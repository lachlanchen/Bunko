#if DEBUG
import AppKit
import WebKit

/// Runs only when explicitly requested in a Debug build. Exercises the actual
/// bundled reader in WebKit and saves evidence inside the app's sandbox.
@MainActor
final class MacSmokeTests {
    private let webView: WKWebView
    private let output = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("tmp/Bunko-Mac-QA", isDirectory: true)
    private var checks: [String] = []
    private var actualRegion: Any = [:]
    init(webView: WKWebView) { self.webView = webView }

    private func js(_ source: String) async throws -> Any? {
        // The older WebKit async overlay force-unwraps JavaScript undefined.
        // The callback API preserves its optional result on Monterey toolchains.
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Any?, Error>) in
            webView.evaluateJavaScript(source) { value, error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: value) }
            }
        }
    }
    private func wait(_ expression: String, timeout: TimeInterval = 90) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if let result = try? await js("Boolean(\(expression))"), result as? Bool == true { return }
            try await Task.sleep(nanoseconds: 500_000_000)
        }
        let body = (try? await js("JSON.stringify({text:document.body.innerText.slice(0,1500), math:document.querySelectorAll('.katex').length, figures:document.querySelectorAll('.book-figure').length, image:document.querySelector('.book-figure img')?.outerHTML, rect:document.querySelector('.book-figure')?.getBoundingClientRect().toJSON(), visibility:document.visibilityState})")) ?? "no document"
        throw NSError(domain: "BunkoQA", code: 1, userInfo: [NSLocalizedDescriptionKey: "Timed out: \(expression)\n\(body)"])
    }
    private func command(_ name: String) throws {
        // Exercise the actual AppKit target/action path, including validation.
        // A direct web event would miss broken or unavailable native menus.
        var matches: [(NSMenu, NSMenuItem)] = []
        func visit(_ menu: NSMenu) {
            for item in menu.items {
                if item.representedObject as? String == name { matches.append((menu, item)) }
                if let submenu = item.submenu { visit(submenu) }
            }
        }
        if let menu = NSApp.mainMenu { visit(menu) }
        guard matches.count == 1, let match = matches.first else {
            throw NSError(domain: "BunkoQA", code: 5, userInfo: [NSLocalizedDescriptionKey: "Expected one native menu command: \(name)"])
        }
        try performMenuAction(match.0, item: match.1)
    }
    private func performMenuAction(_ menu: NSMenu, item: NSMenuItem) throws {
        menu.update()
        let index = menu.index(of: item)
        guard index >= 0, item.isEnabled, item.action != nil, item.target != nil else {
            throw NSError(domain: "BunkoQA", code: 6, userInfo: [NSLocalizedDescriptionKey: "Native menu command unavailable: \(item.title)"])
        }
        menu.performActionForItem(at: index)
    }
    private func screenshot(_ name: String) async throws {
        let image = try await webView.takeSnapshot(configuration: nil)
        guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff),
              let png = bitmap.representation(using: .png, properties: [:]) else { throw URLError(.cannotDecodeContentData) }
        try png.write(to: output.appendingPathComponent(name + ".png"))
    }
    private func check(_ name: String) { checks.append(name); print("BUNKO_QA PASS: \(name)"); fflush(stdout) }
    private func region(_ country: String) async throws {
        _ = try await webView.callAsyncJavaScript("await window.webkit.messageHandlers.bunkoAuth.postMessage({qaRegion: country}); window.dispatchEvent(new Event('bunko-region-changed')); return true", arguments: ["country": country], in: nil, contentWorld: .page)
    }

    private func reopenAfterClosing(_ action: () throws -> Void) async throws {
        guard let originalWindow = webView.window else {
            throw NSError(domain: "BunkoQA", code: 2, userInfo: [NSLocalizedDescriptionKey: "Missing reader window"])
        }
        let document = UUID().uuidString
        _ = try await js("window.__qaWindowDocument = '\(document)'")
        originalWindow.performClose(nil)
        guard !originalWindow.isVisible else { throw URLError(.cannotParseResponse) }
        try action()
        guard originalWindow.isVisible, webView.window === originalWindow,
              originalWindow.contentView === webView,
              document == (try await js("window.__qaWindowDocument") as? String) else {
            throw NSError(domain: "BunkoQA", code: 4, userInfo: [NSLocalizedDescriptionKey: "Reopen did not preserve the window and WebKit document"])
        }
    }

    private func reopenThroughWindowMenu() async throws {
        try await reopenAfterClosing {
            guard let menu = NSApp.windowsMenu,
                  let item = menu.items.first(where: { $0.identifier?.rawValue == "bunko.show-main-window" }) else {
                throw NSError(domain: "BunkoQA", code: 3, userInfo: [NSLocalizedDescriptionKey: "Missing permanent Show Bunko menu item"])
            }
            try performMenuAction(menu, item: item)
        }
    }

    func run() async {
        do {
            try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
            try await wait("document.querySelectorAll('.card').length >= 183")
            check("live 183-book catalogue in bundled macOS WebKit")
            actualRegion = try await webView.callAsyncJavaScript("return await window.webkit.messageHandlers.bunkoAuth.postMessage({region:true})", arguments: [:], in: nil, contentWorld: .page) ?? [:]
            check("actual StoreKit storefront bridge returned; country matrix below uses explicit synthetic fixtures")
            try await region("CHN")
            try command("settings")
            try await wait("document.querySelector('.cloud-entry') && document.querySelector('.companion-entry')")
            try await screenshot("00-mainland-settings")
            _ = try await js("document.querySelector('.sheet header button').click()")
            try await region("")
            try command("settings")
            try await wait("document.querySelector('.cloud-entry') && document.querySelector('.companion-entry')")
            _ = try await js("document.querySelector('.sheet header button').click()")
            for country in ["USA", "HKG"] {
                try await region(country)
                try await wait("document.querySelector('.companion-entry')")
            }
            check("CHN/unknown/USA/HKG all retain the companion and reading-plan entry")
            try await region("CHN")
            _ = try await js("document.querySelector('.companion-entry').click()")
            try await wait("document.querySelector('.agent-page .agent-heading') && document.querySelector('.agent-welcome')")
            try await screenshot("00-reading-assistant")
            try await region("")
            try await wait("document.querySelector('.agent-page .agent-heading')")
            _ = try await js("document.querySelector('.agent-header > button').click()")
            try await wait("document.querySelector('.companion-entry') && document.querySelectorAll('.card').length >= 183")
            check("assistant opens and stays mounted across CHN/unknown storefronts; back restores library")
            try await wait("Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).length === 5 && Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).every(img => img.complete && img.naturalWidth > 0)")
            check("visible library cover artwork loaded")
            try await screenshot("01-library")
            try await reopenAfterClosing { try command("settings") }
            try await wait("document.querySelector('[role=dialog]')")
            check("native Settings menu reopens a closed window and opens reader settings")
            _ = try await js("document.querySelector('.sheet header button').click()")
            try command("search")
            // A deliberately nonactivating window cannot promise keyboard focus.
            // Exercise search itself without taking the user's foreground app.
            try await wait("document.querySelector('.search input')")
            _ = try await js("{ const input = document.querySelector('.search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Natsume'); input.dispatchEvent(new Event('input', {bubbles:true})); }")
            try await wait("document.querySelectorAll('.card').length === 1 && document.querySelector('.card[data-book-id=sanshiro]')")
            _ = try await js("{ const input = document.querySelector('.search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', {bubbles:true})); }")
            check("book search filters and restores the catalogue without activating the window")

            _ = try await js("document.querySelector('.card[data-book-id=sanshiro]').click()")
            try await wait("document.querySelector('.book-hero')")
            if (try await js("Boolean(document.querySelector('.ready'))")) as? Bool != true {
                _ = try await js("Array.from(document.querySelectorAll('.actions button')).find(b => b.textContent.includes('Download for offline')).click()")
                try await wait("document.querySelector('.ready')", timeout: 180)
            }
            check("complete book downloaded to IndexedDB")
            _ = try await js("document.querySelector('.chapter-list li:first-child button').click()")
            try await wait("document.querySelectorAll('ruby').length > 20")
            check("ruby and multilingual text render")
            try await screenshot("02-reading")
            // Exercise the bundled reader through real WebKit/window reflow.
            _ = try await js("window.__qaParagraph = Math.min(10, document.querySelectorAll('[data-para]').length - 2); const p = document.querySelector('[data-para=\"' + window.__qaParagraph + '\"]'); const page = document.querySelector('.page'); page.scrollTop += p.getBoundingClientRect().top - page.getBoundingClientRect().top - 12")
            try await Task.sleep(nanoseconds: 500_000_000)
            // Compare the actual visible passage and fractional position. offsetTop
            // depends on the offset parent and is not a viewport coordinate.
            _ = try await js("window.__qaPoint = () => { const page = document.querySelector('.page'); const edge = page.getBoundingClientRect().top + 12; const p = Array.from(page.querySelectorAll('[data-para]')).find(p => p.getBoundingClientRect().bottom > edge); const r = p.getBoundingClientRect(); return {id:p.dataset.para, fraction:(edge-r.top)/r.height}; }; window.__qaBefore = window.__qaPoint()")
            for width in [620, 1000, 740, 1280] {
                webView.window?.setContentSize(NSSize(width: width, height: 800))
                try await Task.sleep(nanoseconds: 500_000_000)
                try await wait("window.__qaPoint().id === window.__qaBefore.id && Math.abs(window.__qaPoint().fraction - window.__qaBefore.fraction) < 0.04", timeout: 5)
            }
            check("reading passage and ruby survive four native window resizes")
            for _ in 0..<3 {
                try await reopenThroughWindowMenu()
                try await wait("document.querySelectorAll('ruby').length > 20 && window.__qaPoint().id === window.__qaBefore.id && Math.abs(window.__qaPoint().fraction - window.__qaBefore.fraction) < 0.04", timeout: 5)
            }
            check("three Close Window and Show Bunko cycles preserve the same reader, exact passage and ruby without reloading")
            try await reopenAfterClosing {
                guard let delegate = NSApp.delegate as? AppDelegate,
                      !delegate.applicationShouldHandleReopen(NSApp, hasVisibleWindows: false),
                      !delegate.applicationShouldHandleReopen(NSApp, hasVisibleWindows: true) else {
                    throw NSError(domain: "BunkoQA", code: 7, userInfo: [NSLocalizedDescriptionKey: "Dock reopen delegate did not handle the existing window"])
                }
            }
            try await wait("document.querySelectorAll('ruby').length > 20 && window.__qaPoint().id === window.__qaBefore.id && Math.abs(window.__qaPoint().fraction - window.__qaBefore.fraction) < 0.04", timeout: 5)
            check("Dock reopen delegate restores the closed reader and reuses the already-visible window")
            let savedPlace = try await js("localStorage.getItem('CapacitorStorage.bunko.place.v1')") as? String
            try await region("CHN")
            try command("settings")
            try await wait("document.querySelector('.cloud-entry')")
            _ = try await js("document.querySelector('.sheet header button').click()")
            guard savedPlace == (try await js("localStorage.getItem('CapacitorStorage.bunko.place.v1')") as? String) else { throw URLError(.cannotParseResponse) }
            try await wait("document.querySelectorAll('ruby').length > 20")
            try await region("USA")
            check("storefront change preserves downloaded book, ruby and exact saved reading position")
            try await screenshot("02-resized-reading")
            try command("larger-text")
            try await wait("document.querySelector('.page').style.fontSize !== '1rem'")
            try command("reset-text")
            try await wait("document.querySelector('.page').style.fontSize === '1rem'")
            check("native text-size controls update and restore reading size")
            try command("next-chapter")
            try await wait("document.querySelector('.reader')?.dataset.chapter === '1' && JSON.parse(localStorage.getItem('CapacitorStorage.bunko.place.v1') || '{}').sanshiro?.chapter === 1")
            try command("chapters")
            try await wait("document.querySelector('.sheet .chapter-list')")
            _ = try await js("document.querySelector('.sheet .chapter-list li:last-child button').click()")
            try await wait("document.querySelector('.reader')?.dataset.chapter === '12' && document.querySelectorAll('ruby').length > 20")
            check("chapter navigation reaches downloaded final chapter")

            let rules = "[{\"trigger\":{\"url-filter\":\"^https?://\"},\"action\":{\"type\":\"block\"}}]"
            let block = try await WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "BunkoOfflineQA", encodedContentRuleList: rules)
            webView.configuration.userContentController.add(block!)
            webView.reload()
            try await wait("document.querySelector('.card[data-book-id=sanshiro]')")
            _ = try await js("document.querySelector('.card[data-book-id=sanshiro]').click()")
            try await wait("document.querySelector('.ready')")
            _ = try await js("document.querySelector('.actions .primary').click()")
            try await wait("document.querySelector('.reader')?.dataset.chapter === '12' && document.querySelectorAll('ruby').length > 20")
            check("offline reload resumes the saved final chapter with HTTP blocked")
            webView.configuration.userContentController.remove(block!)
            try command("library")
            try await wait("document.querySelector('.card[data-book-id=physics-classical-mechanics]')")
            _ = try await js("document.querySelector('.card[data-book-id=physics-classical-mechanics]').click()")
            try await wait("document.querySelector('.book-hero')")
            _ = try await js("document.querySelector('.actions .primary').click()")
            try await wait("document.querySelector('.katex') && document.querySelector('.book-figure')")
            _ = try await js("document.querySelector('.katex').closest('.para')?.scrollIntoView()")
            try await screenshot("03-physics-equations")
            _ = try await js("document.querySelector('.book-figure').scrollIntoView()")
            try await wait("document.querySelector('.book-figure img')?.naturalWidth > 0")
            if (try await js("document.querySelectorAll('.katex-error,.math-error').length")) as? Int != 0 { throw URLError(.cannotParseResponse) }
            check("physics equations and figures render without TeX errors")
            try await screenshot("04-physics-figures")
            if ProcessInfo.processInfo.environment["BUNKO_MAP_QA"] == "1" {
                // The isolated operator copies this synthetic component fixture
                // into the Debug product only. Release resources exclude it.
                webView.load(URLRequest(url: URL(string: "bunko://localhost/qa-map.html")!))
                try await wait("document.querySelectorAll('.atlas-region').length === 13 && document.querySelectorAll('.atlas-region-label').length === 13")
                try await wait("new Set(Array.from(document.querySelectorAll('.atlas-region')).map(p => p.style.fill)).size === 13")
                _ = try await js("document.querySelector('.atlas-region[aria-label=荆州]').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
                try await wait("document.querySelector('.atlas-region[aria-label=荆州]').classList.contains('selected')")
                try await screenshot("05-han-regions")
                _ = try await js("document.querySelector('[data-map-extend]').click()")
                try await wait("document.querySelectorAll('.atlas-region').length === 13 && document.querySelectorAll('.atlas-pin').length === 3 && !document.querySelector('.atlas-unresolved')")
                for width in [620, 1120] {
                    webView.window?.setContentSize(NSSize(width: width, height: 800))
                    try await Task.sleep(nanoseconds: 300_000_000)
                    try await wait("document.documentElement.scrollWidth <= innerWidth + 1")
                }
                try await screenshot("06-han-cities")
                _ = try await js("document.querySelector('[data-map-extend]').click()")
                try await wait("document.querySelectorAll('.atlas-region').length === 13 && document.querySelectorAll('.atlas-pin').length === 0")
                check("synthetic map fixture: 13 colored regions, selection, three-city continuation, resize and prior-map return in native WebKit")
            }
            if ProcessInfo.processInfo.environment["BUNKO_WORKSPACE_QA"] == "1" {
                webView.load(URLRequest(url: URL(string: "bunko://localhost/qa-workspace.html")!))
                try await wait("document.querySelector('#reading-message-extended') && !document.querySelector('#reading-message-far')")
                _ = try await js("{ const input=document.querySelector('.agent-composer textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'继续完善这张图'); input.dispatchEvent(new Event('input',{bubbles:true})); const picker=document.querySelector('.book-artifact-picker select'); picker.value='workspace-far'; picker.dispatchEvent(new Event('change',{bubbles:true})); }")
                try await wait("document.querySelector('#reading-message-far') && document.querySelector('.agent-composer textarea').value === '继续完善这张图'")
                _ = try await js("{ const picker=document.querySelector('.book-artifact-picker select'); picker.value=''; picker.dispatchEvent(new Event('change',{bubbles:true})); }")
                try await wait("document.querySelector('#reading-message-extended') && !document.querySelector('#reading-message-far')")
                check("synthetic reading workspace restores nearest branch and preserves drafts when switching")
                try await reopenThroughWindowMenu()
                try await wait("document.querySelector('#reading-message-extended') && document.querySelector('.agent-composer textarea').value === '继续完善这张图' && !window.__fixtureSends", timeout: 5)
                check("Show Bunko preserves the conversation branch, unsent draft and generation count after closing")
                try await screenshot("07-reading-conversation")
                _ = try await js("document.querySelectorAll('nav button')[1].click()")
                try await wait("document.querySelectorAll('.guide-group-filter button').length === 4")
                _ = try await js("document.querySelectorAll('.guide-group-filter button')[3].click()")
                try await wait("document.querySelectorAll('.graph-person').length === 10")
                for width in [620, 1120] {
                    webView.window?.setContentSize(NSSize(width: width, height: 800))
                    try await Task.sleep(nanoseconds: 300_000_000)
                    try await wait("document.documentElement.scrollWidth <= innerWidth + 1")
                }
                _ = try await js("Array.from(document.querySelectorAll('.graph-person')).find(p=>p.textContent==='周瑜').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
                try await wait("document.querySelector('.guide-card h2')?.textContent === '周瑜'")
                try await reopenThroughWindowMenu()
                try await wait("document.querySelectorAll('.graph-person').length === 10 && document.querySelector('.guide-card h2')?.textContent === '周瑜' && !window.__fixtureSends", timeout: 5)
                check("Show Bunko preserves the relationship filter and selected person without generation")
                try await screenshot("08-reading-relationships")
                _ = try await js("document.querySelectorAll('nav button')[3].click()")
                try await wait("document.querySelectorAll('.time-marker.background-date').length === 3")
                try await screenshot("09-reading-timeline")
                _ = try await js("document.querySelectorAll('nav button')[0].click()")
                try await wait("document.querySelector('.agent-composer textarea').value === '继续完善这张图'")
                _ = try await js("document.querySelector('.agent-composer button[type=submit]').click()")
                try await wait("document.querySelector('#reading-message-followup') && window.__fixtureSends === 1")
                webView.reload()
                try await wait("document.querySelector('#reading-message-extended') && !window.__fixtureSends")
                check("synthetic workspace: faction filter, person details, resize, dated background timeline, explicit followup and no generation on reopen")
            }
            let report: [String: Any] = ["passed": true, "checks": checks, "actualRegion": actualRegion, "countryMatrix": "synthetic Debug fixtures; not physical China network", "nativeMenuDispatch": "actual NSMenu target/action; no direct web command injection", "windowRecovery": "nonactivating Debug checks; Dock delegate invoked directly, no physical Dock click or keyboard focus claim", "system": ProcessInfo.processInfo.operatingSystemVersionString]
            try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("result.json"))
            print("BUNKO_QA COMPLETE \(output.path)")
        } catch {
            let report: [String: Any] = ["passed": false, "checks": checks, "error": String(describing: error)]
            try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("result.json"))
            print("BUNKO_QA FAILED \(error)\n\(output.path)")
        }
        fflush(stdout)
        NSApp.terminate(nil)
    }
}
#endif
