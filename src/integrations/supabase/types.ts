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
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          seller_id: string
          title_snapshot: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          seller_id: string
          title_snapshot: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          title_snapshot?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          veribuy_verified_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          veribuy_verified_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          veribuy_verified_at?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          cod_owed_snapshot: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          notes: string | null
          online_balance_snapshot: number
          reference: string | null
          seller_id: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount: number
          cod_owed_snapshot: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          online_balance_snapshot: number
          reference?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount?: number
          cod_owed_snapshot?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          online_balance_snapshot?: number
          reference?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: []
      }
      platform_bank_accounts: {
        Row: {
          account_title: string
          bank_name: string
          created_at: string
          iban: string
          id: string
          is_active: boolean
        }
        Insert: {
          account_title: string
          bank_name: string
          created_at?: string
          iban: string
          id?: string
          is_active?: boolean
        }
        Update: {
          account_title?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          seller_id: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          seller_id: string
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          seller_id?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_documents: {
        Row: {
          doc_type: Database["public"]["Enums"]["seller_doc_type"]
          id: string
          seller_user_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["seller_doc_type"]
          id?: string
          seller_user_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["seller_doc_type"]
          id?: string
          seller_user_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      seller_ledger: {
        Row: {
          cod_owed: number
          lifetime_commission: number
          lifetime_earned: number
          online_balance: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          cod_owed?: number
          lifetime_commission?: number
          lifetime_earned?: number
          online_balance?: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          cod_owed?: number
          lifetime_commission?: number
          lifetime_earned?: number
          online_balance?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          business_name: string
          created_at: string
          description: string | null
          email_verified: boolean
          iban: string | null
          id: string
          is_verified: boolean
          legal_name: string | null
          phone: string | null
          professional_email: string | null
          rejection_reason: string | null
          seller_type: Database["public"]["Enums"]["seller_type"]
          status: Database["public"]["Enums"]["seller_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          warehouse_address_line1: string | null
          warehouse_address_line2: string | null
          warehouse_city: string | null
          warehouse_country: string | null
          warehouse_postal_code: string | null
          warehouse_state: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_name: string
          created_at?: string
          description?: string | null
          email_verified?: boolean
          iban?: string | null
          id?: string
          is_verified?: boolean
          legal_name?: string | null
          phone?: string | null
          professional_email?: string | null
          rejection_reason?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          status?: Database["public"]["Enums"]["seller_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          warehouse_address_line1?: string | null
          warehouse_address_line2?: string | null
          warehouse_city?: string | null
          warehouse_country?: string | null
          warehouse_postal_code?: string | null
          warehouse_state?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_name?: string
          created_at?: string
          description?: string | null
          email_verified?: boolean
          iban?: string | null
          id?: string
          is_verified?: boolean
          legal_name?: string | null
          phone?: string | null
          professional_email?: string | null
          rejection_reason?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          status?: Database["public"]["Enums"]["seller_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          warehouse_address_line1?: string | null
          warehouse_address_line2?: string | null
          warehouse_city?: string | null
          warehouse_country?: string | null
          warehouse_postal_code?: string | null
          warehouse_state?: string | null
        }
        Relationships: []
      }
      seller_team_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string
          member_user_id: string | null
          seller_owner_id: string
          team_role: Database["public"]["Enums"]["seller_team_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email: string
          member_user_id?: string | null
          seller_owner_id: string
          team_role?: Database["public"]["Enums"]["seller_team_role"]
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string
          member_user_id?: string | null
          seller_owner_id?: string
          team_role?: Database["public"]["Enums"]["seller_team_role"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payout_id: string | null
          seller_id: string
          type: Database["public"]["Enums"]["txn_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payout_id?: string | null
          seller_id: string
          type: Database["public"]["Enums"]["txn_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payout_id?: string | null
          seller_id?: string
          type?: Database["public"]["Enums"]["txn_type"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_payout: { Args: { _payout_id: string }; Returns: undefined }
      dispute_order: { Args: { _order_id: string }; Returns: undefined }
      get_seller_team_role: {
        Args: { _owner: string; _user: string }
        Returns: Database["public"]["Enums"]["seller_team_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: { _user_id: string }; Returns: boolean }
      is_seller_team_member: {
        Args: { _owner: string; _user: string }
        Returns: boolean
      }
      verify_order: { Args: { _order_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "customer" | "seller" | "admin"
      order_status:
        | "pending_payment"
        | "paid"
        | "shipped"
        | "awaiting_unbox_verification"
        | "completed"
        | "disputed"
        | "cancelled"
      payment_method: "online" | "cod"
      payout_status: "pending" | "confirmed" | "cancelled"
      seller_doc_type:
        | "cnic_front"
        | "cnic_back"
        | "trade_license"
        | "selfie_with_id"
      seller_status: "pending" | "approved" | "blocked"
      seller_team_role: "owner" | "operations"
      seller_type: "individual" | "business"
      txn_type:
        | "sale_online"
        | "sale_cod"
        | "commission_online"
        | "commission_cod"
        | "payout"
        | "adjustment"
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
      app_role: ["customer", "seller", "admin"],
      order_status: [
        "pending_payment",
        "paid",
        "shipped",
        "awaiting_unbox_verification",
        "completed",
        "disputed",
        "cancelled",
      ],
      payment_method: ["online", "cod"],
      payout_status: ["pending", "confirmed", "cancelled"],
      seller_doc_type: [
        "cnic_front",
        "cnic_back",
        "trade_license",
        "selfie_with_id",
      ],
      seller_status: ["pending", "approved", "blocked"],
      seller_team_role: ["owner", "operations"],
      seller_type: ["individual", "business"],
      txn_type: [
        "sale_online",
        "sale_cod",
        "commission_online",
        "commission_cod",
        "payout",
        "adjustment",
      ],
    },
  },
} as const
