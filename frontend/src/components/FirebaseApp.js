import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/FirebaseAuthContext';
import { Toaster } from '@/components/ui/sonner';
import FirebaseLoginScreen from '@/components/FirebaseLoginScreen';
import FirebaseParentDashboard from '@/components/FirebaseParentDashboard';
import FirebaseChildDashboard from '@/components/FirebaseChildDashboard';

function AppContent() {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-nunito text-gray-600">Carregando MissionKids...</p>
          <p className="text-sm text-gray-500 mt-2">🔥 Firebase Edition</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <FirebaseLoginScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          userProfile.role === 'child' ? 
            <FirebaseChildDashboard /> : 
            <FirebaseParentDashboard />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function FirebaseApp() {
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

export default FirebaseApp;