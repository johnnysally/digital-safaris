export function extractError(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return typeof msg === 'string' && msg ? msg : fallback;
}

export default extractError;