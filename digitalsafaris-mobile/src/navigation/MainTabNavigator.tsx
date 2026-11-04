import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from '../types';
import HomeNavigator from './HomeNavigator';
import ExploreNavigator from './ExploreNavigator';
import ActivityNavigator from './ActivityNavigator';
import WalletNavigator from './WalletNavigator';
import ProfileNavigator from './ProfileNavigator';
import { colors, font } from '../theme';
import { useNotificationStore } from '../store';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary[600],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: font.xs, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let name: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'HomeTab':
              name = focused ? 'home' : 'home-outline';
              break;
            case 'ExploreTab':
              name = focused ? 'compass' : 'compass-outline';
              break;
            case 'ActivityTab':
              name = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'WalletTab':
              name = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'ProfileTab':
              name = focused ? 'person' : 'person-outline';
              break;
            default:
              name = 'ellipse-outline';
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ title: 'Explore' }} />
      <Tab.Screen name="ActivityTab" component={ActivityNavigator} options={{ title: 'Activity' }} />
      <Tab.Screen name="WalletTab" component={WalletNavigator} options={{ title: 'Wallet' }} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.secondary[500],
            color: colors.white,
            fontSize: 10,
          },
        }}
      />
    </Tab.Navigator>
  );
}