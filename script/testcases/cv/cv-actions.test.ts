import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCvAction } from '../../../src/features/cvs/api/actions';

vi.mock('../../../src/lib/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue({ appUser: { id: 1 } })
}));

vi.mock('../../../src/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({})
}));

vi.mock('../../../src/features/cvs/services/cv.service', () => ({
  deleteOwnCv: vi.fn().mockResolvedValue(undefined)
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

describe('deleteCvAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw ActionError for invalid ID', async () => {
    const result = await deleteCvAction(0);
    // Since we are mocking action from @/lib/action/server, it should return { ok: false }
    expect(result).toHaveProperty('ok', false);
  });
});
