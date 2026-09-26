#!/usr/bin/env bash
set -euo pipefail
# Run npm run build:macos on the source host, sync macos/ and this script, then
# run here on the shared Xcode host. Never print signing passwords.
export PATH=/usr/bin:/bin:/usr/sbin:/sbin
bunko_root="${BUNKO_ROOT:-$HOME/Projects/Bunko}"
bunko_release="${BUNKO_RELEASE:-1.0.6-8}"
bunko_kc="$HOME/Library/Keychains/landn-release.keychain-db"
bunko_pass=$(tr -d '\r\n' < "$HOME/.config/echomind/apple/release-keychain.pass")
security unlock-keychain -p "$bunko_pass" "$bunko_kc"
security set-keychain-settings -lut 14400 "$bunko_kc"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$bunko_pass" "$bunko_kc" >/dev/null
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles" "$bunko_root/release"
bunko_profile="$HOME/.config/bunko/apple/Bunko_Mac_App_Store.provisionprofile"
bunko_profile_id=$(security cms -D -i "$bunko_profile" | plutil -extract UUID raw -o - -)
cp "$bunko_profile" "$HOME/Library/MobileDevice/Provisioning Profiles/$bunko_profile_id.provisionprofile"
cp "$bunko_profile" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/$bunko_profile_id.provisionprofile"
cd "$bunko_root"
xcodebuild -project macos/Bunko.xcodeproj -scheme Bunko -configuration Release -destination 'generic/platform=macOS' \
  -archivePath "release/Bunko-macOS-$bunko_release.xcarchive" -derivedDataPath release/DerivedDataMacRelease -jobs "${BUNKO_BUILD_JOBS:-2}" archive \
  ARCHS='arm64 x86_64' ONLY_ACTIVE_ARCH=NO COMPILER_INDEX_STORE_ENABLE=NO "OTHER_CODE_SIGN_FLAGS=--keychain $bunko_kc"
# Check the actual archive before exporting or uploading it.
bunko_info="$bunko_root/release/Bunko-macOS-$bunko_release.xcarchive/Products/Applications/Bunko.app/Contents/Info.plist"
bunko_actual_version=$(plutil -extract CFBundleShortVersionString raw -o - "$bunko_info")
bunko_actual_build=$(plutil -extract CFBundleVersion raw -o - "$bunko_info")
if [[ "$bunko_actual_version-$bunko_actual_build" != "$bunko_release" ]]; then
  printf 'Archive version mismatch: expected %s, found %s-%s\n' "$bunko_release" "$bunko_actual_version" "$bunko_actual_build" >&2
  exit 1
fi
xcodebuild -exportArchive -archivePath "release/Bunko-macOS-$bunko_release.xcarchive" \
  -exportOptionsPlist macos/ExportOptions.plist -exportPath "release/macos-export-$bunko_release"
codesign --verify --deep --strict "release/Bunko-macOS-$bunko_release.xcarchive/Products/Applications/Bunko.app"
shasum -a 256 "release/macos-export-$bunko_release/Bunko.pkg"
