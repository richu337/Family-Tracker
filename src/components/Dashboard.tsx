import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Family, FamilyMember, UserLocation, UserStatus } from '../types';
import Map from './Map';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Map as MapIcon, 
  Users, 
  Bell, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Home, 
  Navigation, 
  LogOut,
  Copy,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  profile: UserProfile;
  family: Family;
}

export default function Dashboard({ profile, family }: DashboardProps) {
  const [members, setMembers] = useState<(UserProfile & { memberInfo: FamilyMember })[]>([]);
  const [locations, setLocations] = useState<Record<string, UserLocation>>({});
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [activeTab, setActiveTab] = useState<'map' | 'members' | 'alerts'>('map');
  const [copied, setCopied] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [tracking, setTracking] = useState(true);

  // Real-time listeners
  useEffect(() => {
    // 1. Listen for family members
    const membersQuery = query(collection(db, 'families', family.id, 'members'));
    const unsubscribeMembers = onSnapshot(membersQuery, async (snapshot) => {
      const memberList: (UserProfile & { memberInfo: FamilyMember })[] = [];
      for (const memberDoc of snapshot.docs) {
        const memberInfo = memberDoc.data() as FamilyMember;
        const userDoc = await getDoc(doc(db, 'users', memberDoc.id));
        if (userDoc.exists()) {
          memberList.push({
            ...(userDoc.data() as UserProfile),
            uid: memberDoc.id,
            memberInfo,
          });
        }
      }
      setMembers(memberList);
    });

    // 2. Listen for locations of family members
    const locationsQuery = query(collection(db, 'locations'));
    const unsubscribeLocations = onSnapshot(locationsQuery, (snapshot) => {
      const locs: Record<string, UserLocation> = {};
      snapshot.docs.forEach(doc => {
        locs[doc.id] = { uid: doc.id, ...doc.data() } as UserLocation;
      });
      setLocations(locs);
    });

    // 3. Listen for statuses
    const statusesQuery = query(collection(db, 'status'));
    const unsubscribeStatuses = onSnapshot(statusesQuery, (snapshot) => {
      const stats: Record<string, UserStatus> = {};
      snapshot.docs.forEach(doc => {
        stats[doc.id] = { uid: doc.id, ...doc.data() } as UserStatus;
      });
      setStatuses(stats);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeLocations();
      unsubscribeStatuses();
    };
  }, [family.id]);

  // Geolocation tracking - Update every 15 seconds with fresh GPS readings
  useEffect(() => {
    if (!tracking || !navigator.geolocation) return;

    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 15000; // 15 seconds

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        const { latitude, longitude, accuracy } = position.coords;

        // Only update database if 15 seconds have passed
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          try {
            await setDoc(doc(db, 'locations', profile.uid), {
              latitude,
              longitude,
              accuracy,
              updatedAt: Timestamp.now(),
            });
            lastUpdateTime = now;
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Fallback or alert user if permission denied
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, // Force fresh reading, no cache
        timeout: 10000 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, profile.uid]);

  const updateStatus = async (status: UserStatus['currentStatus']) => {
    await setDoc(doc(db, 'status', profile.uid), {
      currentStatus: status,
      updatedAt: Timestamp.now(),
    });
    setShowStatusModal(false);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => auth.signOut();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Safe': return 'text-green-500 bg-green-50';
      case 'Reached Home': return 'text-blue-500 bg-blue-50';
      case 'On the Way': return 'text-orange-500 bg-orange-50';
      case 'Need Help': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Safe': return <CheckCircle2 size={16} />;
      case 'Reached Home': return <Home size={16} />;
      case 'On the Way': return <Navigation size={16} />;
      case 'Need Help': return <AlertTriangle size={16} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{family.familyName}</h1>
            <button 
              onClick={copyInviteCode}
              className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              Code: {family.inviteCode}
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStatusModal(true)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${getStatusColor(statuses[profile.uid]?.currentStatus)}`}
          >
            {getStatusIcon(statuses[profile.uid]?.currentStatus)}
            {statuses[profile.uid]?.currentStatus || 'Set Status'}
          </button>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-4"
            >
              <Map 
                locations={locations} 
                members={members} 
                statuses={statuses}
                center={locations[profile.uid] ? { lat: locations[profile.uid].latitude, lng: locations[profile.uid].longitude } : undefined}
              />
              
              {/* SOS Button Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateStatus('Need Help')}
                  className="w-20 h-20 bg-red-600 text-white rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-white"
                >
                  <AlertTriangle size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">SOS</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div 
              key="members"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute inset-0 overflow-y-auto p-6 space-y-4"
            >
              <h2 className="text-xl font-bold mb-4">Family Members</h2>
              {members.map((member) => (
                <div key={member.uid} className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt={member.name} className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {member.name[0]}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        locations[member.uid] ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                    <div>
                      <div className="font-bold">{member.name} {member.uid === profile.uid && '(You)'}</div>
                      <div className="text-xs text-gray-400 capitalize">{member.role} • {member.memberInfo.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 mb-1 ${getStatusColor(statuses[member.uid]?.currentStatus)}`}>
                      {getStatusIcon(statuses[member.uid]?.currentStatus)}
                      {statuses[member.uid]?.currentStatus || 'Offline'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {locations[member.uid] 
                        ? `Last seen ${formatDistanceToNow(locations[member.uid].updatedAt.toDate())} ago`
                        : 'No location data'}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div 
              key="alerts"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute inset-0 overflow-y-auto p-6 space-y-4"
            >
              <h2 className="text-xl font-bold mb-4">Safety Alerts</h2>
              {(Object.values(statuses) as UserStatus[]).filter(s => s.currentStatus === 'Need Help').map((status) => {
                const member = members.find(m => m.uid === status.uid);
                return (
                  <div key={status.uid} className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-red-900">{member?.name} needs help!</div>
                      <p className="text-sm text-red-700">Emergency SOS activated. Live location is being shared.</p>
                      <div className="mt-2 text-xs text-red-500 font-medium">
                        {formatDistanceToNow(status.updatedAt.toDate())} ago
                      </div>
                    </div>
                  </div>
                );
              })}
              {(Object.values(statuses) as UserStatus[]).filter(s => s.currentStatus === 'Need Help').length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Bell size={48} className="mb-4 opacity-20" />
                  <p>No active safety alerts</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around pb-8">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <MapIcon size={24} />
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'members' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Users size={24} />
          <span className="text-[10px] font-bold">Family</span>
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'alerts' ? 'text-blue-600' : 'text-gray-400'} relative`}
        >
          <Bell size={24} />
          <span className="text-[10px] font-bold">Alerts</span>
          {(Object.values(statuses) as UserStatus[]).some(s => s.currentStatus === 'Need Help') && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
        <button 
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-bold mb-6">Update Status</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['Safe', 'Reached Home', 'On the Way', 'Need Help'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all border-2 ${
                      statuses[profile.uid]?.currentStatus === s 
                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      s === 'Need Help' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {getStatusIcon(s)}
                    </div>
                    <span className="font-bold text-sm">{s}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="w-full mt-8 py-4 text-gray-500 font-bold"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
