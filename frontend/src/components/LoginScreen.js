import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Star, Users, Trophy } from 'lucide-react';
import PasswordReset from './PasswordReset';
import PinReset from './PinReset';

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPinReset, setShowPinReset] = useState(false);

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

  const [userType, setUserType] = useState('parent');

  // If password reset is shown, render it
  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  // If PIN reset is shown, render it
  if (showPinReset) {
    return <PinReset onBack={() => setShowPinReset(false)} />;
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-in">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold font-nunito text-gray-800 mb-2">
            Mission<span className="text-indigo-600">Kids</span>
          </h1>
          <p className="text-gray-600 font-nunito">
            Cumprir tarefas virou uma missão divertida! 🎯
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-nunito text-gray-800">
              Bem-vindo de volta!
            </CardTitle>
            <CardDescription>
              Entre para continuar sua aventura
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-nunito">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="font-nunito">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* User Type Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      type="button"
                      variant={userType === 'parent' ? 'default' : 'outline'}
                      onClick={() => setUserType('parent')}
                      className="h-12 font-nunito"
                      data-testid="parent-login-btn"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Pais
                    </Button>
                    <Button
                      type="button"
                      variant={userType === 'child' ? 'default' : 'outline'}
                      onClick={() => setUserType('child')}
                      className="h-12 font-nunito"
                      data-testid="child-login-btn"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Crianças
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="login-email-input"
                    />
                  </div>

                  {userType === 'parent' ? (
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Sua senha"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="pin">PIN (4 dígitos)</Label>
                      <Input
                        id="pin"
                        type="password"
                        placeholder="0000"
                        maxLength={4}
                        value={loginForm.pin}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, pin: e.target.value }))}
                        required
                        data-testid="login-pin-input"
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-nunito bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                    data-testid="login-submit-btn"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  {/* Forgot Password Link - Only for parents */}
                  {userType === 'parent' && (
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors font-nunito"
                        data-testid="forgot-password-link"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nome</Label>
                    <Input
                      id="reg-name"
                      placeholder="Seu nome"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="register-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="register-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Crie uma senha"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      data-testid="register-password-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={registerForm.role === 'parent' ? 'default' : 'outline'}
                        onClick={() => setRegisterForm(prev => ({ ...prev, role: 'parent' }))}
                        className="h-10 font-nunito"
                        data-testid="register-parent-btn"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Pai/Mãe
                      </Button>
                      <Button
                        type="button"
                        variant={registerForm.role === 'child' ? 'default' : 'outline'}
                        onClick={() => setRegisterForm(prev => ({ ...prev, role: 'child' }))}
                        className="h-10 font-nunito"
                        data-testid="register-child-btn"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Criança
                      </Button>
                    </div>
                  </div>

                  {registerForm.role === 'child' && (
                    <div className="space-y-2">
                      <Label htmlFor="reg-pin">PIN (4 dígitos)</Label>
                      <Input
                        id="reg-pin"
                        type="password"
                        placeholder="0000"
                        maxLength={4}
                        value={registerForm.pin}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, pin: e.target.value }))}
                        required
                        data-testid="register-pin-input"
                      />
                    </div>
                  )}

                  {registerForm.role === 'parent' && (
                    <div className="space-y-2">
                      <Label htmlFor="allowance">Meta de Mesada (R$)</Label>
                      <Input
                        id="allowance"
                        type="number"
                        placeholder="50"
                        min="1"
                        value={registerForm.allowance_goal}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, allowance_goal: e.target.value }))}
                        data-testid="register-allowance-input"
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-nunito bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features showcase */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs font-nunito text-gray-600">Ganhe XP</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-xs font-nunito text-gray-600">Missões</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
            <Shield className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-nunito text-gray-600">Mesada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;