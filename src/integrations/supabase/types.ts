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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          currency: string
          id: string
          job_id: string
          message: string
          proof_url: string | null
          quote_amount: number | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          currency?: string
          id?: string
          job_id: string
          message: string
          proof_url?: string | null
          quote_amount?: number | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          currency?: string
          id?: string
          job_id?: string
          message?: string
          proof_url?: string | null
          quote_amount?: number | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_methods: {
        Row: {
          brand: string
          cardholder: string | null
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          user_id: string
        }
        Insert: {
          brand: string
          cardholder?: string | null
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          cardholder?: string | null
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          client_id: string
          created_at: string
          creative_id: string
          duration_minutes: number
          id: string
          notes: string | null
          scheduled_at: string
          service_id: string | null
          status: string
          studio_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          creative_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at: string
          service_id?: string | null
          status?: string
          studio_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          creative_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at?: string
          service_id?: string | null
          status?: string
          studio_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      content_collaborators: {
        Row: {
          created_at: string
          id: string
          role: string
          sort_order: number
          studio_id: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          sort_order?: number
          studio_id?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          sort_order?: number
          studio_id?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_collaborators_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          company: string | null
          created_at: string
          currency: string
          deadline: string | null
          description: string
          discipline: string
          featured_until: string | null
          id: string
          is_featured: boolean
          job_type: string
          location: string | null
          remote: boolean
          status: string
          studio_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description: string
          discipline: string
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          job_type?: string
          location?: string | null
          remote?: boolean
          status?: string
          studio_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          discipline?: string
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          job_type?: string
          location?: string | null
          remote?: boolean
          status?: string
          studio_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          related_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          related_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          related_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          blurb: string
          created_at: string
          cta: string
          features: string[]
          highlight: boolean
          id: string
          is_active: boolean
          name: string
          period: string
          price_ngn: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          blurb?: string
          created_at?: string
          cta?: string
          features?: string[]
          highlight?: boolean
          id: string
          is_active?: boolean
          name: string
          period?: string
          price_ngn?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          blurb?: string
          created_at?: string
          cta?: string
          features?: string[]
          highlight?: boolean
          id?: string
          is_active?: boolean
          name?: string
          period?: string
          price_ngn?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          available_for_hire: boolean
          avatar_url: string | null
          behance: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          discipline: string | null
          dribbble: string | null
          full_name: string | null
          headline: string | null
          id: string
          instagram: string | null
          is_pro: boolean
          linkedin: string | null
          location: string | null
          skills: string[]
          twitter: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          available_for_hire?: boolean
          avatar_url?: string | null
          behance?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          discipline?: string | null
          dribbble?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          instagram?: string | null
          is_pro?: boolean
          linkedin?: string | null
          location?: string | null
          skills?: string[]
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          available_for_hire?: boolean
          avatar_url?: string | null
          behance?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          discipline?: string | null
          dribbble?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          instagram?: string | null
          is_pro?: boolean
          linkedin?: string | null
          location?: string | null
          skills?: string[]
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          cover_url: string
          created_at: string
          discipline: string | null
          id: string
          is_published: boolean
          likes_count: number
          location: string | null
          sections: Json
          studio_id: string | null
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          views_count: number
          year: string | null
        }
        Insert: {
          client?: string | null
          cover_url: string
          created_at?: string
          discipline?: string | null
          id?: string
          is_published?: boolean
          likes_count?: number
          location?: string | null
          sections?: Json
          studio_id?: string | null
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
          year?: string | null
        }
        Update: {
          client?: string | null
          cover_url?: string
          created_at?: string
          discipline?: string | null
          id?: string
          is_published?: boolean
          likes_count?: number
          location?: string | null
          sections?: Json
          studio_id?: string | null
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          currency: string
          delivery_days: number | null
          description: string | null
          id: string
          is_visible: boolean
          price_amount: number | null
          price_unit: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          description?: string | null
          id?: string
          is_visible?: boolean
          price_amount?: number | null
          price_unit?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          description?: string | null
          id?: string
          is_visible?: boolean
          price_amount?: number | null
          price_unit?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_email: string | null
          invited_user_id: string | null
          role: string
          status: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_email?: string | null
          invited_user_id?: string | null
          role?: string
          status?: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string | null
          invited_user_id?: string | null
          role?: string
          status?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_invites_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_members: {
        Row: {
          created_at: string
          id: string
          role: string
          studio_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          studio_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          studio_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          id: string
          is_public: boolean
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          body: string
          category: string
          created_at: string
          email: string
          id: string
          name: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          body: string
          category?: string
          created_at?: string
          email: string
          id?: string
          name: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          body?: string
          category?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      threads: {
        Row: {
          client_id: string | null
          created_at: string
          creative_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          last_message_at: string
          subject: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          creative_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          last_message_at?: string
          subject?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          creative_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          last_message_at?: string
          subject?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_ngn: number
          created_at: string
          description: string | null
          id: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount_ngn?: number
          created_at?: string
          description?: string | null
          id?: string
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          description?: string | null
          id?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      works: {
        Row: {
          cover_url: string
          created_at: string
          description: string | null
          discipline: string | null
          gallery: Json
          id: string
          is_featured: boolean
          is_published: boolean
          likes_count: number
          studio_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          cover_url: string
          created_at?: string
          description?: string | null
          discipline?: string | null
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          likes_count?: number
          studio_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          cover_url?: string
          created_at?: string
          description?: string | null
          discipline?: string | null
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          likes_count?: number
          studio_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "works_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      can_manage_content_collaborators: {
        Args: { _studio_id?: string; _target_id: string; _target_type: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_job_views: { Args: { _job_id: string }; Returns: undefined }
      increment_project_views: { Args: { _id: string }; Returns: undefined }
      increment_work_views: { Args: { _id: string }; Returns: undefined }
      is_studio_admin: {
        Args: { _studio_id: string; _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type:
      | "artist"
      | "architect"
      | "builder"
      | "designer"
      | "photographer"
      | "engineer"
      | "studio"
      | "other"
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      account_type: [
        "artist",
        "architect",
        "builder",
        "designer",
        "photographer",
        "engineer",
        "studio",
        "other",
      ],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
