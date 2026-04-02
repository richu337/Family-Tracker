import React, { useState } from 'react';
import { signInAnonymously, auth, db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Shield, User, Phone, ChevronRight } from 'lucide-react';

export default function Login() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'parent' | 'child' | 'guardian'>('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // 1. Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      // 2. Create the user profile immediately
      const profileData = {
        uid,
        name,
        phone,
        role,
        profileImage: '',
        createdAt: Timestamp.now(),
      };
      
      await setDoc(doc(db, 'users', uid), profileData);
      
      // App.tsx will pick up the user and profile and redirect automatically
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-[32px] mb-6 backdrop-blur-md border border-white/30">
          <Shield size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Family Safety</h1>
        <p className="text-blue-100/80 text-sm max-w-xs mx-auto font-medium">
          The simplest way to keep your family connected and safe.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-gray-900"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Get Started</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          No email or password needed. Just enter your details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
              <input
                type="text"
                placeholder="e.g. John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {(['parent', 'child', 'guardian'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                    role === r 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'bg-gray-50 border-gray-50 text-gray-400 hover:border-blue-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-bold bg-red-50 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-xl hover:shadow-blue-200 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Start Tracking
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-[10px] text-gray-400 font-medium leading-relaxed">
          Your session will be saved on this device. <br />
          <span className="underline cursor-pointer">Terms of Service</span> • <span className="underline cursor-pointer">Privacy Policy</span>
        </div>
      </motion.div>

      <div className="mt-10 text-blue-100/40 text-[10px] font-bold tracking-widest uppercase">
        © 2026 Family Safety Tracker
      </div>
    </div>
  );
}
