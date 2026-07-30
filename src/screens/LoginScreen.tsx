import { useState } from 'react';
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { useIsDesktopWeb } from '../layout/desktop';
import { colors } from '../theme/colors';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const isDesktop = useIsDesktopWeb();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    Keyboard.dismiss();
    setIsSubmitting(true);
    setError(null);
    const result = await login(email, password);
    setError(result);
    setIsSubmitting(false);
  };

  const formContent = (
    <>
      {!isDesktop ? (
        <>
          <Text style={styles.brand}>STU & LAURIE</Text>
          <Text style={styles.brandSub}>VARIETY HOUR</Text>
          <Text style={styles.tagline}>
            Live stage energy. Streamed to you.
          </Text>
        </>
      ) : (
        <Text style={styles.desktopFormTitle}>Sign in</Text>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@email.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          label={isSubmitting ? 'Entering…' : 'Enter the show'}
          onPress={onSubmit}
          disabled={isSubmitting}
          style={styles.submit}
          preferredFocus
        />
        <AppButton
          label="Create account"
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </>
  );

  // On web, Pressable + Keyboard.dismiss steals focus from TextInputs.
  const formBlock =
    Platform.OS === 'web' ? (
      formContent
    ) : (
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
        {formContent}
      </Pressable>
    );

  if (isDesktop) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.desktopSplit}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&q=80',
            }}
            style={styles.desktopHero}
          >
            <LinearGradient
              colors={[
                'rgba(9,10,13,0.25)',
                'rgba(9,10,13,0.75)',
                colors.background,
              ]}
              style={styles.desktopHeroGradient}
            >
              <Text style={styles.desktopBrand}>STU & LAURIE</Text>
              <Text style={styles.desktopBrandSub}>VARIETY HOUR</Text>
              <Text style={styles.desktopTagline}>
                Live stage energy. Streamed to you.
              </Text>
            </LinearGradient>
          </ImageBackground>
          <View style={styles.desktopFormPane}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.desktopFormInner}
            >
              {formBlock}
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&q=80',
        }}
        style={styles.bg}
      >
        <LinearGradient
          colors={[
            'rgba(9,10,13,0.35)',
            'rgba(9,10,13,0.92)',
            colors.background,
          ]}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.content}
          >
            {formBlock}
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bg: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  desktopSplit: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopHero: {
    flex: 1.15,
  },
  desktopHeroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 48,
    paddingBottom: 56,
  },
  desktopBrand: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 72,
    color: colors.text,
    letterSpacing: 3,
    lineHeight: 72,
  },
  desktopBrandSub: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: colors.accent,
    letterSpacing: 5,
    marginTop: -4,
  },
  desktopTagline: {
    marginTop: 14,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 18,
    maxWidth: 360,
  },
  desktopFormPane: {
    width: 440,
    maxWidth: 520,
    flexShrink: 0,
    flexGrow: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  desktopFormInner: {
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  desktopFormTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 40,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: 20,
  },
  brand: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 56,
    color: colors.text,
    letterSpacing: 2,
    lineHeight: 56,
  },
  brandSub: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    color: colors.accent,
    letterSpacing: 4,
    marginTop: -4,
  },
  tagline: {
    marginTop: 8,
    marginBottom: 28,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
  },
  form: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  label: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    marginTop: 10,
    color: colors.spotlight,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
  },
  submit: {
    marginTop: 18,
  },
});
