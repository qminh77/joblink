import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendConnectionRequestAction } from '../../../src/features/network/api/actions';

vi.mock('../../../src/features/auth/api/auth-server', () => ({
  requireCurrentUser: vi.fn().mockResolvedValue({ appUser: { id: 1, role: 'member' } }),
  requireUserRole: vi.fn().mockResolvedValue({ appUser: { id: 1, role: 'member' } })
}));

vi.mock('../../../src/lib/action/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({})
}));

vi.mock('../../../src/features/network/services/connections.service', () => ({
  sendConnectionRequest: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key)
}));

describe('sendConnectionRequestAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send connection request successfully', async () => {
    const result = await sendConnectionRequestAction(456);
    expect(result).toBeDefined();
  });
});
