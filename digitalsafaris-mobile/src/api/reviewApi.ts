import axios, { unwrap, unwrapList } from './axios';
import type { Review, Paginated, ListParams } from '../types';

export interface CreateReviewPayload {
  targetType: 'accommodation' | 'restaurant' | 'transport';
  targetId: string;
  booking?: string;
  trip?: string;
  order?: string;
  property?: string;
  room?: string;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
  cleanliness?: number | null;
  comfort?: number | null;
  location?: number | null;
  service?: number | null;
  value?: number | null;
  foodQuality?: number | null;
  delivery?: number | null;
  tags?: string[];
}

const reviewApi = {
  async create(payload: CreateReviewPayload): Promise<Review> {
    const res = await axios.post('/customer/reviews', payload);
    return unwrap<Review>(res.data);
  },

  async list(params?: ListParams): Promise<Paginated<Review>> {
    const res = await axios.get('/customer/reviews', { params });
    return unwrapList<Review>(res.data);
  },

  async update(
    id: string,
    payload: Partial<CreateReviewPayload>,
  ): Promise<Review> {
    const res = await axios.patch(`/customer/reviews/${id}`, payload);
    return unwrap<Review>(res.data);
  },

  async remove(id: string): Promise<void> {
    await axios.delete(`/customer/reviews/${id}`);
  },
};

export default reviewApi;