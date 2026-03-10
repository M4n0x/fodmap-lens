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
