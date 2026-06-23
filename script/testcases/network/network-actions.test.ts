import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendConnectionRequestAction } from '../../../src/features/network/api/actions';

vi.mock('../../../src/lib/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue({ appUser: { id: 1 } })
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
  revalidatePath: vi.fn()
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
