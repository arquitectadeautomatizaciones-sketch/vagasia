"use client";

import { useState } from "react";
import { mockServices } from "@/lib/mock-data";
import { Zap, MapPin, Phone, ChevronLeft, ChevronRight, Check, Clock } from "lucide-react";

const DAYS_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

const UNAVAILABLE = new Set(["10:00", "14:00", "15:30"]);

type Step = "service" | "datetime" | "contact" | "confirmed";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function BookingPage() {
  const today = new Date(2026, 3, 26);
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState({ year: 2026, month: 3 });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  const service = mockServices.find((s) => s.id === selectedService);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);

  const prevMonth = () => {
    setViewDate((d) =>
      d.month === 0 ? { year: d.year - 1, month: 11 } : { year: d.year, month: d.month - 1 }
    );
  };

  const nextMonth = () => {
    setViewDate((d) =>
      d.month === 11 ? { year: d.year + 1, month: 0 } : { year: d.year, month: d.month + 1 }
    );
  };

  const isPastDay = (day: number) => {
    const d = new Date(viewDate.year, viewDate.month, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isToday = (day: number) =>
    viewDate.year === today.getFullYear() &&
    viewDate.month === today.getMonth() &&
    day === today.getDate();

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-2xl border border-white/5 bg-[#1E293B] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2DD4BF]/20">
            <Check size={28} className="text-[#2DD4BF]" />
          </div>
          <h2 className="text-lg font-semibold text-white">Marcação confirmada!</h2>
          <p className="mt-2 text-sm text-slate-400">
            Receberás uma confirmação no WhatsApp.
          </p>
          <div className="mt-5 rounded-lg bg-[#0F172A] p-4 text-left space-y-2 text-sm">
            <Row label="Serviço" value={service?.name ?? ""} />
            <Row label="Data" value={`${selectedDay} de ${MONTH_NAMES[viewDate.month]} de ${viewDate.year}`} />
            <Row label="Hora" value={selectedTime ?? ""} />
            <Row label="Nome" value={form.name} />
          </div>
          <button
            onClick={() => { setStep("service"); setSelectedService(null); setSelectedDay(null); setSelectedTime(null); setForm({ name: "", phone: "", notes: "" }); }}
            className="mt-5 w-full rounded-lg border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Fazer outra marcação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1E293B]">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00B4D8]">
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Cabeleireira Lisboa</p>
              <p className="text-[10px] text-[#2DD4BF]">Reserva online</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={11} />Lisboa</span>
            <span className="flex items-center gap-1"><Phone size={11} />+351 21 000 0000</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["service", "datetime", "contact"] as Step[]).map((s, i) => {
            const labels = ["Serviço", "Data & Hora", "Contacto"];
            const current = ["service", "datetime", "contact"].indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  i < current ? "bg-[#2DD4BF] text-white" :
                  i === current ? "bg-[#00B4D8] text-white" :
                  "bg-white/10 text-slate-500"
                }`}>
                  {i < current ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs ${i === current ? "text-white font-medium" : "text-slate-500"}`}>
                  {labels[i]}
                </span>
                {i < 2 && <div className="w-6 h-px bg-white/10" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Service */}
        {step === "service" && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white">Escolhe um serviço</h2>
            {mockServices.filter((s) => s.active).map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); setStep("datetime"); }}
                className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  selectedService === s.id
                    ? "border-[#00B4D8] bg-[#00B4D8]/5"
                    : "border-white/5 bg-[#1E293B] hover:border-white/10"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Clock size={11} />
                    {s.duration_minutes} minutos
                  </p>
                </div>
                <p className="text-lg font-bold text-[#2DD4BF]">€{s.price}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === "datetime" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep("service")} className="text-slate-500 hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Escolhe data e hora</h2>
            </div>

            {/* Calendar */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="text-slate-500 hover:text-white">
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-white">
                  {MONTH_NAMES[viewDate.month]} {viewDate.year}
                </p>
                <button onClick={nextMonth} className="text-slate-500 hover:text-white">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_ABBR.map((d) => (
                  <p key={d} className="text-center text-[10px] font-semibold text-slate-600 py-1">{d}</p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const past = isPastDay(day);
                  const todayClass = isToday(day);
                  const selected = selectedDay === day;
                  return (
                    <button
                      key={day}
                      disabled={past}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                        past ? "text-slate-700 cursor-not-allowed" :
                        selected ? "bg-[#00B4D8] text-white font-semibold" :
                        todayClass ? "border border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10" :
                        "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDay && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-3">
                  Horários disponíveis — {selectedDay} de {MONTH_NAMES[viewDate.month]}
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {TIME_SLOTS.map((t) => {
                    const unavailable = UNAVAILABLE.has(t);
                    return (
                      <button
                        key={t}
                        disabled={unavailable}
                        onClick={() => setSelectedTime(t)}
                        className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                          unavailable ? "bg-white/3 text-slate-700 cursor-not-allowed line-through" :
                          selectedTime === t ? "bg-[#00B4D8] text-white" :
                          "bg-[#1E293B] text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDay && selectedTime && (
              <button
                onClick={() => setStep("contact")}
                className="w-full rounded-lg bg-[#00B4D8] py-3 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {/* Step 3: Contact */}
        {step === "contact" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep("datetime")} className="text-slate-500 hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Os teus dados</h2>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-white/5 bg-[#1E293B] p-4 space-y-1.5 text-sm">
              <Row label="Serviço" value={service?.name ?? ""} />
              <Row label="Data" value={`${selectedDay} de ${MONTH_NAMES[viewDate.month]} de ${viewDate.year}`} />
              <Row label="Hora" value={selectedTime ?? ""} />
              <Row label="Preço" value={`€${service?.price}`} />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="O teu nome"
                  className="w-full rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Telemóvel *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+351 9XX XXX XXX"
                  className="w-full rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Alguma informação adicional…"
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#1E293B] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00B4D8]/50 resize-none"
                />
              </div>
            </div>

            <button
              disabled={!form.name || !form.phone}
              onClick={() => setStep("confirmed")}
              className="w-full rounded-lg bg-[#00B4D8] py-3 text-sm font-semibold text-white hover:bg-[#0090b0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar marcação
            </button>

            <p className="text-center text-[11px] text-slate-600">
              Ao confirmar, receberás uma mensagem de confirmação no WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-10 py-4 text-center text-[11px] text-slate-700">
        Powered by{" "}
        <span className="text-[#00B4D8] font-semibold">VagasIA</span>
        {" "}— Transforme vagas vazias em faturação.
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
