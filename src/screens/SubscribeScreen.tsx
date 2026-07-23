import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { openSubscribeWeb } from '../lib/openSubscribeWeb';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscribe'>;

export function SubscribeScreen({ navigation }: Props) {
  const {
    user,
    hasActiveSubscription,
    planId,
    activateSubscription,
    cancelSubscription,
  } = useAuth();

  return (
    <Screen>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>STU & LAURIE+</Text>
        <Text style={styles.title}>Subscribe</Text>
        <Text style={styles.copy}>
          Membership is billed on the web (WordPress checkout). Register once,
          then complete payment securely outside the app stores.
        </Text>

        {hasActiveSubscription ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Subscription active</Text>
            <Text style={styles.activeCopy}>
              Plan: {planId ?? 'active'}. You can stream live shows and the full
              premium library.
            </Text>
            <AppButton
              label="Cancel (mock)"
              variant="secondary"
              onPress={cancelSubscription}
            />
          </View>
        ) : (
          <View style={styles.plan}>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>$11.50</Text>
            <Text style={styles.planDesc}>
              Full library and live access. You will create your billing profile
              on our subscribe page, then finish payment on the official
              checkout.
            </Text>
            <AppButton
              label="Continue on web"
              onPress={() => void openSubscribeWeb(user?.email)}
              style={styles.planCta}
            />
            <AppButton
              label="Demo unlock (local only)"
              variant="ghost"
              onPress={() => activateSubscription('monthly')}
            />
          </View>
        )}

        <AppButton
          label="Done"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 8,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    color: colors.accent,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 2,
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 44,
  },
  copy: {
    marginTop: 8,
    marginBottom: 24,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  plan: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  planName: {
    color: colors.text,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 18,
  },
  planPrice: {
    marginTop: 4,
    color: colors.accent,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
  },
  planDesc: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  planCta: {
    marginTop: 14,
  },
  activeCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 18,
    marginBottom: 16,
  },
  activeTitle: {
    color: colors.success,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 18,
  },
  activeCopy: {
    marginTop: 8,
    marginBottom: 14,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
});
