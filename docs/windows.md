# Bunko for Windows

The Windows preview opens Bunko in a dedicated desktop window. Read downloaded
book chapters, switch languages and use the reading companion with the existing
Bunko service. Back, Home and Refresh are in the window toolbar; Alt+Left and F5
work too.

Download the complete EXE from [LazyingArt Windows downloads](https://lazying.art/downloads/windows/#bunko).
It includes the .NET runtime and needs Microsoft Edge WebView2. No installer or
administrator account is required. The preview is unsigned and Windows may show
a publisher warning. It is separate from the Apple and Google store editions.

## Build

Use .NET SDK 10.0.401 and the pinned dependency lockfile:

```sh
dotnet publish windows/Bunko.Windows.csproj -c Release -r win-x64 \
  --self-contained true -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -p:EnableCompressionInSingleFile=true -p:DebugType=None \
  -o release/windows-1.0.15-single-x64 -m:1
```

The published EXE is self-contained. WebView2 XML documentation next to the build
output is not needed to run it. Keep accounts in the per-user WebView2 profile;
provider sign-in opens the system browser and uses Bunko's existing PKCE flow.
The app denies external navigation inside the reader and does not expose native
host objects or a JavaScript message bridge.

`--self-test` creates a separate anonymous profile and runs without activating
its window. Capture evidence and remove only that profile after the exact process
and WebView2 children exit. Actual provider sign-in and Windows 10 are separate
qualification gaps; no Microsoft Store release is implied.
