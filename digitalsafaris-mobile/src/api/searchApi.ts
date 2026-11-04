import axios, { unwrapList, unwrap } from './axios';
import type {
  Restaurant,
  RestaurantDetails,
  Property,
  PropertyDetails,
  Room,
  MenuItem,
  Location,
  Paginated,
  ListParams,
  SearchResponse,
  SearchPropertiesParams,
} from '../types';

const searchApi = {
  async restaurants(params?: ListParams): Promise<Paginated<Restaurant>> {
    const res = await axios.get('/customer/search/restaurants', { params });
    return unwrapList<Restaurant>(res.data);
  },

  async restaurantDetails(idOrSlug: string): Promise<RestaurantDetails> {
    const isObjectId = /^[a-f0-9]{24}$/i.test(idOrSlug);

    const listRes = await axios.get('/customer/search/restaurants', {
      params: isObjectId
        ? { id: idOrSlug, limit: 1 }
        : { slug: idOrSlug, limit: 1 },
    });
    const listed = unwrapList<Restaurant>(listRes.data).data ?? [];
    const restaurant = listed[0];
    if (!restaurant) throw new Error('Restaurant not found');

    const menuRes = await axios.get('/customer/search/menu-items', {
      params: { restaurantId: restaurant._id, limit: 500 },
    });
    const menu = unwrapList<MenuItem>(menuRes.data).data ?? [];

    return { restaurant, menu };
  },

  async accommodations(params?: ListParams): Promise<Paginated<Property>> {
    const res = await axios.get('/customer/search/accommodations', { params });
    return unwrapList<Property>(res.data);
  },

  async properties(
    params?: SearchPropertiesParams,
  ): Promise<Paginated<Property>> {
    const res = await axios.get('/customer/search/properties', { params });
    return unwrapList<Property>(res.data);
  },

  async propertyDetails(idOrSlug: string): Promise<PropertyDetails> {
    const res = await axios.get(`/customer/search/properties/${idOrSlug}`);
    return unwrap<PropertyDetails>(res.data);
  },

  async rooms(params?: ListParams): Promise<Paginated<Room>> {
    const res = await axios.get('/customer/search/rooms', { params });
    return unwrapList<Room>(res.data);
  },

  async menuItems(params?: ListParams): Promise<Paginated<MenuItem>> {
    const res = await axios.get('/customer/search/menu-items', { params });
    return unwrapList<MenuItem>(res.data);
  },

  async locations(params?: ListParams): Promise<Location[]> {
    const res = await axios.get('/customer/search/locations', { params });
    return unwrap<Location[]>(res.data);
  },

  async global(params: { q: string; town?: string }): Promise<SearchResponse> {
    const res = await axios.get('/customer/search/global', { params });
    return unwrap<SearchResponse>(res.data);
  },
};

export default searchApi;