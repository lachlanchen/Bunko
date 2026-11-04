import AppKit
import WebKit
import AuthenticationServices
import Security
import StoreKit
#if DEBUG
import Network
#endif

@main
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply, ASWebAuthenticationPresentationContextProviding {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        withExtendedLifetime(delegate) { app.run() }
    }

    private var window: NSWindow!
    private(set) var webView: WKWebView!
    private var pendingBookLink:URL?
    private var readerLoaded=false
    private var storefrontTask: Task<Void, Never>?
    #if DEBUG
    private var qaStorefront: String?
    #endif
    private var authSession: ASWebAuthenticationSession?
    private let schemeHandler = BundleSchemeHandler()

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(schemeHandler, forURLScheme: "bunko")
        config.websiteDataStore = .default()
        #if DEBUG
        // Test hosts can use a loopback CONNECT tunnel without changing system proxies.
        #if compiler(>=5.9)
        if #available(macOS 14.0, *), CommandLine.arguments.contains("--bunko-smoke-test"),
           let value = ProcessInfo.processInfo.environment["BUNKO_QA_PROXY_PORT"],
           let port = UInt16(value), let endpointPort = NWEndpoint.Port(rawValue: port) {
            config.websiteDataStore.proxyConfigurations = [ProxyConfiguration(
                httpCONNECTProxy: .hostPort(host: "127.0.0.1", port: endpointPort))]
        }
        #endif
        #endif
        config.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "bunkoAuth")
        let appInfo = ["version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "",
                       "build": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""]
        let appInfoJSON = String(data: try! JSONSerialization.data(withJSONObject: appInfo), encoding: .utf8)!
        config.userContentController.addUserScript(WKUserScript(
            source: "window.__BUNKO_DESKTOP__ = true; window.__BUNKO_APP_INFO__ = \(appInfoJSON);", injectionTime: .atDocumentStart, forMainFrameOnly: true))
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
        storefrontTask = Task { [weak self] in
            for await _ in Storefront.updates {
                await MainActor.run { self?.webView.evaluateJavaScript("window.dispatchEvent(new Event('bunko-region-changed'))", completionHandler: nil) }
            }
        }
        showMainWindow(nil)
        webView.load(URLRequest(url: URL(string: "bunko://localhost/index.html")!))
        #if DEBUG
        if CommandLine.arguments.contains("--bunko-smoke-test") {
            window.setContentSize(NSSize(width: 1280, height: 800))
            Task { await MacSmokeTests(webView: webView).run() }
        }
        #endif
    }

    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        guard frame.isMainFrame, frame.request.url?.scheme == "bunko",
              frame.request.url?.host == "localhost" else { completionHandler(nil); return }
        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowsMultipleSelection = false
        panel.allowedFileTypes = ["pdf", "docx", "md", "mmd", "txt", "tex"]
        panel.beginSheetModal(for: window) { result in
            completionHandler(result == .OK ? panel.urls : nil)
        }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        showMainWindow(nil)
        return false
    }

    // Keep the existing WebKit document alive: reopening must not reload the
    // reader, lose a draft or interrupt a companion response.
    @objc private func showMainWindow(_ sender: Any?) {
        guard let window else { return }
        if window.isMiniaturized { window.deminiaturize(nil) }
        #if DEBUG
        if CommandLine.arguments.contains("--bunko-smoke-test") {
            window.orderBack(nil)
            return
        }
        #endif
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { window }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame,
              message.frameInfo.request.url?.scheme == "bunko",
              message.frameInfo.request.url?.host == "localhost",
              let body = message.body as? [String: Any] else { replyHandler(nil, "Denied"); return }
        #if DEBUG
        // Explicit synthetic country fixtures exist only in the isolated Debug harness.
        if CommandLine.arguments.contains("--bunko-smoke-test"), let fixture = body["qaRegion"] as? String {
            qaStorefront = fixture == "actual" ? nil : fixture
            replyHandler(true, nil)
            return
        }
        #endif
        if body["region"] as? Bool == true {
            Task {
                let storefront = await Storefront.current
                await MainActor.run {
                    var country = storefront?.countryCode ?? ""
                    #if DEBUG
                    country = self.qaStorefront ?? country
                    #endif
                    replyHandler(["storefront": country, "deviceRegion": Locale.current.regionCode ?? ""], nil)
                }
            }
            return
        }
        if let action = body["storage"] as? String {
            var storageService = "art.lazying.bunko.discussions"
            #if DEBUG
            if CommandLine.arguments.contains("--bunko-smoke-test") { storageService += ".qa39" }
            #endif
            let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: storageService,
                kSecAttrAccount as String: "session", kSecUseDataProtectionKeychain as String: true]
            switch action {
            case "read":
                var read = query
                read[kSecReturnData as String] = true
                read[kSecMatchLimit as String] = kSecMatchLimitOne
                var result: CFTypeRef?
                let status = SecItemCopyMatching(read as CFDictionary, &result)
                if status == errSecItemNotFound { replyHandler(NSNull(), nil) }
                else if status == errSecSuccess, let data = result as? Data { replyHandler(String(data: data, encoding: .utf8), nil) }
                else { replyHandler(nil, "Secure storage unavailable") }
            case "save":
                guard let token = body["token"] as? String,
                      token.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { replyHandler(nil, "Invalid session"); return }
                let attributes: [String: Any] = [kSecValueData as String: Data(token.utf8),
                    kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
                var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
                if status == errSecItemNotFound { status = SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil) }
                replyHandler(status == errSecSuccess, status == errSecSuccess ? nil : "Secure storage unavailable")
            case "clear":
                let status = SecItemDelete(query as CFDictionary)
                replyHandler(true, status == errSecSuccess || status == errSecItemNotFound ? nil : "Secure storage unavailable")
            default: replyHandler(nil, "Invalid storage action")
            }
            return
        }
        if let share = body["share"] as? [String: String], let title = share["title"],
           let value = share["url"], let url = URL(string: value),
           url.scheme == "https", url.host == "bunko.lazying.art",
           url.path.range(of: "^/bunko/share/book/[a-z0-9-]{1,120}$", options: .regularExpression) != nil {
            let picker = NSSharingServicePicker(items: [String(title.prefix(400)), url])
            picker.show(relativeTo: NSRect(x:webView.bounds.midX,y:40,width:1,height:1), of:webView, preferredEdge:.minY)
            replyHandler(true, nil); return
        }
        if body["cancel"] as? Bool == true { authSession?.cancel(); authSession = nil; replyHandler(true, nil); return }
        guard authSession == nil, let value = body["url"] as? String, let url = URL(string: value),
              url.scheme == "https", url.user == nil, url.password == nil, url.fragment == nil,
              url.port == nil || url.port == 443 else {
            replyHandler(nil, "Invalid authorization URL"); return
        }
        let query = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let github = url.host == "github.com" && url.path == "/login/oauth/authorize"
        let shared = url.host == "llm.lazying.art" && url.path == "/bunko/oauth/lazyingart"
            && query.count == 1 && query.first?.name == "ticket"
            && query.first?.value?.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil
        guard github || shared else { replyHandler(nil, "Invalid authorization URL"); return }
        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "art.lazying.bunko") { [weak self] callback, error in
            DispatchQueue.main.async {
                self?.authSession = nil
                if error != nil || callback == nil { replyHandler(nil, "Authorization cancelled") }
                else { replyHandler(true, nil); self?.window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true) }
            }
        }
        session.presentationContextProvider = self
        authSession = session
        if !session.start() { authSession = nil; replyHandler(nil, "Could not open authorization") }
    }

    func application(_ application:NSApplication, open urls:[URL]) {
        guard let url=urls.first(where:{$0.scheme=="art.lazying.bunko" && $0.host=="book" && $0.query==nil && $0.fragment==nil && $0.path.range(of:"^/[a-z0-9-]{1,120}$",options:.regularExpression) != nil}) else{return}
        pendingBookLink=url
        deliverBookLink()
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!) {readerLoaded=true;deliverBookLink()}
    private func deliverBookLink() {
        guard readerLoaded,let url=pendingBookLink,let webView=webView,webView.url?.scheme == "bunko" else{return}
        let value=String(data:try! JSONSerialization.data(withJSONObject:[url.absoluteString]),encoding:.utf8)!
        webView.evaluateJavaScript("window.__BUNKO_BOOK_LINK__ = \(value)[0]; window.dispatchEvent(new CustomEvent('bunko-open-book',{detail:window.__BUNKO_BOOK_LINK__}));",completionHandler:nil)
        pendingBookLink=nil
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
        command(app, "Check for Updates…", "check-updates", "")
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
        let reopen = windowMenu.addItem(withTitle: NSLocalizedString("Show Bunko", comment: "Mac menu"), action: #selector(showMainWindow(_:)), keyEquivalent: "n")
        reopen.identifier = NSUserInterfaceItemIdentifier("bunko.show-main-window")
        reopen.target = self
        windowMenu.addItem(.separator())
        windowMenu.addItem(withTitle: NSLocalizedString("Minimize", comment: "Mac menu"), action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        NSApp.windowsMenu = windowMenu
        NSApp.mainMenu = main
    }

    @objc private func readerCommand(_ sender: NSMenuItem) {
        guard let command = sender.representedObject as? String,
              let data = try? JSONSerialization.data(withJSONObject: ["command": command]),
              let json = String(data: data, encoding: .utf8) else { return }
        showMainWindow(nil)
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
