import { useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';

export function useBarcode() {
  const [isScanning, setIsScanning] = useState(true);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (!isScanning || data === lastScannedRef.current) return;

      lastScannedRef.current = data;
      setIsScanning(false);

      router.push({
        pathname: '/product/[barcode]' as any,
        params: { barcode: data, source: 'scan' },
      });

      // Reset after cooldown to allow re-scanning
      cooldownRef.current = setTimeout(() => {
        lastScannedRef.current = null;
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
