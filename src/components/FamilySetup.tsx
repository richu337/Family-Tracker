import React, { useState } from 'react';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Family, FamilyMember } from '../types';
import { motion } from 'motion/react';
import { Users, Plus, UserPlus, ChevronRight, Hash } from 'lucide-react';

interface FamilySetupProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  setFamily: (family: Family) => void;
}

export default function FamilySetup({ profile, setProfile, setFamily }: FamilySetupProps) {
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const familyId = Math.random().toString(36).substring(2, 15);
      const code = generateInviteCode();
      const familyData: Family = {
        id: familyId,
        familyName,
        createdBy: profile.uid,
        createdAt: Timestamp.now(),
        inviteCode: code,
      };

      await setDoc(doc(db, 'families', familyId), familyData);
      
      const memberData: FamilyMember = {
        uid: profile.uid,
        nickname: profile.name,
        role: 'admin',
        joinedAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'families', familyId, 'members', profile.uid), memberData);
      await setDoc(doc(db, 'users', profile.uid), { familyId }, { merge: true });

      setProfile({ ...profile, familyId });
      setFamily(familyData);
    } catch (error) {
      console.error('Family creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const familyDoc = querySnapshot.docs[0];
        const familyId = familyDoc.id;
        const familyData = { id: familyId, ...familyDoc.data() } as Family;

        const memberData: FamilyMember = {
          uid: profile.uid,
          nickname: profile.name,
          role: 'member',
          joinedAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'families', familyId, 'members', profile.uid), memberData);
        await setDoc(doc(db, 'users', profile.uid), { familyId }, { merge: true });

        setProfile({ ...profile, familyId });
        setFamily(familyData);
      } else {
        alert('Invalid invite code');
      }
    } catch (error) {
      console.error('Join family failed:', error);
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
        {mode === 'selection' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4">
                <Users size={32} />
              </div>
              <h1 className="text-2xl font-bold">Family Group</h1>
              <p className="text-gray-500">Create a new family or join an existing one</p>
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-between p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg group"
            >
              <div className="flex items-center gap-4">
                <Plus size={24} />
                <div className="text-left">
                  <div className="font-bold">Create Family</div>
                  <div className="text-sm text-blue-100">Start a new private group</div>
                </div>
              </div>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-between p-6 bg-white border-2 border-gray-100 hover:border-blue-200 text-gray-900 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <UserPlus size={24} className="text-blue-600" />
                <div className="text-left">
                  <div className="font-bold">Join Family</div>
                  <div className="text-sm text-gray-500">Use an invite code</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateFamily} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setMode('selection')} className="text-gray-400 hover:text-gray-600">
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <h1 className="text-2xl font-bold">Create Family</h1>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Family Name</label>
              <input
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                placeholder="The Smith Family"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Family'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinFamily} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setMode('selection')} className="text-gray-400 hover:text-gray-600">
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <h1 className="text-2xl font-bold">Join Family</h1>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 uppercase tracking-widest font-mono text-lg"
                  placeholder="ABCDEF"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Family'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
