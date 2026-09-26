#!/usr/bin/env bash
set -euo pipefail
# Run on the shared Mac after syncing ios/ and the two Capacitor plugin folders.
export PATH=/usr/bin:/bin:/usr/sbin:/sbin
bunko_root="${BUNKO_ROOT:-$HOME/Projects/Bunko}"
bunko_release="${BUNKO_RELEASE:-1.0.6-8}"
bunko_kc="$HOME/Library/Keychains/landn-release.keychain-db"
bunko_pass=$(tr -d '\r\n' < "$HOME/.config/echomind/apple/release-keychain.pass")
security unlock-keychain -p "$bunko_pass" "$bunko_kc"
security set-keychain-settings -lut 14400 "$bunko_kc"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$bunko_pass" "$bunko_kc" >/dev/null
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles" "$bunko_root/release"
cp "$HOME/.config/bunko/apple/Bunko_App_Store.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/92181e3c-3354-4f9c-b9a4-aa92cd5d19b7.mobileprovision"
cp "$HOME/.config/bunko/apple/Bunko_App_Store.mobileprovision" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles/92181e3c-3354-4f9c-b9a4-aa92cd5d19b7.mobileprovision"
cd "$bunko_root/ios/App"
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS -archivePath "$bunko_root/release/Bunko-$bunko_release.xcarchive" -derivedDataPath "$bunko_root/release/DerivedData" -jobs "${BUNKO_BUILD_JOBS:-2}" archive COMPILER_INDEX_STORE_ENABLE=NO "OTHER_CODE_SIGN_FLAGS=--keychain $bunko_kc"
xcodebuild -exportArchive -archivePath "$bunko_root/release/Bunko-$bunko_release.xcarchive" -exportOptionsPlist ExportOptions.plist -exportPath "$bunko_root/release/export-$bunko_release"
shasum -a 256 "$bunko_root/release/export-$bunko_release/App.ipa"
