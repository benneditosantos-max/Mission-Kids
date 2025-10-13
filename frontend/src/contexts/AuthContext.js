import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
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
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      axios.get('/users/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      // Play success sound
      playSound('success');
      
      toast.success(`Bem-vindo${userData.role === 'child' ? 'a' : ''}, ${userData.name}! 🎉`);
      
      return userData;
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro no login';
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      setUser(newUser);
      
      toast.success(`Conta criada com sucesso! Bem-vindo, ${newUser.name}! 🎉`);
      
      return newUser;
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro no cadastro';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logout realizado com sucesso!');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  // Sound effects using Web Audio API
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
        case 'complete':
          frequency = 440; // A4
          duration = 0.4;
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
      // Fallback for browsers that don't support Web Audio API
      console.log(`Sound: ${type}`);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    playSound
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};