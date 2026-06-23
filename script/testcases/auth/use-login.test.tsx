import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useLogin } from '../../../src/features/auth/hooks/use-login';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('../../../src/features/auth/api/auth-client', () => ({
  signInWithPasswordClient: vi.fn(),
  signOutClient: vi.fn()
}));

vi.mock('../../../src/features/auth/api/mfa-client', () => ({
  getAssuranceLevel: vi.fn(),
  listVerifiedTotpFactors: vi.fn()
}));

vi.mock('../../../src/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'member', status: 'active' }, error: null })
    }))
  })
}));

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="vi" messages={{ auth: { login: { success: "Thành công" }, errors: {} }, common: {} }}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

describe('useLogin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize successfully', () => {
    const { result } = renderHook(() => useLogin(), { wrapper });
    expect(result.current.isPending).toBe(false);
  });
});
