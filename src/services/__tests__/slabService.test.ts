import { slabService } from '../slabService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('slabService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSlabs', () => {
    it('should fetch all slabs with filters', async () => {
      const mockSlabs = [
        {
          id: 'slab-1',
          name: 'Test Card',
          price: 100,
          status: 'active',
        },
      ];

      // Create a chainable mock that returns the final result
      const createChainableMock = () => {
        const chain = {
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockSlabs,
            error: null,
          }),
        };
        return chain;
      };

      const mockSelect = jest.fn().mockReturnValue(createChainableMock());

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await slabService.getAllSlabs({
        status: 'active',
      });

      expect(result).toEqual(mockSlabs);
    });
  });

  describe('getSlabById', () => {
    it('should fetch slab by id', async () => {
      const mockSlab = {
        id: 'slab-1',
        name: 'Test Card',
        price: 100,
      };

      const createChainableMock = () => {
        return {
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockSlab,
            error: null,
          }),
        };
      };

      const mockSelect = jest.fn().mockReturnValue(createChainableMock());

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await slabService.getSlabById('slab-1');

      expect(result).toEqual(mockSlab);
    });

    it('should throw error if slab not found', async () => {
      const createChainableMock = () => {
        return {
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found', code: 'PGRST116' },
          }),
        };
      };

      const mockSelect = jest.fn().mockReturnValue(createChainableMock());

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(slabService.getSlabById('invalid-id')).rejects.toEqual(
        expect.objectContaining({ message: 'Not found' })
      );
    });
  });

  describe('getFeatured', () => {
    it('should fetch featured slabs', async () => {
      const mockFeatured = [
        {
          id: 'slab-1',
          name: 'Featured Card',
          listing_type: 'featured',
        },
      ];

      const createChainableMock = () => {
        return {
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockFeatured,
            error: null,
          }),
        };
      };

      const mockSelect = jest.fn().mockReturnValue(createChainableMock());

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await slabService.getFeatured(5);

      expect(result).toEqual(mockFeatured);
    });
  });

  describe('getHotDeals', () => {
    it('should fetch hot deals', async () => {
      const mockDeals = [
        {
          id: 'slab-1',
          name: 'Hot Deal',
          price: 50,
        },
      ];

      const createChainableMock = () => {
        return {
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        };
      };

      const mockSelect = jest.fn().mockReturnValue(createChainableMock());

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await slabService.getHotDeals(5);

      expect(result).toEqual(mockDeals);
    });
  });
});

