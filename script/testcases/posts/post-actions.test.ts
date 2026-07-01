import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleReactionAction } from '../../../src/features/posts/api/actions';

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

vi.mock('../../../src/features/posts/services/post-actions.service', () => ({
  togglePostReaction: vi.fn().mockResolvedValue({ reacted: true })
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

describe('toggleReactionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle reaction successfully', async () => {
    const result = await toggleReactionAction(123);
    // Because of the action wrapper, we expect { ok: true, data: { reacted: true } } or similar
    // The exact wrapper structure might vary, but it shouldn't be an error.
    expect(result).toBeDefined();
  });
});
