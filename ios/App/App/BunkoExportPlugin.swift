import Capacitor
import UIKit

@objc(BunkoExportPlugin)
final class BunkoExportPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "BunkoExportPlugin"
    let jsName = "BunkoExport"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareImage", returnType: CAPPluginReturnPromise)
    ]

    @objc func save(_ call: CAPPluginCall) { presentFile(call, imageOnly: false) }
    @objc func shareImage(_ call: CAPPluginCall) { presentFile(call, imageOnly: true) }

    private func presentFile(_ call: CAPPluginCall, imageOnly: Bool) {
        guard let filename = call.getString("filename"), filename.count <= 132 else {
            call.reject("Invalid file"); return
        }
        let png = filename.range(of: #"^bunko-[a-z0-9-]{1,120}\.png$"#, options: .regularExpression) != nil
        let epub = !imageOnly && filename.range(of: #"^[\p{L}\p{N}\p{M} _().-]+\.epub$"#, options: .regularExpression) != nil
        let limit = (png ? 8 : 32) * 1024 * 1024
        let signature: [UInt8] = png ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] : [0x50, 0x4b, 0x03, 0x04]
        guard png || epub, let encoded = call.getString("base64"),
              encoded.utf8.count <= ((limit + 2) / 3) * 4,
              let data = Data(base64Encoded: encoded),
              data.count <= limit, data.starts(with: signature) else {
            call.reject("Invalid file"); return
        }
        let manager = FileManager.default
        let directory = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let file = directory.appendingPathComponent(filename)
        do {
            try manager.createDirectory(at: directory, withIntermediateDirectories: false)
            try data.write(to: file, options: .atomic)
        } catch {
            try? manager.removeItem(at: directory)
            call.reject("Could not prepare the file"); return
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
                if error != nil { call.reject("Could not share the file") }
                else { call.resolve(["saved": completed]) }
            }
            presenter.present(picker, animated: true)
        }
    }
}
