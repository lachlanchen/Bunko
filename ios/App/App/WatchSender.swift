import Foundation
import WatchConnectivity
import Capacitor

final class WatchSender: NSObject, WCSessionDelegate {
    static let shared = WatchSender()
    private let key = "bunko.watch.shelf.v1"
    private var pending: Data?

    func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func save(_ reading: WatchReading) throws {
        guard reading.isValid else { throw NSError(domain: "WatchReading", code: 1) }
        let old = UserDefaults.standard.data(forKey: key).flatMap(WatchShelf.decode)?.readings ?? []
        let shelf = WatchShelf(schema: 1, readings: Array(([reading] + old.filter { $0.id != reading.id }).prefix(3)))
        let data = try JSONEncoder().encode(shelf)
        guard WatchShelf.decode(data) != nil else { throw NSError(domain: "WatchReading", code: 2) }
        UserDefaults.standard.set(data, forKey: key)
        pending = data
        activate()
        try flush()
    }

    private func flush() throws {
        guard WCSession.default.activationState == .activated,
              let data = pending ?? UserDefaults.standard.data(forKey: key) else { return }
        // Context survives temporary disconnection and replaces obsolete queued excerpts.
        try WCSession.default.updateApplicationContext(["shelf": data])
        pending = nil
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { try? self.flush() }
    }
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    func sessionWatchStateDidChange(_ session: WCSession) {
        DispatchQueue.main.async { try? self.flush() }
    }
}

@objc(BunkoWatchPlugin)
final class BunkoWatchPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "BunkoWatchPlugin"
    let jsName = "BunkoWatch"
    let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise)]

    @objc func save(_ call: CAPPluginCall) {
        guard let json = call.getString("reading"), let data = json.data(using: .utf8),
              let reading = try? JSONDecoder().decode(WatchReading.self, from: data), reading.isValid else {
            call.reject("Invalid reading excerpt"); return
        }
        DispatchQueue.main.async {
            guard WCSession.isSupported(), WCSession.default.isPaired,
                  WCSession.default.isWatchAppInstalled else {
                call.reject("Install Bunko on your paired Apple Watch first."); return
            }
            do { try WatchSender.shared.save(reading); call.resolve() }
            catch { call.reject("Could not queue the excerpt. Please try again.") }
        }
    }
}

final class BunkoBridgeController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(BunkoWatchPlugin())
    }
}
