import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import FilterSection from './components/FilterSection';
import ProfileCard from './components/ProfileCard';
import ProfileDetails from './components/ProfileDetails';
import HowItWorksModal from './components/HowItWorksModal';
import MediatorChat from './components/MediatorChat';
import { VERSES } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, getDocFromServer, setDoc, Timestamp } from 'firebase/firestore';

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.warn('Firestore Warning (non-fatal): ', JSON.stringify(errInfo));
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

type ViewState = 'landing' | 'register' | 'browse' | 'favorites';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([]);
  const [mutualLikeIds, setMutualLikeIds] = useState<string[]>([]);
  const [userPrefs, setUserPrefs] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemNotice, setSystemNotice] = useState<{
    text: string;
    type: 'info' | 'warning' | 'success';
  } | null>(null);

  // Load local sandbox fallback if stored, to make app stable & stateful
  useEffect(() => {
    const localUserJson = localStorage.getItem('sakina_sandbox_user');
    const localProfileJson = localStorage.getItem('sakina_sandbox_profile');
    const localPrefsJson = localStorage.getItem('sakina_sandbox_prefs');
    
    if (localUserJson) {
      try {
        const parsedUser = JSON.parse(localUserJson);
        setUser(parsedUser);
        if (localProfileJson) {
          setUserProfile(JSON.parse(localProfileJson));
        }
        if (localPrefsJson) {
          setUserPrefs(JSON.parse(localPrefsJson));
        }
        setSystemNotice({
          text: "Welcome back! Running cleanly in Safe Offline Sandbox Mode. Changes are saved to your local workspace.",
          type: 'info'
        });
      } catch (err) {
        console.warn("Error parsing local fallback data:", err);
      }
    }
  }, []);

  // Landing video properties
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=UrS_U6bMclQ');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [tempVideoUrl, setTempVideoUrl] = useState('https://www.youtube.com/watch?v=UrS_U6bMclQ');
  const [isVideoSaving, setIsVideoSaving] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Video URL from Firestore settings/video
  useEffect(() => {
    const videoRef = doc(db, 'settings', 'video');
    const unsubscribe = onSnapshot(videoRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.url) {
          setVideoUrl(data.url);
          setTempVideoUrl(data.url);
        }
      }
    }, (error) => {
      console.warn("Could not load real-time video URL:", error);
    });
    return () => unsubscribe();
  }, []);

  // One-time migration of mock data
  useEffect(() => {
    const migrateData = async () => {
      try {
        const { MOCK_PROFILES } = await import('./mockData');
        for (const profile of MOCK_PROFILES) {
          const profileRef = doc(db, 'profiles', `mock-${profile.id}`);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            await setDoc(profileRef, {
              ...profile,
              createdAt: Timestamp.now()
            });
          }
        }
      } catch (error) {
        // Migration errors are non-fatal for the user but good to know
        console.warn("Migration error:", error);
      }
    };
    migrateData();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If there is already a sandbox local session active, keep it intact
      if (localStorage.getItem('sakina_sandbox_user')) {
        setIsAuthReady(true);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
            setView('browse');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `profiles/${currentUser.uid}`);
        }
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Profiles with strict gender filtering or fallback to mock profiles
  useEffect(() => {
    if (!isAuthReady || !userProfile) {
      setProfiles([]);
      return;
    }

    const oppositeGender = userProfile.gender === 'male' ? 'female' : 'male';
    
    // Always load MOCK_PROFILES filtered by opposite gender as our guaranteed base baseline!
    import('./mockData').then(({ MOCK_PROFILES }) => {
      const filteredMocks = MOCK_PROFILES.filter(p => p.gender === oppositeGender);
      setProfiles(filteredMocks);
    });

    // If it's a local sandbox fallback, we don't attempt Firestore listening
    if (user?.isLocalFallback) {
      return;
    }

    // Otherwise, listen from Firestore
    const q = query(
      collection(db, 'profiles'),
      where('gender', '==', oppositeGender)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      import('./mockData').then(({ MOCK_PROFILES }) => {
        const filteredMocks = MOCK_PROFILES.filter(p => p.gender === oppositeGender);
        const liveProfiles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as any));
        
        // Combine them ensuring no duplicate IDs or UIDs
        const combined = [...liveProfiles] as any[];
        filteredMocks.forEach((mock: any) => {
          if (!combined.some((item: any) => String(item.id) === String(mock.id) || (item.uid && mock.uid && String(item.uid) === String(mock.uid)))) {
            combined.push(mock);
          }
        });
        
        setProfiles(combined);
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    });

    return () => unsubscribe();
  }, [isAuthReady, userProfile, user]);

  // Simulate compatibility and initial sorting
  const getCompatibilityScore = (profile: any) => {
    // Stable random seed-like score for demo if no prefs
    if (!userPrefs) {
      // Use profile.uid or id to generate a stable score
      const seed = profile.uid || profile.id || '0';
      const charSum = String(seed).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const base = charSum % 100;
      return base < 15 ? base + 20 : base; 
    }
    
    let score = 50; // base score
    if (userPrefs.prefSect && profile.sect === userPrefs.prefSect) score += 15;
    if (userPrefs.prefReligiosity && profile.religiosity === userPrefs.prefReligiosity) score += 15;
    if (userPrefs.prefCountry && profile.country === userPrefs.prefCountry) score += 10;
    if (profile.age >= userPrefs.prefAgeMin && profile.age <= userPrefs.prefAgeMax) score += 10;
    
    return Math.min(score, 100);
  };

  const handleCreateProfile = async () => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.warn("Firebase Anonymous sign-in was blocked; activating the local sandbox fallback:", error);
        
        // Activate Local Sandbox fallback mode
        const fallbackId = 'sandbox_user_' + Math.random().toString(36).substring(2, 11);
        const sandboxUser = {
          uid: fallbackId,
          isAnonymous: true,
          isLocalFallback: true,
          email: null,
          displayName: 'Guest Candidate'
        };
        
        localStorage.setItem('sakina_sandbox_user', JSON.stringify(sandboxUser));
        setUser(sandboxUser as any);
        
        setSystemNotice({
          text: "Automatic Offline Sandbox Activated: Anonymous Sign-in is restricted in this Firebase environment. Your profile details will be stored locally in this browser sandbox so you can test features gracefully.",
          type: 'warning'
        });
      }
    }
    setView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreMatches = () => {
    // If user has no profile yet, make sure we have a temporary profile to enable browsing
    if (!userProfile) {
      const demoProfile = {
        gender: 'male', // default value to browse opposite female profiles
        name: 'Guest Explorer',
        age: 25,
        city: 'Mumbai',
        country: 'India',
        sect: 'Sunni',
        isLocalFallback: true
      };
      setUserProfile(demoProfile);
    }
    setView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationComplete = async (formData: any, prefData: any) => {
    if (!user) return;

    const profileData = {
      ...formData,
      uid: user.uid,
      createdAt: Timestamp.now(),
    };

    // Always back up to local storage first
    localStorage.setItem('sakina_sandbox_profile', JSON.stringify(profileData));
    localStorage.setItem('sakina_sandbox_prefs', JSON.stringify(prefData));

    if (user.isLocalFallback) {
      setUserProfile(profileData);
      setUserPrefs(prefData);
      setView('browse');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      await setDoc(doc(db, 'profiles', user.uid), profileData);
      setUserProfile(profileData);
      setUserPrefs(prefData);
      setView('browse');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
      // Fail gracefully and allow browsing locally anyway
      setUserProfile(profileData);
      setUserPrefs(prefData);
      setView('browse');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLike = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    setLikedProfileIds(prev => {
      const alreadyLiked = prev.includes(profileId);
      if (alreadyLiked) {
        return prev.filter(id => id !== profileId);
      } else {
        // Higher chance of mutual like for demo
        if (Math.random() > 0.4 && !mutualLikeIds.includes(profileId)) {
          setMutualLikeIds(m => [...m, profileId]);
        }
        return [...prev, profileId];
      }
    });
  };

  const handleContactMediator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChat(true);
  };

  // Strictly sort: High compatibility (>50) at top, Low (<=50) at bottom
  const getSortedProfiles = (profiles: any[]) => {
    return [...profiles]
      .map(p => ({ ...p, compatibility: getCompatibilityScore(p) }))
      .sort((a, b) => {
        const aHigh = a.compatibility > 50;
        const bHigh = b.compatibility > 50;
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;
        return b.compatibility - a.compatibility; 
      });
  };

  const sortedAllProfiles = getSortedProfiles(profiles);
  const favoritesMutual = sortedAllProfiles.filter(p => mutualLikeIds.includes(p.id));
  const favoritesSent = sortedAllProfiles.filter(p => likedProfileIds.includes(p.id) && !mutualLikeIds.includes(p.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="flex flex-col items-center gap-6">
          <div className="text-[#c5a059] text-6xl animate-spin-slow">۞</div>
          <p className="cinzel-font text-[#064e3b] font-black tracking-widest animate-pulse">Loading Sanctuary...</p>
        </div>
      </div>
    );
  }

  const renderLanding = () => (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl px-6 pt-24 pb-12 text-center flex flex-col items-center justify-center min-h-[90vh]">
        <div className="animate-fade-in basmala-glow basmala-font text-5xl md:text-7xl lg:text-8xl text-[#c5a059] mb-8 select-none tracking-normal">
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
        <div className="relative mb-16 animate-fade-up delay-700 flex flex-col items-center w-full">
          <div className="flex flex-col items-center justify-center w-full px-4">
            <h1 className="cinzel-decorative text-5xl md:text-8xl lg:text-[11rem] font-black tracking-[0.1em] md:tracking-[0.15em] text-[#064e3b] gold-glow-text leading-tight select-none drop-shadow-2xl uppercase text-center">
              SAKINA REHMAN
            </h1>
            <div className="flex items-center justify-center gap-6 w-full max-w-4xl mt-4">
              <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent animate-draw-line delay-1200"></div>
              <div className="flex items-center gap-4 text-[#c5a059] opacity-70">
                <span className="text-3xl amiri-font animate-spin-slow">✥</span>
                <span className="text-2xl amiri-font">۞</span>
                <span className="text-3xl amiri-font animate-spin-slow" style={{ animationDirection: 'reverse' }}>✥</span>
              </div>
              <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-[#c5a059]/50 to-transparent animate-draw-line delay-1200"></div>
            </div>
          </div>
          <div className="mt-10">
            <div className="px-12 py-3 border-x-2 border-[#c5a059]/40 relative">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/30 to-transparent"></div>
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/30 to-transparent"></div>
               <p className="amiri-font italic text-[#3d5a45] text-lg md:text-xl uppercase tracking-[0.2em] md:tracking-[0.4em] font-black opacity-90">
                 The Sanctuary of Halal Union
               </p>
            </div>
          </div>
        </div>
        <p className="serif-heading italic text-2xl md:text-4xl text-[#3d5a45]/90 animate-fade-up delay-1200 mb-20 tracking-wide max-w-4xl mx-auto leading-relaxed">
          “Where Nikah begins with faith, dignity, and tranquility.”
        </p>
        <div className="relative group animate-fade-up delay-1800 mb-24 px-1">
          <div className="absolute inset-0 bg-[#c5a059]/10 blur-3xl rounded-full scale-90 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 bg-white/60 py-8 px-12 md:px-20 rounded-full border-2 border-[#c5a059]/20 shadow-2xl backdrop-blur-2xl animate-border-glow overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmerText_10s_infinite_linear] pointer-events-none"></div>
            <div className="flex items-center gap-4 transition-all duration-700 group-hover:scale-105">
               <span className="text-[#c5a059] text-2xl animate-spin-slow">۞</span>
               <span className="text-[#064e3b] font-black tracking-[0.2em] text-sm md:text-base uppercase shimmer-gold animate-sacred-glow sacred-text-hover cursor-default">
                 No face-to-face without mahrams
               </span>
            </div>
            <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-[#c5a059]/40 to-transparent"></div>
            <div className="flex items-center gap-4 transition-all duration-700 group-hover:scale-105">
               <span className="text-[#064e3b] font-black tracking-[0.2em] text-sm md:text-base uppercase shimmer-gold animate-sacred-glow sacred-text-hover cursor-default">
                 No compromise with Islamic boundaries
               </span>
               <span className="text-[#c5a059] text-2xl animate-spin-slow" style={{ animationDirection: 'reverse' }}>۞</span>
            </div>
          </div>
        </div>
        <div className="animate-fade-up delay-1800 flex flex-col items-center space-y-8 w-full mb-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center w-full max-w-4xl">
            <button 
              onClick={handleCreateProfile}
              className="w-full md:w-auto bg-[#064e3b] hover:bg-[#043327] text-[#fdfbf7] px-12 md:px-16 py-6 rounded-full text-xl md:text-2xl font-black tracking-tight transition-all duration-700 shadow-2xl animate-pulse-soft border border-white/20 group overflow-hidden relative active:scale-95"
            >
              <span className="relative z-10">Create Your Nikah Profile</span>
              <div className="absolute inset-0 bg-[#c5a059] translate-y-full group-hover:translate-y-0 transition-transform duration-700 opacity-20"></div>
            </button>
            
            <button 
              onClick={handleExploreMatches}
              className="w-full md:w-auto bg-white/40 hover:bg-white/80 text-[#064e3b] px-12 md:px-16 py-6 rounded-full text-xl md:text-2xl font-black tracking-tight transition-all duration-700 shadow-xl border-2 border-[#c5a059]/30 group overflow-hidden relative active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <span>Explore Matches</span>
                <span className="text-[#c5a059] text-xl transition-transform duration-500 group-hover:translate-x-2">→</span>
              </span>
              <div className="absolute inset-0 bg-[#c5a059]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[#3d5a45]/70 text-lg font-bold italic amiri-font md:text-2xl">
              Begin your journey with intention and sincerity.
            </p>
            <div className="flex items-center gap-4 bg-[#c5a059]/5 px-6 py-2 rounded-full border border-[#c5a059]/10 animate-fade-in delay-1800">
               <span className="text-[#c5a059] text-xs">۞</span>
               <p className="text-[#c5a059] text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                 Assigned Identity: {user?.uid || 'Guest'}
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Your Halal Matches Section - MUTUAL ONLY - Large CTA Style */}
      {favoritesMutual.length > 0 && (
        <section className="w-full py-24 bg-[#064e3b]/5 border-y border-[#c5a059]/10 animate-fade-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <header className="text-center mb-16">
              <h2 className="cinzel-decorative text-4xl md:text-6xl text-[#064e3b] font-black uppercase tracking-widest mb-6">Your Halal Matches</h2>
              <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mx-auto mb-8"></div>
              <p className="amiri-font italic text-2xl md:text-3xl text-[#3d5a45]/80 max-w-3xl mx-auto leading-relaxed">
                “Mutual hearts connected by faith, sincerity, and the blessing of Allah.”
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 mb-20">
              {favoritesMutual.map(p => (
                <ProfileCard 
                  key={p.id} 
                  profile={p} 
                  compatibilityScore={p.compatibility}
                  isLiked={true}
                  isMutual={true}
                  onLike={(e) => handleLike(e, p.id)}
                  onClick={() => setSelectedProfile(p)}
                  onContactMediator={handleContactMediator}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-10">
              <button 
                onClick={() => setShowChat(true)}
                className="group relative flex items-center justify-center gap-8 py-10 px-24 bg-[#064e3b] text-white rounded-full font-black uppercase tracking-[0.4em] text-xl md:text-2xl hover:bg-[#043327] transition-all shadow-[0_40px_100px_-20px_rgba(6,78,59,0.4)] overflow-hidden scale-100 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                <span className="text-4xl animate-pulse">✉</span>
                <span className="relative z-10">Contact the Mediator</span>
              </button>
              <div className="flex items-center gap-4 text-[#c5a059]/60">
                 <div className="h-px w-12 bg-current opacity-30"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Step towards a sacred union</p>
                 <div className="h-px w-12 bg-current opacity-30"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Divine Guidance - Quranic Verses Section */}
      <section className="w-full max-w-7xl px-6 py-24 border-y border-[#e8e2d6]/40 bg-white/10 animate-fade-up">
        <div className="text-center mb-16 space-y-4">
          <span className="amiri-font text-5xl text-[#c5a059] animate-sacred-glow">۞</span>
          <h2 className="serif-heading text-4xl md:text-5xl text-[#064e3b] font-black">Divine Guidance</h2>
          <div className="h-[1px] w-24 bg-[#c5a059]/30 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {VERSES.map((verse, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-md p-10 rounded-[3rem] border border-[#e8e2d6] hover:border-[#c5a059]/40 transition-all duration-700 shadow-lg group hover:-translate-y-2">
              <div className="mb-8 text-[#c5a059] opacity-40 group-hover:opacity-100 transition-opacity">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01701V14H12.017C14.2261 14 16.017 12.2091 16.017 10V7C16.017 5.89543 15.1216 5 14.017 5H11.017C8.80787 5 7.01701 6.79086 7.01701 9V12H4.01701V9C4.01701 5.13401 7.15102 2 11.017 2H14.017C16.7784 2 19.017 4.23858 19.017 7V10C19.017 13.4382 16.5165 16.2915 13.2504 16.8584C13.7335 17.2001 14.017 17.5816 14.017 18V21H14.017Z" /></svg>
              </div>
              <p className="amiri-font text-2xl md:text-3xl text-[#3d5a45] leading-relaxed italic mb-8">
                {verse.text}
              </p>
              <div className="pt-6 border-t border-[#e8e2d6] flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c5a059]">{verse.surah}</span>
                <span className="text-[#e8e2d6] text-xl">✦</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sacred Methodology - How It Works Section */}
      <section className="w-full max-w-7xl px-6 py-32 bg-white/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 text-left animate-fade-in">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#c5a059]">The Sacred Path</span>
              <h2 className="serif-heading text-5xl md:text-6xl text-[#064e3b] font-black leading-tight">Sacred Methodology</h2>
            </div>
            <p className="text-xl text-[#3d5a45]/80 leading-relaxed font-medium">
              Our platform is built upon the pillars of modesty (Haya) and sincerity (Ikhlas). 
              Learn how we facilitate noble unions while preserving the sanctity of Islamic boundaries and ensuring a safe, dignified environment for all.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-6 py-6 px-10 bg-white/75 hover:bg-white border-2 border-[#c5a059]/30 text-[#064e3b] rounded-full font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:shadow-2xl active:scale-95 text-center justify-center group"
              >
                <span className="w-10 h-10 rounded-full bg-[#064e3b]/10 text-[#064e3b] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </span>
                Read Detailed Guide
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Cute Green Banner */}
            <div className="bg-[#064e3b] text-white text-[11px] font-black uppercase tracking-[0.25em] px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 mb-2 animate-pulse-soft border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Watch the Process
            </div>

            {isPlaying ? (
              <div className="relative aspect-video w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(6,78,59,0.25)] border-[12px] border-white bg-black animate-fade-in group">
                {(() => {
                  const ytId = getYouTubeId(videoUrl);
                  if (ytId) {
                    return (
                      <iframe 
                        className="w-full h-full object-cover border-0" 
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} 
                        title="Sacred Process Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      />
                    );
                  } else {
                    const isDirect = /\.(mp4|webm|ogg|mov|quicktime)($|\?)/i.test(videoUrl);
                    if (isDirect) {
                      return (
                        <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
                      );
                    } else {
                      return (
                        <iframe 
                          className="w-full h-full object-cover border-0" 
                          src={videoUrl} 
                          title="Custom Video"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      );
                    }
                  }
                })()}
                <button 
                  onClick={() => setIsPlaying(false)} 
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center font-black transition-all z-20"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsPlaying(true)}
                className="relative aspect-video w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(6,78,59,0.25)] border-[12px] border-white group transition-transform duration-700 hover:rotate-1 cursor-pointer"
              >
                <img src="https://images.unsplash.com/photo-1518155317743-a8ff43ea6f5f?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Halal process video preview" />
                <div className="absolute inset-0 bg-[#064e3b]/20 flex items-center justify-center group-hover:bg-[#064e3b]/10 transition-all">
                  <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center animate-pulse-soft border border-white/40">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#c5a059] text-3xl shadow-2xl transition-transform group-hover:scale-110">
                      <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-8 left-10 right-10 flex items-center justify-between text-white/90">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Amanah Guidelines</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Play Video</span>
                </div>
              </div>
            )}

            {/* Editable Video URL option below the Video Container */}
            <div className="w-full flex flex-col items-center">
              {isEditingVideo ? (
                <div className="w-full bg-[#fdfbf7] p-6 rounded-3xl border border-[#c5a059]/30 shadow-md max-w-lg animate-fade-in space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#e8e2d6]">
                    <h4 className="text-sm font-bold text-[#064e3b] uppercase tracking-wider">Configure Process Video</h4>
                    <button onClick={() => { setIsEditingVideo(false); setVideoError(null); }} className="text-[#3d5a45]/50 hover:text-red-500 text-xs font-black">✕ Close</button>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[#3d5a45] uppercase tracking-widest text-left w-full">Video URL / YouTube Link</label>
                    <input 
                      type="text" 
                      value={tempVideoUrl} 
                      onChange={(e) => setTempVideoUrl(e.target.value)} 
                      placeholder="e.g. https://www.youtube.com/watch?v=..." 
                      className="w-full bg-white border border-[#e8e2d6] p-3 rounded-xl text-xs focus:ring-2 focus:ring-[#c5a059] focus:outline-none"
                    />
                    {videoError && <span className="text-[10px] font-black text-red-500 uppercase text-left block">{videoError}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if (!tempVideoUrl.trim()) {
                          setVideoError("Please provide a valid URL");
                          return;
                        }
                        setVideoError(null);
                        setIsVideoSaving(true);
                        try {
                          await setDoc(doc(db, 'settings', 'video'), {
                            url: tempVideoUrl.trim(),
                            updatedAt: Timestamp.now()
                          });
                          setVideoUrl(tempVideoUrl.trim());
                          setIsPlaying(true); // Auto play the newly configured video
                          setIsEditingVideo(false);
                        } catch (err) {
                          console.error(err);
                          setVideoError("Failed to save settings to Firestore.");
                        } finally {
                          setIsVideoSaving(false);
                        }
                      }} 
                      disabled={isVideoSaving}
                      className="flex-grow py-3 bg-[#c5a059] hover:bg-[#b08e4d] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isVideoSaving ? "Saving..." : "Save Link"}
                    </button>
                    <button 
                      onClick={() => {
                        setTempVideoUrl(videoUrl);
                        setIsEditingVideo(false);
                        setVideoError(null);
                      }} 
                      className="py-3 px-4 bg-white border border-[#e8e2d6] text-[#3d5a45] rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[9px] text-[#3d5a45]/50 italic text-center leading-relaxed">
                    Supports any standard YouTube watch link, short link, embed link, video file (.mp4, .webm, .ogg), or general webpage iframe source.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingVideo(true)}
                  className="flex items-center gap-2 py-2.5 px-5 bg-white/75 hover:bg-white border border-[#e8e2d6] text-[#c5a059] rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-md hover:border-[#c5a059]/40"
                >
                  <span>⚙️</span> Change Process Video URL
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Decorative Final Statement */}
      <section className="py-32 w-full max-w-4xl text-center px-6">
        <p className="amiri-font text-3xl italic text-[#3d5a45] mb-8 leading-relaxed">
          "The pursuit of marriage is a sacred journey, a fulfillment of half our Deen, and a path paved with tranquility for those who walk it with sincerity."
        </p>
        <div className="flex items-center justify-center gap-6">
           <div className="h-px w-16 bg-[#c5a059]/20"></div>
           <span className="text-[#c5a059] text-2xl animate-spin-slow">۞</span>
           <div className="h-px w-16 bg-[#c5a059]/20"></div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-[#c5a059]/30">
      {/* System Notice Alert Banner */}
      {systemNotice && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[90] max-w-2xl w-[calc(100%-2rem)] p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3.5 animate-fade-in ${
          systemNotice.type === 'warning'
            ? 'bg-amber-50/95 border-amber-500/30 text-amber-900 shadow-amber-500/10' 
            : systemNotice.type === 'success'
            ? 'bg-[#ecfdf5]/95 border-emerald-500/30 text-[#065f46] shadow-emerald-500/10'
            : 'bg-[#eff6ff]/95 border-blue-500/30 text-[#1e40af] shadow-blue-500/10'
        }`}>
          <div className="text-xl shrink-0 mt-0.5">
            {systemNotice.type === 'warning' ? '⚠️' : systemNotice.type === 'success' ? '✅' : 'ℹ️'}
          </div>
          <div className="flex-grow space-y-1">
            <p className="text-xs font-semibold leading-relaxed">{systemNotice.text}</p>
            {systemNotice.type === 'warning' && (
              <p className="text-[10px] opacity-80 leading-normal font-medium">
                To activate permanent database persistence, please enable the <strong>Anonymous</strong> sign-in provider in your Firebase project console under <em>Authentication &gt; Sign-in method</em>.
              </p>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setSystemNotice(null)} 
            className="text-[10px] font-black select-none opacity-60 hover:opacity-100 shrink-0 uppercase tracking-widest px-2 py-1 hover:bg-black/5 rounded-lg transition-all"
          >
            Dismiss
          </button>
        </div>
      )}

      <header className="fixed top-0 left-0 w-full z-50 p-4 md:p-8 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto bg-white/70 backdrop-blur-xl px-6 md:px-8 py-2 md:py-3 rounded-full border border-[#c5a059]/20 shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setView('landing')}>
          <span className="cinzel-decorative font-black text-sm md:text-xl text-[#064e3b] tracking-[0.1em] uppercase">Sakina Rehman</span>
        </div>
        {(view === 'browse' || view === 'favorites' || view === 'register') && (
          <div className="pointer-events-auto flex gap-4 md:gap-6">
             <button 
              onClick={() => setView('browse')}
              className={`p-4 md:p-5 rounded-full border shadow-xl transition-all active:scale-95 flex items-center gap-3 ${view === 'browse' ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white/90 text-[#3d5a45] border-[#c5a059]/30'}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span className="hidden md:inline font-black uppercase text-[12px] tracking-[0.2em]">Browse</span>
            </button>
            <button 
              onClick={() => setView('favorites')}
              className={`p-4 md:p-5 rounded-full border shadow-xl transition-all active:scale-95 flex items-center gap-3 ${view === 'favorites' ? 'bg-[#c5a059] text-white border-[#c5a059]' : 'bg-white/90 text-[#3d5a45] border-[#c5a059]/30'}`}
            >
              <div className="relative">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {likedProfileIds.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-md border border-white/20">{likedProfileIds.length}</span>}
              </div>
              <span className="hidden md:inline font-black uppercase text-[12px] tracking-[0.2em]">Favorites</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {view === 'landing' && renderLanding()}
        {view === 'register' && (
          <div className="pt-24 md:pt-40 pb-32 px-6 max-w-7xl mx-auto w-full">
            <ProfileForm onComplete={handleRegistrationComplete} />
          </div>
        )}
        {view === 'browse' && (
          <div className="pt-32 md:pt-40 pb-32 px-6 max-w-[90rem] mx-auto w-full">
            <FilterSection />
            <div className="mb-10 flex items-center gap-4">
              <span className="h-px flex-grow bg-[#e8e2d6]"></span>
              <h2 className="serif-heading italic text-2xl text-[#064e3b]">Potential Nikah Matches</h2>
              <span className="h-px flex-grow bg-[#e8e2d6]"></span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
              {sortedAllProfiles.map(p => (
                <ProfileCard 
                  key={p.id} 
                  profile={p} 
                  compatibilityScore={p.compatibility}
                  isLiked={likedProfileIds.includes(p.id)}
                  onLike={(e) => handleLike(e, p.id)}
                  onClick={() => setSelectedProfile(p)} 
                />
              ))}
            </div>
          </div>
        )}
        {view === 'favorites' && (
          <div className="pt-32 md:pt-40 pb-32 px-6 max-w-[90rem] mx-auto w-full animate-fade-in">
            <header className="text-center mb-16">
              <span className="amiri-font text-6xl text-[#c5a059] block mb-6 animate-sacred-glow">۞</span>
              <h1 className="cinzel-font text-4xl md:text-6xl text-[#064e3b] font-black uppercase tracking-widest mb-4">Your Favorites</h1>
              <p className="amiri-font italic text-[#3d5a45]/60 text-2xl max-w-2xl mx-auto">“Two hearts that beat in unison for the sake of Allah find their way to eternal peace.”</p>
              <div className="mt-12 flex justify-center">
                 <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#c5a059]/40 to-transparent"></div>
              </div>
            </header>

            {/* Mutual Likes Section */}
            <section className="mb-24">
              <div className="flex flex-col items-center gap-4 mb-12">
                <div className="flex items-center w-full gap-6">
                   <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent to-[#c5a059]/40"></div>
                   <h3 className="cinzel-font text-3xl md:text-4xl text-[#c5a059] font-black uppercase tracking-wider text-center">Sacred Unions</h3>
                   <div className="h-[2px] flex-grow bg-gradient-to-l from-transparent to-[#c5a059]/40"></div>
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#c5a059]/60">Profiles where interest is mutual</p>
              </div>
              
              {favoritesMutual.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 animate-fade-up">
                  {favoritesMutual.map(p => (
                    <ProfileCard 
                      key={p.id} 
                      profile={p} 
                      compatibilityScore={p.compatibility}
                      isLiked={true}
                      isMutual={true}
                      onLike={(e) => handleLike(e, p.id)}
                      onClick={() => setSelectedProfile(p)}
                      onContactMediator={handleContactMediator}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center bg-[#fdfbf7] rounded-[3rem] border-2 border-dashed border-[#e8e2d6] shadow-inner">
                  <div className="text-4xl opacity-20 mb-4">🤝</div>
                  <p className="amiri-font text-2xl text-[#3d5a45]/40 italic">Mutual connections will appear here once interest is returned.</p>
                </div>
              )}
            </section>

            {/* Only Liked Section */}
            <section className="mb-24">
              <div className="flex flex-col items-center gap-4 mb-12">
                <div className="flex items-center w-full gap-6">
                   <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-[#3d5a45]/20"></div>
                   <h3 className="serif-heading text-2xl md:text-3xl text-[#3d5a45]/70 font-bold uppercase tracking-widest text-center">Awaiting Sincerity</h3>
                   <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-[#3d5a45]/20"></div>
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#3d5a45]/40">Profiles you have expressed interest in</p>
              </div>

              {favoritesSent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 opacity-85 animate-fade-up">
                  {favoritesSent.map(p => (
                    <ProfileCard 
                      key={p.id} 
                      profile={p} 
                      compatibilityScore={p.compatibility}
                      isLiked={true}
                      onLike={(e) => handleLike(e, p.id)}
                      onClick={() => setSelectedProfile(p)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-[#e8e2d6] transition-all">
                  <p className="amiri-font text-2xl text-[#3d5a45]/40 italic">You have not expressed interest in any profiles yet.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedProfile && (
        <ProfileDetails 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
          isLiked={likedProfileIds.includes(selectedProfile.id)}
          isMutual={mutualLikeIds.includes(selectedProfile.id)}
          onLike={(e) => handleLike(e, selectedProfile.id)}
        />
      )}

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}

      {showChat && (
        <MediatorChat onClose={() => setShowChat(false)} userUid={user?.uid || 'Guest'} />
      )}

      {/* Footer */}
      <footer className="w-full py-24 md:py-32 border-t border-[#e8e2d6]/60 text-center opacity-80 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[#3d5a45] mb-10">
            © All Rights Reserved — Sakina Rehman
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-14 text-[12px] md:text-[14px] text-[#c5a059] font-black uppercase tracking-[0.3em]">
            <span>Sincerity</span>
            <span className="hidden md:block w-3 h-3 bg-[#c5a059] rounded-full opacity-20"></span>
            <span>Tranquility</span>
            <span className="hidden md:block w-3 h-3 bg-[#c5a059] rounded-full opacity-20"></span>
            <span>Deen</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;