import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { User as UserIcon, Phone, ShieldCheck, ChevronRight } from 'lucide-react';

interface ProfileProps {
  user: User;
  setProfile: (profile: UserProfile) => void;
}

export default function Profile({ user, setProfile }: ProfileProps) {
  const [name, setName] = useState(user.displayName || '');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'parent' | 'child' | 'guardian'>('parent');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profileData: UserProfile = {
        uid: user.uid,
        name,
        phone,
        role,
        profileImage: user.photoURL || '',
        createdAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('Profile setup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <UserIcon size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Complete Profile</h1>
            <p className="text-gray-500">Tell us a bit about yourself</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-3 gap-3">
              {(['parent', 'child', 'guardian'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    role === r 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
