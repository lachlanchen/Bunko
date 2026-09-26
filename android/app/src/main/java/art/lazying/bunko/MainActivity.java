package art.lazying.bunko;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        // Builds through 1.0.3 registered the web PWA inside this WebView.
        // Run from the native shell: an old worker can otherwise hide even
        // the new JavaScript that would unregister it. Never clear app data,
        // IndexedDB or Preferences: those hold books, dictionaries and notes.
        bridgeBuilder.addWebViewListener(new WebViewListener() {
            private boolean checked = false;

            @Override
            public void onPageLoaded(WebView webView) {
                if (checked) return;
                checked = true;
                webView.evaluateJavascript(
                    "(async () => {" +
                    "if (!('serviceWorker' in navigator)) return;" +
                    "const registrations = await navigator.serviceWorker.getRegistrations();" +
                    "if (!registrations.length) return;" +
                    "await Promise.all(registrations.map(r => r.unregister()));" +
                    "if ('caches' in window) {" +
                    "const names = await caches.keys();" +
                    "await Promise.all(names.filter(n => n.startsWith('workbox-precache')).map(n => caches.delete(n)));" +
                    "}" +
                    "location.reload();" +
                    "})().catch(() => {});", null);
            }
        });
        super.load();
    }
}
