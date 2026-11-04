import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from '../types';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import ForgotPassword from '../screens/auth/ForgotPassword';
import ResetPassword from '../screens/auth/ResetPassword';
import VerifyEmail from '../screens/auth/VerifyEmail';
import { defaultHeaderOptions } from './headerOptions';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator id="AuthStack" screenOptions={defaultHeaderOptions}>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ title: 'Forgot Password' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{ title: 'Reset Password' }}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmail}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}