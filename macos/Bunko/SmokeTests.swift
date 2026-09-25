#if DEBUG
import AppKit
import WebKit

/// Runs only when explicitly requested in a Debug build. Exercises the actual
/// bundled reader in WebKit and saves evidence inside the app's sandbox.
@MainActor
final class MacSmokeTests {
    private let webView: WKWebView
    private let output = FileManager.default.temporaryDirectory.appendingPathComponent("Bunko-Mac-QA", isDirectory: true)
    private var checks: [String] = []
    init(webView: WKWebView) { self.webView = webView }

    private func js(_ source: String) async throws -> Any? {
        try await webView.evaluateJavaScript(source)
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

    func run() async {
        do {
            try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
            try await wait("document.querySelectorAll('.card').length >= 183")
            check("live 183-book catalogue in bundled macOS WebKit")
            try await wait("Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).length === 5 && Array.from(document.querySelectorAll('.card .cover img')).slice(0, 5).every(img => img.complete && img.naturalWidth > 0)")
            check("visible library cover artwork loaded")
            try await screenshot("01-library")
            try await command("settings")
            try await wait("document.querySelector('[role=dialog]')")
            check("native Settings menu opens reader settings")
            _ = try await js("document.querySelector('.sheet header button').click()")
            try await command("search")
            try await wait("document.activeElement === document.querySelector('.search input')")
            check("native Find a Book menu focuses search")

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
            let report: [String: Any] = ["passed": true, "checks": checks, "system": ProcessInfo.processInfo.operatingSystemVersionString]
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
