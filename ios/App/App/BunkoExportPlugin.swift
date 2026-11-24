import Capacitor
import UIKit

@objc(BunkoExportPlugin)
final class BunkoExportPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "BunkoExportPlugin"
    let jsName = "BunkoExport"
    let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise)]

    @objc func save(_ call: CAPPluginCall) {
        guard let filename = call.getString("filename"), filename.count <= 110,
              filename.range(of: #"^[\p{L}\p{N}\p{M} _().-]+\.epub$"#, options: .regularExpression) != nil,
              let encoded = call.getString("base64"), encoded.utf8.count <= 44_739_244,
              let data = Data(base64Encoded: encoded), data.count <= 32 * 1024 * 1024,
              data.starts(with: [0x50, 0x4B, 0x03, 0x04]) else {
            call.reject("Invalid EPUB"); return
        }
        let manager = FileManager.default
        let directory = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let file = directory.appendingPathComponent(filename)
        do {
            try manager.createDirectory(at: directory, withIntermediateDirectories: false)
            try data.write(to: file, options: .atomic)
        } catch {
            try? manager.removeItem(at: directory)
            call.reject("Could not prepare EPUB"); return
        }
        DispatchQueue.main.async { [weak self] in
            guard let presenter = self?.bridge?.viewController, presenter.presentedViewController == nil else {
                try? manager.removeItem(at: directory)
                call.reject("Close the open window and try again"); return
            }
            let picker = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            picker.popoverPresentationController?.sourceView = presenter.view
            picker.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
            picker.completionWithItemsHandler = { _, completed, _, error in
                try? manager.removeItem(at: directory)
                if error != nil { call.reject("Could not save EPUB") }
                else { call.resolve(["saved": completed]) }
            }
            presenter.present(picker, animated: true)
        }
    }
}
