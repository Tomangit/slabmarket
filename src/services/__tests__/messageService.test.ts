import { messageService } from '../messageService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateConversation', () => {
    it('should return existing conversation if found', async () => {
      const mockConversation = {
        id: 'conv-1',
        participant_1_id: 'user-1',
        participant_2_id: 'user-2',
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await messageService.getOrCreateConversation('user-1', 'user-2');

      expect(result.id).toBe('conv-1');
    });

    it('should create new conversation if not found', async () => {
      // Mock: conversation not found
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      });

      // Mock: create conversation
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'conv-new',
              participant_1_id: 'user-1',
              participant_2_id: 'user-2',
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      const result = await messageService.getOrCreateConversation('user-1', 'user-2');

      expect(result.id).toBe('conv-new');
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'msg-1',
              conversation_id: 'conv-1',
              sender_id: 'user-1',
              recipient_id: 'user-2',
              content: 'Test message',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Mock getOrCreateConversation
      jest.spyOn(messageService, 'getOrCreateConversation').mockResolvedValue({
        id: 'conv-1',
        participant_1_id: 'user-1',
        participant_2_id: 'user-2',
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      const result = await messageService.sendMessage('user-1', {
        recipientId: 'user-2',
        content: 'Test message',
      });

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Test message');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await messageService.markAsRead('conv-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('messages');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      const mockCount = jest.fn().mockReturnValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                count: 5,
                error: null,
              }),
            }),
          }),
        }),
      });

      const count = await messageService.getUnreadCount('conv-1', 'user-1');

      expect(count).toBe(5);
    });
  });
});

