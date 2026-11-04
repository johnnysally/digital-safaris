import axios, { unwrap, unwrapList } from './axios';
import type { Booking, Paginated, ListParams } from '../types';

export interface QuotePayload {
  roomId: string;
  checkIn: string;
  checkOut: string;
  roomsBooked: number;
  guests: { adults: number; children: number };
}

export interface QuoteResponse {
  quoteId: string;
  expiresAt: string;
  roomId: string;
  roomName: string;
  propertyName: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsBooked: number;
  guests: { adults: number; children: number };
  pricePerNight: number;
  subtotal: number;
  total: number;
  currency: string;
}

export interface CreateBookingPayload {
  quoteId: string;
  paymentReference: string;
  specialRequests?: string;
}

const bookingApi = {
  async quote(payload: QuotePayload): Promise<QuoteResponse> {
    const res = await axios.post('/customer/bookings/quote', payload);
    return unwrap<QuoteResponse>(res.data);
  },

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const res = await axios.post('/customer/bookings', payload);
    return unwrap<Booking>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Booking>> {
    const res = await axios.get('/customer/bookings', { params });
    return unwrapList<Booking>(res.data);
  },

  async details(id: string): Promise<Booking> {
    const res = await axios.get(`/customer/bookings/${id}`);
    return unwrap<Booking>(res.data);
  },

  async cancel(id: string, reason?: string): Promise<Booking> {
    const res = await axios.post(`/customer/bookings/${id}/cancel`, { reason });
    return unwrap<Booking>(res.data);
  },

  async checkIn(id: string): Promise<Booking> {
    const res = await axios.post(`/customer/bookings/${id}/check-in`);
    return unwrap<Booking>(res.data);
  },
};

export default bookingApi;