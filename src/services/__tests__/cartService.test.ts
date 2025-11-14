import { cartService } from '../cartService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncCartItems', () => {
    it('should sync cart items to Supabase', async () => {
      const mockUpsert = jest.fn().mockReturnValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      const userId = 'test-user-id';
      const items = [
        {
          id: 'slab-1',
          cardId: 'card-1',
          name: 'Test Card',
          price: 100,
          quantity: 1,
        },
      ];

      await cartService.syncCartItems(userId, items);

      expect(supabase.from).toHaveBeenCalledWith('cart_sessions');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          items: expect.any(Object),
          updated_at: expect.any(String),
        }),
        { onConflict: 'user_id' }
      );
    });

    it('should throw error if sync fails', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        error: { message: 'Sync failed', code: '23505' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      const userId = 'test-user-id';
      const items = [
        {
          id: 'slab-1',
          cardId: 'card-1',
          name: 'Test Card',
          price: 100,
          quantity: 1,
        },
      ];

      await expect(cartService.syncCartItems(userId, items)).rejects.toEqual(
        expect.objectContaining({ message: 'Sync failed' })
      );
    });
  });

  describe('clearCartItems', () => {
    it('should clear cart items', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: mockUpdate,
        }),
      });

      const userId = 'test-user-id';

      await cartService.clearCartItems(userId);

      expect(supabase.from).toHaveBeenCalledWith('cart_sessions');
    });
  });

  describe('recordCheckout', () => {
    it('should record checkout event', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        shippingAddress: '123 Test St',
        items: [],
        total: 100,
        paymentMethod: 'card' as const,
      };

      await cartService.recordCheckout(payload);

      expect(supabase.from).toHaveBeenCalledWith('checkout_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: payload.userId,
          email: payload.email,
          full_name: payload.fullName,
          shipping_address: payload.shippingAddress,
          total: payload.total,
          payment_method: payload.paymentMethod,
          status: 'stub_confirmed',
        })
      );
    });
  });
});

