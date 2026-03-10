# Barcode Scanner Stabilization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent premature barcode scans by requiring 3 consecutive detections of the same barcode before accepting it.

**Architecture:** Extract the stabilization logic into a pure helper function (`createBarcodeStabilizer`) that tracks a candidate barcode and consecutive hit count. The `useBarcode` hook calls this helper on each scan event and only navigates when the stabilizer confirms consensus. This keeps the logic testable without mocking React hooks or expo-router.

**Tech Stack:** TypeScript, React hooks, Jest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/barcodeStabilizer.ts` | Create | Pure stabilization logic (candidate tracking, hit counting, threshold check) |
| `src/hooks/useBarcode.ts` | Modify | Integrate stabilizer into scan handler, reset on `resetScanner` |
| `src/__tests__/barcodeStabilizer.test.ts` | Create | Unit tests for stabilization logic |

---

## Chunk 1: Stabilizer Logic + Tests

### Task 1: Write the barcodeStabilizer module with tests (TDD)

**Files:**
- Create: `src/__tests__/barcodeStabilizer.test.ts`
- Create: `src/hooks/barcodeStabilizer.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/barcodeStabilizer.test.ts`:

```typescript
import { createBarcodeStabilizer } from '../hooks/barcodeStabilizer';

describe('createBarcodeStabilizer', () => {
  it('does not accept on first detection', () => {
    const stabilizer = createBarcodeStabilizer(3);
    expect(stabilizer.onDetection('1234567890123')).toBe(false);
  });

  it('does not accept on second consecutive detection', () => {
    const stabilizer = createBarcodeStabilizer(3);
    stabilizer.onDetection('1234567890123');
    expect(stabilizer.onDetection('1234567890123')).toBe(false);
  });

  it('accepts on third consecutive detection (threshold=3)', () => {
    const stabilizer = createBarcodeStabilizer(3);
    stabilizer.onDetection('1234567890123');
    stabilizer.onDetection('1234567890123');
    expect(stabilizer.onDetection('1234567890123')).toBe(true);
  });

  it('resets count when a different barcode is detected', () => {
    const stabilizer = createBarcodeStabilizer(3);
    stabilizer.onDetection('1234567890123');
    stabilizer.onDetection('1234567890123');
    // Different barcode resets the counter
    stabilizer.onDetection('9999999999999');
    expect(stabilizer.onDetection('9999999999999')).toBe(false);
    // Need one more to reach threshold
    expect(stabilizer.onDetection('9999999999999')).toBe(true);
  });

  it('reset clears candidate and count', () => {
    const stabilizer = createBarcodeStabilizer(3);
    stabilizer.onDetection('1234567890123');
    stabilizer.onDetection('1234567890123');
    stabilizer.reset();
    // After reset, count starts from scratch
    expect(stabilizer.onDetection('1234567890123')).toBe(false);
  });

  it('works with threshold of 1 (immediate accept)', () => {
    const stabilizer = createBarcodeStabilizer(1);
    expect(stabilizer.onDetection('1234567890123')).toBe(true);
  });

  it('does not re-accept after already accepted without reset', () => {
    const stabilizer = createBarcodeStabilizer(3);
    stabilizer.onDetection('1234567890123');
    stabilizer.onDetection('1234567890123');
    expect(stabilizer.onDetection('1234567890123')).toBe(true);
    // Subsequent detections of same barcode should not re-trigger
    expect(stabilizer.onDetection('1234567890123')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/barcodeStabilizer.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement barcodeStabilizer**

Create `src/hooks/barcodeStabilizer.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/barcodeStabilizer.test.ts --no-coverage`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/barcodeStabilizer.ts src/__tests__/barcodeStabilizer.test.ts
git commit -m "feat: add barcode stabilizer with multi-frame consensus"
```

---

## Chunk 2: Integrate Stabilizer into useBarcode Hook

### Task 2: Wire stabilizer into the existing useBarcode hook

**Files:**
- Modify: `src/hooks/useBarcode.ts` (lines 1-54)

- [ ] **Step 1: Update useBarcode.ts to use the stabilizer**

Replace the full contents of `src/hooks/useBarcode.ts` with:

```typescript
import { useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { createBarcodeStabilizer } from './barcodeStabilizer';

export function useBarcode() {
  const [isScanning, setIsScanning] = useState(true);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stabilizerRef = useRef(createBarcodeStabilizer());

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (!isScanning) return;

      const accepted = stabilizerRef.current.onDetection(data);
      if (!accepted) return;

      lastScannedRef.current = data;
      setIsScanning(false);

      router.push({
        pathname: '/product/[barcode]' as any,
        params: { barcode: data, source: 'scan' },
      });

      // Reset after cooldown to allow re-scanning
      cooldownRef.current = setTimeout(() => {
        lastScannedRef.current = null;
        stabilizerRef.current.reset();
        setIsScanning(true);
      }, 3000);
    },
    [isScanning]
  );

  const handleManualEntry = useCallback((barcode: string) => {
    const trimmed = barcode.trim();
    if (trimmed) {
      router.push({
        pathname: '/product/[barcode]' as any,
        params: { barcode: trimmed, source: 'manual' },
      });
    }
  }, []);

  const resetScanner = useCallback(() => {
    lastScannedRef.current = null;
    stabilizerRef.current.reset();
    setIsScanning(true);
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }
  }, []);

  return {
    isScanning,
    handleBarcodeScanned,
    handleManualEntry,
    resetScanner,
  };
}
```

Key changes from current code:
- Added `stabilizerRef` initialized with `createBarcodeStabilizer()`
- `handleBarcodeScanned` now calls `stabilizerRef.current.onDetection(data)` and returns early if not accepted (replaces the old `data === lastScannedRef.current` check)
- `resetScanner` and cooldown timeout both call `stabilizerRef.current.reset()`

- [ ] **Step 2: Run existing tests to verify no regressions**

Run: `npx jest --no-coverage`
Expected: All tests PASS (existing OCR pipeline tests + new stabilizer tests)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBarcode.ts
git commit -m "feat: integrate barcode stabilizer into useBarcode hook"
```
