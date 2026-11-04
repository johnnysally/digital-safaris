import axios, { unwrap } from './axios';
import type { Customer, CustomerProfile, CustomerPreferences } from '../types';

const customerApi = {
  async profile(): Promise<{
    customer: Customer;
    profile?: CustomerProfile;
    preference?: CustomerPreferences;
  }> {
    const res = await axios.get('/customer/profile');
    return unwrap(res.data);
  },

  async updateProfile(payload: Partial<Customer>): Promise<Customer> {
    const res = await axios.patch('/customer/profile', payload);
    return unwrap<Customer>(res.data);
  },

  async updateDetails(
    payload: Partial<CustomerProfile>
  ): Promise<CustomerProfile> {
    const res = await axios.patch('/customer/profile/details', payload);
    return unwrap<CustomerProfile>(res.data);
  },

  async updatePreferences(
    payload: Partial<CustomerPreferences>
  ): Promise<CustomerPreferences> {
    const res = await axios.patch('/customer/profile/preferences', payload);
    return unwrap<CustomerPreferences>(res.data);
  },

  async uploadAvatar(formData: FormData): Promise<{ avatar?: string }> {
    const res = await axios.patch('/customer/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const body = unwrap<
      { avatar?: string } | { customer?: { avatar?: string } }
    >(res.data);
    const avatar =
      (body as { avatar?: string }).avatar ||
      (body as { customer?: { avatar?: string } }).customer?.avatar;
    return { avatar };
  },

  async removeAvatar(): Promise<void> {
    await axios.patch('/customer/profile/avatar', { avatar: null });
  },
};

export default customerApi;