import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRegister } from '../../../src/features/auth/hooks/use-register';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('../../../src/features/auth/api/auth-actions', () => ({
  registerCompanyAction: vi.fn().mockResolvedValue({ ok: true }),
  registerMemberAction: vi.fn().mockResolvedValue({ ok: true, verifyRequired: true })
}));

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="vi" messages={{ auth: { register: { successCompanyPending: "Thành công", successNeedVerify: "Cần xác minh" }, errors: {} }, common: {} }}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

describe('useRegister hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize successfully', () => {
    const { result } = renderHook(() => useRegister(), { wrapper });
    expect(result.current.isPending).toBe(false);
  });
});
