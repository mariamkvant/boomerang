import UIKit
import Capacitor

/// Custom CAPBridgeViewController that fixes iPad camera/file picker crash.
/// On iPad, UIImagePickerController and UIDocumentPickerViewController must be
/// presented as popovers. Capacitor's default handler doesn't always configure
/// the popoverPresentationController.sourceView, causing a crash.
class SafeBridgeViewController: CAPBridgeViewController {

    override func present(_ viewControllerToPresent: UIViewController, animated flag: Bool, completion: (() -> Void)? = nil) {
        // Fix iPad popover crash for file/camera pickers
        if let popover = viewControllerToPresent.popoverPresentationController {
            if popover.sourceView == nil && popover.barButtonItem == nil {
                popover.sourceView = self.view
                popover.sourceRect = CGRect(
                    x: self.view.bounds.midX,
                    y: self.view.bounds.midY,
                    width: 0,
                    height: 0
                )
                popover.permittedArrowDirections = []
            }
        }
        super.present(viewControllerToPresent, animated: flag, completion: completion)
    }
}
