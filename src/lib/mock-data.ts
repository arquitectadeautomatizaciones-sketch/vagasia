import type { Appointment, Client, WaitingListEntry, Service } from "./types";

export const mockServices: Service[] = [
  { id: "s1", business_id: "b1", name: "Corte de cabelo", duration_minutes: 45, price: 20, description: null, active: true },
  { id: "s2", business_id: "b1", name: "Coloração", duration_minutes: 120, price: 60, description: null, active: true },
  { id: "s3", business_id: "b1", name: "Tratamento capilar", duration_minutes: 60, price: 35, description: null, active: true },
  { id: "s4", business_id: "b1", name: "Escova e brushing", duration_minutes: 40, price: 25, description: null, active: true },
];

export const mockClients: Client[] = [
  { id: "c1", business_id: "b1", name: "Ana Ferreira", phone: "+351 912 345 678", email: "ana.ferreira@email.com", notes: null, total_appointments: 12, total_spent: 320, last_appointment: "2026-04-20", created_at: "2025-01-10" },
  { id: "c2", business_id: "b1", name: "Mariana Costa", phone: "+351 963 456 789", email: null, notes: "Prefere tarde", total_appointments: 8, total_spent: 240, last_appointment: "2026-04-22", created_at: "2025-02-14" },
  { id: "c3", business_id: "b1", name: "Sofia Rodrigues", phone: "+351 934 567 890", email: "sofia.r@gmail.com", notes: null, total_appointments: 5, total_spent: 150, last_appointment: "2026-04-15", created_at: "2025-03-01" },
  { id: "c4", business_id: "b1", name: "Catarina Lima", phone: "+351 915 678 901", email: null, notes: "Alergia a amónia", total_appointments: 3, total_spent: 90, last_appointment: "2026-04-10", created_at: "2025-03-20" },
  { id: "c5", business_id: "b1", name: "Beatriz Oliveira", phone: "+351 965 789 012", email: "bea.oliveira@email.com", notes: null, total_appointments: 7, total_spent: 210, last_appointment: "2026-04-18", created_at: "2025-01-25" },
  { id: "c6", business_id: "b1", name: "Inês Santos", phone: "+351 936 890 123", email: null, notes: null, total_appointments: 2, total_spent: 45, last_appointment: "2026-04-05", created_at: "2025-04-01" },
];

const today = "2026-04-26";

export const mockAppointments: Appointment[] = [
  { id: "a1", business_id: "b1", client_id: "c1", service_id: "s1", starts_at: `${today}T09:00:00`, ends_at: `${today}T09:45:00`, status: "confirmada", notes: null, price: 20, created_at: today, client: mockClients[0], service: mockServices[0] },
  { id: "a2", business_id: "b1", client_id: "c2", service_id: "s2", starts_at: `${today}T10:00:00`, ends_at: `${today}T12:00:00`, status: "confirmada", notes: null, price: 60, created_at: today, client: mockClients[1], service: mockServices[1] },
  { id: "a3", business_id: "b1", client_id: "c3", service_id: "s4", starts_at: `${today}T12:30:00`, ends_at: `${today}T13:10:00`, status: "pendente", notes: null, price: 25, created_at: today, client: mockClients[2], service: mockServices[3] },
  { id: "a4", business_id: "b1", client_id: "c4", service_id: "s3", starts_at: `${today}T14:00:00`, ends_at: `${today}T15:00:00`, status: "cancelada", notes: "Cliente cancelou", price: 35, created_at: today, client: mockClients[3], service: mockServices[2] },
  { id: "a5", business_id: "b1", client_id: "c5", service_id: "s1", starts_at: `${today}T15:30:00`, ends_at: `${today}T16:15:00`, status: "confirmada", notes: null, price: 20, created_at: today, client: mockClients[4], service: mockServices[0] },
  { id: "a6", business_id: "b1", client_id: "c6", service_id: "s2", starts_at: `${today}T16:30:00`, ends_at: `${today}T18:30:00`, status: "pendente", notes: null, price: 60, created_at: today, client: mockClients[5], service: mockServices[1] },
];

export const mockWaitingList: WaitingListEntry[] = [
  { id: "w1", business_id: "b1", client_id: "c1", service_id: "s2", preferred_date: "2026-04-27", preferred_time_start: "10:00", preferred_time_end: "14:00", notes: null, notified: false, created_at: "2026-04-25", client: mockClients[0], service: mockServices[1] },
  { id: "w2", business_id: "b1", client_id: "c3", service_id: "s1", preferred_date: null, preferred_time_start: "09:00", preferred_time_end: "12:00", notes: "Qualquer dia da semana", notified: false, created_at: "2026-04-24", client: mockClients[2], service: mockServices[0] },
  { id: "w3", business_id: "b1", client_id: "c5", service_id: "s3", preferred_date: "2026-04-28", preferred_time_start: null, preferred_time_end: null, notes: null, notified: true, created_at: "2026-04-23", client: mockClients[4], service: mockServices[2] },
];
