import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { ScanOverlay } from './ScanOverlay';

interface BarcodeScannerProps {
  onBarcodeScanned: (result: { type: string; data: string }) => void;
  isScanning: boolean;
}

export function BarcodeScanner({ onBarcodeScanned, isScanning }: BarcodeScannerProps) {
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        onBarcodeScanned={isScanning ? onBarcodeScanned : undefined}
      />
      <ScanOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
});
