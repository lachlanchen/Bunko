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
        let body = (try? await js("document.body.innerText.slice(0, 2500)")) ?? "no document"
        throw NSError(domain: "BunkoQA", code: 1, userInfo: [NSLocalizedDescriptionKey: "Timed out: \(expression)\n\(body)"])
    }
    private func command(_ name: String) async throws {
        _ = try await js("window.dispatchEvent(new CustomEvent('bunko-command', {detail:{command:'\(name)'}}))")
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

    func run() async {
        do {
            try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
            try await wait("document.querySelectorAll('.card').length >= 183")
            check("live 183-book catalogue in bundled macOS WebKit")
            actualRegion = try await webView.callAsyncJavaScript("return await window.webkit.messageHandlers.bunkoAuth.postMessage({region:true})", arguments: [:], in: nil, contentWorld: .page) ?? [:]
            check("actual StoreKit storefront bridge returned; country matrix below uses explicit synthetic fixtures")
            try await region("CHN")
            try await command("settings")
            try await wait("document.querySelector('.companion-region-notice')?.textContent.includes('mainland China') && !document.querySelector('.companion-entry')")
            try await screenshot("00-mainland-settings")
            _ = try await js("document.querySelector('.sheet header button').click()")
            try await region("")
            try await command("settings")
            try await wait("document.querySelector('.companion-region-notice')?.textContent.includes('region can be confirmed')")
            _ = try await js("document.querySelector('.sheet header button').click()")
            for country in ["USA", "HKG"] {
                try await region(country)
                try await wait("document.querySelector('.companion-entry')")
            }
            check("synthetic CHN/unknown disable companion; USA/HKG restore entry without changing library")
            try await wait("Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).length === 5 && Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).every(img => img.complete && img.naturalWidth > 0)")
            check("visible library cover artwork loaded")
            try await screenshot("01-library")
            try await command("settings")
            try await wait("document.querySelector('[role=dialog]')")
            check("native Settings menu opens reader settings")
            _ = try await js("document.querySelector('.sheet header button').click()")
            try await command("search")
            // A deliberately nonactivating window cannot promise keyboard focus.
            // Exercise search itself without taking the user's foreground app.
            try await wait("document.querySelector('.search input')")
            _ = try await js("const input = document.querySelector('.search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Natsume'); input.dispatchEvent(new Event('input', {bubbles:true}))")
            try await wait("document.querySelectorAll('.card').length === 1 && document.querySelector('.card[data-book-id=sanshiro]')")
            _ = try await js("const input = document.querySelector('.search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', {bubbles:true}))")
            check("book search filters and restores the catalogue without activating the window")

            _ = try await js("document.querySelector('.card[data-book-id=sanshiro]').click()")
            try await wait("document.querySelector('.book-hero')")
            if (try await js("Boolean(document.querySelector('.ready'))")) as? Bool != true {
                _ = try await js("document.querySelectorAll('.actions button')[1].click()")
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
            let savedPlace = try await js("localStorage.getItem('CapacitorStorage.bunko.place.v1')") as? String
            try await region("CHN")
            try await command("settings")
            try await wait("document.querySelector('.companion-region-notice')?.textContent.includes('mainland China')")
            _ = try await js("document.querySelector('.sheet header button').click()")
            guard savedPlace == (try await js("localStorage.getItem('CapacitorStorage.bunko.place.v1')") as? String) else { throw URLError(.cannotParseResponse) }
            try await wait("document.querySelectorAll('ruby').length > 20")
            try await region("USA")
            check("storefront change preserves downloaded book, ruby and exact saved reading position")
            try await screenshot("02-resized-reading")
            try await command("larger-text")
            try await wait("document.querySelector('.page').style.fontSize !== '1rem'")
            try await command("reset-text")
            try await wait("document.querySelector('.page').style.fontSize === '1rem'")
            check("native text-size controls update and restore reading size")
            try await command("next-chapter")
            try await wait("document.querySelector('.reader')?.dataset.chapter === '1' && JSON.parse(localStorage.getItem('CapacitorStorage.bunko.place.v1') || '{}').sanshiro?.chapter === 1")
            try await command("chapters")
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
            try await command("library")
            try await wait("document.querySelector('.card[data-book-id=physics-classical-mechanics]')")
            _ = try await js("document.querySelector('.card[data-book-id=physics-classical-mechanics]').click()")
            try await wait("document.querySelector('.book-hero')")
            _ = try await js("document.querySelector('.actions .primary').click()")
            try await wait("document.querySelector('.katex') && document.querySelector('.book-figure img')")
            _ = try await js("document.querySelector('.katex').closest('.para')?.scrollIntoView()")
            try await screenshot("03-physics-equations")
            _ = try await js("document.querySelector('.book-figure').scrollIntoView()")
            try await wait("document.querySelector('.book-figure img')?.naturalWidth > 0")
            if (try await js("document.querySelectorAll('.katex-error,.math-error').length")) as? Int != 0 { throw URLError(.cannotParseResponse) }
            check("physics equations and figures render without TeX errors")
            try await screenshot("04-physics-figures")
            let report: [String: Any] = ["passed": true, "checks": checks, "actualRegion": actualRegion, "countryMatrix": "synthetic Debug fixtures; not physical China network", "system": ProcessInfo.processInfo.operatingSystemVersionString]
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
