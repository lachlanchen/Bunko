import AppKit
import WebKit

@main
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        withExtendedLifetime(delegate) { app.run() }
    }

    private var window: NSWindow!
    private(set) var webView: WKWebView!
    private let schemeHandler = BundleSchemeHandler()

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(schemeHandler, forURLScheme: "bunko")
        config.websiteDataStore = .default()
        config.userContentController.addUserScript(WKUserScript(
            source: "window.__BUNKO_DESKTOP__ = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1120, height: 800),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Bunko · 文庫"
        window.minSize = NSSize(width: 620, height: 500)
        window.contentView = webView
        window.setFrameAutosaveName("BunkoReader")
        window.center()
        window.isReleasedWhenClosed = false
        createMenus()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        webView.load(URLRequest(url: URL(string: "bunko://localhost/index.html")!))
        #if DEBUG
        if CommandLine.arguments.contains("--bunko-smoke-test") {
            window.setContentSize(NSSize(width: 1280, height: 800))
            Task { await MacSmokeTests(webView: webView).run() }
        }
        #endif
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        window.makeKeyAndOrderFront(nil); return true
    }

    private func createMenus() {
        let main = NSMenu()
        func menu(_ title: String) -> NSMenu {
            let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
            let submenu = NSMenu(title: title); item.submenu = submenu; main.addItem(item); return submenu
        }
        func command(_ menu: NSMenu, _ title: String, _ name: String, _ key: String) {
            let item = NSMenuItem(title: NSLocalizedString(title, comment: "Mac menu"), action: #selector(readerCommand(_:)), keyEquivalent: key)
            item.representedObject = name; item.target = self; menu.addItem(item)
        }
        let app = menu("Bunko")
        app.addItem(withTitle: NSLocalizedString("About Bunko", comment: "Mac menu"), action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        app.addItem(.separator())
        command(app, "Settings…", "settings", ",")
        app.addItem(.separator())
        app.addItem(withTitle: NSLocalizedString("Hide Bunko", comment: "Mac menu"), action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        app.addItem(withTitle: NSLocalizedString("Quit Bunko", comment: "Mac menu"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let file = menu(NSLocalizedString("File", comment: "Mac menu"))
        command(file, "Library", "library", "1")
        command(file, "Find a Book…", "search", "f")
        file.addItem(withTitle: NSLocalizedString("Close Window", comment: "Mac menu"), action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        let edit = menu(NSLocalizedString("Edit", comment: "Mac menu"))
        for (title, selector, key) in [("Undo", "undo:", "z"), ("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            edit.addItem(withTitle: NSLocalizedString(title, comment: "Mac menu"), action: Selector(selector), keyEquivalent: key)
        }
        let view = menu(NSLocalizedString("View", comment: "Mac menu"))
        command(view, "Larger Text", "larger-text", "+")
        command(view, "Smaller Text", "smaller-text", "-")
        command(view, "Default Text Size", "reset-text", "0")
        view.addItem(.separator())
        let fullScreen = view.addItem(withTitle: NSLocalizedString("Toggle Full Screen", comment: "Mac menu"), action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fullScreen.keyEquivalentModifierMask = [.command, .control]
        let book = menu(NSLocalizedString("Book", comment: "Mac menu"))
        command(book, "Previous Chapter", "previous-chapter", "[")
        command(book, "Next Chapter", "next-chapter", "]")
        command(book, "Chapters", "chapters", "t")
        let windowMenu = menu(NSLocalizedString("Window", comment: "Mac menu"))
        windowMenu.addItem(withTitle: NSLocalizedString("Minimize", comment: "Mac menu"), action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        NSApp.windowsMenu = windowMenu
        NSApp.mainMenu = main
    }

    @objc private func readerCommand(_ sender: NSMenuItem) {
        guard let command = sender.representedObject as? String,
              let data = try? JSONSerialization.data(withJSONObject: ["command": command]),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('bunko-command', {detail: \(json)}))")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "bunko" && url.host == "localhost" { decisionHandler(.allow); return }
        if ["https", "http", "mailto"].contains(url.scheme?.lowercased() ?? "") { NSWorkspace.shared.open(url) }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, ["https", "http", "mailto"].contains(url.scheme?.lowercased() ?? "") {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert(); alert.messageText = message
        alert.addButton(withTitle: NSLocalizedString("OK", comment: "Confirmation"))
        alert.addButton(withTitle: NSLocalizedString("Cancel", comment: "Confirmation"))
        alert.beginSheetModal(for: window) { completionHandler($0 == .alertFirstButtonReturn) }
    }
}
