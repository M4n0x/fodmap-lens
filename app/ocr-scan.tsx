import { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Image as RNImage } from 'react-native';
import { Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSQLiteContext } from 'expo-sqlite';
import { useOcrAnalysis } from '@/src/hooks/useOcrAnalysis';
import { updateScanHistoryOcr } from '@/src/db/queries';
import { useAppStore } from '@/src/store/appStore';
import { CropOverlay } from '@/src/components/ocr/CropOverlay';
import { FodmapScore } from '@/src/components/product/FodmapScore';
import { FodmapBreakdown } from '@/src/components/product/FodmapBreakdown';
import { IngredientList } from '@/src/components/product/IngredientList';
import { colors, typography, spacing, radius } from '@/src/theme/design';

type Phase = 'camera' | 'crop' | 'processing' | 'results';

interface CapturedImage {
  uri: string;
  width: number;
  height: number;
}

export default function OcrScanScreen() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const setOcrResult = useAppStore((s) => s.setOcrResult);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('camera');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const busyRef = useRef(false);
  const { analysis, isAnalyzing, error, extractedText, analyze, reset } = useOcrAnalysis();

  const handleImageCaptured = useCallback((uri: string, width: number, height: number) => {
    setCapturedImage({ uri, width, height });
    setPhase('crop');
    busyRef.current = false;
  }, []);

  const handleCapture = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    // Try CameraView capture first
    if (cameraReady && cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          // Get image dimensions
          const size = await ImageManipulator.manipulateAsync(photo.uri, []);
          handleImageCaptured(photo.uri, size.width, size.height);
          return;
        }
      } catch (err) {
        console.warn('CameraView capture failed, using ImagePicker:', err);
      }
    }

    // Fallback: system camera
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        handleImageCaptured(asset.uri, asset.width, asset.height);
        return;
      }
    } catch (err) {
      console.warn('ImagePicker fallback failed:', err);
    }
    busyRef.current = false;
  }, [cameraReady, handleImageCaptured]);

  const handlePickImage = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        handleImageCaptured(asset.uri, asset.width, asset.height);
        return;
      }
    } catch (err) {
      console.warn('Gallery pick failed:', err);
    }
    busyRef.current = false;
  }, [handleImageCaptured]);

  const handleCropConfirm = useCallback(async (cropRegion: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  }) => {
    if (!capturedImage) return;
    setPhase('processing');
    try {
      // Crop the image
      const cropped = await ImageManipulator.manipulateAsync(
        capturedImage.uri,
        [{ crop: cropRegion }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Run OCR on cropped image
      const result = await TextRecognition.recognize(cropped.uri);
      const text = result.text?.trim() ?? '';

      if (!text) {
        // No text found — go back to crop to try again
        setPhase('crop');
        return;
      }

      await analyze(text);
      setPhase('results');
    } catch (err: any) {
      console.warn('OCR error:', err);
      setPhase('crop');
    }
  }, [capturedImage, analyze]);

  const handleSaveAndGoBack = useCallback(async () => {
    if (barcode && analysis) {
      setOcrResult(barcode, analysis);
      try {
        const analysisJson = JSON.stringify(analysis);
        await updateScanHistoryOcr(db, barcode, analysis.overallScore, analysis.overallRating, analysisJson);
      } catch (err) {
        console.error('Failed to update scan history:', err);
      }
    }
    router.back();
  }, [barcode, analysis, db, setOcrResult]);

  const handleRetake = useCallback(() => {
    reset();
    setCapturedImage(null);
    setCameraReady(false);
    setPhase('camera');
  }, [reset]);

  const handleBackToCrop = useCallback(() => {
    reset();
    setPhase('crop');
  }, [reset]);

  // Permission
  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permIcon}>
          <MaterialCommunityIcons name="camera-outline" size={36} color={colors.textMuted} />
        </View>
        <Text style={styles.permTitle}>{t('ocr.title')}</Text>
        <Text style={styles.permMessage}>{t('ocr.hint')}</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>{t('scan.permissionButton')}</Text>
        </Pressable>
      </View>
    );
  }

  // Processing
  if (phase === 'processing' || isAnalyzing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.sage} />
        <Text style={styles.processingText}>{t('ocr.processing')}</Text>
      </View>
    );
  }

  // Crop phase
  if (phase === 'crop' && capturedImage) {
    return (
      <CropOverlay
        imageUri={capturedImage.uri}
        imageWidth={capturedImage.width}
        imageHeight={capturedImage.height}
        onConfirm={handleCropConfirm}
        onRetake={handleRetake}
        scanLabel={t('ocr.scanArea')}
        retakeLabel={t('ocr.retake')}
      />
    );
  }

  // Results
  if (phase === 'results' && analysis) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultsContent}>
        <View style={styles.ocrHeader}>
          <View style={styles.ocrIconCircle}>
            <MaterialCommunityIcons name="text-recognition" size={28} color={colors.sage} />
          </View>
          <Text style={styles.ocrTitle}>{t('ocr.resultsTitle')}</Text>
          <Text style={styles.ocrSubtitle}>{t('ocr.resultsSubtitle')}</Text>
        </View>

        <FodmapScore score={analysis.overallScore} rating={analysis.overallRating} />
        <FodmapBreakdown analysis={analysis} />
        <IngredientList
          ingredients={analysis.matchedIngredients}
        />

        {extractedText ? (
          <View style={styles.textPreview}>
            <Text style={styles.textPreviewLabel}>{t('ocr.recognizedText')}</Text>
            <Text style={styles.textPreviewContent} numberOfLines={6}>
              {extractedText}
            </Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <Pressable style={styles.retakeButton} onPress={handleBackToCrop}>
            <MaterialCommunityIcons name="crop" size={20} color={colors.sage} />
            <Text style={styles.retakeText}>{t('ocr.adjustCrop')}</Text>
          </Pressable>
          <Pressable style={styles.doneButton} onPress={handleSaveAndGoBack}>
            <MaterialCommunityIcons name="check" size={20} color={colors.textOnDark} />
            <Text style={styles.doneText}>{t('ocr.done')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // Error result
  if (phase === 'results' && error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <MaterialCommunityIcons name="text-box-remove-outline" size={36} color={colors.amber} />
        </View>
        <Text style={styles.errorTitle}>{t('ocr.noTextFound')}</Text>
        <Text style={styles.errorMessage}>{t('ocr.noTextMessage')}</Text>
        <Pressable style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={handleBackToCrop}>
          <MaterialCommunityIcons name="crop" size={20} color={colors.textOnDark} />
          <Text style={styles.primaryBtnText}>{t('ocr.adjustCrop')}</Text>
        </Pressable>
      </View>
    );
  }

  // Camera
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle} pointerEvents="box-none">
          <View style={styles.overlaySide} />
          <View style={styles.scanArea} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>{t('ocr.hint')}</Text>
          <Pressable style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureOuter}>
              <View style={styles.captureInner}>
                <MaterialCommunityIcons name="camera" size={28} color={colors.sage} />
              </View>
            </View>
          </Pressable>
          <Pressable style={styles.galleryButton} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.galleryText}>{t('ocr.pickImage')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const SCAN_W = 320;
const SCAN_H = 220;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  resultsContent: { paddingBottom: 40 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, backgroundColor: colors.cream,
  },
  permIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  permTitle: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  permMessage: {
    ...typography.bodyMedium, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.sage,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 4, borderRadius: radius.md,
  },
  primaryBtnText: { ...typography.titleMedium, color: colors.textOnDark },
  processingText: { ...typography.bodyLarge, color: colors.textSecondary, marginTop: spacing.lg },
  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_H },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanArea: { width: SCAN_W, height: SCAN_H },
  overlayBottom: {
    flex: 1.2, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center',
    justifyContent: 'center', gap: spacing.md, paddingBottom: 30,
  },
  hint: {
    ...typography.bodyMedium, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', paddingHorizontal: spacing.xl,
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.sage, borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.sage, borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.sage, borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.sage, borderBottomRightRadius: 4,
  },
  captureButton: { alignItems: 'center', justifyContent: 'center' },
  captureOuter: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  captureInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
  },
  galleryButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  galleryText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  // Results
  ocrHeader: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  ocrIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sageMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  ocrTitle: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs },
  ocrSubtitle: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
  textPreview: {
    marginHorizontal: spacing.md, marginVertical: spacing.md,
    backgroundColor: colors.warmWhite, borderRadius: radius.md, padding: spacing.md,
  },
  textPreviewLabel: { ...typography.labelLarge, color: colors.textMuted, marginBottom: spacing.sm },
  textPreviewContent: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 18 },
  buttonRow: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.lg,
  },
  retakeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 4, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.sage,
  },
  retakeText: { ...typography.titleMedium, color: colors.sage },
  doneButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 4, borderRadius: radius.md,
    backgroundColor: colors.sage,
  },
  doneText: { ...typography.titleMedium, color: colors.textOnDark },
  errorIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.amberMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  errorTitle: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  errorMessage: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
});
