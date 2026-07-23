import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { openSubscribeWeb } from '../lib/openSubscribeWeb';
import { colors } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Account'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function AccountScreen({ navigation }: Props) {
  const { user, hasActiveSubscription, planId, logout } = useAuth();
  const isDesktop = useIsDesktopWeb();
  const pad = isDesktop ? desktopSpacing.screenPad : 20;

  return (
    <Screen
      style={[
        styles.root,
        { paddingHorizontal: pad },
        isDesktop && styles.rootDesktop,
      ]}
    >
      <StatusBar style="light" />
      <Text style={styles.title}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Subscription</Text>
        <Text style={styles.value}>
          {hasActiveSubscription
            ? `Active · ${planId ?? 'plan'}`
            : 'Inactive'}
        </Text>
        <AppButton
          label={hasActiveSubscription ? 'Manage on web' : 'Subscribe on web'}
          onPress={() => void openSubscribeWeb(user?.email)}
          style={styles.cta}
        />
        <AppButton
          label="Subscription details"
          variant="ghost"
          onPress={() => navigation.navigate('Subscribe')}
        />
      </View>
      <Text style={styles.note}>
        Billing opens in the browser. App access unlocks after payment sync is
        wired to the backend.
      </Text>
      <AppButton label="Sign out" variant="secondary" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 8,
  },
  rootDesktop: {
    maxWidth: 560,
    width: '100%',
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 40,
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
  },
  value: {
    marginTop: 4,
    color: colors.text,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 20,
  },
  email: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
  },
  cta: {
    marginTop: 14,
  },
  note: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
});
