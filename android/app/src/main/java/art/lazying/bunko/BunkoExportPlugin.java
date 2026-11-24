package art.lazying.bunko;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "BunkoExport")
public class BunkoExportPlugin extends Plugin {
    private static final int MAX_BYTES = 32 * 1024 * 1024;

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("filename", "");
        byte[] bytes = readEpub(call);
        if (bytes == null || name.length() > 204 || !name.matches("[\\p{L}\\p{N}\\p{M} _().-]+\\.epub")) {
            call.reject("Invalid EPUB");
            return;
        }
        Intent prompt = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType("application/epub+zip")
            .putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, prompt, "saveResult");
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Uri destination = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) {
            call.resolve(new JSObject().put("saved", false));
            return;
        }
        getBridge().execute(() -> {
            byte[] bytes = readEpub(call);
            if (bytes == null) { call.reject("Invalid EPUB"); return; }
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(destination, "wt")) {
                if (stream == null) throw new IOException("Missing destination");
                stream.write(bytes);
            } catch (IOException | SecurityException failure) {
                call.reject("Could not save EPUB");
                return;
            }
            call.resolve(new JSObject().put("saved", true));
        });
    }

    private byte[] readEpub(PluginCall call) {
        String encoded = call.getString("base64", "");
        if (encoded.length() > 44_739_244) return null;
        try {
            byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
            if (bytes.length < 4 || bytes.length > MAX_BYTES ||
                bytes[0] != 0x50 || bytes[1] != 0x4b || bytes[2] != 3 || bytes[3] != 4) return null;
            return bytes;
        } catch (IllegalArgumentException invalid) { return null; }
    }
}
