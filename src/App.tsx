/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Code2, 
  Cpu, 
  ExternalLink, 
  Globe, 
  MapPin,
  Layout,
  Layers, 
  Menu, 
  MessageSquare, 
  MousePointer2, 
  Search, 
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
  Clock,
  User,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Droplets,
  ShieldCheck,
  Disc
} from 'lucide-react';
// import { 
//   collection, 
//   addDoc, 
//   serverTimestamp,
//   doc,
//   getDocFromServer
// } from 'firebase/firestore';
// import { db } from './firebase';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, // No auth in this simple app
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Data ---

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

function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    service: '',
    price: 0,
    priceLabel: ''
  });

  const services = [
    { id: 'oil', name: 'Oil & Filter Change', icon: Droplets, price: 95, label: '$95+' },
    { id: 'safety', name: 'Safety Inspection', icon: ShieldCheck, price: 100, label: '$100' },
    { id: 'ac', name: 'AC Service', icon: Thermometer, price: 150, label: '$150' },
    { id: 'brake', name: 'Brake & Pad Service', icon: Disc, price: 300, label: '$300+' },
    { id: 'diag', name: 'Diagnostics', icon: Activity, price: 150, label: '$150/HR' },
    { id: 'other', name: 'Other / Custom', icon: Settings, price: 0, label: 'Custom' }
  ];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Simulating booking submission...');
      localStorage.setItem(`booking_${Date.now()}`, JSON.stringify(formData));
      
      // Notify endpoint
      // We try both the relative path and a more explicit one if needed
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-30"
        >
          <X size={20} className="text-zinc-400" />
        </button>

        {isSuccess ? (
          <div className="p-12 text-center py-24">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(52,214,255,0.2)]"
            >
              <CheckCircle2 size={48} className="text-accent-blue" />
            </motion.div>
            <h3 className="orbitron text-3xl font-black italic mb-4 uppercase">Transmission Complete</h3>
            <p className="text-zinc-400 mb-10 italic max-w-sm mx-auto leading-relaxed">
              Your request has been logged into the queue. Ethan will verify the technical requirements and contact you at <span className="text-accent-blue font-bold">{formData.phone}</span> very soon.
            </p>
            <button 
              onClick={onClose}
              className="gradient-btn px-16 py-5 rounded-2xl orbitron font-black text-black uppercase italic tracking-wider transition-transform hover:scale-105"
            >
              Back to Terminal
            </button>
          </div>
        ) : (
          <>
            <div className="relative h-2 bg-white/5 w-full">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-accent-blue shadow-[0_0_15px_rgba(52,214,255,0.5)]"
                initial={{ width: "33%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Desktop Progress Rail */}
              <div className="w-64 bg-black/40 p-8 border-r border-white/5 hidden md:block">
                <div className="orbitron text-[10px] tracking-[0.5em] text-accent-blue mb-12 uppercase">Booking Engine</div>
                <div className="space-y-8">
                  {[
                    { id: 1, label: 'Identity', icon: User },
                    { id: 2, label: 'Service', icon: Wrench },
                    { id: 3, label: 'Finalize', icon: CheckCircle2 }
                  ].map(s => (
                    <div key={s.id} className="flex items-center gap-4 group">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500",
                        step === s.id ? "bg-accent-blue border-accent-blue text-black shadow-[0_0_15px_rgba(52,214,255,0.4)]" : 
                        step > s.id ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue" : "border-white/5 text-zinc-700 bg-white/2"
                      )}>
                        <s.icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "orbitron text-[8px] tracking-[0.2em] uppercase font-black",
                          step >= s.id ? "text-accent-ice" : "text-zinc-800"
                        )}>Stage 0{s.id}</span>
                        <span className={cn(
                          "orbitron text-[10px] tracking-widest uppercase font-black",
                          step === s.id ? "text-white" : "text-zinc-600"
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
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Identity & Platform</h3>
                        <p className="text-zinc-500 text-xs italic">Enter your contact info and the vehicle we'll be working on.</p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="orbitron text-[9px] tracking-widest text-zinc-500 uppercase px-1">Full Name</label>
                            <input 
                              type="text"
                              value={formData.name}
                              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-4 text-white focus:border-accent-blue focus:bg-white/5 focus:outline-hidden transition-all text-sm font-medium"
                              placeholder="e.g. John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="orbitron text-[9px] tracking-widest text-zinc-500 uppercase px-1">Phone Link</label>
                            <input 
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-4 text-white focus:border-accent-blue focus:bg-white/5 focus:outline-hidden transition-all text-sm font-medium"
                              placeholder="805-555-0123"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="orbitron text-[9px] tracking-widest text-zinc-500 uppercase px-1">Vehicle Platform (Year, Make, Model)</label>
                          <div className="relative group">
                            <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent-blue transition-colors" size={18} />
                            <input 
                              type="text"
                              value={formData.vehicle}
                              onChange={e => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                              className="w-full bg-white/3 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white focus:border-accent-blue focus:bg-white/5 focus:outline-hidden transition-all text-sm font-medium"
                              placeholder="2022 Porsche 911 GT3"
                            />
                          </div>
                        </div>

                        <button
                          disabled={!formData.name || !formData.phone || !formData.vehicle}
                          onClick={nextStep}
                          className="w-full gradient-btn py-5 rounded-2xl orbitron font-black text-black uppercase italic disabled:opacity-30 flex items-center justify-center gap-3 mt-4"
                        >
                          Select Service <ChevronRight size={20} />
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
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Precision Selection</h3>
                        <p className="text-zinc-500 text-xs italic">Choose a service category or describe custom requirements.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {services.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setFormData(prev => ({ ...prev, service: s.name, price: s.price, priceLabel: s.label }))}
                            className={cn(
                              "p-4 rounded-2xl border text-left transition-all duration-300 group relative",
                              formData.service === s.name 
                                ? "bg-accent-blue/10 border-accent-blue/50 ring-1 ring-accent-blue/20" 
                                : "bg-white/2 border-white/5 hover:border-white/20"
                            )}
                          >
                            <s.icon className={cn(
                              "mb-3 transition-colors",
                              formData.service === s.name ? "text-accent-blue" : "text-zinc-600 group-hover:text-zinc-400"
                            )} size={24} />
                            <div className={cn(
                              "orbitron text-[9px] font-black tracking-widest uppercase mb-1",
                              formData.service === s.name ? "text-white" : "text-zinc-500"
                            )}>{s.name}</div>
                            <div className={cn(
                              "text-[10px] font-mono",
                              formData.service === s.name ? "text-accent-ice" : "text-zinc-600"
                            )}>{s.label}</div>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="orbitron text-[9px] tracking-widest text-zinc-500 uppercase px-1">Specific Requirements (Optional)</label>
                        <textarea 
                          className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-4 text-white focus:border-accent-blue focus:bg-white/5 focus:outline-hidden transition-all text-sm font-medium h-24 resize-none"
                          placeholder="Describe the technical issue or modifications..."
                          onChange={e => {
                            if (!services.some(s => s.name === e.target.value)) {
                              setFormData(prev => ({ ...prev, service: e.target.value, price: 0, priceLabel: 'Custom Quote' }));
                            }
                          }}
                        />
                      </div>

                      <div className="flex gap-4">
                        <button onClick={prevStep} className="flex-1 glass py-5 rounded-2xl orbitron text-[10px] font-black uppercase tracking-[0.3em] italic">Back</button>
                        <button
                          disabled={!formData.service}
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
                        <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Execution Scan</h3>
                        <p className="text-zinc-500 text-xs italic">Verify all technical details before final transmission.</p>
                      </div>

                      <div className="bg-white/3 border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity size={100} className="text-accent-blue" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                          <div>
                            <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-600 mb-2 uppercase italic font-black">Platform</div>
                            <div className="text-white font-bold tracking-tight">{formData.vehicle}</div>
                          </div>
                          <div>
                            <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-600 mb-2 uppercase italic font-black">Service Category</div>
                            <div className="text-accent-blue font-bold tracking-tight">{formData.service}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-600 mb-2 uppercase italic font-black">Contract Holder</div>
                            <div className="text-white font-bold tracking-tight">{formData.name}</div>
                            <div className="text-zinc-500 text-xs font-mono">{formData.phone}</div>
                          </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-accent-blue/5 border border-accent-blue/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 mt-6">
                          <div className="text-center sm:text-left">
                            <div className="orbitron text-[8px] tracking-[0.4em] text-accent-ice mb-1 uppercase font-black">Estimated Total</div>
                            <div className="text-3xl text-white orbitron font-black italic tracking-tighter">
                              {formData.priceLabel}
                            </div>
                          </div>
                          <div className="text-[7px] text-accent-blue/40 orbitron uppercase tracking-widest text-center sm:text-right max-w-[120px] leading-relaxed">
                            Final billing subject to technical teardown
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
                        <AlertCircle size={16} className="text-accent-blue shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                          Finalizing this request opens a direct communications channel with Ethan. Professional grade service requires precision synchronization. Ethan will call you to confirm final details.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button onClick={prevStep} className="flex-1 glass py-5 rounded-2xl orbitron text-[10px] font-black uppercase tracking-[0.3em] italic">Back</button>
                        <button
                          disabled={isSubmitting}
                          onClick={handleBooking}
                          className="flex-[2] gradient-btn py-5 rounded-2xl orbitron font-black text-black uppercase italic disabled:opacity-30 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(52,214,255,0.3)]"
                        >
                          {isSubmitting ? (
                            <>
                              <Activity className="animate-spin" size={18} />
                              Transmitting...
                            </>
                          ) : (
                            <>
                              Confirm & Request Call <Zap size={18} />
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

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(onComplete, 1200);
  };

  return (
    <motion.div 
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
              <div className="orbitron text-[10px] tracking-[0.5em] text-zinc-500 mb-8 uppercase">Systems Ready</div>
              
              {/* Start Button */}
              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-40 h-40 rounded-full flex items-center justify-center group"
              >
                {/* Button Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20 group-hover:border-accent-blue transition-colors duration-500 shadow-[0_0_40px_rgba(52,214,255,0.1)] group-hover:shadow-[0_0_60px_rgba(52,214,255,0.3)]" />
                
                {/* Button Inner Body */}
                <div className="absolute inset-3 rounded-full bg-linear-to-b from-zinc-800 to-black border border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner uppercase">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.1)_0%,transparent_70%)] group-hover:bg-accent-blue/10 transition-colors" />
                  <span className="relative z-10 orbitron text-[8px] font-black tracking-widest text-zinc-500 group-hover:text-accent-blue transition-colors mt-2">Engine</span>
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
              
              <div className="mt-8 orbitron text-[8px] tracking-[0.3em] text-accent-blue/50 animate-pulse uppercase">Push to Ignite</div>
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

      {/* Cinematic Speed Lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: "120vw", opacity: 0 }}
          animate={isStarting ? { 
            x: "-120vw", 
            opacity: [0, 0.8, 0],
            scaleX: [1, 3, 1]
          } : {}}
          transition={{ 
            duration: 0.2 + Math.random() * 0.2, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 0.5
          }}
          className="absolute h-px bg-linear-to-r from-transparent via-accent-blue to-transparent"
          style={{ 
            width: 300 + Math.random() * 500, 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`
          }}
        />
      ))}
    </motion.div>
  );
}

type View = 'home' | 'catalog' | 'gallery' | 'contact';

function Gallery({ onNavigate }: { onNavigate: (view: View) => void }) {
  const projects = [
    {
      title: "Porsche 911 GT3",
      category: "Euro Performance",
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2070&auto=format&fit=crop",
      description: "Stage 2 tuning, custom exhaust, and suspension geometry optimization.",
      stats: { hp: "+45 HP", torque: "+30 lb-ft", weight: "-12 lbs" }
    },
    {
      title: "Nissan GT-R R35",
      category: "JDM Precision",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop",
      description: "Dual-clutch transmission rebuild and cooling system overhauls.",
      stats: { hp: "850 WHP", torque: "720 lb-ft", weight: "Stock" }
    },
    {
      title: "McLaren 720S",
      category: "Exotic Maintenance",
      image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?q=80&w=2070&auto=format&fit=crop",
      description: "Annual service, precision alignment, and brake system restoration.",
      stats: { hp: "Factory", torque: "Factory", weight: "Perfect" }
    },
    {
      title: "BMW M2 Competition",
      category: "Track Setup",
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d6274a?q=80&w=2169&auto=format&fit=crop",
      description: "Full track prep including cage installation and fire suppression.",
      stats: { hp: "+60 HP", torque: "+45 lb-ft", weight: "-80 lbs" }
    },
    {
      title: "Engine Calibration",
      category: "Diagnostics",
      image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=2106&auto=format&fit=crop",
      description: "Master level diagnostic session resolving complex phantom DTCs.",
      stats: { hp: "Optimized", torque: "Linear", weight: "N/A" }
    },
    {
      title: "Audi RS6 Avant",
      category: "Performance Wagon",
      image: "https://images.unsplash.com/photo-1610502860263-503487377bc3?q=80&w=2070&auto=format&fit=crop",
      description: "Intercooler upgrades and TCU mapping for rapid response.",
      stats: { hp: "700 HP", torque: "650 lb-ft", weight: "-20 lbs" }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6 md:px-12 relative min-h-screen"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Project Archives</div>
          <h1 className="orbitron text-5xl md:text-7xl font-black italic mb-6 tracking-tight text-glow uppercase">
            SELECTED <span className="ice-highlight">WORK</span>
          </h1>
          <div className="w-24 h-1 bg-accent-blue mx-auto mb-8"></div>
          <p className="text-zinc-400 text-xl italic font-medium max-w-2xl mx-auto">
            A visual documentation of precision mechanical engineering and performance tuning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative h-[450px] rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-accent-blue/50 transition-all duration-500"
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="orbitron text-[10px] font-black tracking-widest text-accent-blue mb-2 uppercase translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {project.category}
                </div>
                <h3 className="orbitron text-2xl font-black italic text-white mb-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 uppercase">
                  {project.title}
                </h3>
                <p className="text-zinc-400 text-sm italic mb-6 line-clamp-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                  {project.description}
                </p>
                
                <div className="flex gap-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-200">
                  {Object.entries(project.stats).map(([label, val]) => (
                    <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-center flex-1">
                      <div className="orbitron text-[7px] text-zinc-500 uppercase tracking-widest leading-none mb-1">{label}</div>
                      <div className="text-[10px] font-black text-accent-ice italic uppercase">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 glass p-12 rounded-[3rem] text-center bg-accent-blue/5 border-accent-blue/20">
          <h3 className="orbitron text-2xl font-black italic mb-6 uppercase">Ready for your transformation?</h3>
          <p className="text-zinc-400 italic mb-8 max-w-xl mx-auto">From subtle refinements to extreme builds, your project deserves master-level execution.</p>
          <div className="flex flex-wrap justify-center gap-6 font-mono text-[10px] uppercase tracking-widest text-accent-blue mb-8">
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent-blue" /> European Platforms</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent-blue" /> JDM Tuning</span>
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent-blue" /> Exotic Service</span>
          </div>
          <button 
            onClick={() => onNavigate('contact')}
            className="gradient-btn px-12 py-5 rounded-xl orbitron font-black text-xl italic text-black uppercase"
          >
            Start Project
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Navbar({ currentView, onNavigate, onBookingOpen }: { currentView: View; onNavigate: (view: View) => void; onBookingOpen: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full flex justify-between items-center py-3 px-4 md:py-4 md:px-12 z-50 bg-black/80 backdrop-blur-md border-b border-white/10" id="navbar">
      <div 
        className="flex items-center gap-3 md:gap-4 cursor-pointer group" 
        onClick={() => {
          onNavigate('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsOpen(false);
        }}
      >
        <div className="relative flex items-center gap-2 md:gap-4">
          <div className="relative h-14 w-20 md:h-18 md:w-28 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <img 
              src="/motor-logo.png" 
              alt="EZ Performance Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(52,214,255,0.4)] transition-all duration-500" 
              onError={(e) => {
                e.currentTarget.classList.add('hidden');
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-logo');
                if (fallback) fallback.classList.remove('hidden');
              }} 
            />
            <div className="fallback-logo hidden flex items-center justify-center relative w-full h-full">
              <div className="absolute inset-0 bg-accent-blue/10 rounded-full blur-xl animate-pulse"></div>
              <Activity className="text-accent-blue w-8 h-8 md:w-10 md:h-10 relative z-10" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="orbitron font-black text-sm md:text-2xl leading-none tracking-tighter italic text-white flex flex-col">
              <span className="blue-highlight">EZ PERFORMANCE</span>
            </div>
            <div className="hidden lg:block orbitron text-[6px] tracking-[0.3em] text-zinc-500 font-black uppercase mt-1 leading-none italic opacity-80">
              Automotive Diagnostics · Repair · Maintenance
            </div>
          </div>
        </div>
      </div>

      <nav className="hidden lg:flex space-x-10 orbitron uppercase">
        <button 
          onClick={() => onNavigate('home')} 
          className={`nav-link ${currentView === 'home' ? 'blue-highlight' : 'text-zinc-400 hover:text-white'}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('catalog')} 
          className={`nav-link ${currentView === 'catalog' ? 'blue-highlight' : 'text-zinc-400 hover:text-white'}`}
        >
          Catalog
        </button>
        <button 
          onClick={() => onNavigate('gallery')} 
          className={`nav-link ${currentView === 'gallery' ? 'blue-highlight' : 'text-zinc-400 hover:text-white'}`}
        >
          Gallery
        </button>
        <button 
          onClick={() => onNavigate('contact')} 
          className={`nav-link ${currentView === 'contact' ? 'blue-highlight' : 'text-zinc-400 hover:text-white'}`}
        >
          Contact
        </button>
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onBookingOpen}
          className="gradient-btn px-3 py-2 md:px-8 md:py-3 rounded flex items-center gap-2 orbitron font-black text-[9px] md:text-xs tracking-widest text-black shadow-[0_0_15px_rgba(52,214,255,0.3)] hover:scale-105 transition-transform"
        >
          <Calendar size={12} className="md:hidden" />
          <span className="hidden sm:inline">BOOK NOW</span>
          <span className="sm:hidden">BOOK</span>
        </button>
        <button 
          className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-zinc-800 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4 orbitron">
              <button 
                onClick={() => { onNavigate('home'); setIsOpen(false); }} 
                className={`text-left text-lg font-black italic tracking-wider py-2 border-b border-white/5 ${currentView === 'home' ? 'blue-highlight' : 'text-zinc-400'}`}
              >
                Home
              </button>
              <button 
                onClick={() => { onNavigate('catalog'); setIsOpen(false); }} 
                className={`text-left text-lg font-black italic tracking-wider py-2 border-b border-white/5 ${currentView === 'catalog' ? 'blue-highlight' : 'text-zinc-400'}`}
              >
                Catalog
              </button>
              <button 
                onClick={() => { onNavigate('gallery'); setIsOpen(false); }} 
                className={`text-left text-lg font-black italic tracking-wider py-2 border-b border-white/5 ${currentView === 'gallery' ? 'blue-highlight' : 'text-zinc-400'}`}
              >
                Gallery
              </button>
              <button 
                onClick={() => { onNavigate('contact'); setIsOpen(false); }} 
                className={`text-left text-lg font-black italic tracking-wider py-2 border-b border-white/5 ${currentView === 'contact' ? 'blue-highlight' : 'text-zinc-400'}`}
              >
                Contact
              </button>
            </div>
          </motion.div>
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
    let timeout: NodeJS.Timeout;

    const runScan = async () => {
      // Small delay before start
      await new Promise(r => setTimeout(r, 1000));

      for (let i = 0; i < PHASES.length; i++) {
        setCurrentPhaseIdx(i);
        setDisplayedLines(PHASES.slice(0, i + 1));
        await new Promise(r => setTimeout(r, PHASES[i].delay));
      }

      setScanStatus("COMPLETE");
      setScanComplete(true);

      // Wait before restart
      await new Promise(r => setTimeout(r, 5000));
      setScanStatus("RUNNING...");
      setScanComplete(false);
      setDisplayedLines([]);
      setCurrentPhaseIdx(0);
      runScan();
    };

    runScan();
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
            Automotive Diagnostics · Repair · Maintenance delivered with dealership precision. Led by Ethan Zandonatti.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <div className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-accent-blue hover:border-accent-blue transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <MapPin size={14} />
              </div>
              SHOP & MOBILE SERVICE
            </div>
            <div className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-zinc-400 hover:border-accent-blue transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <Globe size={14} />
              </div>
              SERVING LOMPOC TO PASO ROBLES
            </div>
            <div className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-accent-ice hover:border-accent-ice transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-ice/10 flex items-center justify-center border border-accent-ice/20">
                <Wrench size={14} />
              </div>
              MASTER TECH CERTIFIED
            </div>
          </div>

          <button 
            onClick={() => onNavigate('catalog')}
            className="inline-block gradient-btn px-10 md:px-20 py-4 md:py-6 rounded-lg orbitron font-black text-xl md:text-3xl italic tracking-tighter text-black uppercase"
          >
            VIEW SERVICES
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
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
      description: "Expert installation of lift kits and suspension tuning to give your truck the perfect stance and performance."
    },
    {
      icon: ZapIcon,
      title: "HYBRID & EV SERVICE",
      description: "Specialized service for high-voltage systems. EV Battery health monitoring and component repair."
    },
    {
      icon: Wrench,
      title: "ADVANCED REPAIR",
      description: "From precision engine rebuilds to brake and pad replacement, we handle the heavy-duty jobs."
    },
    {
      icon: Thermometer,
      title: "AC SERVICE",
      description: "Complete HVAC system diagnostics and recharging to keep your cabin environment perfect."
    },
    {
      icon: Smartphone,
      title: "SHOP & MOBILE DISPATCH",
      description: "Whether you visit our shop for complex repairs or need mobile dispatch from Lompoc to Paso Robles, we bring master-level expertise to you.",
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
            From complex high-voltage EV systems to aggressive truck leveling kits. 
            We handle the jobs other shops can't.
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-block mt-12"
          >
            <button 
              onClick={() => onNavigate('catalog')}
              className="frost-outline px-10 py-4 font-black rounded-full orbitron text-[10px] md:text-xs tracking-[0.2em] shadow-lg uppercase"
            >
              VIEW FULL SERVICE CATALOG
            </button>
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

function Catalog({ onNavigate }: { onNavigate: (view: View) => void }) {
  const catalogSections = [
    {
      title: "Basic Maintenance & Technical Care",
      items: [
        { name: "Oil & Filter Change", price: "$95+", detail: "Full synthetic service with ultra-premium filters." },
        { name: "Fluid Care Package", price: "$120+", detail: "Coolant, brake, and power steering health exchange." },
        { name: "Safety Inspection", price: "$100", detail: "Exhaustive 50-point mechanical and safety audit." },
        { name: "AC Service", price: "$150", detail: "System performance check and refrigerant recharge." }
      ]
    },
    {
      title: "Diagnostics & Electronics",
      items: [
        { name: "Full Computer Scan", price: "$120+", detail: "Deep system interrogation across all modules." },
        { name: "Electrical Tracing", price: "$200/HR", detail: "Short circuit and parasitic draw pinpointing." },
        { name: "Module Programming", price: "$150", detail: "Dealer-level software updates and syncing." },
        { name: "Marine and Car Stereo Installation", price: "Varies", detail: "Custom audio builds and system integration." }
      ]
    },
    {
      title: "Performance & Suspension",
      items: [
        { name: "Levelling Kit Install", price: "$400+", detail: "Professional truck stance improvement." },
        { name: "Lift Kit Integration", price: "Varies", detail: "Full suspension geometry optimization." }
      ]
    },
    {
      title: "Specialized Services",
      items: [
        { name: "EV Battery Health", price: "$200", detail: "High-voltage block variance testing." },
        { name: "Engine Rebuilds", price: "Varies", detail: "Full teardown and precision machining." },
        { name: "Brake pad and Rotor replacement", price: "$300+", detail: "Quality pad and rotor renewal and service." }
      ]
    },
    {
      title: "Tow Service",
      items: [
        { name: "Recovery & Transport", price: "$5/mile", detail: "Minimum hook up fee $50. If your car is down we will come pick it up for repairs." }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6 md:px-12 relative min-h-screen"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <h1 className="orbitron text-5xl md:text-7xl font-black italic mb-6 tracking-tight text-glow uppercase">Service <span className="ice-highlight">Catalog</span></h1>
          <p className="text-zinc-400 text-xl italic font-medium">Transparent pricing and specialized expert procedures.</p>
        </div>

        <div className="space-y-16">
          {catalogSections.map((section, idx) => (
            <div key={idx} className="glass p-10 rounded-[2.5rem]">
              <h2 className="orbitron text-2xl font-black italic mb-8 border-b border-accent-blue/20 pb-4 text-accent-blue">{section.title}</h2>
              <div className="grid gap-6">
                {section.items.map((item, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-blue/30 transition-all group">
                    <div>
                      <h4 className="orbitron text-lg font-bold text-white group-hover:ice-highlight transition-colors mb-1">{item.name}</h4>
                      <p className="text-zinc-400 text-sm italic">{item.detail}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <span className="orbitron text-lg font-black italic blue-highlight">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 glass p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-accent-blue/30">
          <div className="max-w-md">
            <h3 className="orbitron text-2xl font-bold italic mb-4">Don't see what you need?</h3>
            <p className="text-zinc-400 italic">We handle custom performance projects and rare vehicle platforms. Reach out for a specialized quote.</p>
          </div>
          <button 
            onClick={() => onNavigate('contact')} 
            className="gradient-btn px-12 py-5 rounded-xl orbitron font-black text-xl italic text-black uppercase"
          >
            Custom Quote
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Process() {
  const steps = [
    {
      num: "01",
      title: "Inquiry",
      description: "Submit your project details via our digital booking engine for immediate review."
    },
    {
      num: "02",
      title: "Consultation",
      description: "Direct technical consultation with Ethan to define project scope and performance goals."
    },
    {
      num: "03",
      title: "Precision Prep",
      description: "Sourcing of OEM or specialized performance components and specialized tooling setup."
    },
    {
      num: "04",
      title: "Execution",
      description: "Master-level mechanical service performed at our shop or via executive mobile dispatch."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-white/2 border-y border-white/5">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-xl">
            <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Workflow</div>
            <h2 className="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-glow uppercase leading-tight">
              The <span className="ice-highlight">Professional</span> <br />Experience
            </h2>
          </div>
          <p className="text-zinc-500 text-lg italic max-w-sm">
            Professional mechanical support is defined by the process. We eliminate the friction of traditional shops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 group hover:border-accent-blue/30 transition-all duration-500"
            >
              <div className="orbitron text-5xl font-black italic text-white/5 group-hover:text-accent-blue/10 transition-colors absolute top-4 right-6 leading-none">
                {step.num}
              </div>
              <h3 className="orbitron text-xl font-black italic text-white mb-4 uppercase">{step.title}</h3>
              <p className="text-zinc-400 text-sm italic leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
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
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Authority</div>
          <h2 className="orbitron text-4xl md:text-5xl font-black italic tracking-tighter text-glow text-center uppercase">
            Mastered <span className="ice-highlight">Platforms</span>
          </h2>
          <div className="w-24 h-1 bg-accent-blue mt-8"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {brands.map((brand, idx) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center transition-all duration-300 group"
            >
              <div className="orbitron text-[10px] md:text-xs font-black italic tracking-widest text-zinc-600 group-hover:text-accent-blue transition-colors uppercase text-center select-none">
                {brand}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-zinc-700 text-[10px] orbitron font-black tracking-[0.3em] uppercase italic">
            Professional mechanical support for all major vehicle platforms
          </p>
        </div>
      </div>
    </section>
  );
}

function ServiceArea() {
  const cities = [
    "Lompoc", "Santa Maria", "Orcutt", "Nipomo", 
    "Arroyo Grande", "Grover Beach", "Pismo Beach", 
    "San Luis Obispo", "Atascadero", "Templeton", "Paso Robles"
  ];

  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden bg-white/[0.02]">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div>
              <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Regional Coverage</div>
              <h2 className="orbitron text-4xl md:text-5xl font-black italic tracking-tighter text-glow uppercase leading-tight">
                MOBILE <span className="ice-highlight">DISPATCH</span> <br />RANGE
              </h2>
            </div>
            
            <p className="text-zinc-400 text-lg italic leading-relaxed max-w-lg">
              We provide master-level automotive support directly to your location throughout the Central Coast. Our mobile units are fully equipped for diagnostics, maintenance, and complex repairs.
            </p>

            <div className="flex flex-wrap gap-3">
              {cities.map((city, idx) => (
                <div key={idx} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] orbitron font-black tracking-widest text-zinc-500 hover:text-accent-blue hover:border-accent-blue transition-all cursor-default">
                  {city}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="aspect-square relative rounded-[3rem] overflow-hidden border border-white/10 group bg-zinc-900 flex items-center justify-center p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,214,255,0.1)_0%,transparent_70%)]" />
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,214,255,0.2)]">
                  <Globe size={40} className="text-accent-blue" />
                </div>
                <div className="orbitron text-3xl font-black italic text-white mb-2 uppercase">Central Coast</div>
                <div className="orbitron text-xs tracking-[0.4em] text-accent-blue font-black uppercase">Elite Coverage</div>
              </div>
              
              {/* Decorative Map Elements */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(52,214,255,1)] animate-ping" />
              <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-accent-ice shadow-[0_0_10px_rgba(52,214,255,1)] animate-ping animation-delay-1000" />
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
      q: "Do you service standard daily drivers as well as high-performance cars?",
      a: "Absolutely. While we are primarily known for precision maintenance and expert diagnostics on all major platforms, we also provide master-level support for high-performance builds and technical modifications."
    },
    {
      q: "What defines your advanced diagnostic process?",
      a: "We use factory-level scanning hardware to pull real-time telemetry from every control module. We don't just clear codes; we identify the root cause of mechanical or electrical failures with surgical accuracy."
    },
    {
      q: "Are the mechanical services under warranty?",
      a: "All maintenance work carries a 12-month/12k mile precision guarantee. Performance modifications are warrantied for defects in installation craftsmanship."
    },
    {
      q: "Can you source OEM parts directly?",
      a: "We maintain direct relationships with master logistics centers for BMW, Porsche, and McLaren parts, ensuring only verified OEM components are used in your build."
    }
  ];

  return (
    <section className="py-32 px-6 md:px-12 bg-white/[0.01]">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-20">
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Directives</div>
          <h2 className="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-glow uppercase">Common <span className="ice-highlight">Inquiries</span></h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              className="border border-white/5 rounded-3xl overflow-hidden bg-white/2"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-8 text-left group"
              >
                <span className="orbitron text-lg font-black italic text-zinc-300 group-hover:text-accent-blue transition-colors uppercase">{faq.q}</span>
                <ChevronRight className={`text-accent-blue transition-transform duration-300 ${openIndex === idx ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 pt-0 text-zinc-500 italic leading-relaxed text-sm border-t border-white/5 mx-8">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section id="contact" className="py-32 px-6 md:px-12 relative overflow-hidden">
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Direct Access</div>
              <h2 className="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-glow mb-6 uppercase leading-tight">
                LET'S GET TO <br />
                <span className="ice-highlight">WORK.</span>
              </h2>
              <div className="w-24 h-1 bg-accent-blue mb-8"></div>
              <p className="text-zinc-400 text-lg md:text-xl max-w-lg italic leading-relaxed">
                Connect directly with Ethan Zandonatti. From master diagnostics to high-level performance builds, 
                professional mechanical support is one conversation away.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md">
                <div className="mt-1 p-2 rounded-lg bg-accent-blue/10">
                  <Settings size={20} className="text-accent-blue" />
                </div>
                <div>
                  <div className="text-xs font-black orbitron tracking-widest text-accent-blue mb-1 uppercase">Tech Note</div>
                  <p className="text-sm text-zinc-400 italic">Please include Year, Make, Model, and a brief description of your request for the fastest response.</p>
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
              href="tel:18055888082" 
              className="group relative block p-8 rounded-[2.5rem] bg-gradient-to-br from-white to-zinc-200 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Phone size={120} className="text-black" />
              </div>
              <div className="relative z-10 flex flex-col items-center sm:items-start text-black">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="orbitron text-[10px] font-black tracking-widest opacity-60 uppercase">Call Direct</span>
                </div>
                <div className="orbitron text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter mb-1">
                  1-805-588-8082
                </div>
                <div className="text-sm font-bold opacity-60 uppercase tracking-widest">Mobile Dispatch: Lompoc to Paso Robles</div>
              </div>
            </motion.a>

            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsBookingOpen(true)}
              className="group relative block w-full p-8 rounded-[2.5rem] bg-zinc-900/60 border-2 border-accent-blue/30 backdrop-blur-xl transition-colors hover:border-accent-blue/60 text-left"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageCircle size={120} className="text-accent-blue" />
              </div>
              <div className="relative z-10 flex flex-col items-center sm:items-start">
                <div className="orbitron text-[10px] font-black tracking-widest text-accent-blue mb-2 uppercase">Fastest Response</div>
                <div className="orbitron text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter text-white mb-2 uppercase">
                  START A <span className="ice-highlight">BOOKING</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Professional Request</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>Direct Transmission</span>
                </div>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-500 mb-1 uppercase">Response</div>
                <div className="text-accent-ice text-xs font-black uppercase italic">Same-Day Priority</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-500 mb-1 uppercase">Consultation</div>
                <div className="text-accent-ice text-xs font-black uppercase italic">Professional Grade</div>
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
            <p className="text-zinc-500 text-[9px] tracking-[0.3em] uppercase font-black leading-loose mb-6 italic">
              Automotive Diagnostics · Repair · Maintenance
            </p>
            <div className="space-y-2 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
              <p className="flex items-center gap-2 justify-center md:justify-start"><Globe size={12} className="text-accent-blue" /> Dispatch: Lompoc to Paso Robles</p>
              <p className="flex items-center gap-2 justify-center md:justify-start"><User size={12} className="text-accent-blue" /> Owner: Ethan Zandonatti</p>
              <p className="flex items-center gap-2 justify-center md:justify-start"><Phone size={12} className="text-accent-blue" /> 805-588-8082</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 orbitron text-[10px] tracking-[0.3em] font-black">
            <button onClick={() => onNavigate('home')} className="text-zinc-300 hover:text-accent-blue transition-colors uppercase cursor-pointer">Home</button>
            <button onClick={() => onNavigate('catalog')} className="text-zinc-300 hover:text-accent-blue transition-colors uppercase cursor-pointer">Services</button>
            <button onClick={() => onNavigate('gallery')} className="text-zinc-300 hover:text-accent-blue transition-colors uppercase cursor-pointer">Gallery</button>
            <button 
              onClick={() => onNavigate('contact')} 
              className={`text-zinc-300 hover:text-accent-blue transition-colors uppercase cursor-pointer ${currentView === 'contact' ? 'text-accent-blue' : ''}`}
            >
              Contact
            </button>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="h-12 w-16 mb-4 opacity-40 hover:opacity-100 transition-opacity">
              <img 
                src="/motor-logo.png" 
                alt="EZ Performance Footer Logo" 
                className="w-full h-full object-contain grayscale"
              />
            </div>
            <div className="text-zinc-400 orbitron text-xs font-black italic mb-2 tracking-widest">Est. 2026</div>
            <p className="text-zinc-700 text-[10px] font-mono uppercase">
              © EZ PERFORMANCE. PHENOMENAL PRECISION.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    // Local storage persistence or other initialization can go here
    console.log('App initialized.');
  }, []);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="selection:bg-accent-blue selection:text-black min-h-screen relative">
      {/* Background Layers - Always rendered, covered by loader during ignition */}
      <div className="bg-fixed-car" aria-hidden="true" />
      <div className="bg-fixed-gradient" aria-hidden="true" />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <IgnitionScreen key="loader" onComplete={() => setIsLoading(false)} />
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <Navbar 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              onBookingOpen={() => setIsBookingOpen(true)} 
            />
            
            <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
            
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
                <Catalog onNavigate={handleNavigate} />
              )}
              {currentView === 'gallery' && (
                <Gallery onNavigate={handleNavigate} />
              )}
              {currentView === 'contact' && (
                <div className="pt-20">
                  <Contact />
                </div>
              )}
            </AnimatePresence>

            <Footer currentView={currentView} onNavigate={handleNavigate} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}


