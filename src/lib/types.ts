export type AppointmentStatus = "confirmada" | "pendente" | "cancelada";

export interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  active: boolean;
}

export interface Client {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  total_appointments: number;
  total_spent: number;
  last_appointment: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  price: number;
  created_at: string;
  client?: Client;
  service?: Service;
}

export interface WaitingListEntry {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  notes: string | null;
  notified: boolean;
  created_at: string;
  client?: Client;
  service?: Service;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export type ExceptionType = "block" | "open";

export interface AvailabilityException {
  id: string;
  business_id: string;
  date: string; // "YYYY-MM-DD"
  type: ExceptionType;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  reason: string | null;
}

export type SlotStatus = "disponivel" | "reservada" | "cancelada";

export interface AvailableSlot {
  id: string;
  business_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  service_id: string | null;
  status: SlotStatus;
  notes: string | null;
  created_at: string;
  service?: Service;
}

export type Database = {
  public: {
    Tables: {
      businesses: { Row: Business; Insert: Omit<Business, "id" | "created_at">; Update: Partial<Business> };
      services: { Row: Service; Insert: Omit<Service, "id">; Update: Partial<Service> };
      clients: { Row: Client; Insert: Omit<Client, "id" | "created_at">; Update: Partial<Client> };
      appointments: { Row: Appointment; Insert: Omit<Appointment, "id" | "created_at">; Update: Partial<Appointment> };
      waiting_list: { Row: WaitingListEntry; Insert: Omit<WaitingListEntry, "id" | "created_at">; Update: Partial<WaitingListEntry> };
      business_hours: { Row: BusinessHours; Insert: Omit<BusinessHours, "id">; Update: Partial<BusinessHours> };
      availability_exceptions: { Row: AvailabilityException; Insert: Omit<AvailabilityException, "id">; Update: Partial<AvailabilityException> };
      available_slots: { Row: AvailableSlot; Insert: Omit<AvailableSlot, "id" | "created_at" | "service">; Update: Partial<Omit<AvailableSlot, "service">> };
    };
  };
};
