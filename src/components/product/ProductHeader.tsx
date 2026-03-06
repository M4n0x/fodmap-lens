import { StyleSheet, View, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { OFFProduct } from '@/src/types/product';
import { colors, typography, spacing, radius, shadows } from '@/src/theme/design';

interface ProductHeaderProps {
  product: OFFProduct;
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const { t } = useTranslation();
  const imageUrl = product.image_front_url || product.image_url;
  const name =
    product.product_name ||
    product.product_name_en ||
    product.product_name_fr ||
    product.product_name_de ||
    'Unknown Product';

  return (
    <View style={styles.card}>
      <View style={styles.imageShell}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {!!product.brands && <Text style={styles.brand}>{product.brands}</Text>}
        <View style={styles.metaRow}>
          {!!product.quantity && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{product.quantity}</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{t('revamp.common.dataSourceOff')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    ...shadows.sm,
  },
  imageShell: {
    width: 104,
    marginRight: spacing.md,
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderLight,
  },
  placeholderText: {
    ...typography.displayMedium,
    color: colors.textMuted,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.titleLarge,
    color: colors.textPrimary,
  },
  brand: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaChip: {
    borderRadius: radius.full,
    backgroundColor: colors.warmWhite,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  metaChipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
});
