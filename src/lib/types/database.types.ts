export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          assigned_specialist: string | null
          booking_source: Database["public"]["Enums"]["booking_source"]
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          reason: string
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_specialist?: string | null
          booking_source: Database["public"]["Enums"]["booking_source"]
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          reason: string
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_specialist?: string | null
          booking_source?: Database["public"]["Enums"]["booking_source"]
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          city: string | null
          created_at: string
          dob: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          patient_id: string | null
          phone: string
          preferred_date: string
          preferred_time: string | null
          reason: string
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_request_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          patient_id?: string | null
          phone: string
          preferred_date: string
          preferred_time?: string | null
          reason: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_request_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string
          preferred_date?: string
          preferred_time?: string | null
          reason?: string
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_request_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_record_teeth: {
        Row: {
          clinical_record_id: string
          id: string
          notes: string | null
          tooth_number: string
        }
        Insert: {
          clinical_record_id: string
          id?: string
          notes?: string | null
          tooth_number: string
        }
        Update: {
          clinical_record_id?: string
          id?: string
          notes?: string | null
          tooth_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_record_teeth_clinical_record_id_fkey"
            columns: ["clinical_record_id"]
            isOneToOne: false
            referencedRelation: "clinical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_records: {
        Row: {
          advice: string | null
          appointment_id: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string
          diagnosis: string | null
          id: string
          medications: string | null
          patient_id: string
          procedure_summary: string | null
          tenant_id: string
        }
        Insert: {
          advice?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by: string
          diagnosis?: string | null
          id?: string
          medications?: string | null
          patient_id: string
          procedure_summary?: string | null
          tenant_id: string
        }
        Update: {
          advice?: string | null
          appointment_id?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string
          diagnosis?: string | null
          id?: string
          medications?: string | null
          patient_id?: string
          procedure_summary?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_by: string | null
          error_count: number
          filename: string | null
          id: string
          imported_at: string
          record_count: number
          source_system: string
          status: Database["public"]["Enums"]["import_batch_status"]
          tenant_id: string
        }
        Insert: {
          created_by?: string | null
          error_count?: number
          filename?: string | null
          id?: string
          imported_at?: string
          record_count?: number
          source_system: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          tenant_id: string
        }
        Update: {
          created_by?: string | null
          error_count?: number
          filename?: string | null
          id?: string
          imported_at?: string
          record_count?: number
          source_system?: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_records: {
        Row: {
          candidate_patients: Json | null
          historical_age: string | null
          id: string
          import_batch_id: string | null
          imported_at: string
          match_confidence: number | null
          match_status: Database["public"]["Enums"]["match_status"]
          parsed_address: string | null
          parsed_name: string | null
          parsed_phone: string | null
          patient_id: string | null
          raw_amount: number
          raw_narration: string
          raw_patient_identifier: string
          raw_payment_mode: string
          source_record_id: string
          source_system: string
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          candidate_patients?: Json | null
          historical_age?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          match_confidence?: number | null
          match_status?: Database["public"]["Enums"]["match_status"]
          parsed_address?: string | null
          parsed_name?: string | null
          parsed_phone?: string | null
          patient_id?: string | null
          raw_amount: number
          raw_narration: string
          raw_patient_identifier: string
          raw_payment_mode: string
          source_record_id: string
          source_system: string
          tenant_id: string
          transaction_date: string
        }
        Update: {
          candidate_patients?: Json | null
          historical_age?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          match_confidence?: number | null
          match_status?: Database["public"]["Enums"]["match_status"]
          parsed_address?: string | null
          parsed_name?: string | null
          parsed_phone?: string | null
          patient_id?: string | null
          raw_amount?: number
          raw_narration?: string
          raw_patient_identifier?: string
          raw_payment_mode?: string
          source_record_id?: string
          source_system?: string
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_relationships: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          related_patient_id: string
          relationship_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          related_patient_id: string
          relationship_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          related_patient_id?: string
          relationship_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_relationships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_relationships_related_patient_id_fkey"
            columns: ["related_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_relationships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          dob: string | null
          id: string
          location: string | null
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          dob?: string | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          dob?: string | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          id: string
          patient_id: string
          payment_date: string
          payment_mode: string
          reference: string | null
          specialist_referral_id: string | null
          tenant_id: string
          treatment_item_id: string | null
          treatment_plan_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          patient_id: string
          payment_date: string
          payment_mode: string
          reference?: string | null
          specialist_referral_id?: string | null
          tenant_id: string
          treatment_item_id?: string | null
          treatment_plan_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          payment_date?: string
          payment_mode?: string
          reference?: string | null
          specialist_referral_id?: string | null
          tenant_id?: string
          treatment_item_id?: string | null
          treatment_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_specialist_referral_id_fkey"
            columns: ["specialist_referral_id"]
            isOneToOne: false
            referencedRelation: "specialist_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_treatment_item_id_fkey"
            columns: ["treatment_item_id"]
            isOneToOne: false
            referencedRelation: "treatment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_referrals: {
        Row: {
          advance_percentage: number
          advance_required: number
          appointment_id: string | null
          created_at: string
          created_by: string
          estimated_cost: number
          id: string
          patient_id: string
          reason: string
          scheduled_appointment_id: string | null
          specialist_name: string
          status: Database["public"]["Enums"]["specialist_referral_status"]
          tenant_id: string
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          advance_percentage?: number
          advance_required: number
          appointment_id?: string | null
          created_at?: string
          created_by: string
          estimated_cost: number
          id?: string
          patient_id: string
          reason: string
          scheduled_appointment_id?: string | null
          specialist_name: string
          status?: Database["public"]["Enums"]["specialist_referral_status"]
          tenant_id: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          advance_percentage?: number
          advance_required?: number
          appointment_id?: string | null
          created_at?: string
          created_by?: string
          estimated_cost?: number
          id?: string
          patient_id?: string
          reason?: string
          scheduled_appointment_id?: string | null
          specialist_name?: string
          status?: Database["public"]["Enums"]["specialist_referral_status"]
          tenant_id?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_referrals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_referrals_scheduled_appointment_id_fkey"
            columns: ["scheduled_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_referrals_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      treatment_items: {
        Row: {
          completed_at: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          notes: string | null
          procedure: string
          status: Database["public"]["Enums"]["treatment_status"]
          tooth_number: string | null
          treatment_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          procedure: string
          status?: Database["public"]["Enums"]["treatment_status"]
          tooth_number?: string | null
          treatment_plan_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          procedure?: string
          status?: Database["public"]["Enums"]["treatment_status"]
          tooth_number?: string | null
          treatment_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_items_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["treatment_plan_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["treatment_plan_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["treatment_plan_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_booking_request_to_patient: {
        Args: { p_existing_patient_id?: string; p_request_id: string }
        Returns: string
      }
      get_auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_auth_tenant_id: { Args: never; Returns: string }
      save_consultation: {
        Args: {
          p_advice: string
          p_appointment_id: string
          p_chief_complaint: string
          p_diagnosis: string
          p_medications: string
          p_procedure_summary: string
          p_teeth: Json
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      appointment_status:
        | "SCHEDULED"
        | "CONFIRMED"
        | "CHECKED_IN"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      booking_request_status:
        | "NEW"
        | "CONTACTED"
        | "CONVERTED"
        | "DECLINED"
        | "CANCELLED"
      booking_source:
        | "WALK_IN"
        | "PHONE"
        | "WHATSAPP"
        | "WEBSITE"
        | "GOOGLE"
        | "REFERRAL"
        | "INSTAGRAM"
        | "OTHER"
      import_batch_status:
        | "CREATED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
      match_status:
        | "UNMATCHED"
        | "CANDIDATE"
        | "AUTO_MATCHED"
        | "MANUAL_REVIEW"
        | "CONFIRMED"
        | "REJECTED"
      specialist_referral_status:
        | "PENDING_ADVANCE"
        | "ADVANCE_PAID"
        | "SCHEDULED"
        | "COMPLETED"
        | "CANCELLED"
      treatment_plan_status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED"
      treatment_status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      user_role: "DENTIST" | "ASSISTANT" | "ADMIN"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "SCHEDULED",
        "CONFIRMED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      booking_request_status: [
        "NEW",
        "CONTACTED",
        "CONVERTED",
        "DECLINED",
        "CANCELLED",
      ],
      booking_source: [
        "WALK_IN",
        "PHONE",
        "WHATSAPP",
        "WEBSITE",
        "GOOGLE",
        "REFERRAL",
        "INSTAGRAM",
        "OTHER",
      ],
      import_batch_status: [
        "CREATED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      match_status: [
        "UNMATCHED",
        "CANDIDATE",
        "AUTO_MATCHED",
        "MANUAL_REVIEW",
        "CONFIRMED",
        "REJECTED",
      ],
      specialist_referral_status: [
        "PENDING_ADVANCE",
        "ADVANCE_PAID",
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
      ],
      treatment_plan_status: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"],
      treatment_status: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      user_role: ["DENTIST", "ASSISTANT", "ADMIN"],
    },
  },
} as const


  export type BookingRequestStatus = Enums<'booking_request_status'>
  export type PatientProfile = Tables<'patients'> & {
    appointments?: any[];
    clinical_records?: any[];
    treatment_plans?: any[];
    legacy_records?: any[];
    patient_relationships?: any[];
    patient_relationships_related?: any[];
  }
  export type Payment = Tables<'payments'> & { treatment_plan_id?: string | null }
  export type TreatmentPlan = Tables<'treatment_plans'>
  export type TreatmentItem = Tables<'treatment_items'>
  export type ClinicalRecord = Tables<'clinical_records'>
  export type ToothRecord = Tables<'clinical_record_teeth'>
  export type Patient = PatientProfile
  export type Appointment = Tables<'appointments'> & { patients?: any }
  export type AppointmentStatus = Enums<'appointment_status'>
  export type BookingRequest = Tables<'booking_requests'>
  export type SpecialistReferral = Tables<'specialist_referrals'>
