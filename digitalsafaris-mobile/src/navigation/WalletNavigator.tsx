import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { WalletStackParamList } from '../types';
import Wallet from '../screens/wallet/Wallet';
import Payment from '../screens/wallet/Payment';
import { defaultHeaderOptions, NotificationBell } from './headerOptions';

const Stack = createStackNavigator<WalletStackParamList>();

export default function WalletNavigator() {
  return (
    <Stack.Navigator id="WalletStack" screenOptions={defaultHeaderOptions}>
      <Stack.Screen
        name="Wallet"
        component={Wallet}
        options={{ title: 'Wallet', headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen name="Payment" component={Payment} options={{ title: 'Payments' }} />
    </Stack.Navigator>
  );
}