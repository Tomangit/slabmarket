 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          card_number: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          rarity: string | null
          set_name: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          card_number?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity?: string | null
          set_name: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          card_number?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: string | null
          set_name?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          created_at: string | null
          items: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          items?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          items?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      checkout_events: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          items: Json | null
          payment_method: string
          shipping_address: string
          status: string
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          items?: Json | null
          payment_method: string
          shipping_address: string
          status?: string
          total: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          items?: Json | null
          payment_method?: string
          shipping_address?: string
          status?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_companies: {
        Row: {
          api_endpoint: string | null
          code: string
          created_at: string | null
          id: string
          name: string
          verification_enabled: boolean
        }
        Insert: {
          api_endpoint?: string | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          verification_enabled?: boolean
        }
        Update: {
          api_endpoint?: string | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          verification_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          price: number
          recorded_at: string | null
          slab_id: string
        }
        Insert: {
          id?: string
          price: number
          recorded_at?: string | null
          slab_id: string
        }
        Update: {
          id?: string
          price?: number
          recorded_at?: string | null
          slab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "slabs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          created_at: string | null
          era: string
          id: string
          language: string
          name: string
          release_year: number | null
        }
        Insert: {
          created_at?: string | null
          era: string
          id: string
          language: string
          name: string
          release_year?: number | null
        }
        Update: {
          created_at?: string | null
          era?: string
          id?: string
          language?: string
          name?: string
          release_year?: number | null
        }
        Relationships: []
      }
      slabs: {
        Row: {
          auction_end_date: string | null
          buyer_protection: boolean | null
          card_id: string | null
          card_number: string | null
          category_id: string | null
          cert_number: string
          cert_verified: boolean | null
          cert_verified_at: string | null
          created_at: string | null
          currency: string
          description: string | null
          escrow_protection: boolean | null
          grade: string
          grading_company_id: string | null
          id: string
          images: string[] | null
          listing_type: string
          name: string
          pop_report_higher: number | null
          pop_report_total: number | null
          price: number
          seller_id: string | null
          set_name: string | null
          shipping_available: boolean | null
          shipping_cost: number | null
          shipping_estimated_days: number | null
          shipping_insured: boolean | null
          shipping_temperature_controlled: boolean | null
          status: string
          subgrade_centering: number | null
          subgrade_corners: number | null
          subgrade_edges: number | null
          subgrade_surface: number | null
          updated_at: string | null
          video_360_url: string | null
          views: number | null
          watchlist_count: number | null
          year: number | null
          first_edition: boolean | null
          shadowless: boolean | null
          pokemon_center_edition: boolean | null
          prerelease: boolean | null
          staff: boolean | null
          tournament_card: boolean | null
          error_card: boolean | null
        }
        Insert: {
          auction_end_date?: string | null
          buyer_protection?: boolean | null
          card_id?: string | null
          card_number?: string | null
          category_id?: string | null
          cert_number: string
          cert_verified?: boolean | null
          cert_verified_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          escrow_protection?: boolean | null
          grade: string
          grading_company_id?: string | null
          id?: string
          images?: string[] | null
          listing_type: string
          name: string
          pop_report_higher?: number | null
          pop_report_total?: number | null
          price: number
          seller_id?: string | null
          set_name?: string | null
          shipping_available?: boolean | null
          shipping_cost?: number | null
          shipping_estimated_days?: number | null
          shipping_insured?: boolean | null
          shipping_temperature_controlled?: boolean | null
          status?: string
          subgrade_centering?: number | null
          subgrade_corners?: number | null
          subgrade_edges?: number | null
          subgrade_surface?: number | null
          updated_at?: string | null
          video_360_url?: string | null
          views?: number | null
          watchlist_count?: number | null
          year?: number | null
          first_edition?: boolean | null
          shadowless?: boolean | null
          pokemon_center_edition?: boolean | null
          prerelease?: boolean | null
          staff?: boolean | null
          tournament_card?: boolean | null
          error_card?: boolean | null
        }
        Update: {
          auction_end_date?: string | null
          buyer_protection?: boolean | null
          card_id?: string | null
          card_number?: string | null
          category_id?: string | null
          cert_number?: string
          cert_verified?: boolean | null
          cert_verified_at?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          escrow_protection?: boolean | null
          grade?: string
          grading_company_id?: string | null
          id?: string
          images?: string[] | null
          listing_type?: string
          name?: string
          pop_report_higher?: number | null
          pop_report_total?: number | null
          price?: number
          seller_id?: string | null
          set_name?: string | null
          shipping_available?: boolean | null
          shipping_cost?: number | null
          shipping_estimated_days?: number | null
          shipping_insured?: boolean | null
          shipping_temperature_controlled?: boolean | null
          status?: string
          subgrade_centering?: number | null
          subgrade_corners?: number | null
          subgrade_edges?: number | null
          subgrade_surface?: number | null
          updated_at?: string | null
          video_360_url?: string | null
          views?: number | null
          watchlist_count?: number | null
          year?: number | null
          first_edition?: boolean | null
          shadowless?: boolean | null
          pokemon_center_edition?: boolean | null
          prerelease?: boolean | null
          staff?: boolean | null
          tournament_card?: boolean | null
          error_card?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "slabs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slabs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "marketplace_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slabs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slabs_grading_company_id_fkey"
            columns: ["grading_company_id"]
            isOneToOne: false
            referencedRelation: "grading_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slabs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          escrow_status: string
          id: string
          marketplace_fee: number
          payment_processing_fee: number
          price: number
          seller_id: string
          seller_receives: number
          shipping_status: string
          slab_id: string
          tracking_number: string | null
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          escrow_status?: string
          id?: string
          marketplace_fee: number
          payment_processing_fee: number
          price: number
          seller_id: string
          seller_receives: number
          shipping_status?: string
          slab_id: string
          tracking_number?: string | null
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          escrow_status?: string
          id?: string
          marketplace_fee?: number
          payment_processing_fee?: number
          price?: number
          seller_id?: string
          seller_receives?: number
          shipping_status?: string
          slab_id?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "slabs"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string | null
          id: string
          price_alert: number | null
          slab_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_alert?: number | null
          slab_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price_alert?: number | null
          slab_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "slabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          slab_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          slab_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          slab_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "slabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      marketplace_cards: {
        Row: {
          available_gradings: string[] | null
          average_price: number | null
          card_number: string | null
          category_id: string | null
          category_name: string | null
          highest_price: number | null
          id: string | null
          image_url: string | null
          lowest_price: number | null
          name: string | null
          rarity: string | null
          set_name: string | null
          total_listings: number | null
          total_sellers: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      increment_slab_views: {
        Args: { slab_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
