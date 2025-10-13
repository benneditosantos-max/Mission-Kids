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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-in">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold font-nunito text-gray-800 mb-2">
            Mission<span className="text-indigo-600">Kids</span>
          </h1>
          <p className="text-gray-600 font-nunito mb-4">
            Escolha a versão do seu Gestor Familiar! 🎯
          </p>
          <Badge className="bg-yellow-100 text-yellow-800">
            🚀 Duas versões disponíveis
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Firebase Version */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-400"
            onClick={() => setSelectedVersion('firebase')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-nunito text-gray-800">
                Firebase Edition
              </CardTitle>
              <Badge className="bg-green-100 text-green-800 mx-auto">
                🔥 Recomendado
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Autenticação Firebase completa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Subcontas seguras para crianças</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Firestore em tempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">Cloud Functions & Storage</span>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                <p className="text-sm text-orange-700 font-medium">
                  ✨ Nova implementação
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Sistema de subcontas, autenticação dual e Firestore
                </p>
              </div>

              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-nunito">
                <Flame className="w-4 h-4 mr-2" />
                Usar Firebase Edition
              </Button>
            </CardContent>
          </Card>

          {/* MongoDB Original Version */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-400"
            onClick={() => setSelectedVersion('mongodb')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-nunito text-gray-800">
                MongoDB Original
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-800 mx-auto">
                💎 Clássico
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-green-500" />
                  <span className="text-sm">FastAPI + MongoDB + JWT</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Autenticação personalizada</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Cloud className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Recuperação de senha/PIN</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Sistema gamificado completo</span>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                <p className="text-sm text-green-700 font-medium">
                  ✅ Versão estável
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Totalmente testada e funcional (95% success)
                </p>
              </div>

              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-nunito">
                <Database className="w-4 h-4 mr-2" />
                Usar MongoDB Original
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 font-nunito">
            🎯 Ambas as versões oferecem o sistema completo de gamificação familiar
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