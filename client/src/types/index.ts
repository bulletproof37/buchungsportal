// Haus-Interface
export interface House {
  id: number;
  name: string;
  price_per_night: number;
  sort_order: number;
}

// Buchungs-Status
export type BookingStatus = 'reservation' | 'booking';

// Buchungs-Interface
export interface Booking {
  id: number;
  house_id: number;
  status: BookingStatus;
  check_in: string; // ISO-Datum
  check_out: string; // ISO-Datum
  guest_last_name: string;
  guest_first_name: string;
  guest_email?: string;
  guest_phone: string;
  guest_street?: string;
  guest_zip?: string;
  guest_city?: string;
  guest_count?: number;
  dog_count: number;
  price_per_night: number;
  surcharge_first_night: number;
  price_per_dog_night: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Buchung erstellen/bearbeiten
export interface BookingInput {
  house_id: number;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  guest_last_name: string;
  guest_first_name: string;
  guest_email?: string;
  guest_phone: string;
  guest_street?: string;
  guest_zip?: string;
  guest_city?: string;
  guest_count?: number;
  dog_count: number;
  price_per_night: number;
  notes?: string;
}

// Einstellungen
export interface Settings {
  company_name: string;
  company_address: string;
  company_zip: string;
  company_city: string;
  company_phone: string;
  company_mobile: string;
  company_email: string;
  surcharge_first_night: number;
  price_per_dog_night: number;
  min_nights: number;
}

// Statistik pro Haus
export interface HouseStatistics {
  house_id: number;
  house_name: string;
  overnight_stays: number;
  booking_count: number;
  reservation_count: number;
  occupied_days: number;
  occupancy_rate: number;
  revenue: number;
}

// Gesamt-Statistik
export interface Statistics {
  from: string;
  to: string;
  houses: HouseStatistics[];
  total: {
    overnight_stays: number;
    booking_count: number;
    reservation_count: number;
    occupancy_rate: number;
    revenue: number;
  };
}

// Sperrzeit
export interface Block {
  id: number;
  house_id: number;
  date_from: string; // ISO date (erster gesperrter Tag)
  date_to: string;   // ISO date (Tag NACH dem letzten gesperrten Tag, exklusiv)
  description: string;
  created_at: string;
}

export interface BlockInput {
  house_id: number;
  date_from: string;
  date_to: string;
  description: string;
}

// Validierungsfehler
export interface ValidationError {
  field: string;
  message: string;
}

// API-Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
