export type UserRole =
  | "customer"
  | "verification_officer"
  | "sales_admin"
  | "super_admin"
  | "vendor"
  | "vendor_employee";

export type VendorStatus = "pending" | "approved" | "suspended";
export type VendorMemberRole = "owner" | "manager" | "worker";
export type HireRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";
export type VendorProjectStatus = "active" | "completed" | "cancelled";
export type VendorTaskStatus = "todo" | "in_progress" | "done";
export type MaterialCategory = "cement" | "bricks" | "steel" | "other";
export type MaterialSellerType = "platform" | "vendor";
export type MaterialOrderStatus =
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type KycStatus = "pending" | "verified" | "rejected";
export type PlotType = "residential" | "commercial";
export type PlotStatus =
  | "available"
  | "reserved"
  | "under_verification"
  | "sold";
export type AmenityType = "mosque" | "park" | "hospital" | "school" | "other";
export type ListingStatus = "pending" | "approved" | "rejected";
export type ReservationStatus =
  | "pending_payment"
  | "reserved"
  | "under_verification"
  | "confirmed"
  | "cancelled"
  | "expired";
export type TransactionStatus =
  | "initiated"
  | "success"
  | "failed"
  | "refunded";
export type DocumentType =
  | "cnic"
  | "cnic_front"
  | "cnic_back"
  | "ownership_proof"
  | "allotment_letter"
  | "ndc_clearance"
  | "agreement_to_sell"
  | "passport_photo"
  | "power_of_attorney"
  | "transfer_deed"
  | "payment_receipt"
  | "other";
export type DocumentStatus = "pending" | "verified" | "rejected";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          cnic_number: string | null;
          phone: string;
          role: UserRole;
          kyc_status: KycStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          cnic_number?: string | null;
          phone: string;
          role?: UserRole;
          kyc_status?: KycStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      phases: {
        Row: {
          id: string;
          society_id: string | null;
          name: string;
          boundary_geojson: Json;
          town_plan_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          society_id?: string | null;
          name: string;
          boundary_geojson: Json;
          town_plan_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["phases"]["Insert"]>;
      };
      plots: {
        Row: {
          id: string;
          phase_id: string;
          plot_number: string;
          size: string;
          street: string | null;
          zone: string | null;
          type: PlotType;
          lump_sum_price: number;
          token_amount: number;
          status: PlotStatus;
          rda_verified: boolean;
          admin_verified: boolean;
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phase_id: string;
          plot_number: string;
          size: string;
          street?: string | null;
          zone?: string | null;
          type: PlotType;
          lump_sum_price: number;
          token_amount: number;
          status?: PlotStatus;
          rda_verified?: boolean;
          admin_verified?: boolean;
          latitude: number;
          longitude: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plots"]["Insert"]>;
      };
      payment_plans: {
        Row: {
          id: string;
          plot_id: string;
          plan_type: string;
          installment_schedule: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plot_id: string;
          plan_type: string;
          installment_schedule?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_plans"]["Insert"]>;
      };
      amenities: {
        Row: {
          id: string;
          phase_id: string | null;
          type: AmenityType;
          latitude: number;
          longitude: number;
          label: string | null;
        };
        Insert: {
          id?: string;
          phase_id?: string | null;
          type: AmenityType;
          latitude: number;
          longitude: number;
          label?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["amenities"]["Insert"]>;
      };
      favorites: {
        Row: {
          id: string;
          customer_id: string;
          plot_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          plot_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      listing_submissions: {
        Row: {
          id: string;
          plot_id: string | null;
          submitted_by: string;
          asking_price: number;
          status: ListingStatus;
          reviewed_by: string | null;
          review_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plot_id?: string | null;
          submitted_by: string;
          asking_price: number;
          status?: ListingStatus;
          reviewed_by?: string | null;
          review_notes?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["listing_submissions"]["Insert"]
        >;
      };
      reservations: {
        Row: {
          id: string;
          plot_id: string;
          customer_id: string;
          token_amount_paid: number | null;
          status: ReservationStatus;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plot_id: string;
          customer_id: string;
          token_amount_paid?: number | null;
          status?: ReservationStatus;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          reservation_id: string;
          gateway_ref: string | null;
          amount: number;
          currency: string;
          status: TransactionStatus;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          gateway_ref?: string | null;
          amount: number;
          currency?: string;
          status?: TransactionStatus;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          plot_id: string | null;
          reservation_id: string | null;
          type: DocumentType;
          file_url: string;
          status: DocumentStatus;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          plot_id?: string | null;
          reservation_id?: string | null;
          type: DocumentType;
          file_url: string;
          status?: DocumentStatus;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      ownership_records: {
        Row: {
          id: string;
          plot_id: string;
          reservation_id: string;
          owner_id: string;
          confirmed_by: string;
          confirmed_at: string;
        };
        Insert: {
          id?: string;
          plot_id: string;
          reservation_id: string;
          owner_id: string;
          confirmed_by: string;
          confirmed_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ownership_records"]["Insert"]
        >;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      kyc_status_enum: KycStatus;
      plot_type_enum: PlotType;
      plot_status_enum: PlotStatus;
      amenity_type_enum: AmenityType;
      listing_status_enum: ListingStatus;
      reservation_status_enum: ReservationStatus;
      transaction_status_enum: TransactionStatus;
      document_type_enum: DocumentType;
      document_status_enum: DocumentStatus;
    };
  };
}

export type Phase = Database["public"]["Tables"]["phases"]["Row"];
export type Plot = Database["public"]["Tables"]["plots"]["Row"];
export type PaymentPlan = Database["public"]["Tables"]["payment_plans"]["Row"];
export type Amenity = Database["public"]["Tables"]["amenities"]["Row"];

export type PlotWithRelations = Plot & {
  phase?: Pick<Phase, "id" | "name"> | null;
  payment_plans?: PaymentPlan[];
  /** Derived: status === "available" */
  is_available?: boolean;
  /** True after successful token payment for an active buy reservation */
  payment_verified?: boolean;
  /** KuickPay PSID / consumer number when payment initiated */
  psid?: string | null;
  payment_ref?: string | null;
  /** Active unpaid reservation expiry (pending_payment) for map countdown */
  reservation_expires_at?: string | null;
};
