import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ExploreStackParamList } from '../types';
import Explore from '../screens/explore/Explore';
import Accommodation from '../screens/explore/Accommodation';
import AccommodationDetail from '../screens/explore/AccommodationDetail';
import AccommodationBooking from '../screens/explore/AccommodationBooking';
import Restaurant from '../screens/explore/Restaurant';
import RestaurantDetail from '../screens/explore/RestaurantDetail';
import Transport from '../screens/explore/Transport';
import AiConcierge from '../screens/explore/AiConcierge';
import Search from '../screens/search/Search';
import { defaultHeaderOptions } from './headerOptions';

const Stack = createStackNavigator<ExploreStackParamList>();

export default function ExploreNavigator() {
  return (
    <Stack.Navigator
      id="ExploreStack"
      screenOptions={defaultHeaderOptions}
      initialRouteName="Explore"
    >
      <Stack.Screen name="Explore" component={Explore} options={{ title: 'Explore' }} />
      <Stack.Screen name="Accommodation" component={Accommodation} options={{ title: 'Accommodation' }} />
      <Stack.Screen name="AccommodationDetail" component={AccommodationDetail} options={{ title: 'Property' }} />
      <Stack.Screen name="AccommodationBooking" component={AccommodationBooking} options={{ title: 'Book Stay' }} />
      <Stack.Screen name="Restaurant" component={Restaurant} options={{ title: 'Restaurant' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} options={{ title: 'Menu' }} />
      <Stack.Screen name="Transport" component={Transport} options={{ title: 'Transport' }} />
      <Stack.Screen name="AiConcierge" component={AiConcierge} options={{ title: 'Concierge' }} />
      <Stack.Screen name="Search" component={Search} options={{ title: 'Search' }} />
    </Stack.Navigator>
  );
}