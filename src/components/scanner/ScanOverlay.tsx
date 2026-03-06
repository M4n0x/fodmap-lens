import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '@/src/theme/design';

export function ScanOverlay() {
  const { t } = useTranslation();

  return (
    <View style={styles.overlay}>
      <View style={styles.unfocused} />
      <View style={styles.middleRow}>
        <View style={styles.unfocused} />
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.unfocused} />
      </View>
      <View style={styles.unfocused}>
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{t('scan.instructions')}</Text>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 34;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  unfocused: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 140,
  },
  reticle: {
    width: 300,
    height: 140,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.sageLight,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.sageLight,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.sageLight,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.sageLight,
    borderBottomRightRadius: 12,
  },
  hintContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  hintText: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
});
