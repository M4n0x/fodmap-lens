#!/usr/bin/env bash
# Automated screenshot capture via Android emulator
# Usage: ./scripts/screenshots.sh [avd_name]
#
# Takes screenshots of all main screens using the release APK.
# Requires: Android SDK with emulator, release APK installed, ImageMagick (magick).

set -euo pipefail

ADB_BIN="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
EMULATOR="${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator"
PACKAGE="com.anonymous.fodmapapp"
SCHEME="fodmapapp"
OUT_DIR="screenshots"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
AVD="${1:-Pixel_8_API_35}"

mkdir -p "$OUT_DIR"

# --- Helpers ---

adb_cmd() { "$ADB_BIN" -s "$EMU_SERIAL" "$@"; }

wait_for_boot() {
  echo "Waiting for emulator to boot..."
  "$ADB_BIN" wait-for-device
  until [ "$(adb_cmd shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
  sleep 3
  echo "Emulator ready."
}

screenshot() {
  local name="$1"
  local delay="${2:-3}"
  sleep "$delay"
  adb_cmd shell screencap -p /sdcard/screenshot.png
  adb_cmd pull /sdcard/screenshot.png "$OUT_DIR/${name}_full.png" >/dev/null
  adb_cmd shell rm /sdcard/screenshot.png
  magick "$OUT_DIR/${name}_full.png" -resize 50% -quality 75 "$OUT_DIR/${name}.jpg"
  rm "$OUT_DIR/${name}_full.png"
  echo "  captured: ${name}.jpg"
}

open_deeplink() {
  adb_cmd shell am start -a android.intent.action.VIEW \
    -d "${SCHEME}://$1" "$PACKAGE" >/dev/null 2>&1
}

get_screen_dims() {
  WIDTH=$(adb_cmd shell wm size | grep -oE '[0-9]+x[0-9]+' | head -1 | cut -dx -f1)
  HEIGHT=$(adb_cmd shell wm size | grep -oE '[0-9]+x[0-9]+' | head -1 | cut -dx -f2)
  TAB_WIDTH=$((WIDTH / 4))
  TAB_Y=$((HEIGHT - 130))
}

tap_tab() {
  local tab_index="$1"
  adb_cmd shell input tap $((TAB_WIDTH * tab_index + TAB_WIDTH / 2)) "$TAB_Y"
}

# --- Main ---

# Find a running emulator or start one
EMU_SERIAL=$("$ADB_BIN" devices | grep -oE 'emulator-[0-9]+' | head -1 || true)
if [ -z "$EMU_SERIAL" ]; then
  echo "Starting emulator: $AVD"
  "$EMULATOR" -avd "$AVD" -no-audio -no-snapshot-save &
  EMU_SERIAL=$("$ADB_BIN" devices | grep -oE 'emulator-[0-9]+' | head -1 || true)
  wait_for_boot
else
  echo "Emulator already running: $EMU_SERIAL"
fi

get_screen_dims

# --- Phase 1: Fresh install and seed data ---

echo "Reinstalling app..."
adb_cmd uninstall "$PACKAGE" >/dev/null 2>&1 || true
adb_cmd install -r "$APK_PATH" >/dev/null 2>&1
adb_cmd shell pm grant "$PACKAGE" android.permission.CAMERA 2>/dev/null || true

# Verify install
adb_cmd shell pm list packages | grep -q "$PACKAGE" || { echo "ERROR: Install failed"; exit 1; }

echo "Launching app and waiting for DB initialization..."
adb_cmd shell am start -n "$PACKAGE/.MainActivity" >/dev/null 2>&1
sleep 12

# Warm up: navigate tabs to ensure DB + UI are fully ready
tap_tab 1; sleep 2; tap_tab 2; sleep 2; tap_tab 0; sleep 2

echo "Seeding scan history..."
for barcode in 5449000000996 3017620422003 8076802085738; do
  open_deeplink "product/${barcode}?source=manual"
  sleep 12
done

# --- Phase 2: Restart and take screenshots ---

echo "Restarting app for screenshots..."
adb_cmd shell am force-stop "$PACKAGE"
sleep 2
adb_cmd shell am start -n "$PACKAGE/.MainActivity" >/dev/null 2>&1
sleep 8

echo "Taking screenshots..."

# 1. Scan tab (home)
tap_tab 0
screenshot "01-scan"

# 2. History tab (now populated)
tap_tab 1
screenshot "02-history"

# 3. Search tab (empty)
tap_tab 2
screenshot "03-search"

# 4. Tap the "Garlic" quick start chip for search results
adb_cmd shell input tap 135 800
screenshot "07-search-results" 3

# 5. Settings tab
tap_tab 3
screenshot "04-settings"

# 6. Product detail via deep link (Barilla)
open_deeplink "product/8076802085738?source=history"
screenshot "05-product-detail" 5

# 7. Scroll down for FODMAP breakdown
adb_cmd shell input swipe $((WIDTH / 2)) 1500 $((WIDTH / 2)) 600 300
screenshot "06-product-breakdown" 2

echo ""
echo "All screenshots saved to $OUT_DIR/"
ls -1 "$OUT_DIR"/*.jpg
