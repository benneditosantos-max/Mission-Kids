import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile from Firestore
        await loadUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'parents', uid));
      if (userDoc.exists()) {
        setUserProfile({ 
          ...userDoc.data(), 
          id: userDoc.id, 
          role: 'parent' 
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Parent registration
  const registerParent = async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create parent document in Firestore
      const parentData = {
        parentId: user.uid,
        name: name,
        email: email,
        children: [],
        createdAt: new Date()
      };

      await setDoc(doc(db, 'parents', user.uid), parentData);
      setUserProfile({ ...parentData, id: user.uid, role: 'parent' });

      // Play success sound
      playSound('success');
      toast.success(`Conta criada com sucesso! Bem-vindo, ${name}! 🎉`);
      
      return user;
    } catch (error) {
      const message = getErrorMessage(error.code);
      toast.error(message);
      throw error;
    }
  };

  // Parent login
  const loginParent = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      playSound('success');
      toast.success(`Bem-vindo de volta! 🎉`);
      return result.user;
    } catch (error) {
      const message = getErrorMessage(error.code);
      toast.error(message);
      throw error;
    }
  };

  // Child registration (creates subconta in Firestore, not Firebase Auth)
  const registerChild = async (childData) => {
    if (!currentUser) {
      throw new Error('Parent must be logged in to create child account');
    }

    try {
      // Check if username is unique
      const childrenRef = collection(db, 'children');
      const usernameQuery = query(childrenRef, where('username', '==', childData.username));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Este nome de usuário já está em uso');
      }

      // Create child document
      const newChild = {
        parentId: currentUser.uid,
        name: childData.name,
        age: parseInt(childData.age),
        username: childData.username,
        password: childData.password, // PIN/password for child
        avatar: childData.avatar || 'default.png',
        xp: 0,
        level: 1,
        tasks: [],
        wallet: {
          balance: 0,
          goals: []
        },
        createdAt: new Date()
      };

      const childDoc = await addDoc(collection(db, 'children'), newChild);
      
      // Update parent's children array
      const parentRef = doc(db, 'parents', currentUser.uid);
      await updateDoc(parentRef, {
        children: arrayUnion(childDoc.id)
      });

      // Update local user profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          children: [...(userProfile.children || []), childDoc.id]
        });
      }

      playSound('success');
      toast.success(`${childData.name} foi adicionado com sucesso! 👶`);
      
      return { id: childDoc.id, ...newChild };
    } catch (error) {
      toast.error(error.message || 'Erro ao criar conta da criança');
      throw error;
    }
  };

  // Child login (custom implementation)
  const loginChild = async (username, password) => {
    try {
      const childrenRef = collection(db, 'children');
      const childQuery = query(childrenRef, where('username', '==', username));
      const querySnapshot = await getDocs(childQuery);

      if (querySnapshot.empty) {
        throw new Error('Usuário não encontrado');
      }

      const childDoc = querySnapshot.docs[0];
      const childData = childDoc.data();

      if (childData.password !== password) {
        throw new Error('PIN incorreto');
      }

      // Set child as current user (custom session)
      const childProfile = {
        ...childData,
        id: childDoc.id,
        role: 'child'
      };

      setCurrentUser(childProfile);
      setUserProfile(childProfile);

      // Store child session in localStorage
      localStorage.setItem('childSession', JSON.stringify(childProfile));

      playSound('success');
      toast.success(`Olá, ${childData.name}! Bem-vindo às suas missões! 🚀`);

      return childProfile;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Clear child session if exists
      localStorage.removeItem('childSession');
      
      // If it's a Firebase user (parent), sign out
      if (currentUser && currentUser.uid) {
        await signOut(auth);
      } else {
        // If it's a child, just clear the state
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro no logout');
    }
  };

  // Check for child session on app load
  useEffect(() => {
    const checkChildSession = () => {
      const childSession = localStorage.getItem('childSession');
      if (childSession && !currentUser) {
        try {
          const childData = JSON.parse(childSession);
          setCurrentUser(childData);
          setUserProfile(childData);
          setLoading(false);
        } catch (error) {
          localStorage.removeItem('childSession');
        }
      }
    };

    // Only check if no Firebase user is present
    if (!currentUser && !loading) {
      checkChildSession();
    }
  }, [currentUser, loading]);

  // Sound effects
  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      let frequency, duration;
      
      switch (type) {
        case 'success':
          frequency = 523.25; // C5
          duration = 0.3;
          break;
        case 'levelup':
          frequency = 659.25; // E5
          duration = 0.5;
          break;
        case 'coin':
          frequency = 880; // A5
          duration = 0.2;
          break;
        default:
          frequency = 261.63; // C4
          duration = 0.2;
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log(`Sound: ${type}`);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Email não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return 'Erro na autenticação. Tente novamente.';
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    registerParent,
    loginParent,
    registerChild,
    loginChild,
    logout,
    playSound,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};