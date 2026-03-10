const REQUIRED_CONSECUTIVE_SCANS = 3;

export interface BarcodeStabilizer {
  /** Returns true when the barcode reaches the consecutive detection threshold. */
  onDetection(barcode: string): boolean;
  /** Resets candidate and hit count. */
  reset(): void;
}

export function createBarcodeStabilizer(
  threshold: number = REQUIRED_CONSECUTIVE_SCANS
): BarcodeStabilizer {
  let candidate: string | null = null;
  let hitCount = 0;
  let accepted = false;

  return {
    onDetection(barcode: string): boolean {
      if (barcode !== candidate) {
        candidate = barcode;
        hitCount = 1;
        accepted = false;
      } else if (!accepted) {
        hitCount++;
      }

      if (hitCount >= threshold && !accepted) {
        accepted = true;
        return true;
      }

      return false;
    },

    reset(): void {
      candidate = null;
      hitCount = 0;
      accepted = false;
    },
  };
}
