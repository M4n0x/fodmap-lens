#!/usr/bin/env bash
# Automated screenshot capture via Android emulator
# Usage: ./scripts/screenshots.sh [avd_name]
#
# Takes screenshots of all main screens using the release APK.
# Requires: Android SDK with emulator, release APK installed.

set -euo pipefail

ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
EMULATOR="${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator"
PACKAGE="com.anonymous.fodmapapp"
SCHEME="fodmapapp"
OUT_DIR="screenshots"
AVD="${1:-Pixel_8_API_35}"

mkdir -p "$OUT_DIR"

# --- Helpers ---

wait_for_boot() {
  echo "Waiting for emulator to boot..."
  "$ADB" wait-for-device
  until [ "$($ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
  sleep 3
  echo "Emulator ready."
}

screenshot() {
  local name="$1"
  local delay="${2:-3}"
  sleep "$delay"
  "$ADB" shell screencap -p /sdcard/screenshot.png
  "$ADB" pull /sdcard/screenshot.png "$OUT_DIR/${name}.png" >/dev/null
  "$ADB" shell rm /sdcard/screenshot.png
  echo "  captured: ${name}.png"
}

open_deeplink() {
  "$ADB" shell am start -a android.intent.action.VIEW \
    -d "${SCHEME}://$1" "$PACKAGE" >/dev/null 2>&1
}

get_screen_dims() {
  WIDTH=$("$ADB" shell wm size | grep -oE '[0-9]+x[0-9]+' | head -1 | cut -dx -f1)
  HEIGHT=$("$ADB" shell wm size | grep -oE '[0-9]+x[0-9]+' | head -1 | cut -dx -f2)
  TAB_WIDTH=$((WIDTH / 4))
  TAB_Y=$((HEIGHT - 130))
}

tap_tab() {
  local tab_index="$1"
  "$ADB" shell input tap $((TAB_WIDTH * tab_index + TAB_WIDTH / 2)) "$TAB_Y"
}

# --- Main ---

# Start emulator if not already running
if ! "$ADB" devices | grep -q "emulator"; then
  echo "Starting emulator: $AVD"
  "$EMULATOR" -avd "$AVD" -no-audio -no-snapshot-save &
  wait_for_boot
else
  echo "Emulator already running."
fi

get_screen_dims

# Grant permissions upfront
echo "Granting permissions..."
"$ADB" shell pm grant "$PACKAGE" android.permission.CAMERA 2>/dev/null || true

# Force stop and clean launch
echo "Launching app..."
"$ADB" shell am force-stop "$PACKAGE"
sleep 1
"$ADB" shell am start -n "$PACKAGE/.MainActivity" >/dev/null 2>&1
sleep 6

# Seed history: visit 3 products with source=manual
echo "Seeding scan history..."
for barcode in 8076802085738 3017620422003 5449000000996; do
  open_deeplink "product/${barcode}?source=manual"
  sleep 7
  "$ADB" shell input keyevent 4
  sleep 2
done

echo "Taking screenshots..."

# 1. Scan tab (home)
tap_tab 0
screenshot "01-scan"

# 2. History tab (now populated)
tap_tab 1
screenshot "02-history"

# 3. Search tab
tap_tab 2
screenshot "03-search"

# 4. Settings tab
tap_tab 3
screenshot "04-settings"

# 5. Product detail via deep link
open_deeplink "product/8076802085738?source=history"
screenshot "05-product-detail" 5

# 6. Scroll down for FODMAP breakdown
"$ADB" shell input swipe $((WIDTH / 2)) 1500 $((WIDTH / 2)) 600 300
screenshot "06-product-breakdown" 2

# 7. Go back, search for garlic
"$ADB" shell input keyevent 4
sleep 2
tap_tab 2
sleep 2
# Tap the search input field
"$ADB" shell input tap $((WIDTH / 2)) 230
sleep 1
"$ADB" shell input text "garlic"
screenshot "07-search-results" 3
# Dismiss keyboard
"$ADB" shell input keyevent 4

echo ""
echo "All screenshots saved to $OUT_DIR/"
ls -1 "$OUT_DIR"/*.png
