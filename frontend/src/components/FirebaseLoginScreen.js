import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Shield, Star, Users, Trophy } from 'lucide-react';

const FirebaseLoginScreen = () => {
  const { loginParent, registerParent, loginChild } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('parent');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    username: '',
    childPassword: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });

  const handleParentLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginParent(loginForm.email, loginForm.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginChild(loginForm.username, loginForm.childPassword);
    } catch (error) {
      console.error('Child login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      return; // Error handling in UI
    }

    setIsLoading(true);
    
    try {
      await registerParent(registerForm.email, registerForm.password, registerForm.name);
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
          <Badge className="mt-2 bg-green-100 text-green-800">
            🔥 Powered by Firebase
          </Badge>
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

                {userType === 'parent' ? (
                  <form onSubmit={handleParentLogin} className="space-y-4">
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

                    <Button 
                      type="submit" 
                      className="w-full h-12 font-nunito bg-indigo-600 hover:bg-indigo-700"
                      disabled={isLoading}
                      data-testid="login-submit-btn"
                    >
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleChildLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <Input
                        id="username"
                        placeholder="joao13"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                        data-testid="child-username-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="childPassword">PIN (4 dígitos)</Label>
                      <Input
                        id="childPassword"
                        type="password"
                        placeholder="1234"
                        maxLength={4}
                        value={loginForm.childPassword}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setLoginForm(prev => ({ ...prev, childPassword: value }));
                        }}
                        required
                        data-testid="child-password-input"
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 font-nunito bg-purple-600 hover:bg-purple-700"
                      disabled={isLoading}
                      data-testid="child-login-submit-btn"
                    >
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="register">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700 font-medium">
                    👨‍👩‍👧 Apenas pais podem se cadastrar aqui
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Contas das crianças serão criadas pelos pais no painel administrativo
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nome Completo</Label>
                    <Input
                      id="reg-name"
                      placeholder="Seu nome completo"
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
                      placeholder="Mínimo 6 caracteres"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                      data-testid="register-password-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm-password">Confirmar Senha</Label>
                    <Input
                      id="reg-confirm-password"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      data-testid="register-confirm-password-input"
                    />
                    {registerForm.password && registerForm.confirmPassword && 
                     registerForm.password !== registerForm.confirmPassword && (
                      <p className="text-xs text-red-500">As senhas não conferem</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-nunito bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading || registerForm.password !== registerForm.confirmPassword}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
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

export default FirebaseLoginScreen;