import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarcodeScanner } from '@/src/components/scanner/BarcodeScanner';
import { useBarcode } from '@/src/hooks/useBarcode';
import { colors, typography, spacing, radius, shadows } from '@/src/theme/design';

type CaptureMode = 'camera' | 'manual';

export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const { isScanning, handleBarcodeScanned, handleManualEntry, resetScanner } = useBarcode();
  const [manualBarcode, setManualBarcode] = useState('');
  const [mode, setMode] = useState<CaptureMode>('camera');
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission?.granted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unmount/remount camera on focus to prevent dark camera after navigation
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      resetScanner();
      return () => {
        setCameraActive(false);
      };
    }, [resetScanner])
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (mode === 'manual') {
    return (
      <KeyboardAvoidingView
        style={styles.manualScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.manualCard}>
          <View style={styles.manualHeader}>
            <View style={styles.manualIcon}>
              <MaterialCommunityIcons name="keyboard-outline" size={20} color={colors.sage} />
            </View>
            <View style={styles.manualInfo}>
              <Text style={styles.manualTitle}>{t('scan.manualEntry')}</Text>
              <Text style={styles.manualText}>{t('revamp.scan.manualHelp')}</Text>
            </View>
          </View>
          <TextInput
            mode="outlined"
            label={t('scan.manualPlaceholder')}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="numeric"
            style={styles.input}
            maxLength={13}
            outlineColor={colors.border}
            activeOutlineColor={colors.sage}
          />
          <View style={styles.manualActionRow}>
            <Button
              mode="contained"
              onPress={() => handleManualEntry(manualBarcode)}
              disabled={!manualBarcode.trim()}
              style={styles.flexButton}
              buttonColor={colors.sage}
              textColor={colors.textOnDark}
            >
              {t('scan.manualSubmit')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => { setManualBarcode(''); setMode('camera'); }}
              style={styles.flexButton}
              textColor={colors.sage}
            >
              {t('revamp.common.back')}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionIcon}>
          <MaterialCommunityIcons name="camera-off-outline" size={28} color={colors.amberDark} />
        </View>
        <Text style={styles.permissionTitle}>{t('scan.permissionTitle')}</Text>
        <Text style={styles.permissionMessage}>{t('scan.permissionMessage')}</Text>
        <Button
          mode="contained"
          onPress={() => void requestPermission()}
          style={styles.permissionButton}
          buttonColor={colors.sage}
          textColor={colors.textOnDark}
        >
          {t('scan.permissionButton')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.scannerShell}>
      {cameraActive && (
        <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} isScanning={isScanning} />
      )}

      <LinearGradient colors={['rgba(21,32,28,0.84)', 'transparent']} style={styles.scannerTopFade}>
        <Text style={styles.scannerEyebrow}>{t('revamp.scan.scannerEyebrow')}</Text>
        <Text style={styles.scannerTitle}>{t('scan.instructions')}</Text>
        <Text style={styles.scannerBody}>{t('revamp.scan.scannerBody')}</Text>
      </LinearGradient>

      <Pressable style={styles.manualButton} onPress={() => setMode('manual')}>
        <MaterialCommunityIcons name="keyboard-outline" size={18} color="#fff" />
        <Text style={styles.manualButtonText}>{t('scan.manualEntry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.amberMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  permissionMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    borderRadius: radius.full,
  },
  manualScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  manualCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.sm,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  manualIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualInfo: {
    flex: 1,
  },
  manualTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  manualText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.cardBg,
  },
  manualActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  flexButton: {
    flex: 1,
    borderRadius: radius.full,
  },
  scannerShell: {
    flex: 1,
    backgroundColor: '#15201C',
  },
  scannerTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scannerEyebrow: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  scannerTitle: {
    ...typography.displayMedium,
    color: colors.textOnDark,
    marginBottom: spacing.xs,
  },
  scannerBody: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: 280,
  },
  manualButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
  },
  manualButtonText: {
    ...typography.bodyMedium,
    color: '#fff',
    fontWeight: '600',
  },
});
