import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { DESKTOP_BREAKPOINT, isWebPlatform } from '../layout/desktop';
import { colors } from '../theme/colors';
import { isTV, tvSpacing } from '../tv';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { ContentDetailScreen } from '../screens/ContentDetailScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { SubscribeScreen } from '../screens/SubscribeScreen';
import { DesktopTabBar } from './DesktopTabBar';
import { TVTabBar } from './TVTabBar';
import type {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function AdaptiveTabBar(props: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  if (isTV) {
    return <TVTabBar {...props} />;
  }
  if (isWebPlatform() && width >= DESKTOP_BREAKPOINT) {
    return <DesktopTabBar {...props} />;
  }
  return <BottomTabBar {...props} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb =
    isWebPlatform() && !isTV && width >= DESKTOP_BREAKPOINT;

  if (isTV) {
    return (
      <Tab.Navigator
        tabBar={(props) => <TVTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            marginLeft: tvSpacing.railWidth,
            backgroundColor: colors.background,
          },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <AdaptiveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isDesktopWeb ? 'top' : 'bottom',
        tabBarStyle: isDesktopWeb
          ? {
              backgroundColor: colors.surface,
              borderTopWidth: 0,
              borderBottomWidth: 0,
              elevation: 0,
              height: undefined,
            }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 56 + Math.max(insets.bottom, 8),
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 6,
            },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3_600SemiBold',
          fontSize: 12,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabGlyph label="●" color={color} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color }) => <TabGlyph label="■" color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color }) => <TabGlyph label="◆" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabGlyph({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 12, lineHeight: 16 }}>{label}</Text>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen name="ContentDetail" component={ContentDetailScreen} />
      <RootStack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ animation: 'fade' }}
      />
      <RootStack.Screen name="Subscribe" component={SubscribeScreen} />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.bootLabel}>STU & LAURIE</Text>
        {isTV ? <Text style={styles.bootHint}>TV mode</Text> : null}
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bootLabel: {
    color: colors.accent,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 3,
  },
  bootHint: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
  },
});
