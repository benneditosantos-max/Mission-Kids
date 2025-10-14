import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Star, Users, Trophy } from 'lucide-react';
import ForgotPassword from '@/components/ForgotPassword';

const ModernLoginScreen = () => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('parent');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    pin: ''
  });

  // Register form state  
  const [registerForm, setRegisterForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'parent',
    pin: '',
    allowance_goal: 50
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login({
        email: loginForm.email,
        password: userType === 'parent' ? loginForm.password : undefined,
        pin: userType === 'child' ? loginForm.pin : undefined
      });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register({
        ...registerForm,
        allowance_goal: parseFloat(registerForm.allowance_goal)
      });
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show forgot password screen if requested
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-white px-8 pt-8 pb-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-nunito text-gray-800 mb-2">
                Mission<span className="text-blue-600">Kids</span>
              </h1>
            </div>

            {/* Character Selection */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* Child Character */}
              <div 
                className={`bg-gradient-to-br ${userType === 'child' ? 'from-yellow-200 to-orange-200 ring-2 ring-orange-400' : 'from-yellow-100 to-orange-100'} rounded-2xl p-4 text-center cursor-pointer transition-all duration-300`}
                onClick={() => setUserType('child')}
              >
                <div className="text-4xl mb-2">👦</div>
                <p className="text-xs font-semibold text-gray-700">Criança</p>
              </div>
              
              {/* Parent Character */}
              <div 
                className={`bg-gradient-to-br ${userType === 'parent' ? 'from-blue-200 to-purple-200 ring-2 ring-blue-400' : 'from-blue-100 to-purple-100'} rounded-2xl p-4 text-center cursor-pointer transition-all duration-300`}
                onClick={() => setUserType('parent')}
              >
                <div className="text-4xl mb-2">👨‍👩‍👧</div>
                <p className="text-xs font-semibold text-gray-700">Pais</p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger value="login" className="font-nunito rounded-xl">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="font-nunito rounded-xl">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {userType === 'parent' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="rounded-xl border-gray-200 h-12"
                          data-testid="login-email-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Sua senha"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="rounded-xl border-gray-200 h-12"
                          data-testid="login-password-input"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="rounded-xl border-gray-200 h-12"
                          data-testid="login-email-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pin" className="text-sm font-medium text-gray-700">PIN (4 dígitos)</Label>
                        <Input
                          id="pin"
                          type="password"
                          placeholder="0000"
                          maxLength={4}
                          value={loginForm.pin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setLoginForm(prev => ({ ...prev, pin: value }));
                          }}
                          required
                          className="rounded-xl border-gray-200 h-12 text-center text-2xl tracking-widest font-mono"
                          data-testid="login-pin-input"
                        />
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className={`w-full h-12 font-nunito rounded-2xl text-white font-bold shadow-lg transition-all duration-200 hover:scale-105 ${
                      userType === 'parent' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                    disabled={isLoading}
                    data-testid="login-submit-btn"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  {/* Forgot Password Link - Only for parents */}
                  {userType === 'parent' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700 font-medium">
                    👨‍👩‍👧 Apenas pais podem se cadastrar
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Contas das crianças são criadas pelos pais
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-sm font-medium text-gray-700">Nome Completo</Label>
                    <Input
                      id="reg-name"
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="rounded-xl border-gray-200 h-12"
                      data-testid="register-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="rounded-xl border-gray-200 h-12"
                      data-testid="register-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                      className="rounded-xl border-gray-200 h-12"
                      data-testid="register-password-input"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-nunito bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg transition-all duration-200 hover:scale-105"
                    disabled={isLoading}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Features showcase - More compact */}
        <div className="mt-4 grid grid-cols-3 gap-2 px-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
            <Trophy className="w-4 h-4 text-yellow-300 mx-auto mb-1" />
            <p className="text-xs font-nunito text-white">XP</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
            <Star className="w-4 h-4 text-white mx-auto mb-1" />
            <p className="text-xs font-nunito text-white">Missões</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
            <Shield className="w-4 h-4 text-blue-300 mx-auto mb-1" />
            <p className="text-xs font-nunito text-white">Mesada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernLoginScreen;