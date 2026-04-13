// Thin axios wrapper with a sensible UA and a single retry on transient failures.
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

const client = axios.create({
  timeout: 30_000,
  headers: {
    'User-Agent':
      'zaKolikDnes/0.1 (+https://github.com/) - fuel price cap tracker, contact: admin',
    'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.5',
  },
  // We need raw bytes for PDFs; callers pick responseType.
  validateStatus: (s) => s >= 200 && s < 400,
});

export async function fetchWithRetry<T = unknown>(
  url: string,
  opts: AxiosRequestConfig = {},
  retries = 1,
): Promise<AxiosResponse<T>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await client.request<T>({ url, method: 'GET', ...opts });
    } catch (err) {
      lastErr = err;
      const ax = err as { response?: { status?: number } };
      const status = ax.response?.status;
      // Bake URL + status into the error message so it surfaces in API responses.
      if (status) {
        (err as Error).message = `${(err as Error).message} (url=${url}, status=${status})`;
      } else {
        (err as Error).message = `${(err as Error).message} (url=${url})`;
      }
      logger.warn({ url, attempt, status, err: (err as Error).message }, 'http fetch failed');
      // Tiny backoff before the retry.
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}
