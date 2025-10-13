import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Flame, Database, Cloud } from 'lucide-react';

// Import components - Original MongoDB version
import LoginScreen from '@/components/LoginScreen';
import ChildDashboard from '@/components/ChildDashboard';
import ParentDashboard from '@/components/ParentDashboard';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Import Modern Design components
import ModernLoginScreen from '@/components/ModernLoginScreen';
import ModernChildDashboard from '@/components/ModernChildDashboard';

// Import Firebase version
import FirebaseApp from '@/components/FirebaseApp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-nunito text-gray-600">Carregando MissionKids...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user.role === 'child' ? 
            <ChildDashboard /> : 
            <ParentDashboard />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function VersionSelector() {
  const [selectedVersion, setSelectedVersion] = useState(null);

  if (selectedVersion === 'firebase') {
    return <FirebaseApp />;
  }

  if (selectedVersion === 'mongodb') {
    return (
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  color: '#374151',
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Main Card Container */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-nunito text-gray-800 mb-2">
              Mission<span className="text-blue-600">Kids</span>
            </h1>
            
            {/* Character Illustrations */}
            <div className="grid grid-cols-2 gap-4 my-8">
              {/* Child Character */}
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
                <div className="text-6xl mb-2">👦</div>
                <p className="text-sm font-semibold text-gray-700">Criança</p>
              </div>
              
              {/* Parent Character */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-6 text-center">
                <div className="text-6xl mb-2">👨‍👩‍👧</div>
                <p className="text-sm font-semibold text-gray-700">Pais</p>
              </div>
            </div>
            
            {/* Enter Button */}
            <Button 
              onClick={() => setSelectedVersion('mongodb')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 mb-6"
            >
              Entrar
            </Button>
            
            {/* User Profile Preview */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">👤</span>
              </div>
              <span className="font-medium">Carrana</span>
            </div>
          </div>
        </div>
        
        {/* Version Selection Cards - Compact */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur border-0"
            onClick={() => setSelectedVersion('firebase')}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">Firebase Edition</span>
                <Badge className="bg-orange-100 text-orange-600 text-xs">Novo</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/80 font-nunito">
            🎯 Gestor familiar gamificado
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return <VersionSelector />;
}

export default App;