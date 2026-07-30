import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    Keyboard.dismiss();
    setIsSubmitting(true);
    setError(null);
    const result = await register(name, email, password);
    setError(result);
    setIsSubmitting(false);
  };

  return (
    <Screen>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Join the show</Text>
          <Text style={styles.subtitle}>
            Create your account. Subscription is managed on the web billing
            flow after signup.
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Min. 4 characters"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label={isSubmitting ? 'Creating…' : 'Create account'}
            onPress={onSubmit}
            disabled={isSubmitting}
            style={styles.submit}
          />
          <AppButton
            label="Back to login"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 44,
    color: colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surface,
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
  },
  submit: {
    marginTop: 22,
  },
});
