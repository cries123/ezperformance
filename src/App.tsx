/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import {
  Globe,
  MapPin,
  Menu,
  Zap,
  Smartphone,
  Wrench,
  Activity,
  Gauge,
  Thermometer,
  ZapIcon,
  Phone,
  MessageCircle,
  Settings,
  Car,
  Calendar,
  User,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ROUTES, PHONE_DISPLAY, PHONE_E164, SERVICE_AREA, applySeo, viewFromPath, type View } from './seo';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Moves focus into a modal, keeps Tab inside it, closes on Escape,
// locks page scroll, and restores focus to the trigger on close.
function useDialog(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const dialog = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items: HTMLElement[] = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return ref;
}

// Real links (crawlable, open-in-new-tab friendly) that navigate client-side on a plain click.
function RouteLink({ view, onNavigate, className, children, current = false }: {
  view: View;
  onNavigate: (view: View) => void;
  className?: string;
  children: React.ReactNode;
  current?: boolean;
  key?: React.Key;
}) {
  return (
    <a
      href={ROUTES[view].path}
      aria-current={current ? 'page' : undefined}
      className={className}
      onClick={e => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onNavigate(view);
      }}
    >
      {children}
    </a>
  );
}

// --- Data ---

interface CatalogItem {
  name: string;
  price: string;
  detail: string;
}

// Single source of truth for services and prices: used by the Services page and the booking form.
const CATALOG: { title: string; items: CatalogItem[] }[] = [
  {
    title: "Basic Maintenance",
    items: [
      { name: "Oil & Filter Change", price: "$95+", detail: "Full synthetic oil and a premium filter." },
      { name: "Fluid Care Package", price: "$120+", detail: "Coolant, brake fluid and power steering fluid exchange." },
      { name: "Safety Inspection", price: "$100", detail: "50-point mechanical and safety inspection." },
      { name: "AC Service", price: "$150", detail: "AC performance check and refrigerant recharge." }
    ]
  },
  {
    title: "Diagnostics & Electrical",
    items: [
      { name: "Full Computer Scan", price: "$120+", detail: "We scan every module to find the cause of warning lights and faults." },
      { name: "Electrical Diagnosis", price: "$200/hr", detail: "Tracking down shorts, dead batteries and parasitic drains." },
      { name: "Module Programming", price: "$150", detail: "Dealer-level software updates and module setup." },
      { name: "Car & Marine Stereo Install", price: "Varies", detail: "Custom audio installs and system integration." }
    ]
  },
  {
    title: "Suspension",
    items: [
      { name: "Leveling Kit Install", price: "$400+", detail: "Level out your truck's stance." },
      { name: "Lift Kit Install", price: "Varies", detail: "Full lift kit installation and suspension setup." }
    ]
  },
  {
    title: "Repair & Specialty",
    items: [
      { name: "Brake Pad & Rotor Replacement", price: "$300+", detail: "New pads and rotors, plus a brake system check." },
      { name: "EV Battery Health Check", price: "$200", detail: "High-voltage battery testing for hybrids and EVs." },
      { name: "Engine Rebuild", price: "Varies", detail: "Full teardown, machining and rebuild." }
    ]
  },
  {
    title: "Towing",
    items: [
      { name: "Towing", price: "$5/mile", detail: "$50 minimum hook-up fee. If your car won't run, we'll pick it up for repairs." }
    ]
  }
];

const CUSTOM_SERVICE = { name: "Something Else", price: "Custom Quote" };

const PHASES = [
  {
    lineId: "line-1",
    text: "> HANDSHAKE PCM / VIN AUTH... ",
    status: "LOCKED",
    statusType: "status-ok",
    delay: 700,
    module: "PCM",
    busLoad: "28% LOAD",
    packetRate: "118 PKT/S",
    phase: "Subsystem sync",
    dtc: "0 pending DTCs",
    metrics: { rpm: "742", voltage: "14.1V", coolant: "192F", trim: "+1.8%" },
    progress: 18
  },
  {
    lineId: "line-2",
    text: "> MISFIRE COUNTERS / O2 DATA... ",
    status: "STABLE",
    statusType: "status-ok",
    delay: 850,
    module: "FUEL SYS",
    busLoad: "33% LOAD",
    packetRate: "129 PKT/S",
    phase: "Fuel trim trace",
    dtc: "0 pending DTCs",
    metrics: { rpm: "756", voltage: "14.0V", coolant: "194F", trim: "+0.9%" },
    progress: 39
  },
  {
    lineId: "line-3",
    text: "> ABS WHEEL SPEED DELTA... ",
    status: "0.0 MPH",
    statusType: "status-ok",
    delay: 900,
    module: "ABS",
    busLoad: "37% LOAD",
    packetRate: "133 PKT/S",
    phase: "Chassis arbitration",
    dtc: "0 pending DTCs",
    metrics: { rpm: "748", voltage: "14.2V", coolant: "194F", trim: "+1.2%" },
    progress: 61
  },
  {
    lineId: "line-4",
    text: "> HV BATTERY BLOCK VARIANCE... ",
    status: "0.02V SPREAD",
    statusType: "status-warn",
    delay: 950,
    module: "BMS",
    busLoad: "42% LOAD",
    packetRate: "141 PKT/S",
    phase: "High-voltage sampling",
    dtc: "0 pending DTCs",
    metrics: { rpm: "744", voltage: "14.1V", coolant: "193F", trim: "+1.5%" },
    progress: 82
  },
  {
    lineId: "line-5",
    text: "> STEERING ANGLE / YAW CORR... ",
    status: "CALIBRATED",
    statusType: "status-ok",
    delay: 900,
    module: "SAS",
    busLoad: "31% LOAD",
    packetRate: "124 PKT/S",
    phase: "Final integrity pass",
    dtc: "0 pending DTCs",
    metrics: { rpm: "741", voltage: "14.1V", coolant: "192F", trim: "+1.0%" },
    progress: 100
  }
];

// --- Components ---

const inputClass = "w-full bg-white/3 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-500 focus:border-accent-blue focus:bg-white/5 focus:outline-hidden transition-all text-sm font-medium";
const labelClass = "block orbitron text-[10px] tracking-widest text-zinc-400 uppercase px-1";

function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const dialogRef = useDialog(isOpen, onClose);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    service: '',
    priceLabel: '',
    notes: ''
  });

  const isCustom = formData.service === CUSTOM_SERVICE.name;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      localStorage.setItem(`booking_${Date.now()}`, JSON.stringify(formData));

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        console.warn("Express endpoint failed, trying direct function route...");
        // Fallback for some hosting configurations
        await fetch('/.netlify/functions/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Booking Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const selectService = (item: { name: string; price: string }) =>
    setFormData(prev => ({ ...prev, service: item.name, priceLabel: item.price }));

  if (!isOpen) return null;

  const renderOption = (item: { name: string; price: string }) => {
    const selected = formData.service === item.name;
    return (
      <button
        key={item.name}
        type="button"
        aria-pressed={selected}
        onClick={() => selectService(item)}
        className={cn(
          "p-3 rounded-xl border text-left transition-all duration-300 flex items-center justify-between gap-3",
          selected
            ? "bg-accent-blue/10 border-accent-blue/50 ring-1 ring-accent-blue/20"
            : "bg-white/2 border-white/10 hover:border-white/25"
        )}
      >
        <span className={cn("text-sm font-semibold", selected ? "text-white" : "text-zinc-300")}>{item.name}</span>
        <span className={cn("text-xs font-mono shrink-0", selected ? "text-accent-ice" : "text-zinc-400")}>{item.price}</span>
      </button>
    );
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden focus:outline-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <h2 id="booking-title" className="sr-only">Book a service</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking form"
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-30"
        >
          <X size={20} className="text-zinc-400" aria-hidden="true" />
        </button>

        {isSuccess ? (
          <div className="p-12 text-center py-24" role="status">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(52,214,255,0.2)]"
            >
              <CheckCircle2 size={48} className="text-accent-blue" aria-hidden="true" />
            </motion.div>
            <h3 className="orbitron text-3xl font-black italic mb-4 uppercase">Request Sent</h3>
            <p className="text-zinc-300 mb-10 max-w-sm mx-auto leading-relaxed">
              Thanks! Ethan will call you at <span className="text-accent-blue font-bold">{formData.phone}</span> soon to confirm your appointment.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="gradient-btn px-16 py-5 rounded-2xl orbitron font-black text-black uppercase italic tracking-wider transition-transform hover:scale-105"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative h-2 bg-white/5 w-full" aria-hidden="true">
              <motion.div
                className="absolute top-0 left-0 h-full bg-accent-blue shadow-[0_0_15px_rgba(52,214,255,0.5)]"
                initial={{ width: "33%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Desktop Progress Rail */}
              <div className="w-64 bg-black/40 p-8 border-r border-white/5 hidden md:block" aria-hidden="true">
                <div className="orbitron text-[10px] tracking-[0.5em] text-accent-blue mb-12 uppercase">Book a Service</div>
                <div className="space-y-8">
                  {[
                    { id: 1, label: 'Your Info', icon: User },
                    { id: 2, label: 'Service', icon: Wrench },
                    { id: 3, label: 'Review', icon: CheckCircle2 }
                  ].map(s => (
                    <div key={s.id} className="flex items-center gap-4 group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500",
                        step === s.id ? "bg-accent-blue border-accent-blue text-black shadow-[0_0_15px_rgba(52,214,255,0.4)]" :
                        step > s.id ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue" : "border-white/10 text-zinc-500 bg-white/2"
                      )}>
                        <s.icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "orbitron text-[9px] tracking-[0.2em] uppercase font-black",
                          step >= s.id ? "text-accent-ice" : "text-zinc-500"
                        )}>Step {s.id}</span>
                        <span className={cn(
                          "orbitron text-[10px] tracking-widest uppercase font-black",
                          step === s.id ? "text-white" : "text-zinc-400"
                        )}>{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Interaction Zone */}
              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <div className="orbitron text-[10px] tracking-widest text-accent-blue uppercase mb-2">Step 1 of 3</div>
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Your Info</h3>
                        <p className="text-zinc-400 text-sm">Tell us how to reach you and what you drive.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label htmlFor="booking-name" className={labelClass}>Full Name</label>
                            <input
                              id="booking-name"
                              type="text"
                              autoComplete="name"
                              required
                              value={formData.name}
                              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              className={inputClass}
                              placeholder="e.g. John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="booking-phone" className={labelClass}>Phone Number</label>
                            <input
                              id="booking-phone"
                              type="tel"
                              autoComplete="tel"
                              required
                              value={formData.phone}
                              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className={inputClass}
                              placeholder="805-555-0123"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="booking-vehicle" className={labelClass}>Vehicle (Year, Make, Model)</label>
                          <div className="relative group">
                            <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-accent-blue transition-colors" size={18} aria-hidden="true" />
                            <input
                              id="booking-vehicle"
                              type="text"
                              required
                              value={formData.vehicle}
                              onChange={e => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                              className={cn(inputClass, "pl-12")}
                              placeholder="2018 Ford F-150"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!formData.name || !formData.phone || !formData.vehicle}
                          onClick={nextStep}
                          className="w-full gradient-btn py-5 rounded-2xl orbitron font-black text-black uppercase italic disabled:opacity-30 flex items-center justify-center gap-3 mt-4"
                        >
                          Next: Choose Service <ChevronRight size={20} aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <div className="orbitron text-[10px] tracking-widest text-accent-blue uppercase mb-2">Step 2 of 3</div>
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">What Do You Need?</h3>
                        <p className="text-zinc-400 text-sm">Pick a service. Prices are starting prices.</p>
                      </div>

                      <fieldset className="space-y-6">
                        <legend className="sr-only">Choose a service</legend>
                        {CATALOG.map(section => (
                          <div key={section.title} className="space-y-2">
                            <div className="orbitron text-[10px] tracking-widest text-zinc-400 uppercase px-1">{section.title}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {section.items.map(renderOption)}
                            </div>
                          </div>
                        ))}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderOption(CUSTOM_SERVICE)}
                        </div>
                      </fieldset>

                      <div className="space-y-2">
                        <label htmlFor="booking-notes" className={labelClass}>
                          {isCustom ? 'Describe what you need' : 'Describe the problem (optional)'}
                        </label>
                        <textarea
                          id="booking-notes"
                          value={formData.notes}
                          maxLength={800}
                          required={isCustom}
                          className={cn(inputClass, "h-24 resize-none")}
                          placeholder="e.g. Grinding noise when braking, check engine light is on..."
                          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-4">
                        <button type="button" onClick={prevStep} className="flex-1 glass py-5 rounded-2xl orbitron text-[10px] font-black uppercase tracking-[0.3em] italic">Back</button>
                        <button
                          type="button"
                          disabled={!formData.service || (isCustom && !formData.notes.trim())}
                          onClick={nextStep}
                          className="flex-[2] gradient-btn py-5 rounded-2xl orbitron font-black text-black uppercase italic disabled:opacity-30"
                        >
                          Review Request
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <div className="orbitron text-[10px] tracking-widest text-accent-blue uppercase mb-2">Step 3 of 3</div>
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Review Your Request</h3>
                        <p className="text-zinc-400 text-sm">Check that everything looks right, then send it.</p>
                      </div>

                      <div className="bg-white/3 border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" aria-hidden="true">
                          <Activity size={100} className="text-accent-blue" />
                        </div>

                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                          <div>
                            <dt className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-2 uppercase italic font-black">Vehicle</dt>
                            <dd className="text-white font-bold tracking-tight">{formData.vehicle}</dd>
                          </div>
                          <div>
                            <dt className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-2 uppercase italic font-black">Service</dt>
                            <dd className="text-accent-blue font-bold tracking-tight">{formData.service}</dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-2 uppercase italic font-black">Your Info</dt>
                            <dd className="text-white font-bold tracking-tight">{formData.name}</dd>
                            <dd className="text-zinc-400 text-xs font-mono">{formData.phone}</dd>
                          </div>
                          {formData.notes.trim() && (
                            <div className="md:col-span-2">
                              <dt className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-2 uppercase italic font-black">Notes</dt>
                              <dd className="text-zinc-300 text-sm whitespace-pre-wrap break-words">{formData.notes}</dd>
                            </div>
                          )}
                        </dl>

                        <div className="p-6 rounded-2xl bg-accent-blue/5 border border-accent-blue/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 mt-6">
                          <div className="text-center sm:text-left">
                            <div className="orbitron text-[9px] tracking-[0.4em] text-accent-ice mb-1 uppercase font-black">Starting Price</div>
                            <div className="text-3xl text-white orbitron font-black italic tracking-tighter">
                              {formData.priceLabel}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-400 text-center sm:text-right max-w-[160px] leading-relaxed">
                            Final price confirmed after inspection
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
                        <AlertCircle size={16} className="text-accent-blue shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          After you send this, Ethan will call you to confirm the details, timing and location. The shop address is shared when your appointment is confirmed.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button type="button" onClick={prevStep} className="flex-1 glass py-5 rounded-2xl orbitron text-[10px] font-black uppercase tracking-[0.3em] italic">Back</button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleBooking}
                          className="flex-[2] gradient-btn py-5 rounded-2xl orbitron font-black text-black uppercase italic disabled:opacity-30 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(52,214,255,0.3)]"
                        >
                          {isSubmitting ? (
                            <>
                              <Activity className="animate-spin" size={18} aria-hidden="true" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Request <Zap size={18} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function IgnitionScreen({ onComplete }: { onComplete: () => void; key?: React.Key }) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  // Randomize the speed lines once, not on every progress tick.
  const speedLines = useMemo(() => Array.from({ length: 15 }, () => ({
    duration: 0.2 + Math.random() * 0.2,
    delay: Math.random() * 0.5,
    width: 300 + Math.random() * 500,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`
  })), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        return Math.min(100, prev + Math.random() * 20);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isReady) startRef.current?.focus();
  }, [isReady]);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(onComplete, 1200);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="EZ Performance intro"
      exit={{
        opacity: 0,
        scale: 1.5,
        filter: "blur(20px) brightness(2)"
      }}
      transition={{ duration: 0.8, ease: "easeIn" }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,214,255,0.05)_0%,transparent_100%)]" />

      {/* Starting Rumble Effect */}
      <AnimatePresence>
        {isStarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1, 0], x: [-2, 2, -1, 1, 0], y: [-1, 1, -2, 2, 0] }}
            transition={{ duration: 0.1, repeat: 10 }}
            className="absolute inset-0 bg-accent-blue/10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center">
        {!isReady && (
          <div className="w-full">
            <div className="flex justify-between items-end orbitron mb-4">
              <div className="text-[10px] tracking-[0.4em] blue-highlight font-black uppercase">System Priming</div>
              <div className="text-xl font-black italic ice-highlight">{Math.round(progress)}%</div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-accent-blue shadow-[0_0_15px_rgba(52,214,255,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {isReady && !isStarting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="orbitron text-[10px] tracking-[0.5em] text-zinc-400 mb-8 uppercase">Systems Ready</div>

              {/* Start Button */}
              <motion.button
                ref={startRef}
                type="button"
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Engine start: enter site"
                className="relative w-40 h-40 rounded-full flex items-center justify-center group"
              >
                {/* Button Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20 group-hover:border-accent-blue transition-colors duration-500 shadow-[0_0_40px_rgba(52,214,255,0.1)] group-hover:shadow-[0_0_60px_rgba(52,214,255,0.3)]" />

                {/* Button Inner Body */}
                <div className="absolute inset-3 rounded-full bg-linear-to-b from-zinc-800 to-black border border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner uppercase">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.1)_0%,transparent_70%)] group-hover:bg-accent-blue/10 transition-colors" />
                  <span className="relative z-10 orbitron text-[8px] font-black tracking-widest text-zinc-400 group-hover:text-accent-blue transition-colors mt-2">Engine</span>
                  <span className="relative z-10 orbitron text-xl font-black italic text-zinc-300 group-hover:text-white transition-colors">Start</span>
                  <div className="relative z-10 w-8 h-1 bg-red-600/40 group-hover:bg-accent-blue/60 mt-2 rounded-full transition-colors" />
                </div>

                {/* Animated Pulsing Ring */}
                <motion.div
                  animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-accent-blue/40"
                />
              </motion.button>

              <div className="mt-8 orbitron text-[8px] tracking-[0.3em] text-accent-blue/70 animate-pulse uppercase">Push to Ignite</div>
            </motion.div>
          )}
        </AnimatePresence>

        {isStarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="orbitron text-2xl font-black italic text-white tracking-widest uppercase mb-2 animate-pulse">Ignition</div>
            <div className="orbitron text-[10px] tracking-[0.4em] blue-highlight font-black">Connecting Subsystems...</div>
          </motion.div>
        )}
      </div>

      {!isStarting && (
        <button
          type="button"
          onClick={onComplete}
          className="absolute bottom-8 right-8 z-20 orbitron text-[10px] tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors px-4 py-2"
        >
          Skip Intro
        </button>
      )}

      {/* Cinematic Speed Lines */}
      {speedLines.map((line, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ x: "120vw", opacity: 0 }}
          animate={isStarting ? {
            x: "-120vw",
            opacity: [0, 0.8, 0],
            scaleX: [1, 3, 1]
          } : {}}
          transition={{
            duration: line.duration,
            repeat: Infinity,
            ease: "linear",
            delay: line.delay
          }}
          className="absolute h-px bg-linear-to-r from-transparent via-accent-blue to-transparent"
          style={{ width: line.width, top: line.top, left: line.left }}
        />
      ))}
    </motion.div>
  );
}

function Gallery(_props: { key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6 md:px-12 relative min-h-screen flex items-center justify-center"
    >
      <div className="text-center">
        <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Gallery</div>
        <h1 className="orbitron text-5xl md:text-7xl font-black italic tracking-tight text-glow uppercase">
          COMING <span className="ice-highlight">SOON</span>
        </h1>
      </div>
    </motion.div>
  );
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: 'home', label: 'Home' },
  { view: 'catalog', label: 'Services' },
  { view: 'gallery', label: 'Gallery' },
  { view: 'contact', label: 'Contact' }
];

function Navbar({ currentView, onNavigate, onBookingOpen }: { currentView: View; onNavigate: (view: View) => void; onBookingOpen: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = (view: View) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <header className="fixed w-full flex justify-between items-center py-3 px-4 md:py-4 md:px-12 z-50 bg-black/80 backdrop-blur-md border-b border-white/10" id="navbar">
      <RouteLink
        view="home"
        onNavigate={navigate}
        className="flex items-center gap-3 md:gap-4 cursor-pointer group"
      >
        <div className="relative flex items-center gap-2 md:gap-4">
          <div className="relative h-14 w-20 md:h-18 md:w-28 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <img
              src="/motor-logo.png"
              alt=""
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(52,214,255,0.4)] transition-all duration-500"
              onError={(e) => {
                e.currentTarget.classList.add('hidden');
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-logo');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="fallback-logo hidden flex items-center justify-center relative w-full h-full">
              <div className="absolute inset-0 bg-accent-blue/10 rounded-full blur-xl animate-pulse"></div>
              <Activity className="text-accent-blue w-8 h-8 md:w-10 md:h-10 relative z-10" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="orbitron font-black text-sm md:text-2xl leading-none tracking-tighter italic text-white flex flex-col">
              <span className="blue-highlight">EZ PERFORMANCE</span>
            </div>
            <div className="hidden lg:block orbitron text-[7px] tracking-[0.3em] text-zinc-400 font-black uppercase mt-1 leading-none italic">
              Automotive Diagnostics · Repair · Maintenance
            </div>
          </div>
        </div>
      </RouteLink>

      <nav aria-label="Main" className="hidden lg:flex space-x-10 orbitron uppercase">
        {NAV_ITEMS.map(item => (
          <RouteLink
            key={item.view}
            view={item.view}
            onNavigate={navigate}
            current={currentView === item.view}
            className={`nav-link ${currentView === item.view ? 'blue-highlight' : 'text-zinc-400 hover:text-white'}`}
          >
            {item.label}
          </RouteLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={onBookingOpen}
          className="gradient-btn px-3 py-2 md:px-8 md:py-3 rounded flex items-center gap-2 orbitron font-black text-[9px] md:text-xs tracking-widest text-black shadow-[0_0_15px_rgba(52,214,255,0.3)] hover:scale-105 transition-transform"
        >
          <Calendar size={12} className="md:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">BOOK NOW</span>
          <span className="sm:hidden">BOOK</span>
        </button>
        <button
          type="button"
          className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="Main"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4 orbitron">
              {NAV_ITEMS.map(item => (
                <RouteLink
                  key={item.view}
                  view={item.view}
                  onNavigate={navigate}
                  current={currentView === item.view}
                  className={`text-left text-lg font-black italic tracking-wider py-2 border-b border-white/5 ${currentView === item.view ? 'blue-highlight' : 'text-zinc-400'}`}
                >
                  {item.label}
                </RouteLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function DiagnosticSystem() {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<typeof PHASES>([]);
  const [scanStatus, setScanStatus] = useState("RUNNING...");
  const [scanComplete, setScanComplete] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(12).fill(30));

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 40) + (scanComplete ? 10 : 30)));
    }, 200);
    return () => clearInterval(waveInterval);
  }, [scanComplete]);

  useEffect(() => {
    // Stops the loop when the component unmounts (e.g. navigating away from Home)
    let cancelled = false;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    const runScan = async () => {
      // Small delay before start
      await wait(1000);

      while (!cancelled) {
        for (let i = 0; i < PHASES.length; i++) {
          if (cancelled) return;
          setCurrentPhaseIdx(i);
          setDisplayedLines(PHASES.slice(0, i + 1));
          await wait(PHASES[i].delay);
        }
        if (cancelled) return;

        setScanStatus("COMPLETE");
        setScanComplete(true);

        // Wait before restart
        await wait(5000);
        if (cancelled) return;
        setScanStatus("RUNNING...");
        setScanComplete(false);
        setDisplayedLines([]);
        setCurrentPhaseIdx(0);
      }
    };

    runScan();
    return () => { cancelled = true; };
  }, []);

  const currentPhase = PHASES[currentPhaseIdx];
  const metrics = scanComplete ? { rpm: "739", voltage: "14.1V", coolant: "191F", trim: "+1.1%" } : currentPhase.metrics;

  return (
    <div className="panel-shell w-full max-w-[540px] border border-accent-blue/12 p-6 md:p-8 rounded-2xl glass relative z-20 h-[450px] flex flex-col panel-scan-sweep overflow-hidden">
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        <span className="text-zinc-500 font-mono text-[10px] md:text-xs ml-2">EZ_DIAGNOSTIC_SYS_V2.0</span>
        <span className={`font-mono text-[10px] md:text-xs ml-auto ${scanComplete ? 'text-green-500' : 'text-accent-blue blink-status'}`}>
          {scanStatus}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        <div className="bg-[#08121c]/80 border border-accent-steel/20 rounded-lg px-3 py-2 font-mono text-[10px]">
          <div className="text-zinc-500 mb-1">SYSTEM ID</div>
          <div className="text-xs text-white uppercase">{scanComplete ? "EZ PERFORMANCE" : currentPhase.module}</div>
        </div>
        <div className="bg-[#08121c]/80 border border-accent-steel/20 rounded-lg px-3 py-2 font-mono text-[10px] flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0">
            <div className="text-zinc-500 mb-1">CAN BUS</div>
            <div className="text-xs text-white truncate">{scanComplete ? "26% LOAD" : currentPhase.busLoad}</div>
          </div>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scanComplete ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-green-500/50'}`}></span>
        </div>
        <div className="bg-[#08121c]/80 border border-accent-steel/20 rounded-lg px-3 py-2 font-mono text-[10px]">
          <div className="text-zinc-500 mb-1">PACKET RATE</div>
          <div className="text-xs text-white">{scanComplete ? "116 PKT/S" : currentPhase.packetRate}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
        <div className="bg-[#08121c]/90 border border-accent-steel/10 rounded-lg px-2 py-3 text-center">
          <div className="text-accent-blue/60 font-mono text-[8px] md:text-[10px] mb-1 uppercase tracking-wider">RPM</div>
          <div className="text-accent-ice font-mono text-sm md:text-lg">{metrics.rpm}</div>
        </div>
        <div className="bg-[#08121c]/90 border border-accent-steel/10 rounded-lg px-2 py-3 text-center">
          <div className="text-accent-blue/60 font-mono text-[8px] md:text-[10px] mb-1 uppercase tracking-wider">VOLT</div>
          <div className="text-accent-ice font-mono text-sm md:text-lg">{metrics.voltage}</div>
        </div>
        <div className="bg-[#08121c]/90 border border-accent-steel/10 rounded-lg px-2 py-3 text-center">
          <div className="text-accent-blue/60 font-mono text-[8px] md:text-[10px] mb-1 uppercase tracking-wider">COOLANT</div>
          <div className="text-accent-ice font-mono text-sm md:text-lg">{metrics.coolant}</div>
        </div>
        <div className="bg-[#08121c]/90 border border-accent-steel/10 rounded-lg px-2 py-3 text-center">
          <div className="text-accent-blue/60 font-mono text-[8px] md:text-[10px] mb-1 uppercase tracking-wider">TRIM</div>
          <div className="text-accent-ice font-mono text-sm md:text-lg">{metrics.trim}</div>
        </div>
      </div>

      <div className="h-12 bg-linear-to-b from-accent-ice/5 to-accent-blue/10 border border-accent-steel/16 rounded-xl px-4 py-2 flex items-end justify-between gap-1 mb-4 relative z-10">
        {waveHeights.map((h, i) => (
          <div
            key={i}
            className="w-full bg-linear-to-b from-accent-ice to-accent-blue rounded-full shadow-[0_0_8px_rgba(52,214,255,0.3)] transition-all duration-200"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div className="font-mono text-[10px] md:text-sm flex-1 space-y-1 relative z-10 overflow-hidden">
        {displayedLines.map((line, i) => (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className="text-accent-blue flex flex-wrap items-center gap-1"
          >
            <span>{line.text}</span>
            <span className={line.statusType === 'status-ok' ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
              {line.status}
            </span>
          </motion.p>
        ))}
        {!scanComplete && <div className="inline-block w-2 h-4 bg-accent-blue animate-pulse ml-1" />}
      </div>

      <div className="flex items-center justify-between text-[8px] md:text-[10px] font-mono text-zinc-500 tracking-[0.18em] uppercase mt-3 mb-2 relative z-10">
        <span>{scanComplete ? "Live monitor armed" : currentPhase.phase}</span>
        <span>{scanComplete ? "0 Active DTCs" : currentPhase.dtc}</span>
      </div>

      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10 border border-white/5">
        <motion.div
          className="h-full bg-linear-to-r from-accent-blue via-accent-steel to-accent-ice shadow-[0_0_10px_rgba(52,214,255,0.5)]"
          style={{ width: `${scanComplete ? 100 : currentPhase.progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

function Hero({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <section className="relative min-h-screen flex items-center px-6 md:px-12 overflow-hidden pt-24" id="home">
      {/* Background Strips */}
      <div className="absolute top-1/4 left-0 w-[500px] h-px bg-linear-to-r from-transparent via-accent-blue to-transparent blur-[2px] opacity-30 -rotate-[35deg]" />
      <div className="absolute top-3/4 left-1/4 w-[700px] h-px bg-linear-to-r from-transparent via-accent-blue to-transparent blur-[2px] opacity-30 -rotate-[35deg]" />

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl text-left"
        >
          <div className="orbitron text-accent-blue text-xs md:text-sm font-black tracking-[0.6em] mb-6 uppercase italic flex items-center gap-4">
            <div className="w-8 h-[2px] bg-accent-blue" />
            Master Level Service
          </div>
          <h1 className="orbitron text-[40px] sm:text-[70px] md:text-[110px] font-black italic leading-[0.8] mb-8 tracking-tighter text-glow uppercase">
            EZ<br /><span className="ice-highlight">PERFORMANCE</span>
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed italic">
            Auto diagnostics, repair and maintenance with dealership-level precision, at our shop or at your place. Led by ASE Certified Master Technician Ethan Zandonatti.
          </p>

          <ul className="flex flex-wrap gap-4 mb-12">
            <li className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-accent-blue hover:border-accent-blue transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <MapPin size={14} aria-hidden="true" />
              </div>
              SHOP & MOBILE SERVICE
            </li>
            <li className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-zinc-300 hover:border-accent-blue transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <Globe size={14} aria-hidden="true" />
              </div>
              SERVING LOMPOC TO PASO ROBLES
            </li>
            <li className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-accent-ice hover:border-accent-ice transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-ice/10 flex items-center justify-center border border-accent-ice/20">
                <Wrench size={14} aria-hidden="true" />
              </div>
              ASE CERTIFIED MASTER TECH
            </li>
          </ul>

          <RouteLink
            view="catalog"
            onNavigate={onNavigate}
            className="inline-block gradient-btn px-10 md:px-20 py-4 md:py-6 rounded-lg orbitron font-black text-xl md:text-3xl italic tracking-tighter text-black uppercase"
          >
            VIEW SERVICES
          </RouteLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          aria-hidden="true"
          className="relative flex justify-center lg:justify-end hidden md:flex"
        >
          <DiagnosticSystem />
          <div className="absolute inset-0 bg-accent-blue/10 blur-[120px] rounded-full scale-110 -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
}

function ServiceCard({ icon: Icon, title, description, isSpecial = false }: { icon: any, title: string, description: string, isSpecial?: boolean, key?: any }) {
  // Generate a stable random delay based on the title string to avoid hydration mismatches
  const staggerDelay = title.length % 5 * 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      viewport={{ once: true }}
      className={`service-card p-10 rounded-3xl relative overflow-hidden group ${isSpecial ? 'bg-[#0f1b2a]/90' : ''}`}
    >
      {isSpecial && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue to-accent-ice" />}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: staggerDelay
        }}
        className={`text-accent-blue group-hover:text-accent-ice mb-8 p-3 rounded-2xl inline-block bg-accent-blue/10 transition-all duration-500 shadow-[0_0_0px_rgba(52,214,255,0)] group-hover:shadow-[0_0_30px_rgba(52,214,255,0.25)]`}
      >
        <Icon
          size={40}
          aria-hidden="true"
          className="group-hover:scale-110 transition-transform duration-500"
        />
      </motion.div>
      <h3 className="orbitron text-2xl font-black italic mb-4 tracking-tight leading-tight group-hover:text-accent-ice transition-colors">
        {title}
      </h3>
      <p className="text-zinc-400 text-lg leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function Services({ onNavigate }: { onNavigate: (view: View) => void }) {
  const services = [
    {
      icon: Activity,
      title: "COMPLETE DIAGNOSTICS",
      description: "Dealership-level computer scanning and electrical troubleshooting for all makes and models.",
      isSpecial: true
    },
    {
      icon: Gauge,
      title: "LIFT & LEVELING KITS",
      description: "Lift and leveling kit installs to give your truck the stance and ride you want."
    },
    {
      icon: ZapIcon,
      title: "HYBRID & EV SERVICE",
      description: "Service for high-voltage systems, including EV and hybrid battery health checks."
    },
    {
      icon: Wrench,
      title: "ADVANCED REPAIR",
      description: "From engine rebuilds to brake pads and rotors, we handle the big jobs."
    },
    {
      icon: Thermometer,
      title: "AC SERVICE",
      description: "AC diagnostics and recharges to keep your cabin cool."
    },
    {
      icon: Smartphone,
      title: "SHOP & MOBILE SERVICE",
      description: "Bring your vehicle to our shop, or we'll come to you anywhere from Lompoc to Paso Robles.",
      isSpecial: true
    }
  ];

  return (
    <section id="services" className="py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent-blue/5 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="orbitron text-4xl md:text-6xl font-black italic mb-8 tracking-[0.1em] text-glow sm:whitespace-nowrap"
          >
            SERVICES WE OFFER
          </motion.h2>
          <p className="text-zinc-400 max-w-3xl mx-auto text-lg md:text-xl italic font-medium leading-relaxed">
            From high-voltage EV systems to truck leveling kits.
            We handle the jobs other shops can't.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block mt-12"
          >
            <RouteLink
              view="catalog"
              onNavigate={onNavigate}
              className="inline-block frost-outline px-10 py-4 font-black rounded-full orbitron text-[10px] md:text-xs tracking-[0.2em] shadow-lg uppercase"
            >
              SEE ALL SERVICES & PRICES
            </RouteLink>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <ServiceCard
              key={idx}
              icon={service.icon}
              title={service.title}
              description={service.description}
              isSpecial={Boolean(service.isSpecial)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Catalog({ onNavigate }: { onNavigate: (view: View) => void; key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6 md:px-12 relative min-h-screen"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <h1 className="orbitron text-5xl md:text-7xl font-black italic mb-6 tracking-tight text-glow uppercase">Services <span className="ice-highlight">& Pricing</span></h1>
          <p className="text-zinc-400 text-xl italic font-medium">Upfront starting prices. Your final price is confirmed after inspection.</p>
        </div>

        <div className="space-y-16">
          {CATALOG.map(section => (
            <div key={section.title} className="glass p-10 rounded-[2.5rem]">
              <h2 className="orbitron text-2xl font-black italic mb-8 border-b border-accent-blue/20 pb-4 text-accent-blue">{section.title}</h2>
              <ul className="grid gap-6">
                {section.items.map(item => (
                  <li key={item.name} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-blue/30 transition-all group">
                    <div>
                      <h3 className="orbitron text-lg font-bold text-white group-hover:ice-highlight transition-colors mb-1">{item.name}</h3>
                      <p className="text-zinc-400 text-sm italic">{item.detail}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <span className="orbitron text-lg font-black italic blue-highlight">{item.price}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 glass p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-accent-blue/30">
          <div className="max-w-md">
            <h2 className="orbitron text-2xl font-bold italic mb-4">Don't see what you need?</h2>
            <p className="text-zinc-400 italic">We take on custom projects and less common vehicles. Get in touch for a quote.</p>
          </div>
          <RouteLink
            view="contact"
            onNavigate={onNavigate}
            className="gradient-btn px-12 py-5 rounded-xl orbitron font-black text-xl italic text-black uppercase"
          >
            Custom Quote
          </RouteLink>
        </div>
      </div>
    </motion.div>
  );
}

function Process() {
  const steps = [
    {
      num: "01",
      title: "Request",
      description: "Book online in about a minute, or give us a call."
    },
    {
      num: "02",
      title: "Phone Call",
      description: "Ethan calls you to talk through the problem, the price and the timing."
    },
    {
      num: "03",
      title: "Parts & Prep",
      description: "We order the parts your job needs and get everything ready before we start."
    },
    {
      num: "04",
      title: "The Work",
      description: "Your service is done at our shop or at your location."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-white/2 border-y border-white/5">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-xl">
            <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">The Process</div>
            <h2 className="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-glow uppercase leading-tight">
              How It <br /><span className="ice-highlight">Works</span>
            </h2>
          </div>
          <p className="text-zinc-400 text-lg italic max-w-sm">
            Simple and upfront. You talk directly with the technician who works on your car.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 group hover:border-accent-blue/30 transition-all duration-500"
            >
              <div className="orbitron text-5xl font-black italic text-white/5 group-hover:text-accent-blue/10 transition-colors absolute top-4 right-6 leading-none" aria-hidden="true">
                {step.num}
              </div>
              <h3 className="orbitron text-xl font-black italic text-white mb-4 uppercase">{step.title}</h3>
              <p className="text-zinc-400 text-sm italic leading-relaxed">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AuthorityGrid() {
  const brands = [
    "Porsche", "BMW", "Audi", "Mercedes-Benz",
    "Nissan", "Toyota", "Chevrolet", "Ford",
    "Kia", "Honda", "Subaru", "Mazda",
    "Lexus", "Jeep", "Dodge", "Volkswagen"
  ];

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center mb-16">
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Makes We Service</div>
          <h2 className="orbitron text-4xl md:text-5xl font-black italic tracking-tighter text-glow text-center uppercase">
            All Major <span className="ice-highlight">Makes</span>
          </h2>
          <div className="w-24 h-1 bg-accent-blue mt-8"></div>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {brands.map((brand, idx) => (
            <motion.li
              key={brand}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center transition-all duration-300 group"
            >
              <div className="orbitron text-[10px] md:text-xs font-black italic tracking-widest text-zinc-400 group-hover:text-accent-blue transition-colors uppercase text-center select-none">
                {brand}
              </div>
            </motion.li>
          ))}
        </ul>

        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-[10px] orbitron font-black tracking-[0.3em] uppercase italic">
            Plus most other makes and models
          </p>
        </div>
      </div>
    </section>
  );
}

function ServiceArea() {
  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden bg-white/[0.02]">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div>
              <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Service Area</div>
              <h2 className="orbitron text-4xl md:text-5xl font-black italic tracking-tighter text-glow uppercase leading-tight">
                MOBILE <span className="ice-highlight">SERVICE</span> <br />AREA
              </h2>
            </div>

            <p className="text-zinc-400 text-lg italic leading-relaxed max-w-lg">
              We bring diagnostics, maintenance and many repairs to your home or work anywhere on the Central Coast. Bigger jobs are done at our shop.
            </p>

            <ul className="flex flex-wrap gap-3">
              {SERVICE_AREA.map(city => (
                <li key={city} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] orbitron font-black tracking-widest text-zinc-400 hover:text-accent-blue hover:border-accent-blue transition-all cursor-default">
                  {city}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 relative">
            <div className="aspect-square relative rounded-[3rem] overflow-hidden border border-white/10 group bg-zinc-900 flex items-center justify-center p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,214,255,0.1)_0%,transparent_70%)]" />
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,214,255,0.2)]">
                  <Globe size={40} className="text-accent-blue" aria-hidden="true" />
                </div>
                <div className="orbitron text-3xl font-black italic text-white mb-2 uppercase">Central Coast</div>
                <div className="orbitron text-xs tracking-[0.4em] text-accent-blue font-black uppercase">Lompoc to Paso Robles</div>
              </div>

              {/* Decorative Map Elements */}
              <div aria-hidden="true" className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(52,214,255,1)] animate-ping" />
              <div aria-hidden="true" className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-accent-ice shadow-[0_0_10px_rgba(52,214,255,1)] animate-ping animation-delay-1000" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do you work on everyday cars, or just performance cars?",
      a: "Both. Most of our work is everyday maintenance and repair on all major makes, and we also handle performance builds and modifications."
    },
    {
      q: "How do your diagnostics work?",
      a: "We scan every control module with professional diagnostic tools and look at live data. We don't just clear codes: we find and fix the root cause of the problem."
    },
    {
      q: "Is your work under warranty?",
      a: "Yes. All maintenance work comes with a 12-month / 12,000-mile guarantee. Performance modifications are warrantied against defects in installation."
    },
    {
      q: "Do you have a shop, or is everything mobile?",
      a: "Both. Many jobs can be done at your location, and bigger repairs are done at our shop. We share the shop address when we confirm your appointment."
    }
  ];

  return (
    <section className="py-32 px-6 md:px-12 bg-white/[0.01]">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-20">
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">FAQ</div>
          <h2 className="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-glow uppercase">Common <span className="ice-highlight">Questions</span></h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-white/5 rounded-3xl overflow-hidden bg-white/2"
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${idx}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${idx}`}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-8 text-left group"
                  >
                    <span className="orbitron text-lg font-black italic text-zinc-300 group-hover:text-accent-blue transition-colors uppercase">{faq.q}</span>
                    <ChevronRight aria-hidden="true" className={`shrink-0 text-accent-blue transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-a-${idx}`}
                      role="region"
                      aria-labelledby={`faq-q-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-8 pt-6 text-zinc-300 italic leading-relaxed text-sm border-t border-white/5 mx-8">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contact({ onBookingOpen }: { onBookingOpen: () => void }) {
  return (
    <section id="contact" className="py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Contact</div>
              <h1 className="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-glow mb-6 uppercase leading-tight">
                LET'S GET TO <br />
                <span className="ice-highlight">WORK.</span>
              </h1>
              <div className="w-24 h-1 bg-accent-blue mb-8"></div>
              <p className="text-zinc-400 text-lg md:text-xl max-w-lg italic leading-relaxed">
                Talk directly with Ethan Zandonatti, the ASE Certified Master Technician who will work on your vehicle.
                Call, or book online and we'll call you back the same day.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md">
                <div className="mt-1 p-2 rounded-lg bg-accent-blue/10">
                  <Settings size={20} className="text-accent-blue" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-black orbitron tracking-widest text-accent-blue mb-1 uppercase">Tip</div>
                  <p className="text-sm text-zinc-300 italic">Have your vehicle's year, make and model ready, plus a short description of the problem.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6"
          >
            <motion.a
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`tel:${PHONE_E164}`}
              className="group relative block p-8 rounded-[2.5rem] bg-gradient-to-br from-white to-zinc-200 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                <Phone size={120} className="text-black" />
              </div>
              <div className="relative z-10 flex flex-col items-center sm:items-start text-black">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" aria-hidden="true" />
                  <span className="orbitron text-[10px] font-black tracking-widest text-zinc-700 uppercase">Call Direct</span>
                </div>
                <div className="orbitron text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter mb-1">
                  {PHONE_DISPLAY}
                </div>
                <div className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Shop & mobile service: Lompoc to Paso Robles</div>
              </div>
            </motion.a>

            <motion.button
              type="button"
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBookingOpen}
              className="group relative block w-full p-8 rounded-[2.5rem] bg-zinc-900/60 border-2 border-accent-blue/30 backdrop-blur-xl transition-colors hover:border-accent-blue/60 text-left"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" aria-hidden="true">
                <MessageCircle size={120} className="text-accent-blue" />
              </div>
              <div className="relative z-10 flex flex-col items-center sm:items-start">
                <div className="orbitron text-[10px] font-black tracking-widest text-accent-blue mb-2 uppercase">Book Online</div>
                <div className="orbitron text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter text-white mb-2 uppercase">
                  START A <span className="ice-highlight">BOOKING</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <span>Pick a service</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600" aria-hidden="true" />
                  <span>We call to confirm</span>
                </div>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-1 uppercase">Response</div>
                <div className="text-accent-ice text-xs font-black uppercase italic">Same-Day Callback</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="orbitron text-[9px] tracking-[0.3em] text-zinc-400 mb-1 uppercase">Certified</div>
                <div className="text-accent-ice text-xs font-black uppercase italic">ASE Master Tech</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Graphic Accents */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-accent-blue/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-ice/5 blur-[150px] rounded-full translate-x-1/3 translate-y-1/3" />
    </section>
  );
}

function Footer({ currentView, onNavigate }: { currentView: View, onNavigate: (view: View) => void }) {
  return (
    <footer className="px-6 md:px-12 py-20 bg-black/95 backdrop-blur-3xl border-t border-white/5 relative z-20">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left mb-16">
          <div className="max-w-sm">
            <div className="orbitron font-black text-3xl tracking-tighter italic mb-4 flex items-center gap-3 justify-center md:justify-start">
              EZ<span className="blue-highlight">PERFORMANCE</span>
            </div>
            <p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase font-black leading-loose mb-6 italic">
              Automotive Diagnostics · Repair · Maintenance
            </p>
            <div className="space-y-2 text-zinc-400 font-mono text-[11px] uppercase tracking-widest">
              <p className="flex items-center gap-2 justify-center md:justify-start"><Globe size={12} className="text-accent-blue" aria-hidden="true" /> Service area: Lompoc to Paso Robles</p>
              <p className="flex items-center gap-2 justify-center md:justify-start"><User size={12} className="text-accent-blue" aria-hidden="true" /> Owner: Ethan Zandonatti</p>
              <p className="flex items-center gap-2 justify-center md:justify-start"><Phone size={12} className="text-accent-blue" aria-hidden="true" /> <a href={`tel:${PHONE_E164}`} className="hover:text-accent-blue transition-colors">{PHONE_DISPLAY}</a></p>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 orbitron text-[10px] tracking-[0.3em] font-black">
            {NAV_ITEMS.map(item => (
              <RouteLink
                key={item.view}
                view={item.view}
                onNavigate={onNavigate}
                current={currentView === item.view}
                className={cn(
                  "text-zinc-300 hover:text-accent-blue transition-colors uppercase cursor-pointer",
                  currentView === item.view && "text-accent-blue"
                )}
              >
                {item.label}
              </RouteLink>
            ))}
          </nav>

          <div className="flex flex-col items-end">
            <div className="h-12 w-16 mb-4 opacity-40 hover:opacity-100 transition-opacity">
              <img
                src="/motor-logo.png"
                alt="EZ Performance logo"
                className="w-full h-full object-contain grayscale"
              />
            </div>
            <div className="text-zinc-400 orbitron text-xs font-black italic mb-2 tracking-widest">Est. 2026</div>
            <p className="text-zinc-500 text-[10px] font-mono uppercase">
              © {new Date().getFullYear()} EZ PERFORMANCE. PHENOMENAL PRECISION.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main App ---

const INTRO_SEEN_KEY = 'ez-intro-seen';

// The intro plays once per browser session, and never for visitors who prefer reduced motion.
function shouldShowIntro() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onPopState = () => setCurrentView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    applySeo(currentView, import.meta.env.VITE_SITE_URL || window.location.origin);
  }, [currentView]);

  const finishIntro = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Storage unavailable (private mode etc.): the intro just plays again next visit.
    }
  };

  const handleNavigate = (view: View) => {
    const { path } = ROUTES[view];
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="selection:bg-accent-blue selection:text-black min-h-screen relative">
        {/* Background Layers */}
        <div className="bg-fixed-car" aria-hidden="true" />
        <div className="bg-fixed-gradient" aria-hidden="true" />

        {/* The intro overlays the site instead of replacing it, so the page content is
            always in the HTML for search engines and loads behind the animation. */}
        <AnimatePresence>
          {showIntro && <IgnitionScreen key="intro" onComplete={finishIntro} />}
        </AnimatePresence>

        <div className="relative z-10" inert={showIntro}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:rounded focus:bg-accent-blue focus:text-black focus:font-bold"
          >
            Skip to content
          </a>

          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            onBookingOpen={() => setIsBookingOpen(true)}
          />

          <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

          <main id="main" tabIndex={-1} className="focus:outline-hidden">
            <AnimatePresence mode="wait">
              {currentView === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Hero onNavigate={handleNavigate} />
                  <AuthorityGrid />
                  <Services onNavigate={handleNavigate} />
                  <ServiceArea />
                  <Process />
                  <FAQ />
                </motion.div>
              )}
              {currentView === 'catalog' && (
                <Catalog key="catalog" onNavigate={handleNavigate} />
              )}
              {currentView === 'gallery' && (
                <Gallery key="gallery" />
              )}
              {currentView === 'contact' && (
                <div key="contact" className="pt-20">
                  <Contact onBookingOpen={() => setIsBookingOpen(true)} />
                </div>
              )}
            </AnimatePresence>
          </main>

          <Footer currentView={currentView} onNavigate={handleNavigate} />
        </div>
      </div>
    </MotionConfig>
  );
}
