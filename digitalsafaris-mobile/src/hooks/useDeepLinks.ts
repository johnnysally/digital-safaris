import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

export function useDeepLinks() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      const params = parsed.queryParams ?? {};

      if (path.startsWith('verify-email')) {
        navigation.navigate('Auth', {
          screen: 'VerifyEmail',
          params: {
            token: (params.token as string) ?? undefined,
            email: (params.email as string) ?? undefined,
          },
        });
        return;
      }

      if (path.startsWith('reset-password')) {
        navigation.navigate('Auth', {
          screen: 'ResetPassword',
          params: {
            email: (params.email as string) ?? undefined,
            otp: (params.otp as string) ?? undefined,
          },
        });
        return;
      }

      if (path.startsWith('booking')) {
        navigation.navigate('Main', { screen: 'ActivityTab' });
        return;
      }

      if (path.startsWith('order')) {
        navigation.navigate('Main', { screen: 'ActivityTab' });
        return;
      }
    };

    Linking.getInitialURL().then(handle);

    const sub = Linking.addEventListener('url', ({ url }) => handle(url));

    return () => sub.remove();
  }, [navigation]);
}

export default useDeepLinks;