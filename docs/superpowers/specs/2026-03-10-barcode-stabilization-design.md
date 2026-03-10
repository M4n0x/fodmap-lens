# Barcode Scanner Stabilization

## Problem

The barcode scanner fires on the first detection event, navigating away before the user has steadily aimed. This causes failed scans where the user isn't ready or the barcode was only briefly in frame.

## Solution: Multi-frame Consensus

Require the same barcode to be detected in **3 consecutive frames** before accepting it. This filters out transient reads from camera sweep or unstable aiming.

### How It Works

1. On each `onBarcodeScanned` event, compare the detected barcode to the previous detection
2. If it matches, increment a consecutive-hit counter
3. If it differs, reset the counter and store the new candidate
4. Once the counter reaches the threshold (3), accept the barcode and navigate

### Changes

**Single file:** `src/hooks/useBarcode.ts`

- Add a `candidateRef` to track the current candidate barcode
- Add a `hitCountRef` to track consecutive detections of that candidate
- Modify `handleBarcodeScanned` to implement the consensus logic
- Reset candidate/hitCount in `resetScanner`
- Configurable threshold constant (`REQUIRED_CONSECUTIVE_SCANS = 3`)

### Behavior

- Adds ~200-400ms perceived delay (3 frames at typical camera frame rate)
- No UI changes — the scanner overlay and flow remain identical
- Cooldown and duplicate-detection logic remain unchanged
- Manual entry is unaffected

### Edge Cases

- **User moves between two barcodes:** Counter resets when barcode changes — correct behavior
- **Same barcode re-scanned after cooldown:** Works as before, counter starts fresh
- **Slow camera / low light:** May take slightly longer to reach threshold — acceptable tradeoff

### Not In Scope

- Motion/blur detection
- Visual feedback during stabilization
- Changes to barcode types or camera settings
