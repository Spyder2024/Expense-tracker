export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_accounts: {
        Row: {
          user_id: string;
          cash_balance: number;
          bank_balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cash_balance?: number;
          bank_balance?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          cash_balance?: number;
          bank_balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      personal_expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          account_type: "Cash" | "Bank";
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          account_type?: "Cash" | "Bank";
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          account_type?: "Cash" | "Bank";
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          id: string;
          lender_id: string;
          borrower_id: string;
          amount: number;
          status: "Pending" | "Settled";
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lender_id: string;
          borrower_id: string;
          amount: number;
          status?: "Pending" | "Settled";
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lender_id?: string;
          borrower_id?: string;
          amount?: number;
          status?: "Pending" | "Settled";
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
