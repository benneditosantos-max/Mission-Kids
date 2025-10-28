import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('missionkids_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('missionkids_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('missionkids_user', JSON.stringify(user));
      playSound('success');
      toast.success(`Bem-vindo${user.role === 'child' ? '(a)' : ''}, ${user.name}! 🎉`);
    } else {
      localStorage.removeItem('missionkids_user');
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('missionkids_user');
    playSound('logout');
    toast.info('Até logo! 👋');
  };

  const playSound = (soundType) => {
    try {
      const audio = new Audio();
      if (soundType === 'success') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGe57OeeSwwPUKzn8bllHQU2jdXyzncmBCh+zPDajj4JFF61';
      } else if (soundType === 'logout') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGe57OeeSwwPUKzn8bllHQU2jdXyzncmBCh+zPDajj4JFF61';
      } else {
        return;
      }
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    loading,
    setUser,
    logout,
    playSound,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};