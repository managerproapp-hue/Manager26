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
  login: (email: string, password?: string) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  signUp: (email: string, password?: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  recoverMasterAccount: (email: string, phone: string) => Promise<{ success: boolean; message: string }>;
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

  const login = async (email: string, password?: string): Promise<{ success: boolean; mustChangePassword?: boolean }> => {
    try {
      if (!password) return { success: false };
      
      // Master user fallback for initial setup
      if (email === 'managerproapp@gmail.com' && password === 'Proteinas@123') {
        console.log('Master user login detected');
      }

      // Try Supabase first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If it's the master user and Supabase login fails (e.g. user not created yet),
        // we can't really "force" a session without a real auth provider.
        // But we can at least provide a clear error or a way to create it.
        throw error;
      }
      
      // Check if user exists in our 'users' table and if they must change password
      const { data: userData } = await supabase
        .from('users')
        .select('mustChangePassword')
        .eq('id', data.user?.id)
        .single();

      return { 
        success: true, 
        mustChangePassword: userData?.mustChangePassword || false 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  };

  const recoverMasterAccount = async (email: string, phone: string): Promise<{ success: boolean; message: string }> => {
    if (email === 'managerproapp@gmail.com' && phone === '619267431') {
      // In a real app, this would trigger an email. 
      // Here we simulate it or provide a way to reset.
      return { 
        success: true, 
        message: 'Se ha enviado una nueva contraseña a tu correo. (Simulado: Usa Proteinas@123 para entrar ahora)' 
      };
    }
    return { success: false, message: 'Datos de recuperación incorrectos.' };
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (!currentUser) return false;

      // Update Supabase Auth password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authError) throw authError;

      // Update our user record
      await updateCurrentUser({ mustChangePassword: false });
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password?: string): Promise<boolean> => {
    try {
      if (!password) return false;
      
      // Sign up in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Also create in Firebase for sync if needed
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.warn('Firebase signup sync failed:', e);
      }

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
          redirectTo: 'https://ais-dev-e2mvrmbrwt3dsxzy4pcfvg-647454433844.europe-west2.run.app/login'
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
      changePassword,
      recoverMasterAccount,
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