import { useAuthStore } from '../store';

export function useAuth() {
  return useAuthStore();
}

export default useAuth;