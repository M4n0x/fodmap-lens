import { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/src/store/appStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '@/src/theme/design';

const { width } = Dimensions.get('window');

const STEPS = [
  { titleKey: 'onboarding.step1Title', textKey: 'onboarding.step1Text', icon: 'barcode-scan', color: colors.sage },
  { titleKey: 'onboarding.step2Title', textKey: 'onboarding.step2Text', icon: 'traffic-light', color: colors.amber },
  { titleKey: 'onboarding.step3Title', textKey: 'onboarding.step3Text', icon: 'scale-balance', color: colors.sage },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setHasSeenOnboarding(true);
      router.replace('/(tabs)');
    }
  };

  const current = STEPS[step];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {step === 0 && (
          <Text style={styles.welcome}>{t('onboarding.welcome')}</Text>
        )}
        <View style={[styles.iconCircle, { backgroundColor: `${current.color}18` }]}>
          <MaterialCommunityIcons
            name={current.icon}
            size={48}
            color={current.color}
          />
        </View>
        <Text style={styles.title}>{t(current.titleKey)}</Text>
        <Text style={styles.text}>{t(current.textKey)}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === step && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          buttonColor={colors.sage}
          textColor={colors.textOnDark}
          contentStyle={styles.buttonContent}
        >
          {step < STEPS.length - 1 ? t('common.ok') : t('onboarding.getStarted')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingTop: 80,
    paddingBottom: 60,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    ...typography.displayMedium,
    color: colors.sage,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  text: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  footer: {
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.sage,
    width: 28,
  },
  button: {
    minWidth: 220,
    borderRadius: radius.full,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
});
