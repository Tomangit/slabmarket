
import { Slab } from "@/types/slab";

export const mockSlabs: Slab[] = [
  {
    id: "1",
    name: "Charizard",
    description: "Iconic Base Set 1st Edition Charizard in pristine PSA 10 condition. One of the most sought-after cards in Pokemon TCG history.",
    category: "pokemon",
    set: "Base Set 1st Edition",
    cardNumber: "4/102",
    year: 1999,
    gradingCompany: "PSA",
    grade: "10",
    certNumber: "82749361",
    certVerified: true,
    popReport: {
      total: 3000,
      higherGrades: 0
    },
    price: 45000,
    currency: "USD",
    listingType: "featured",
    seller: {
      id: "seller1",
      username: "CardKingPro",
      rating: 4.9,
      totalSales: 245,
      verified: true
    },
    images: ["/placeholder-charizard.jpg"],
    shipping: {
      available: true,
      insured: true,
      temperatureControlled: true,
      estimatedDays: 3,
      cost: 50
    },
    escrowProtection: true,
    buyerProtection: true,
    views: 1243,
    watchlistCount: 87,
    priceHistory: [
      { date: "2025-10-13", price: 40000 },
      { date: "2025-10-20", price: 41500 },
      { date: "2025-10-27", price: 43000 },
      { date: "2025-11-03", price: 44000 },
      { date: "2025-11-10", price: 45000 }
    ],
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2025-11-13T14:00:00Z",
    featured: true
  },
  {
    id: "2",
    name: "Pikachu Illustrator",
    description: "Ultra-rare Pikachu Illustrator promo card. One of the most valuable Pokemon cards in existence.",
    category: "pokemon",
    set: "Promo",
    cardNumber: "PROMO",
    year: 1998,
    gradingCompany: "PSA",
    grade: "7",
    certNumber: "12345678",
    certVerified: true,
    popReport: {
      total: 39,
      higherGrades: 12
    },
    price: 275000,
    currency: "USD",
    listingType: "bin",
    seller: {
      id: "seller2",
      username: "VintageCollector",
      rating: 5.0,
      totalSales: 89,
      verified: true
    },
    images: ["/placeholder-pikachu.jpg"],
    shipping: {
      available: true,
      insured: true,
      temperatureControlled: true,
      estimatedDays: 5,
      cost: 200
    },
    escrowProtection: true,
    buyerProtection: true,
    views: 3421,
    watchlistCount: 234,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2025-11-12T16:00:00Z",
    featured: false
  },
  {
    id: "3",
    name: "Blastoise",
    description: "Base Set Shadowless Blastoise in BGS 9.5 Gem Mint condition with perfect subgrades.",
    category: "pokemon",
    set: "Base Set Shadowless",
    cardNumber: "2/102",
    year: 1999,
    gradingCompany: "BGS",
    grade: "9.5",
    subgrades: {
      centering: 9.5,
      corners: 9.5,
      edges: 9.5,
      surface: 10
    },
    certNumber: "98765432",
    certVerified: true,
    price: 8500,
    currency: "USD",
    listingType: "bin",
    seller: {
      id: "seller3",
      username: "SlabDealer",
      rating: 4.8,
      totalSales: 412,
      verified: true
    },
    images: ["/placeholder-blastoise.jpg"],
    shipping: {
      available: true,
      insured: true,
      temperatureControlled: false,
      estimatedDays: 4,
      cost: 35
    },
    escrowProtection: true,
    buyerProtection: true,
    views: 856,
    watchlistCount: 42,
    createdAt: "2025-11-05T12:00:00Z",
    updatedAt: "2025-11-13T10:00:00Z",
    featured: false
  }
];

export function getSlabById(id: string): Slab | undefined {
  return mockSlabs.find(slab => slab.id === id);
}

export function filterSlabs(slabs: Slab[], searchQuery?: string): Slab[] {
  if (!searchQuery) return slabs;
  
  const query = searchQuery.toLowerCase();
  return slabs.filter(slab => 
    slab.name.toLowerCase().includes(query) ||
    slab.set.toLowerCase().includes(query) ||
    slab.certNumber.includes(query)
  );
}
