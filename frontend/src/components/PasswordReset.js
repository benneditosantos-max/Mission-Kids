import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, KeyRound, User, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PasswordReset = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Name verification, 2: New password
  const [resetForm, setResetForm] = useState({
    email: '',
    name: '',
    new_password: '',
    confirm_password: ''
  });

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!resetForm.email || !resetForm.name) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      // First, verify if user exists and name matches
      const response = await axios.post('/auth/reset-password', {
        email: resetForm.email,
        name: resetForm.name,
        new_password: 'temp_password_for_verification'
      });
      
      // If we reach here without error, proceed to step 2
      setStep(2);
      toast.success('Verificação bem-sucedida! Agora defina uma nova senha.');
      
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Email não encontrado no sistema');
      } else if (error.response?.status === 400) {
        toast.error('Nome não confere com o email informado');
      } else {
        toast.error('Erro na verificação. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetForm.new_password || !resetForm.confirm_password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (resetForm.new_password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (resetForm.new_password !== resetForm.confirm_password) {
      toast.error('As senhas não conferem');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/auth/reset-password', {
        email: resetForm.email,
        name: resetForm.name,
        new_password: resetForm.new_password
      });
      
      toast.success('Senha redefinida com sucesso! 🎉');
      
      // Reset form and go back to login
      setResetForm({
        email: '',
        name: '',
        new_password: '',
        confirm_password: ''
      });
      setStep(1);
      onBack();
      
    } catch (error) {
      toast.error('Erro ao redefinir senha. Tente novamente.');
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
            <KeyRound className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold font-nunito text-gray-800 mb-2">
            Mission<span className="text-indigo-600">Kids</span>
          </h1>
          <p className="text-gray-600 font-nunito">
            Recuperação de senha 🔑
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-nunito text-gray-800 flex items-center justify-center">
              <ArrowLeft 
                className="w-5 h-5 mr-2 cursor-pointer hover:text-indigo-600 transition-colors" 
                onClick={onBack}
                data-testid="back-to-login-btn"
              />
              {step === 1 ? 'Verificação de Identidade' : 'Nova Senha'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Confirme seus dados para recuperar a senha'
                : 'Defina uma nova senha para sua conta'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email da conta
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetForm.email}
                    onChange={(e) => setResetForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    data-testid="reset-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-name" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Nome completo
                  </Label>
                  <Input
                    id="reset-name"
                    placeholder="Como cadastrado na conta"
                    value={resetForm.name}
                    onChange={(e) => setResetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="reset-name-input"
                  />
                  <p className="text-xs text-gray-500">
                    Digite exatamente como cadastrou
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-nunito bg-indigo-600 hover:bg-indigo-700"
                  disabled={isLoading}
                  data-testid="verify-identity-btn"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Identidade'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400 mb-4">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-700">
                      Identidade verificada para: {resetForm.email}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Digite a nova senha"
                    value={resetForm.new_password}
                    onChange={(e) => setResetForm(prev => ({ ...prev, new_password: e.target.value }))}
                    required
                    minLength={6}
                    data-testid="new-password-input"
                  />
                  <p className="text-xs text-gray-500">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Digite novamente a nova senha"
                    value={resetForm.confirm_password}
                    onChange={(e) => setResetForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                    required
                    data-testid="confirm-password-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-nunito bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                  data-testid="reset-password-btn"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-nunito"
                  onClick={() => setStep(1)}
                  data-testid="back-to-verification-btn"
                >
                  Voltar à verificação
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security info */}
        <div className="mt-6 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-nunito text-gray-600">
              Por segurança, verificamos sua identidade antes de permitir a alteração da senha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;