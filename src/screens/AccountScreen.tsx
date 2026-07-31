import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
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
  const {
    user,
    hasActiveSubscription,
    planId,
    logout,
    refreshSession,
  } = useAuth();
  const isDesktop = useIsDesktopWeb();
  const pad = isDesktop ? desktopSpacing.screenPad : 20;
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshSession().catch(() => undefined);
    }, [refreshSession]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } catch {
      // keep current UI; API errors surface on next login if session dies
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: pad },
          isDesktop && styles.contentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isDesktop ? styles.column : undefined}>
          <Text style={styles.title}>Account</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.value}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <AppButton
              label="Sign out"
              variant="secondary"
              onPress={() => void logout()}
              style={styles.signOut}
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Subscription</Text>
            <Text style={styles.value}>
              {hasActiveSubscription
                ? `Active · ${planId ?? 'plan'}`
                : 'Inactive'}
            </Text>
            <AppButton
              label={
                hasActiveSubscription ? 'Manage on web' : 'Subscribe on web'
              }
              onPress={() => void openSubscribeWeb(user?.email)}
              style={styles.cta}
            />
            <AppButton
              label={refreshing ? 'Refreshing…' : 'Refresh status'}
              variant="ghost"
              onPress={onRefresh}
              disabled={refreshing}
            />
            <AppButton
              label="Subscription details"
              variant="ghost"
              onPress={() => navigation.navigate('Subscribe')}
            />
          </View>
          <Text style={styles.note}>
            Billing opens in the browser. Membership unlocks after WooCommerce
            syncs with the backend (webhook).
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  contentDesktop: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 560,
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
  signOut: {
    marginTop: 16,
  },
  cta: {
    marginTop: 14,
  },
  note: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
});
