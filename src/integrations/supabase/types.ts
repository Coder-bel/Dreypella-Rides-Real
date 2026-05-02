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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          invite_code: string
          invited_by: string | null
          phone: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invite_code: string
          invited_by?: string | null
          phone: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          phone?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_super: boolean
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_super?: boolean
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_super?: boolean
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      bikers: {
        Row: {
          company_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          plate_number: string | null
          status: string
          user_id: string | null
          whatsapp_number: string
        }
        Insert: {
          company_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          plate_number?: string | null
          status?: string
          user_id?: string | null
          whatsapp_number: string
        }
        Update: {
          company_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          plate_number?: string | null
          status?: string
          user_id?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          passengers: number
          pickup: string
          price: number
          route: string
          status: string
          travel_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passengers?: number
          pickup: string
          price: number
          route: string
          status?: string
          travel_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passengers?: number
          pickup?: string
          price?: number
          route?: string
          status?: string
          travel_date?: string
          user_id?: string
        }
        Relationships: []
      }
      dispatches: {
        Row: {
          assigned_biker_id: string | null
          biker_assigned: string | null
          biker_phone: string | null
          created_at: string
          delivery_type: string
          dropoff: string
          id: string
          package_type: string
          pickup: string
          price: number
          receiver_name: string | null
          receiver_phone: string
          sender_name: string | null
          sender_phone: string
          status: string
          tracking_id: string
          user_id: string
        }
        Insert: {
          assigned_biker_id?: string | null
          biker_assigned?: string | null
          biker_phone?: string | null
          created_at?: string
          delivery_type?: string
          dropoff: string
          id?: string
          package_type: string
          pickup: string
          price: number
          receiver_name?: string | null
          receiver_phone: string
          sender_name?: string | null
          sender_phone: string
          status?: string
          tracking_id: string
          user_id: string
        }
        Update: {
          assigned_biker_id?: string | null
          biker_assigned?: string | null
          biker_phone?: string | null
          created_at?: string
          delivery_type?: string
          dropoff?: string
          id?: string
          package_type?: string
          pickup?: string
          price?: number
          receiver_name?: string | null
          receiver_phone?: string
          sender_name?: string | null
          sender_phone?: string
          status?: string
          tracking_id?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          attempts: number
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          identifier: string
          otp_hash: string
          role: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          identifier: string
          otp_hash: string
          role: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          identifier?: string
          otp_hash?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dva_details: Json | null
          full_name: string | null
          id: string
          matric_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          dva_details?: Json | null
          full_name?: string | null
          id?: string
          matric_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          dva_details?: Json | null
          full_name?: string | null
          id?: string
          matric_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      trips: {
        Row: {
          available_seats: number
          created_at: string
          departure_time: string
          id: string
          is_active: boolean
          pickup_points: string[]
          price: number
          route: string
          travel_date: string
        }
        Insert: {
          available_seats?: number
          created_at?: string
          departure_time: string
          id?: string
          is_active?: boolean
          pickup_points?: string[]
          price?: number
          route: string
          travel_date: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_time?: string
          id?: string
          is_active?: boolean
          pickup_points?: string[]
          price?: number
          route?: string
          travel_date?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_invite: {
        Args: {
          _email: string
          _full_name: string
          _invite_code: string
          _phone: string
        }
        Returns: Json
      }
      claim_biker_code: { Args: { _company_code: string }; Returns: boolean }
      claim_dispatch: { Args: { _dispatch_id: string }; Returns: Json }
      get_biker_login_email: {
        Args: { _company_code: string }
        Returns: string
      }
      get_users_overview: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          matric_number: string
          phone: string
          total_packages: number
          total_rides: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_dispatch_delivered: {
        Args: { _dispatch_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "biker"
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
      app_role: ["admin", "moderator", "user", "biker"],
    },
  },
} as const
