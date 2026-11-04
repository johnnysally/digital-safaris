import axios from './axios';
import type { Customer, LoginResponse } from '../types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  countryCode?: string;
  town?: string;
}

interface RegisterResponse {
  customerId: string;
}

const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await axios.post('/public/register/customer', payload);
    return res.data?.data ?? res.data;
  },

  async verifyEmail(token: string): Promise<{ customerId?: string }> {
    const res = await axios.post('/public/register/verify-email', { token });
    return res.data?.data ?? res.data;
  },

  async resendVerification(email: string): Promise<void> {
    await axios.post('/public/register/resend-verification', { email });
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await axios.post('/public/register/login', payload);
    return (res.data?.data ?? res.data) as LoginResponse;
  },

  async refresh(payload: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken?: string;
  }> {
    const res = await axios.post('/customer/auth/refresh', payload);
    return res.data?.data ?? res.data;
  },

  async logout(): Promise<void> {
    try {
      await axios.post('/customer/auth/logout');
    } catch {}
  },

  async me(): Promise<{ customer: Customer }> {
    const res = await axios.get('/customer/profile');
    const body = res.data?.data ?? res.data;
    return { customer: body.customer as Customer };
  },

  async forgotPassword(payload: { email: string }): Promise<void> {
    await axios.post('/public/register/forgot-password', payload);
  },

  async resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<void> {
    await axios.post('/public/register/reset-password', payload);
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await axios.post('/customer/auth/change-password', payload);
  },
};

export default authApi;