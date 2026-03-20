import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { supabase } from '../lib/supabase';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User, Profile, SUPER_USER_EMAILS } from '../types';

interface AuthContextType {
  currentUser: User | null;
  selectedProfile: Profile | null;
  isImpersonating: boolean;
  isAuthReady: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  selectProfile: (profile: Profile) => void;
  impersonateUser: (user: User) => void;
  stopImpersonating: () => void;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useLocalStorage<Profile | null>('auth:profile', null);
  const [originalUser, setOriginalUser] = useLocalStorage<User | null>('auth:originalUser', null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isImpersonating = !!originalUser;

  useEffect(() => {
    if (currentUser && selectedProfile && !currentUser.profiles.includes(selectedProfile)) {
      console.log('Selected profile no longer valid for user, clearing:', selectedProfile);
      setSelectedProfile(null);
    }
  }, [currentUser, selectedProfile, setSelectedProfile]);

  useEffect(() => {
    // Firebase Auth Listener (Keep for backward compatibility)
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser: any) => {
      console.log('Firebase Auth state changed:', firebaseUser?.email);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          }
        } catch (err) {
          console.error('Firebase sync error:', err);
        }
      }
    });

    // Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event);
      if (session?.user) {
        const userEmail = session.user.email;
        if (userEmail) {
          // Map Supabase user to our User type
          const newUser: User = {
            id: session.user.id,
            email: userEmail,
            name: session.user.user_metadata.full_name || userEmail.split('@')[0],
            profiles: SUPER_USER_EMAILS.includes(userEmail) 
              ? [Profile.CREATOR, Profile.ADMIN, Profile.TEACHER, Profile.ALMACEN, Profile.STUDENT] 
              : [Profile.STUDENT],
            activityStatus: 'Activo',
            locationStatus: 'En el centro',
            avatar: session.user.user_metadata.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`
          };
          setCurrentUser(newUser);
          setIsAuthReady(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setSelectedProfile(null);
        setIsAuthReady(true);
      } else if (event === 'INITIAL_SESSION') {
        if (!session) setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      if (!password) return false;
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password?: string): Promise<boolean> => {
    try {
      if (!password) return false;
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('AuthContext - Starting Google Login (Supabase)');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Supabase login error details:', error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    await supabase.auth.signOut();
    setSelectedProfile(null);
    setOriginalUser(null);
    navigate('/login');
  };

  const selectProfile = (profile: Profile) => {
    console.log('AuthContext - selectProfile:', profile, 'currentUser:', currentUser?.email);
    if (currentUser && currentUser.profiles.includes(profile)) {
      setSelectedProfile(profile);
      
      const currentPath = location.pathname;
      const isProfilePage = currentPath.endsWith('/profile');

      if (isProfilePage) {
        navigate(`/${profile}/profile`);
      } else {
        navigate(`/${profile}/dashboard`);
      }
    }
  };

  const impersonateUser = (user: User) => {
    if (currentUser) {
      setOriginalUser(currentUser);
      setCurrentUser(user);
      if (user.profiles.length > 0) {
        const newProfile = user.profiles[0];
        setSelectedProfile(newProfile);
        navigate(`/${newProfile}/dashboard`);
      } else {
        logout();
      }
    }
  };

  const stopImpersonating = () => {
    if (originalUser) {
      const newProfile = originalUser.profiles[0];
      setCurrentUser(originalUser);
      setSelectedProfile(newProfile);
      setOriginalUser(null);
      navigate(`/${newProfile}/dashboard`);
    }
  };
  
  const updateCurrentUser = async (userData: Partial<User>) => {
    if(currentUser) {
        const updatedUser = {...currentUser, ...userData};
        
        // Update Supabase
        const { error } = await supabase.from('users').upsert(updatedUser);
        if (error) console.error('Error updating user in Supabase:', error);
        
        // Keep Firebase sync for now if needed
        try {
          await setDoc(doc(db, 'users', currentUser.id), updatedUser, { merge: true });
        } catch (e) {
          console.warn('Firebase sync failed (expected if domain not authorized):', e);
        }

        setCurrentUser(updatedUser);
        if(isImpersonating && originalUser?.id === currentUser.id) {
            setOriginalUser(updatedUser);
        }
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      selectedProfile,
      isImpersonating,
      isAuthReady,
      login,
      signUp,
      loginWithGoogle,
      logout,
      selectProfile,
      impersonateUser,
      stopImpersonating,
      updateCurrentUser,
    }),
    [currentUser, selectedProfile, isImpersonating, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};