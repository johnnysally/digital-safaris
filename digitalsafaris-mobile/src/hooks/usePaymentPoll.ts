import { useCallback, useState } from 'react';
import { paymentApi } from '../api';

export interface PollResult {
  paid: boolean;
  message?: string;
}

export function usePaymentPoll() {
  const [polling, setPolling] = useState(false);

  const poll = useCallback(
    async (reference: string, timeoutMs = 120_000): Promise<PollResult> => {
      setPolling(true);
      const start = Date.now();
      try {
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const status = await paymentApi.status(reference);
            if (status.status === 'success') return { paid: true };
            if (['failed', 'cancelled', 'refunded'].includes(status.status)) {
              return {
                paid: false,
                message: status.failureReason ?? 'Payment failed',
              };
            }
          } catch {}
        }
        return { paid: false, message: 'Payment timed out. Try again.' };
      } finally {
        setPolling(false);
      }
    },
    [],
  );

  return { poll, polling };
}

export default usePaymentPoll;