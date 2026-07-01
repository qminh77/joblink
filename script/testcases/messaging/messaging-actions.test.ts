import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageAction } from '../../../src/features/messaging/api/actions';

vi.mock('../../../src/features/auth/api/auth-server', () => ({
  requireCurrentUser: vi.fn().mockResolvedValue({ appUser: { id: 1, role: 'member' }, profile: { displayName: 'Test', avatarUrl: '' } }),
  requireUserRole: vi.fn().mockResolvedValue({ appUser: { id: 1, role: 'member' }, profile: { displayName: 'Test', avatarUrl: '' } })
}));

vi.mock('../../../src/lib/action/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockResolvedValue({ data: { message: { content: 'test' }, recipientId: 2 }, error: null })
  })
}));

vi.mock('../../../src/features/messaging/lib/new-message-notification', () => ({
  notifyNewMessage: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../src/lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key)
}));

describe('sendMessageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message successfully', async () => {
    const result = await sendMessageAction(1, 'Hello World');
    expect(result).toBeDefined();
  });
});
