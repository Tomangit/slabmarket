import { shippingService } from '../shippingService';

describe('shippingService', () => {
  describe('calculateShippingCost', () => {
    it('should calculate base shipping cost for low value items', () => {
      const result = shippingService.calculateShippingCost(50, {
        insured: false,
        temperatureControlled: false,
      });

      expect(result.baseCost).toBe(8.00);
      expect(result.insuranceCost).toBe(0);
      expect(result.temperatureControlCost).toBe(0);
      expect(result.totalCost).toBe(8.00);
    });

    it('should calculate shipping with insurance', () => {
      const result = shippingService.calculateShippingCost(100, {
        insured: true,
        temperatureControlled: false,
      });

      expect(result.baseCost).toBe(8.00);
      expect(result.insuranceCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(8.00);
    });

    it('should calculate shipping with temperature control', () => {
      const result = shippingService.calculateShippingCost(100, {
        insured: false,
        temperatureControlled: true,
      });

      expect(result.baseCost).toBe(8.00);
      expect(result.temperatureControlCost).toBe(25.00);
      expect(result.totalCost).toBe(33.00);
    });

    it('should calculate shipping for high value items', () => {
      const result = shippingService.calculateShippingCost(5000, {
        insured: true,
        temperatureControlled: false,
      });

      expect(result.baseCost).toBe(35.00); // Items $2500-$5000 have base cost of $35
      expect(result.insuranceCost).toBeLessThanOrEqual(200.00); // Max insurance
      expect(result.totalCost).toBeGreaterThan(35.00);
    });

    it('should respect insurance minimum', () => {
      const result = shippingService.calculateShippingCost(10, {
        insured: true,
        temperatureControlled: false,
      });

      expect(result.insuranceCost).toBeGreaterThanOrEqual(5.00);
    });

    it('should respect insurance maximum', () => {
      const result = shippingService.calculateShippingCost(50000, {
        insured: true,
        temperatureControlled: false,
      });

      expect(result.insuranceCost).toBeLessThanOrEqual(200.00);
    });

    it('should calculate expedited shipping cost', () => {
      const result = shippingService.calculateShippingCost(100, {
        insured: false,
        temperatureControlled: false,
        expedited: true,
      });

      expect(result.expeditedCost).toBe(15.00);
      expect(result.totalCost).toBe(23.00); // 8 + 15
    });

    it('should calculate all options together', () => {
      const result = shippingService.calculateShippingCost(1000, {
        insured: true,
        temperatureControlled: true,
        expedited: true,
      });

      expect(result.baseCost).toBe(18.00);
      expect(result.insuranceCost).toBeGreaterThan(0);
      expect(result.temperatureControlCost).toBe(25.00);
      expect(result.expeditedCost).toBe(15.00);
      expect(result.totalCost).toBeGreaterThan(58.00);
    });
  });

  describe('getSlabShippingCost', () => {
    it('should calculate shipping for slab', () => {
      const result = shippingService.getSlabShippingCost(500, true, false);

      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.estimatedDays).toBeGreaterThan(0);
    });
  });

  describe('formatShippingCost', () => {
    it('should format cost correctly', () => {
      expect(shippingService.formatShippingCost(12.50)).toBe('$12.50');
      expect(shippingService.formatShippingCost(0)).toBe('$0.00');
      expect(shippingService.formatShippingCost(100.99)).toBe('$100.99');
    });
  });

  describe('getShippingDescription', () => {
    it('should generate description for standard shipping', () => {
      const desc = shippingService.getShippingDescription({
        insured: false,
        temperatureControlled: false,
      });

      expect(desc).toContain('Standard');
    });

    it('should generate description for expedited shipping', () => {
      const desc = shippingService.getShippingDescription({
        insured: false,
        temperatureControlled: false,
        expedited: true,
      });

      expect(desc).toContain('Expedited');
    });

    it('should include insurance in description', () => {
      const desc = shippingService.getShippingDescription({
        insured: true,
        temperatureControlled: false,
      });

      expect(desc).toContain('Insured');
    });

    it('should include temperature control in description', () => {
      const desc = shippingService.getShippingDescription({
        insured: false,
        temperatureControlled: true,
      });

      expect(desc).toContain('Temperature Controlled');
    });
  });
});

