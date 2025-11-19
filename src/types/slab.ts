
export interface Slab {
  id: string;
  name: string;
  description: string;
  category: "pokemon" | "lorcana" | "sports" | "mtg";
  set: string;
  cardNumber?: string;
  year?: number;
  firstEdition?: boolean;
  
  gradingCompany: "PSA" | "BGS" | "CGC" | "SGC" | "ACE";
  grade: string;
  subgrades?: {
    centering?: number;
    corners?: number;
    edges?: number;
    surface?: number;
  };
  certNumber: string;
  certVerified: boolean;
  popReport?: {
    total: number;
    higherGrades: number;
  };
  
  price: number;
  currency: "USD" | "EUR" | "GBP";
  listingType: "bin" | "auction" | "featured";
  auctionEndDate?: string;
  
  seller: {
    id: string;
    username: string;
    rating: number;
    totalSales: number;
    verified: boolean;
  };
  
  images: string[];
  video360?: string;
  
  shipping: {
    available: boolean;
    insured: boolean;
    temperatureControlled: boolean;
    estimatedDays: number;
    cost: number;
  };
  
  escrowProtection: boolean;
  buyerProtection: boolean;
  
  views: number;
  watchlistCount: number;
  
  priceHistory?: PricePoint[];
  
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface SlabFilter {
  category?: string;
  gradingCompany?: string;
  minGrade?: number;
  maxGrade?: number;
  minPrice?: number;
  maxPrice?: number;
  set?: string;
  listingType?: string;
  certifiedOnly?: boolean;
  escrowOnly?: boolean;
  insuredOnly?: boolean;
  searchQuery?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  verified: boolean;
  kycCompleted: boolean;
  rating: number;
  totalSales: number;
  totalPurchases: number;
  memberSince: string;
  accountType: "buyer" | "seller" | "dealer" | "investor";
}

export interface Watchlist {
  id: string;
  userId: string;
  slabId: string;
  priceAlert?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  slabId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  escrowStatus: "pending" | "released" | "disputed";
  shippingStatus: "preparing" | "shipped" | "delivered";
  trackingNumber?: string;
  createdAt: string;
  completedAt?: string;
}
