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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      gallery_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          answers: Json
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          listing_id: string
          message: string
          photo_path: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          listing_id: string
          message: string
          photo_path?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          listing_id?: string
          message?: string
          photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_card: boolean
          accepts_cash: boolean
          accepts_eft: boolean
          accepts_snapscan: boolean
          account_number: string | null
          bank_name: string | null
          bio: string
          branch_code: string | null
          business_name: string
          category: string
          cover_url: string | null
          created_at: string
          email: string | null
          hours: string
          id: string
          is_featured: boolean
          logo_url: string | null
          next_billing_date: string | null
          payfast_link: string | null
          payment_method_label: string | null
          payment_reference: string | null
          phone: string | null
          plan_type: string
          rating: number
          review_count: number
          service_area: string
          snapscan_qr_url: string | null
          social_url: string | null
          subscription_status: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          accepts_card?: boolean
          accepts_cash?: boolean
          accepts_eft?: boolean
          accepts_snapscan?: boolean
          account_number?: string | null
          bank_name?: string | null
          bio?: string
          branch_code?: string | null
          business_name: string
          category: string
          cover_url?: string | null
          created_at?: string
          email?: string | null
          hours?: string
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          next_billing_date?: string | null
          payfast_link?: string | null
          payment_method_label?: string | null
          payment_reference?: string | null
          phone?: string | null
          plan_type?: string
          rating?: number
          review_count?: number
          service_area?: string
          snapscan_qr_url?: string | null
          social_url?: string | null
          subscription_status?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          accepts_card?: boolean
          accepts_cash?: boolean
          accepts_eft?: boolean
          accepts_snapscan?: boolean
          account_number?: string | null
          bank_name?: string | null
          bio?: string
          branch_code?: string | null
          business_name?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          email?: string | null
          hours?: string
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          next_billing_date?: string | null
          payfast_link?: string | null
          payment_method_label?: string | null
          payment_reference?: string | null
          phone?: string | null
          plan_type?: string
          rating?: number
          review_count?: number
          service_area?: string
          snapscan_qr_url?: string | null
          social_url?: string | null
          subscription_status?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          listing_id: string
          provider_reply: string | null
          rating: number
          reviewer_id: string | null
          reviewer_name: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          listing_id: string
          provider_reply?: string | null
          rating: number
          reviewer_id?: string | null
          reviewer_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          listing_id?: string
          provider_reply?: string | null
          rating?: number
          reviewer_id?: string | null
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          registration_complete: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          registration_complete?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          registration_complete?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_account_registration: {
        Args: { account_role: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
