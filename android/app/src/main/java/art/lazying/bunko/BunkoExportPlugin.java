package art.lazying.bunko;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Comparator;
import java.io.OutputStream;

@CapacitorPlugin(name = "BunkoExport")
public class BunkoExportPlugin extends Plugin {
    private static final int MAX_BYTES = 32 * 1024 * 1024;
    private static final int MAX_PNG_BYTES = 8 * 1024 * 1024;
    private static final String EPUB = "application/epub+zip";
    private static final String PNG = "image/png";

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("filename", "");
        String type = fileType(name);
        if (type == null || readFile(call, type) == null) {
            call.reject("Invalid file"); return;
        }
        Intent prompt = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType(type)
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
            String type = fileType(call.getString("filename", ""));
            byte[] bytes = type == null ? null : readFile(call, type);
            if (bytes == null) { call.reject("Invalid file"); return; }
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(destination, "wt")) {
                if (stream == null) throw new IOException("Missing destination");
                stream.write(bytes);
            } catch (IOException | SecurityException failure) {
                call.reject("Could not save the file");
                return;
            }
            call.resolve(new JSObject().put("saved", true));
        });
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        String name = call.getString("filename", "");
        byte[] bytes = PNG.equals(fileType(name)) ? readFile(call, PNG) : null;
        if (bytes == null) { call.reject("Invalid card"); return; }
        try {
            File dir = new File(getContext().getCacheDir(), "bunko-share-cards");
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Missing cache");
            File[] cached = dir.listFiles(file -> file.isFile() && file.getName().matches("bunko-[a-z0-9-]+\\.png"));
            if (cached != null) {
                Arrays.sort(cached, Comparator.comparingLong(File::lastModified).reversed());
                for (int i = 7; i < cached.length; i++) cached[i].delete();
            }
            File image = File.createTempFile(name.substring(0, name.length() - 4) + "-", ".png", dir);
            try (FileOutputStream stream = new FileOutputStream(image)) { stream.write(bytes); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", image);
            Intent send = new Intent(Intent.ACTION_SEND)
                .setType(PNG)
                .putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            send.setClipData(ClipData.newUri(getContext().getContentResolver(), name, uri));
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(send, null)); call.resolve(); }
                catch (RuntimeException failure) { call.reject("Could not share the card"); }
            });
        } catch (IOException | IllegalArgumentException failure) {
            call.reject("Could not prepare the card");
        }
    }

    private String fileType(String name) {
        if (name.matches("bunko-[a-z0-9-]{1,120}\\.png")) return PNG;
        return name.length() <= 204 && name.matches("[\\p{L}\\p{N}\\p{M} _().-]+\\.epub") ? EPUB : null;
    }

    private byte[] readFile(PluginCall call, String type) {
        boolean png = PNG.equals(type);
        int max = png ? MAX_PNG_BYTES : MAX_BYTES;
        String encoded = call.getString("base64", "");
        if (encoded.length() > ((max + 2) / 3) * 4) return null;
        byte[] signature = png ? new byte[] {(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a} : new byte[] {0x50,0x4b,0x03,0x04};
        try {
            byte[] data = Base64.decode(encoded, Base64.NO_WRAP);
            return data.length >= signature.length && data.length <= max
                && Arrays.equals(Arrays.copyOf(data, signature.length), signature) ? data : null;
        } catch (IllegalArgumentException invalid) { return null; }
    }
}
