import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './navigation';
import { navigationRef } from './navigation/navigationRef';
import { useAuthStore } from './store';
import { colors } from './theme';
import { useSessionRefresh, useDeepLinks } from './hooks';
import UpdatePrompt from './components/ui/UpdatePrompt';
import { useUpdateChecker } from './hooks/useUpdateChecker';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function NavigationShell() {
  useDeepLinks();
  useSessionRefresh();
  return <RootNavigator />;
}

function AppInner() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const [hasHidden, setHasHidden] = useState(false);
  const [updateShown, setUpdateShown] = useState(false);
  const { info } = useUpdateChecker();

  useEffect(() => {
    if (!isLoading && !hasHidden) {
      SplashScreen.hideAsync().catch(() => {});
      setHasHidden(true);
    }
  }, [isLoading, hasHidden]);

  useEffect(() => {
    if (hasHidden && info?.available && !updateShown) {
      setUpdateShown(true);
    }
  }, [hasHidden, info, updateShown]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <NavigationShell />
      <UpdatePrompt
        visible={updateShown}
        info={info}
        onDismiss={() => setUpdateShown(false)}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}