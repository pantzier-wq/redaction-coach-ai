export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      anonymous_essay_attempts: {
        Row: {
          created_at: string;
          error_message: string | null;
          fingerprint: string;
          id: string;
          redacao_hash: string;
          result: Json | null;
          status: string;
          tema: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          fingerprint: string;
          id?: string;
          redacao_hash: string;
          result?: Json | null;
          status: string;
          tema: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          fingerprint?: string;
          id?: string;
          redacao_hash?: string;
          result?: Json | null;
          status?: string;
          tema?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_tool_sessions: {
        Row: {
          call_count: number;
          created_at: string;
          id: string;
          tool: string;
          updated_at: string;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          call_count?: number;
          created_at?: string;
          id: string;
          tool: string;
          updated_at?: string;
          usage_date: string;
          user_id: string;
        };
        Update: {
          call_count?: number;
          created_at?: string;
          id?: string;
          tool?: string;
          updated_at?: string;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_usage_events: {
        Row: {
          actual_microusd: number | null;
          created_at: string;
          error_code: string | null;
          estimated_microusd: number;
          feature: string;
          id: string;
          input_tokens: number | null;
          latency_ms: number | null;
          model: string;
          output_tokens: number | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          actual_microusd?: number | null;
          created_at?: string;
          error_code?: string | null;
          estimated_microusd?: number;
          feature: string;
          id?: string;
          input_tokens?: number | null;
          latency_ms?: number | null;
          model: string;
          output_tokens?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          actual_microusd?: number | null;
          created_at?: string;
          error_code?: string | null;
          estimated_microusd?: number;
          feature?: string;
          id?: string;
          input_tokens?: number | null;
          latency_ms?: number | null;
          model?: string;
          output_tokens?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      essay_attempts: {
        Row: {
          credit_refunded: boolean;
          created_at: string;
          error_message: string | null;
          id: string;
          model: string | null;
          redacao_hash: string;
          request_id: string | null;
          result: Json | null;
          status: string;
          tema: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          credit_refunded?: boolean;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          model?: string | null;
          redacao_hash: string;
          request_id?: string | null;
          result?: Json | null;
          status: string;
          tema: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          credit_refunded?: boolean;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          model?: string | null;
          redacao_hash?: string;
          request_id?: string | null;
          result?: Json | null;
          status?: string;
          tema?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      essays: {
        Row: {
          attempt_id: string | null;
          created_at: string | null;
          id: string;
          redacao: string;
          resultado: Json;
          tema: string;
          user_id: string;
        };
        Insert: {
          attempt_id?: string | null;
          created_at?: string | null;
          id?: string;
          redacao: string;
          resultado: Json;
          tema: string;
          user_id: string;
        };
        Update: {
          attempt_id?: string | null;
          created_at?: string | null;
          id?: string;
          redacao?: string;
          resultado?: Json;
          tema?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          applied: boolean;
          created_at: string;
          email: string | null;
          external_id: string | null;
          id: string;
          note: string | null;
          payload: Json;
          plan: string | null;
          provider: string;
          status: string | null;
          token: string | null;
        };
        Insert: {
          applied?: boolean;
          created_at?: string;
          email?: string | null;
          external_id?: string | null;
          id?: string;
          note?: string | null;
          payload: Json;
          plan?: string | null;
          provider?: string;
          status?: string | null;
          token?: string | null;
        };
        Update: {
          applied?: boolean;
          created_at?: string;
          email?: string | null;
          external_id?: string | null;
          id?: string;
          note?: string | null;
          payload?: Json;
          plan?: string | null;
          provider?: string;
          status?: string | null;
          token?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          credits: number | null;
          full_name: string | null;
          has_full_access: boolean | null;
          id: string;
          is_pro: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          credits?: number | null;
          full_name?: string | null;
          has_full_access?: boolean | null;
          id: string;
          is_pro?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          credits?: number | null;
          full_name?: string | null;
          has_full_access?: boolean | null;
          id?: string;
          is_pro?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      purchase_tokens: {
        Row: {
          created_at: string;
          id: string;
          paid_at: string | null;
          plan: string;
          status: string;
          token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          plan: string;
          status?: string;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          plan?: string;
          status?: string;
          token?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_anonymous_eligibility: {
        Args: { _fingerprint: string };
        Returns: boolean;
      };
      consume_essay_credit: {
        Args: never;
        Returns: {
          allowed: boolean;
          remaining: number;
          unlimited: boolean;
        }[];
      };
      create_anonymous_attempt: {
        Args: { _fingerprint: string; _redacao: string; _tema: string };
        Returns: string;
      };
      finish_ai_usage: {
        Args: {
          _actual_microusd?: number;
          _error_code?: string;
          _event_id: string;
          _input_tokens?: number;
          _latency_ms?: number;
          _output_tokens?: number;
          _status: string;
        };
        Returns: undefined;
      };
      finish_essay_correction: {
        Args: {
          _attempt_id: string;
          _error?: string;
          _result?: Json;
          _status: string;
        };
        Returns: Json;
      };
      execute_essay_correction_flow: {
        Args: {
          _attempt_id?: string;
          _redacao: string;
          _tema: string;
          _user_id: string;
        };
        Returns: Json;
      };
      finalize_anonymous_essay_correction: {
        Args: {
          _attempt_id: string;
          _error?: string;
          _result?: Json;
          _status: string;
        };
        Returns: undefined;
      };
      finalize_essay_correction: {
        Args: {
          _attempt_id: string;
          _error?: string;
          _result?: Json;
          _status: string;
        };
        Returns: undefined;
      };
      grant_purchase: {
        Args: { _amount_cents: number; _token: string };
        Returns: {
          note: string;
          ok: boolean;
          plan: string;
          user_id: string;
        }[];
      };
      reserve_ai_budget: {
        Args: {
          _daily_limit_microusd: number;
          _estimated_microusd: number;
          _feature: string;
          _model: string;
          _priority: boolean;
          _user_id: string;
        };
        Returns: Json;
      };
      release_ai_tool_usage: {
        Args: { _session_id: string; _user_id: string };
        Returns: undefined;
      };
      reserve_ai_tool_usage: {
        Args: {
          _daily_limit: number;
          _max_calls: number;
          _session_id: string;
          _tool: string;
          _user_id: string;
        };
        Returns: Json;
      };
      start_essay_correction: {
        Args: {
          _model: string;
          _redacao_hash: string;
          _request_id: string;
          _tema: string;
          _user_id: string;
        };
        Returns: Json;
      };
      refund_essay_credit: { Args: never; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
