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
  CheckCircle2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { db } from './firebase';

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
    service: ''
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Initiating booking submission to Firestore...');
    
    try {
      // Priority 1: Save to database
      await addDoc(collection(db, 'appointments'), {
        customerName: formData.name,
        customerPhone: formData.phone,
        vehicleInfo: formData.vehicle,
        serviceDescription: formData.service,
        createdAt: serverTimestamp()
      });
      
      console.log('Firestore document successfully created.');

      // Priority 2: Trigger notification (not awaited to prevent UI hang)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          vehicleInfo: formData.vehicle,
          serviceDescription: formData.service
        })
      }).then(res => {
        if (!res.ok) console.warn("Notification endpoint returned error:", res.status);
        else console.log("Notification trigger successful.");
      }).catch(err => {
        console.warn("Notification trigger failed (network/server error):", err);
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Detailed Booking Error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
        >
          <X size={20} className="text-zinc-400" />
        </button>

        {isSuccess ? (
          <div className="p-12 text-center py-24">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-accent-blue/20 flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 size={40} className="text-accent-blue" />
            </motion.div>
            <h3 className="orbitron text-3xl font-black italic mb-4 uppercase">Request Sent</h3>
            <p className="text-zinc-400 mb-8 italic">Ethan has received your project details. Expect a direct response within 24 hours to schedule your session.</p>
            <button 
              onClick={onClose}
              className="gradient-btn px-12 py-4 rounded-xl orbitron font-black text-black uppercase italic"
            >
              Back to Site
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-[85vh] md:h-auto">
            {/* Sidebar / Progress */}
            <div className="w-full md:w-64 bg-black/40 p-8 border-r border-white/5 hidden md:block">
              <div className="orbitron text-[10px] tracking-[0.4em] text-accent-blue mb-12 uppercase">Booking Engine</div>
              <div className="space-y-6">
                {[
                  { id: 1, label: 'Details' },
                  { id: 2, label: 'Confirm' }
                ].map(s => (
                  <div key={s.id} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black orbitron",
                      step === s.id ? "bg-accent-blue border-accent-blue text-black" : 
                      step > s.id ? "bg-accent-blue/20 border-accent-blue/40 text-accent-blue" : "border-white/10 text-zinc-600"
                    )}>
                      {s.id}
                    </div>
                    <span className={cn(
                      "orbitron text-[10px] tracking-widest uppercase",
                      step === s.id ? "text-white" : "text-zinc-600"
                    )}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Project Details</h3>
                  
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="orbitron text-[10px] tracking-widest text-zinc-500 uppercase px-1">Full Name</label>
                        <input 
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-hidden transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="orbitron text-[10px] tracking-widest text-zinc-500 uppercase px-1">Phone Number</label>
                        <input 
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-hidden transition-colors"
                          placeholder="805-555-0123"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="orbitron text-[10px] tracking-widest text-zinc-500 uppercase px-1">Vehicle Info</label>
                      <input 
                        type="text"
                        required
                        value={formData.vehicle}
                        onChange={e => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-hidden transition-colors"
                        placeholder="2018 BMW M3"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="orbitron text-[10px] tracking-widest text-zinc-500 uppercase px-1">Service Needed</label>
                      <textarea 
                        required
                        value={formData.service}
                        onChange={e => setFormData(prev => ({ ...prev, service: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue focus:outline-hidden transition-colors h-32 resize-none"
                        placeholder="Describe the issue or performance mods requested..."
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        disabled={!formData.name || !formData.phone || !formData.vehicle || !formData.service}
                        onClick={() => setStep(2)}
                        className="w-full gradient-btn py-4 rounded-xl orbitron font-black text-black uppercase italic disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        Review Booking <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <h3 className="orbitron text-2xl font-black italic mb-2 uppercase">Confirmation</h3>
                  
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-500 mb-1 uppercase">Vehicle</div>
                        <div className="text-white font-bold">{formData.vehicle}</div>
                      </div>
                      <div>
                        <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-500 mb-1 uppercase">Customer</div>
                        <div className="text-white font-bold">{formData.name} ({formData.phone})</div>
                      </div>
                      <div>
                        <div className="orbitron text-[8px] tracking-[0.3em] text-zinc-500 mb-1 uppercase">Request</div>
                        <div className="text-zinc-400 text-sm italic line-clamp-3">{formData.service}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl">
                    <AlertCircle size={20} className="text-accent-blue shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 italic">
                      Ethan personally reviews all requests. Professional grade mechanical support requires precision planning. Expect a text or call shortly.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep(1)}
                      className="flex-1 glass py-4 rounded-xl orbitron text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleBooking}
                      className="flex-[2] gradient-btn py-4 rounded-xl orbitron font-black text-black uppercase italic disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? 'Sending...' : 'Transmit Request'} 
                      {!isSubmitting && <CheckCircle2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
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

type View = 'home' | 'catalog' | 'gallery';

function Gallery() {
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
            onClick={() => {
              const el = document.getElementById('contact');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="gradient-btn px-12 py-5 rounded-xl orbitron font-black text-xl italic text-black uppercase"
          >
            Start Project
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Navbar({ currentView, onNavigate }: { currentView: View; onNavigate: (view: View) => void }) {
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
        <div className="relative flex items-center gap-2 md:gap-3">
          <div className="logo-ring w-8 h-8 md:w-12 md:h-12 border-2 border-accent-blue/30 rounded-full flex items-center justify-center relative bg-black/40 group-hover:border-accent-blue transition-all duration-500">
            <span className="orbitron font-black text-xs md:text-xl text-white group-hover:text-accent-ice transition-colors">EZ</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 md:w-4 md:h-4 bg-accent-blue rounded-full blur-[2px] md:blur-[4px] opacity-40 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <div className="orbitron font-black text-base md:text-2xl leading-[0.7] tracking-tighter italic text-white flex flex-col">
              <span className="group-hover:text-accent-blue transition-colors">EZ</span>
              <span className="blue-highlight text-[10px] md:text-lg">PERFORMANCE</span>
            </div>
            <div className="hidden lg:block orbitron text-[6px] tracking-[0.2em] text-zinc-500 font-black uppercase mt-1 leading-none italic">
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
          onClick={() => {
            onNavigate('home');
            setTimeout(() => {
              const el = document.getElementById('contact');
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }} 
          className="nav-link text-zinc-400 hover:text-white"
        >
          Contact
        </button>
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        <a href="tel:18055888082" className="gradient-btn px-3 py-2 md:px-8 md:py-3 rounded flex items-center gap-2 orbitron font-black text-[9px] md:text-xs tracking-widest text-black">
          <Phone size={12} className="md:hidden" />
          <span className="hidden sm:inline">CALL NOW</span>
          <span className="sm:hidden">CALL</span>
        </a>
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
                onClick={() => {
                  onNavigate('home');
                  setIsOpen(false);
                  setTimeout(() => {
                    const el = document.getElementById('contact');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} 
                className="text-lg text-zinc-400 hover:text-white font-black italic tracking-wider text-left py-2"
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
                <Settings size={14} />
              </div>
              ASE CERTIFIED
            </div>
            <div className="badge flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] orbitron font-black tracking-widest text-accent-ice hover:border-accent-ice transition-all">
              <div className="w-6 h-6 rounded-lg bg-accent-ice/10 flex items-center justify-center border border-accent-ice/20">
                <Wrench size={14} />
              </div>
              HYUNDAI MASTER TECH
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
      description: "Specialized service for high-voltage systems. Maintenance and repair for the next generation of transport."
    },
    {
      icon: Wrench,
      title: "ADVANCED REPAIR",
      description: "From full engine rebuilds to complex brake systems, we handle the heavy-duty jobs."
    },
    {
      icon: Gauge,
      title: "CARB LEGAL MODS",
      description: "Performance modifications that keep you fast, powerful, and completely street legal."
    },
    {
      icon: Smartphone,
      title: "MOBILE SERVICE",
      description: "Skip the waiting room. We bring the tools, the tech, and the expertise right to your driveway.",
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
        { name: "Precision Oil Service", price: "$95+", detail: "Full synthetic service with ultra-premium filters." },
        { name: "Fluid Care Package", price: "$120+", detail: "Coolant, brake, and power steering health exchange." },
        { name: "Vital Systems Inspection", price: "$85", detail: "Exhaustive 50-point mechanical and safety audit." }
      ]
    },
    {
      title: "Diagnostics & Electronics",
      items: [
        { name: "Full Computer Scan", price: "$120+", detail: "Deep system interrogation across all modules." },
        { name: "Electrical Tracing", price: "$150/hr", detail: "Short circuit and parasitic draw pinpointing." },
        { name: "Module Programming", price: "$200+", detail: "Dealer-level software updates and syncing." }
      ]
    },
    {
      title: "Performance & Suspension",
      items: [
        { name: "Levelling Kit Install", price: "$400+", detail: "Professional truck stance improvement." },
        { name: "Lift Kit Integration", price: "Custom", detail: "Full suspension geometry optimization." },
        { name: "Tuning & Mapping", price: "Custom", detail: "Power curve and shift point optimization." }
      ]
    },
    {
      title: "Specialized Services",
      items: [
        { name: "EV Battery Health", price: "$180", detail: "High-voltage block variance testing." },
        { name: "Engine Rebuilds", price: "Custom", detail: "Full teardown and precision machining." },
        { name: "Brake Overhaul", price: "$300+", detail: "High-performance pad and rotor conversion." }
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
            onClick={() => {
              onNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('contact');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }} 
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

function Testimonials() {
  const reviews = [
    { quote: "Ethan sorted out the transmission issues on my Altima after three other shops failed to diagnose it. Professional, honest, and fast.", author: "Marcus R.", vehicle: "Nissan Altima" },
    { quote: "The mobile oil service for my F-150 is a game changer for my work schedule. Clean, expert work right in my driveway.", author: "Sarah L.", vehicle: "Ford F-150" },
    { quote: "Master-level maintenance on my Kia at a fraction of the dealer cost. The precision in the diagnostics is impressive.", author: "David K.", vehicle: "Kia Stinger" },
    { quote: "Finally found a tech who actually understands Subaru Boxer engines. My WRX has never run smoother.", author: "James T.", vehicle: "Subaru WRX" },
    { quote: "Excellent service on my Honda Accord. He caught a failing wheel bearing that was making a faint noise I barely noticed.", author: "Linda M.", vehicle: "Honda Accord" },
    { quote: "The diagnostic scan on my RAV4 was dead on. Fixed the EVAP leak in under an hour. Highly recommended.", author: "Robert B.", vehicle: "Toyota RAV4" },
    { quote: "Professional, knowledgeable, and easy to work with. He handled the brake build on my Silverado perfectly.", author: "Mike S.", vehicle: "Chevrolet Silverado" },
    { quote: "Great experience with my Mazda3. The scheduled maintenance was thorough and much more affordable than the dealership.", author: "Emily J.", vehicle: "Mazda3" },
    { quote: "Precision check on my Jeep Wrangler. He dialed in the suspension after my lift kit install. Handles great now.", author: "Kevin W.", vehicle: "Jeep Wrangler" },
    { quote: "He knows his Volkswagens. My GTI's carbon cleaning was done meticulously. Notable performance gain.", author: "Chris P.", vehicle: "VW GTI" },
    { quote: "Very impressed with the electronic diagnostics on my Lexus. He found a sensor issue and saved me hundreds.", author: "Sophia O.", vehicle: "Lexus RX" },
    { quote: "The mobile service for my daily commuter Civic is incredibly convenient. Always on time and professional.", author: "Alex G.", vehicle: "Honda Civic" },
    { quote: "Ethan is a true professional. He explained everything clearly and got my Tahoe back on the road fast.", author: "John D.", vehicle: "Chevrolet Tahoe" },
    { quote: "Top-tier work on my Nissan Rogue. The AC repair was handled efficiently and it's blowing ice cold now.", author: "Lisa M.", vehicle: "Nissan Rogue" },
    { quote: "Found a cooling leak that two other shops missed in my Ford Explorer. Ethan's attention to detail is unmatched.", author: "Peter H.", vehicle: "Ford Explorer" },
    { quote: "Excellent maintenance on my Kia Sorrento. The drive is much smoother now. Very reliable service.", author: "Amanda C.", vehicle: "Kia Sorrento" },
    { quote: "He rescued my older Toyota Tacoma. Solid mechanical work that has kept it running for miles.", author: "Bill V.", vehicle: "Toyota Tacoma" },
    { quote: "Technical mastery of the BMW 3 Series. He sorted out the cooling system issues with factory precision.", author: "Ryan F.", vehicle: "BMW 330i" },
    { quote: "Fast, honest, and reliable. Handled the timing belt on my Honda Odyssey. One less thing to worry about.", author: "Megan R.", vehicle: "Honda Odyssey" },
    { quote: "The diagnostics on my Audi A4 were extremely accurate. He's very transparent about what actually needs repair.", author: "Daniel S.", vehicle: "Audi A4" },
    { quote: "Did a fantastic job with my Hyundai Elantra's brakes. Very quiet now and stopping power is perfect.", author: "Kelly P.", vehicle: "Hyundai Elantra" },
    { quote: "The mobile tech kit he has is impressive. He did my Ford Fusion's battery service right in my garage.", author: "Steve N.", vehicle: "Ford Fusion" },
    { quote: "Expert maintenance for my Subaru Forester. He noticed a small head gasket weep before it became a crisis.", author: "Rachel W.", vehicle: "Subaru Forester" },
    { quote: "Honest advice on my Ram 1500. He didn't try to upsell me on anything I didn't need. Just great work.", author: "Tom L.", vehicle: "Ram 1500" },
    { quote: "Perfectly handled the intake service on my Nissan Maxima. The car feels responsive again.", author: "Brian K.", vehicle: "Nissan Maxima" },
    { quote: "Highest level of professionalism. He maintained my Mazda CX-5 and it's performing ideally.", author: "Olivia H.", vehicle: "Mazda CX-5" },
    { quote: "He diagnosed the hybrid system in my Prius when the dealer was stumped. Ethan really knows his tech.", author: "Mark A.", vehicle: "Toyota Prius" },
    { quote: "Quality repair on my Honda Pilot. The suspension feels brand new again. Wonderful service.", author: "Jessica Z.", vehicle: "Honda Pilot" },
    { quote: "Great communication throughout the repair of my GMC Sierra. Very trustworthy and skilled.", author: "Paul M.", vehicle: "GMC Sierra" },
    { quote: "He fixed a pesky rattle in my Kia Optima that had been driving me crazy. Outstanding work.", author: "Natalie G.", vehicle: "Kia Optima" },
    { quote: "Precise engine work on my Toyota Camry. You can tell he takes pride in every turn of the wrench.", author: "George T.", vehicle: "Toyota Camry" },
    { quote: "Super convenient mobile service for my commute-heavy life. Handled my Nissan Sentra perfectly.", author: "Karen S.", vehicle: "Nissan Sentra" },
    { quote: "The diagnostic depth for my Ford Edge was better than the local garage. I'm a customer for life.", author: "Jeff R.", vehicle: "Ford Edge" },
    { quote: "Flawless service on my Subaru Outback. He found an axle issue that was just starting to manifest.", author: "Heather B.", vehicle: "Subaru Outback" },
    { quote: "Highly proficient with Lexus platforms. My ES350 is running incredibly silent and smooth.", author: "Richard W.", vehicle: "Lexus ES" },
    { quote: "Brilliant technical work on my Volkswagen Tiguan. He handled the turbocharger issue with ease.", author: "Scott V.", vehicle: "VW Tiguan" },
    { quote: "The most reliable mechanic I've worked with. Fixed my Hyundai Santa Fe's steering system quickly.", author: "Lauren D.", vehicle: "Hyundai Santa Fe" },
    { quote: "He set up my Toyota Tacoma with a new leveling kit. The stance is perfect and handles great.", author: "Justin C.", vehicle: "Toyota Tacoma" },
    { quote: "Efficient and professional brake replacement on my Honda Accord. No squeaks, just solid stops.", author: "Nicole K.", vehicle: "Honda Accord" },
    { quote: "Diagnostic expert for Ford trucks. He fixed a sensor issue on my F-250 that was causing limp mode.", author: "Garry T.", vehicle: "Ford F-250" },
    { quote: "Service on my Nissan Frontier was top-notch. Quick, clean, and he knows his mechanical specs.", author: "Derek P.", vehicle: "Nissan Frontier" },
    { quote: "I take both our Kia Souls to Ethan. His level of detail is exactly what you want in a mechanic.", author: "Carol M.", vehicle: "Kia Soul" },
    { quote: "Professional grade work on my Toyota 4Runner. He handled the differential service with master skill.", author: "Wayne H.", vehicle: "Toyota 4Runner" },
    { quote: "Ethan is meticulous. My Mazda CX-9's regular service was done with incredible care.", author: "Diana G.", vehicle: "Mazda CX-9" },
    { quote: "Master technician for sure. Fixed a complex electrical issue on my BMW X5 that others refused to touch.", author: "Steven B.", vehicle: "BMW X5" },
    { quote: "Reliable and high-tech approach to maintenance. He handled my Chevy Equinox service excellently.", author: "Pam S.", vehicle: "Chevrolet Equinox" },
    { quote: "Great mobile service for my Ford Ranger. He replaced the alternator in record time right at my house.", author: "Ronnie J.", vehicle: "Ford Ranger" },
    { quote: "Exceptional knowledge of Honda systems. My CR-V is running perfectly after its major service milestone.", author: "Janet L.", vehicle: "Honda CR-V" },
    { quote: "He resolved a persistent engine light on my Kia Forte. Efficient and professional diagnostics.", author: "Anthony Q.", vehicle: "Kia Forte" },
    { quote: "Fixed the suspension on my Dodge Charger. Now it corners like it's on rails. Precise work.", author: "Eric V.", vehicle: "Dodge Charger" },
    { quote: "Ethan's diagnostic skills for my Nissan Murano saved me a ton of time and money. Great results.", author: "Sandra K.", vehicle: "Nissan Murano" },
    { quote: "He's very transparent and honest. My Toyota Corolla's maintenance was done perfectly and within budget.", author: "Jim B.", vehicle: "Toyota Corolla" },
    { quote: "Quality service on my Subaru Ascent. The car feels more responsive and the engine sounds healthier.", author: "Kate F.", vehicle: "Subaru Ascent" },
    { quote: "Master mechanic for a reason. He sorted out the hybrid drive in my Ford C-Max flawlessly.", author: "Clarence R.", vehicle: "Ford C-Max" },
    { quote: "Impressed by the cleanliness and organization of his mobile service for my GMC Acadia. Highly expert.", author: "Julie T.", vehicle: "GMC Acadia" },
    { quote: "The electrical diagnostics on my Jeep Cherokee were spot on. He fixed the wiring issue perfectly.", author: "Fred D.", vehicle: "Jeep Cherokee" },
    { quote: "Professional, skilled, and honest work on my Nissan Titan. I wouldn't trust anyone else with it now.", author: "Luke W.", vehicle: "Nissan Titan" },
    { quote: "Incredible attention to detail on my Volkswagen Jetta. The drive is silent and smooth after his work.", author: "Monica P.", vehicle: "VW Jetta" },
    { quote: "He's handled several repairs for our family's Toyotas. Consistent, high-quality results every time.", author: "The Miller Family", vehicle: "Toyota Sienna" },
    { quote: "Excellent maintenance on my Honda Fit. He's very thorough and checks every mechanical detail.", author: "Cynthia R.", vehicle: "Honda Fit" },
    { quote: "Diagnostic expert on my Kia Sportage. He found a minor vacuum leak that was causing rough idle.", author: "Harold S.", vehicle: "Kia Sportage" },
    { quote: "Great results on my Ford Mustang's suspension build. The handling is much more aggressive and precise.", author: "Jake M.", vehicle: "Ford Mustang" },
    { quote: "Reliable mechanical care for my Mazda CX-3. He always provides clear technical feedback.", author: "Becky L.", vehicle: "Mazda CX-3" },
    { quote: "The mobile service for my daily Jeep Patriot is a life-saver. Professional and efficient work.", author: "Tim G.", vehicle: "Jeep Patriot" },
    { quote: "Ethan's level of technical skill for my Dodge Durango was evident from the start. Perfect repair.", author: "Allen B.", vehicle: "Dodge Durango" },
    { quote: "He fixed a difficult fuel trim issue on my Nissan Armada. Ethan's diagnostics are industry-leading.", author: "Victor O.", vehicle: "Nissan Armada" },
    { quote: "Superb maintenance on my Toyota Highlander. The vehicle is running effortlessly now.", author: "Grace J.", vehicle: "Toyota Highlander" },
    { quote: "Impressive diagnostic work on my Ford Escape. He pinpointed a transmission sensor issue quickly.", author: "Oliver K.", vehicle: "Ford Escape" },
    { quote: "Top-tier service for my Subaru Crosstrek. He made sure everything was calibrated perfectly for winter.", author: "Brooke S.", vehicle: "Subaru Crosstrek" },
    { quote: "Ethan's professionalism is unmatched. Handled the heavy maintenance on my GMC Yukon flawlessly.", author: "Samson A.", vehicle: "GMC Yukon" },
    { quote: "Detailed work on my Kia Niro. He understands the complexities of the hybrid system completely.", author: "Elena M.", vehicle: "Kia Niro" },
    { quote: "Fixed the brake pulsation on my Honda Insight. Smooth as silk now. Very precise work.", author: "Winston C.", vehicle: "Honda Insight" },
    { quote: "He provided master-level service for my Nissan NV200 work van. Keeps my business on the move.", author: "Rick D.", vehicle: "Nissan NV200" },
    { quote: "Professional and honest diagnostic check for my Chevrolet Blazer. I really appreciate his transparency.", author: "Mia L.", vehicle: "Chevrolet Blazer" },
    { quote: "Great mobile technician for my Daily Ford Focus. He's efficient and very skilled mechanically.", author: "Quentin R.", vehicle: "Ford Focus" },
    { quote: "He's been maintaining my Toyota Avalon for over a year now. It still runs like it did on day one.", author: "Louis P.", vehicle: "Toyota Avalon" },
    { quote: "Reliable and expert repair of the steering in my Subaru Tribeca. Not an easy job, but Ethan nailed it.", author: "Valerie H.", vehicle: "Subaru Tribeca" },
    { quote: "High-level technical skill on my Mazda 6. The electronic work was done with extreme precision.", author: "Barry G.", vehicle: "Mazda 6" },
    { quote: "Ethan resolved a tricky idle issue on my Jeep Liberty. His diagnostic logic is very impressive.", author: "Caleb F.", vehicle: "Jeep Liberty" },
    { quote: "Trustworthy and professional service for my Ford Maverick. He's my go-to for any mechanical need.", author: "Sasha N.", vehicle: "Ford Maverick" },
    { quote: "Excellent work on the drivetrain of my Nissan Kicks. The car feels much more solid and responsive.", author: "Ivan S.", vehicle: "Nissan Kicks" },
    { quote: "Professional maintenance for my Kia Carnival. He's very thorough and respectful of the vehicle.", author: "Tanya B.", vehicle: "Kia Carnival" },
    { quote: "Fixed a recurring CEL on my Honda Ridgeline that baffled others. Ethan is a true master tech.", author: "Gordon M.", vehicle: "Honda Ridgeline" },
    { quote: "Impressed by the master diagnostics on my Chevrolet Colorado. He found a faulty ground wire fast.", author: "Ulysses R.", vehicle: "Chevrolet Colorado" },
    { quote: "Precise suspension repairs on my Toyota Venza. It honestly rides better now than when new.", author: "Pearl J.", vehicle: "Toyota Venza" },
    { quote: "High-end mechanical care for my Subaru BRZ. He really understands enthusiast platforms.", author: "Zack T.", vehicle: "Subaru BRZ" },
    { quote: "Ethan's level of diagnostic detail on my Volkswagen Passat is exactly what European cars need.", author: "Vanessa O.", vehicle: "VW Passat" },
    { quote: "Reliable and expert service for my GMC Canyon. He always provides technical peace of mind.", author: "Marcus D.", vehicle: "GMC Canyon" },
    { quote: "Masterful engine service on my Nissan Pathfinder. The performance gain is very noticeable.", author: "Sheila W.", vehicle: "Nissan Pathfinder" },
    { quote: "Exceptional mobile work for my Ford Expedition. He replaced the water pump in my driveway. Master skill.", author: "Arnold G.", vehicle: "Ford Expedition" },
    { quote: "Honest and thorough inspection of my Kia Cadenza. He pointed out exactly what was essential.", author: "Vera S.", vehicle: "Kia Cadenza" },
    { quote: "He resolved a complex brake system error on my Toyota Mirai. Expertise you can trust.", author: "Liam F.", vehicle: "Toyota Mirai" },
    { quote: "Quality mechanical maintenance for my Honda HR-V. Always professional and very efficient.", author: "Clara E.", vehicle: "Honda HR-V" },
    { quote: "Expertise with the Subaru WRX is fantastic. He tuned the suspension for peak daily performance.", author: "Tyler B.", vehicle: "Subaru WRX" },
    { quote: "Ethan's diagnostic scan of my Nissan Leaf was extremely deep. Very reassured by his tech knowledge.", author: "Julian R.", vehicle: "Nissan Leaf" },
    { quote: "He did an incredible job on the clutch service for my Mazda MX-5. Perfect engagement and feel.", author: "Felix P.", vehicle: "Mazda Miata" },
    { quote: "Master tech level quality for my Chevrolet Traverse. He fixed the AC system with total precision.", author: "Irene K.", vehicle: "Chevrolet Traverse" },
    { quote: "Consistent and reliable service for my Ford Bronco. His mechanical integrity is outstanding.", author: "Bruce M.", vehicle: "Ford Bronco" },
    { quote: "Highly proficient diagnostics for my Honda Prelude. He found a distributor issue immediately.", author: "Stanley H.", vehicle: "Honda Prelude" },
    { quote: "Finalizing the year with a master service from Ethan for my Kia Stinger. It has never run better.", author: "Dominic L.", vehicle: "Kia Stinger" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 3) % reviews.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  const visibleReviews = reviews.slice(currentIndex, currentIndex + 3);
  // Ensure we always show 3 if we reach the end of the array
  if (visibleReviews.length < 3) {
    visibleReviews.push(...reviews.slice(0, 3 - visibleReviews.length));
  }

  return (
    <section className="py-32 px-6 md:px-12 bg-black overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <div className="orbitron text-accent-blue text-sm font-black tracking-[0.4em] mb-4 uppercase">Verification</div>
          <h2 className="orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-glow uppercase">
            Client <span className="ice-highlight">Performance</span>
          </h2>
          <div className="mt-4 orbitron text-[8px] tracking-[0.3em] text-zinc-600 uppercase italic">Rotating Master Service Records</div>
        </div>

        <div className="relative h-[auto]">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {visibleReviews.map((rv, idx) => (
              <div 
                key={`${currentIndex}-${idx}`}
                className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 relative overflow-hidden group min-h-[320px] flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue/10 group-hover:bg-accent-blue/40 transition-all duration-500" />
                
                <p className="text-lg text-white italic font-medium leading-relaxed mb-8 relative z-10">
                  "{rv.quote}"
                </p>
                
                <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20">
                    <User size={22} />
                  </div>
                  <div>
                    <div className="orbitron text-[10px] font-black uppercase text-white tracking-widest">{rv.author}</div>
                    <div className="orbitron text-[8px] tracking-[0.2em] text-accent-ice uppercase font-black italic">{rv.vehicle}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 transition-all duration-500 rounded-full ${
                  Math.floor(currentIndex / 3) === i ? 'w-8 bg-accent-blue' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
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
                <div className="text-sm font-bold opacity-60 uppercase tracking-widest">Available for shop & mobile dispatch</div>
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

function Footer({ onNavigate }: { onNavigate: (view: View) => void }) {
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
              <p className="flex items-center gap-2 justify-center md:justify-start"><User size={12} className="text-accent-blue" /> Owner: Ethan Zandonatti</p>
              <p className="flex items-center gap-2 justify-center md:justify-start"><Phone size={12} className="text-accent-blue" /> 805-588-8082</p>
            </div>
          </div>
          
          <div className="flex items-center gap-12 orbitron text-[10px] tracking-[0.3em] font-black">
            <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-accent-blue transition-colors">Home</button>
            <button onClick={() => onNavigate('catalog')} className="text-zinc-500 hover:text-accent-blue transition-colors">Services</button>
            <button onClick={() => onNavigate('gallery')} className="text-zinc-500 hover:text-accent-blue transition-colors">Gallery</button>
            <button 
              onClick={() => {
                onNavigate('home');
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }} 
              className="text-zinc-500 hover:text-accent-blue transition-colors"
            >
              Contact
            </button>
          </div>
          
          <div className="text-right">
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

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Firestore connection...');
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log('Firestore connection verified.');
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network status.");
        } else {
          console.warn("Firestore connection test completed with non-critical result:", error);
        }
      }
    }
    testConnection();
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
            <Navbar currentView={currentView} onNavigate={handleNavigate} />
            
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
                  <Process />
                  <Testimonials />
                  <FAQ />
                  <Contact />
                </motion.div>
              )}
              {currentView === 'catalog' && (
                <Catalog onNavigate={handleNavigate} />
              )}
              {currentView === 'gallery' && (
                <Gallery />
              )}
            </AnimatePresence>

            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}


