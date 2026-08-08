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
      essay_attempts: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          redacao_hash: string
          result: Json | null
          status: string
          tema: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          redacao_hash: string
          result?: Json | null
          status: string
          tema: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          redacao_hash?: string
          result?: Json | null
          status?: string
          tema?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      essays: {
        Row: {
          created_at: string | null
          id: string
          redacao: string
          resultado: Json
          tema: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          redacao: string
          resultado: Json
          tema: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          redacao?: string
          resultado?: Json
          tema?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          applied: boolean
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          note: string | null
          payload: Json
          plan: string | null
          provider: string
          status: string | null
          token: string | null
        }
        Insert: {
          applied?: boolean
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          note?: string | null
          payload: Json
          plan?: string | null
          provider?: string
          status?: string | null
          token?: string | null
        }
        Update: {
          applied?: boolean
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          note?: string | null
          payload?: Json
          plan?: string | null
          provider?: string
          status?: string | null
          token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          credits: number | null
          full_name: string | null
          has_full_access: boolean | null
          id: string
          is_pro: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          credits?: number | null
          full_name?: string | null
          has_full_access?: boolean | null
          id: string
          is_pro?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          credits?: number | null
          full_name?: string | null
          has_full_access?: boolean | null
          id?: string
          is_pro?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_tokens: {
        Row: {
          created_at: string
          id: string
          paid_at: string | null
          plan: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_at?: string | null
          plan: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_at?: string | null
          plan?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_essay_credit: {
        Args: never
        Returns: {
          allowed: boolean
          remaining: number
          unlimited: boolean
        }[]
      }
      execute_essay_correction_flow: {
        Args: {
          _attempt_id?: string
          _redacao: string
          _tema: string
          _user_id: string
        }
        Returns: Json
      }
      finalize_essay_correction: {
        Args: {
          _attempt_id: string
          _error?: string
          _result?: Json
          _status: string
        }
        Returns: undefined
      }
      grant_purchase:
        | {
            Args: { _amount_cents?: number; _token: string }
            Returns: {
              note: string
              ok: boolean
              plan: string
              user_id: string
            }[]
          }
        | {
            Args: { _plan?: string; _token: string }
            Returns: {
              note: string
              ok: boolean
              plan: string
              user_id: string
            }[]
          }
      refund_essay_credit: { Args: never; Returns: number }
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
