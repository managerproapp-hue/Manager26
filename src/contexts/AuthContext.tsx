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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      console.log('Auth state changed:', firebaseUser?.email);
      try {
        if (firebaseUser) {
          // Sync with Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            console.log('User found in Firestore:', userData.email);
            
            // Ensure super users have all profiles
            if (userData.email && SUPER_USER_EMAILS.includes(userData.email)) {
              const allProfiles = [Profile.CREATOR, Profile.ADMIN, Profile.TEACHER, Profile.ALMACEN, Profile.STUDENT];
              if (!userData.profiles || userData.profiles.length !== allProfiles.length) {
                console.log('Updating super user profiles in Firestore...');
                userData = { ...userData, profiles: allProfiles };
                await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });
              }
            }
            
            setCurrentUser(userData);
          } else {
            console.log('User not found in Firestore, creating new user...');
            // Create new user if it doesn't exist (e.g. first time Google login)
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Nuevo Usuario',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
              profiles: (firebaseUser.email && SUPER_USER_EMAILS.includes(firebaseUser.email)) ? [Profile.CREATOR, Profile.ADMIN, Profile.TEACHER, Profile.ALMACEN, Profile.STUDENT] : [Profile.STUDENT],
              activityStatus: 'Activo',
              locationStatus: 'En el centro',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setCurrentUser(newUser);
          }
        } else {
          console.log('No firebase user found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
        setCurrentUser(null);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
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
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setSelectedProfile(null);
    setOriginalUser(null);
    navigate('/login');
  };

  const selectProfile = (profile: Profile) => {
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
        await setDoc(doc(db, 'users', currentUser.id), updatedUser, { merge: true });
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