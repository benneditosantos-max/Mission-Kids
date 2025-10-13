import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, Star, User, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PinReset = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Name verification, 2: New PIN
  const [resetForm, setResetForm] = useState({
    email: '',
    name: '',
    new_pin: '',
    confirm_pin: ''
  });

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!resetForm.email || !resetForm.name) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      // Verify if user exists and name matches
      await axios.post('/auth/verify-identity', {
        email: resetForm.email,
        name: resetForm.name
      });
      
      // If we reach here without error, proceed to step 2
      setStep(2);
      toast.success('Verificação bem-sucedida! Agora defina um novo PIN.');
      
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

  const handlePinReset = async (e) => {
    e.preventDefault();
    
    if (!resetForm.new_pin || !resetForm.confirm_pin) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (resetForm.new_pin.length !== 4 || !/^\d{4}$/.test(resetForm.new_pin)) {
      toast.error('O PIN deve ter exatamente 4 dígitos');
      return;
    }

    if (resetForm.new_pin !== resetForm.confirm_pin) {
      toast.error('Os PINs não conferem');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/auth/reset-pin', {
        email: resetForm.email,
        name: resetForm.name,
        new_pin: resetForm.new_pin
      });
      
      toast.success('PIN redefinido com sucesso! 🎉');
      
      // Reset form and go back to login
      setResetForm({
        email: '',
        name: '',
        new_pin: '',
        confirm_pin: ''
      });
      setStep(1);
      onBack();
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao redefinir PIN. Tente novamente.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-in">
            <Star className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold font-nunito text-gray-800 mb-2">
            Mission<span className="text-purple-600">Kids</span>
          </h1>
          <p className="text-gray-600 font-nunito">
            Recuperar PIN da Criança 🌟
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-nunito text-gray-800 flex items-center justify-center">
              <ArrowLeft 
                className="w-5 h-5 mr-2 cursor-pointer hover:text-purple-600 transition-colors" 
                onClick={onBack}
                data-testid="back-to-login-btn"
              />
              {step === 1 ? 'Verificação de Identidade' : 'Novo PIN'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Confirme seus dados para recuperar o PIN'
                : 'Defina um novo PIN de 4 dígitos'
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
                    Digite exatamente como seus pais cadastraram
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-nunito bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                  data-testid="verify-identity-btn"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Identidade'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePinReset} className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400 mb-4">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-purple-700">
                      Identidade verificada para: {resetForm.email}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pin">Novo PIN (4 dígitos)</Label>
                  <Input
                    id="new-pin"
                    type="password"
                    placeholder="0000"
                    value={resetForm.new_pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setResetForm(prev => ({ ...prev, new_pin: value }));
                    }}
                    required
                    maxLength={4}
                    data-testid="new-pin-input"
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Escolha 4 números que você lembre facilmente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirmar novo PIN</Label>
                  <Input
                    id="confirm-pin"
                    type="password"
                    placeholder="0000"
                    value={resetForm.confirm_pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setResetForm(prev => ({ ...prev, confirm_pin: value }));
                    }}
                    required
                    maxLength={4}
                    data-testid="confirm-pin-input"
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-nunito bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                  data-testid="reset-pin-btn"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir PIN'}
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
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xs font-nunito text-gray-600">
              Peça ajuda aos seus pais se não conseguir lembrar dos seus dados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinReset;