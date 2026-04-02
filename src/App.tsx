import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Family, FamilyMember, UserLocation, UserStatus } from './types';

// Components (to be created)
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FamilySetup from './components/FamilySetup';
import Profile from './components/Profile';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to user profile in real-time
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setProfile({ ...profileData, uid: firebaseUser.uid });

            // If user has a family, fetch family data
            if (profileData.familyId) {
              const familyDoc = await getDoc(doc(db, 'families', profileData.familyId));
              if (familyDoc.exists()) {
                setFamily({ id: familyDoc.id, ...familyDoc.data() } as Family);
              }
            }
          } else {
            setProfile(null);
            setFamily(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setFamily(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/" 
            element={
              user ? (
                profile ? (
                  profile.familyId ? (
                    <Dashboard profile={profile} family={family!} />
                  ) : (
                    <FamilySetup profile={profile} setProfile={setProfile} setFamily={setFamily} />
                  )
                ) : (
                  <Profile user={user} setProfile={setProfile} />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
