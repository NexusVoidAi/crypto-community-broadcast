export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcement_communities: {
        Row: {
          announcement_id: string
          clicks: number | null
          community_id: string
          created_at: string
          delivered: boolean | null
          delivery_log: Json | null
          id: string
          views: number | null
        }
        Insert: {
          announcement_id: string
          clicks?: number | null
          community_id: string
          created_at?: string
          delivered?: boolean | null
          delivery_log?: Json | null
          id?: string
          views?: number | null
        }
        Update: {
          announcement_id?: string
          clicks?: number | null
          community_id?: string
          created_at?: string
          delivered?: boolean | null
          delivery_log?: Json | null
          id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_communities_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          id: string
          impressions: number | null
          media_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at: string
          user_id: string
          validation_result: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          impressions?: number | null
          media_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at?: string
          user_id: string
          validation_result?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          impressions?: number | null
          media_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["announcement_status"]
          title?: string
          updated_at?: string
          user_id?: string
          validation_result?: Json | null
        }
        Relationships: []
      }
      bot_commands: {
        Row: {
          command: string
          created_at: string
          description: string
          id: string
          is_admin_only: boolean
          response_template: string
          updated_at: string
        }
        Insert: {
          command: string
          created_at?: string
          description: string
          id?: string
          is_admin_only?: boolean
          response_template: string
          updated_at?: string
        }
        Update: {
          command?: string
          created_at?: string
          description?: string
          id?: string
          is_admin_only?: boolean
          response_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          clicks: number
          conversions: number
          created_at: string
          date: string
          id: string
          impressions: number
          reach: number
          revenue: number
          spend: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          conversions?: number
          created_at?: string
          date: string
          id?: string
          impressions?: number
          reach?: number
          revenue?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
          reach?: number
          revenue?: number
          spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number
          clicks: number
          conversions: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          reach: number
          revenue: number
          spent: number
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_categories:
            | Database["public"]["Enums"]["target_category"][]
            | null
          target_nations: string[] | null
          target_states: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reach?: number
          revenue?: number
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_categories?:
            | Database["public"]["Enums"]["target_category"][]
            | null
          target_nations?: string[] | null
          target_states?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          clicks?: number
          conversions?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reach?: number
          revenue?: number
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_categories?:
            | Database["public"]["Enums"]["target_category"][]
            | null
          target_nations?: string[] | null
          target_states?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          admin_email: string | null
          approval_status: string
          created_at: string
          description: string | null
          focus_areas: string[] | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          platform_id: string | null
          price_per_announcement: number
          reach: number | null
          region: string[] | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          admin_email?: string | null
          approval_status?: string
          created_at?: string
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          platform: Database["public"]["Enums"]["platform_type"]
          platform_id?: string | null
          price_per_announcement?: number
          reach?: number | null
          region?: string[] | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          admin_email?: string | null
          approval_status?: string
          created_at?: string
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          platform_id?: string | null
          price_per_announcement?: number
          reach?: number | null
          region?: string[] | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      community_earnings: {
        Row: {
          amount: number
          community_id: string
          created_at: string
          currency: string
          id: string
          payment_id: string
        }
        Insert: {
          amount: number
          community_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_id: string
        }
        Update: {
          amount?: number
          community_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_earnings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_earnings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_preferences: {
        Row: {
          bounties: boolean | null
          community_id: string | null
          created_at: string | null
          enable_monetization: boolean | null
          hackathons: boolean | null
          hiring: boolean | null
          id: string
          irl_events: boolean | null
          news_updates: boolean | null
          thread_contests: boolean | null
          updated_at: string | null
        }
        Insert: {
          bounties?: boolean | null
          community_id?: string | null
          created_at?: string | null
          enable_monetization?: boolean | null
          hackathons?: boolean | null
          hiring?: boolean | null
          id?: string
          irl_events?: boolean | null
          news_updates?: boolean | null
          thread_contests?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bounties?: boolean | null
          community_id?: string | null
          created_at?: string | null
          enable_monetization?: boolean | null
          hackathons?: boolean | null
          hiring?: boolean | null
          id?: string
          irl_events?: boolean | null
          news_updates?: boolean | null
          thread_contests?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_preferences_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          announcement_id: string
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          announcement_id: string
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          announcement_id?: string
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          id: number
          platform_fee: number
          telegram_bot_token: string | null
          telegram_bot_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          platform_fee?: number
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          platform_fee?: number
          telegram_bot_token?: string | null
          telegram_bot_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          created_at: string
          id: string
          name: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_type?: string
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_total_communities: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_community_reach: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_tokens_earned: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      announcement_status:
        | "DRAFT"
        | "PENDING_VALIDATION"
        | "VALIDATION_FAILED"
        | "PUBLISHED"
      campaign_status: "active" | "paused" | "completed" | "draft"
      payment_status: "PENDING" | "PAID" | "FAILED"
      platform_type: "TELEGRAM" | "DISCORD" | "WHATSAPP"
      target_category:
        | "Students"
        | "Professionals"
        | "Entrepreneurs"
        | "Parents"
        | "Tech Enthusiasts"
        | "Fitness Enthusiasts"
        | "Healthcare Workers"
        | "Remote Workers"
        | "Digital Nomads"
        | "Small Business Owners"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_status: [
        "DRAFT",
        "PENDING_VALIDATION",
        "VALIDATION_FAILED",
        "PUBLISHED",
      ],
      campaign_status: ["active", "paused", "completed", "draft"],
      payment_status: ["PENDING", "PAID", "FAILED"],
      platform_type: ["TELEGRAM", "DISCORD", "WHATSAPP"],
      target_category: [
        "Students",
        "Professionals",
        "Entrepreneurs",
        "Parents",
        "Tech Enthusiasts",
        "Fitness Enthusiasts",
        "Healthcare Workers",
        "Remote Workers",
        "Digital Nomads",
        "Small Business Owners",
      ],
    },
  },
} as const
