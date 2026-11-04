import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../types';
import Profile from '../screens/profile/Profile';
import Reviews from '../screens/profile/Reviews';
import Notifications from '../screens/profile/Notifications';
import { defaultHeaderOptions } from './headerOptions';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator id="ProfileStack" screenOptions={defaultHeaderOptions}>
      <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
      <Stack.Screen name="Reviews" component={Reviews} options={{ title: 'Reviews' }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}