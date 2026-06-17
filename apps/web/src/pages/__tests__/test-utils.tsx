import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Test harness for any page that depends on react-query + react-router.
 *
 * - QueryClient is created per test (no cache bleed across runs).
 * - `retry: false` so a failing fetch shows up immediately instead of
 *   waiting through React Query's default exponential back-off.
 * - MemoryRouter lets a test inject the URL it wants via `initialEntries`.
 *
 * Usage:
 *   renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });
 *   renderWithProviders(<AssignmentDetailPage />, {
 *     initialEntries: ['/assignments/abc-123'],
 *   });
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    }),
    ...rest
  }: { initialEntries?: string[]; queryClient?: QueryClient } & RenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...rest });
}

/**
 * Convenience: replace global fetch with a vi.fn() and pre-load it with
 * the given responses. Each call to fetch consumes the next entry from
 * `mockResponses`. Returns the fetch spy so callers can assert on call args.
 */
export function mockFetch(
  responses: Array<{ ok: boolean; status?: number; body?: unknown; raw?: Response }>,
) {
  const fetchSpy = vi.fn();
  for (const r of responses) {
    if (r.raw) {
      fetchSpy.mockResolvedValueOnce(r.raw);
      continue;
    }
    const status = r.status ?? (r.ok ? 200 : 400);
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(r.body ?? {}), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}
