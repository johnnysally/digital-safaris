import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ActivityStackParamList } from '../types';
import Activity from '../screens/activity/Activity';
import Booking from '../screens/activity/Booking';
import Order from '../screens/activity/Order';
import Trip from '../screens/activity/Trip';
import Broadcast from '../screens/activity/Broadcast';
import Tracking from '../screens/activity/Tracking';
import NewReview from '../screens/activity/NewReview';
import { defaultHeaderOptions } from './headerOptions';

const Stack = createStackNavigator<ActivityStackParamList>();

export default function ActivityNavigator() {
  return (
    <Stack.Navigator
      id="ActivityStack"
      screenOptions={defaultHeaderOptions}
      initialRouteName="Activity"
    >
      <Stack.Screen name="Activity" component={Activity} options={{ title: 'Activity' }} />
      <Stack.Screen name="Booking" component={Booking} options={{ title: 'Bookings' }} />
      <Stack.Screen name="Order" component={Order} options={{ title: 'Orders' }} />
      <Stack.Screen name="Trip" component={Trip} options={{ title: 'Trips' }} />
      <Stack.Screen name="Broadcast" component={Broadcast} options={{ title: 'Broadcasts' }} />
      <Stack.Screen name="Tracking" component={Tracking} options={{ title: 'Tracking' }} />
      <Stack.Screen name="NewReview" component={NewReview} options={{ title: 'Write a Review' }} />
    </Stack.Navigator>
  );
}