// Shipping cost calculation service
// This service calculates shipping costs based on item value, weight, and shipping options

export interface ShippingOptions {
  insured: boolean;
  temperatureControlled: boolean;
  expedited?: boolean;
  carrier?: "usps" | "ups" | "fedex" | "dhl";
}

export interface ShippingCost {
  baseCost: number;
  insuranceCost: number;
  temperatureControlCost: number;
  expeditedCost: number;
  totalCost: number;
  estimatedDays: number;
}

// Shipping rate configuration
// In production, these would be stored in a database table
const SHIPPING_RATES = {
  // Base shipping cost by value tier
  baseRates: [
    { maxValue: 100, cost: 8.00 },      // Items under $100
    { maxValue: 500, cost: 12.00 },     // Items $100-$500
    { maxValue: 1000, cost: 18.00 },    // Items $500-$1000
    { maxValue: 2500, cost: 25.00 },    // Items $1000-$2500
    { maxValue: 5000, cost: 35.00 },    // Items $2500-$5000
    { maxValue: Infinity, cost: 50.00 }, // Items over $5000
  ],
  
  // Insurance cost (percentage of item value)
  insuranceRate: 0.015, // 1.5% of item value (min $5, max $200)
  insuranceMin: 5.00,
  insuranceMax: 200.00,
  
  // Temperature-controlled shipping
  temperatureControlCost: 25.00,
  
  // Expedited shipping
  expeditedCost: 15.00,
  
  // Estimated delivery days
  standardDays: 7,
  expeditedDays: 3,
  temperatureControlledDays: 5,
};

export const shippingService = {
  /**
   * Calculate shipping cost based on item value and shipping options
   * @param itemValue - Value of the item in USD
   * @param options - Shipping options
   * @returns Shipping cost breakdown
   */
  calculateShippingCost(
    itemValue: number,
    options: ShippingOptions
  ): ShippingCost {
    // Calculate base shipping cost based on item value
    let baseCost = SHIPPING_RATES.baseRates.find(
      (rate) => itemValue <= rate.maxValue
    )?.cost || SHIPPING_RATES.baseRates[SHIPPING_RATES.baseRates.length - 1].cost;

    // Calculate insurance cost
    let insuranceCost = 0;
    if (options.insured) {
      insuranceCost = itemValue * SHIPPING_RATES.insuranceRate;
      insuranceCost = Math.max(
        SHIPPING_RATES.insuranceMin,
        Math.min(insuranceCost, SHIPPING_RATES.insuranceMax)
      );
    }

    // Temperature-controlled shipping cost
    const temperatureControlCost = options.temperatureControlled
      ? SHIPPING_RATES.temperatureControlCost
      : 0;

    // Expedited shipping cost
    const expeditedCost = options.expedited
      ? SHIPPING_RATES.expeditedCost
      : 0;

    // Calculate total cost
    const totalCost = baseCost + insuranceCost + temperatureControlCost + expeditedCost;

    // Calculate estimated delivery days
    let estimatedDays = SHIPPING_RATES.standardDays;
    if (options.expedited) {
      estimatedDays = SHIPPING_RATES.expeditedDays;
    } else if (options.temperatureControlled) {
      estimatedDays = SHIPPING_RATES.temperatureControlledDays;
    }

    return {
      baseCost,
      insuranceCost,
      temperatureControlCost,
      expeditedCost,
      totalCost: Math.round(totalCost * 100) / 100,
      estimatedDays,
    };
  },

  /**
   * Get shipping cost for a slab listing
   * @param slabPrice - Price of the slab
   * @param shippingInsured - Whether shipping is insured
   * @param shippingTemperatureControlled - Whether shipping is temperature controlled
   * @returns Shipping cost
   */
  getSlabShippingCost(
    slabPrice: number,
    shippingInsured: boolean,
    shippingTemperatureControlled: boolean
  ): ShippingCost {
    return this.calculateShippingCost(slabPrice, {
      insured: shippingInsured,
      temperatureControlled: shippingTemperatureControlled,
    });
  },

  /**
   * Format shipping cost for display
   * @param cost - Shipping cost
   * @returns Formatted cost string
   */
  formatShippingCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
  },

  /**
   * Get shipping options description
   * @param options - Shipping options
   * @returns Description string
   */
  getShippingDescription(options: ShippingOptions): string {
    const parts: string[] = [];
    
    if (options.expedited) {
      parts.push("Expedited");
    } else {
      parts.push("Standard");
    }
    
    if (options.insured) {
      parts.push("Insured");
    }
    
    if (options.temperatureControlled) {
      parts.push("Temperature Controlled");
    }
    
    return parts.join(" • ");
  },
};

