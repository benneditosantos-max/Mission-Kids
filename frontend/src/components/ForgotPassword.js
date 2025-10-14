import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Key, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Request token, 2: Reset with token
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      if (response.data.token) {
        // Mock: Show token to user (in production, would be sent via email)
        setGeneratedToken(response.data.token);
        toast.success(response.data.message);
        setStep(2);
      } else {
        toast.success(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao solicitar recuperação';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!token || !newPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/reset-password-with-token', {
        token,
        new_password: newPassword
      });
      
      toast.success(response.data.message);
      
      // Wait a bit then go back to login
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao redefinir senha';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    toast.success('Token copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-fit mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Button>
          <CardTitle className="text-2xl font-bold font-nunito text-gray-800">
            Recuperar Senha
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Digite seu email para receber o token de recuperação'
              : 'Use o token para criar uma nova senha'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Nota:</strong> Como este é um sistema de demonstração, o token será exibido na tela. 
                  Em produção, seria enviado por email.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold py-3"
              >
                {loading ? 'Processando...' : 'Solicitar Token de Recuperação'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {generatedToken && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong className="text-green-800">Token gerado:</strong>
                    <div className="mt-2 flex items-center space-x-2">
                      <code className="flex-1 bg-white p-2 rounded border text-xs break-all">
                        {generatedToken}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={copyTokenToClipboard}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-green-700 text-xs mt-2">
                      ⏱️ Válido por 1 hora
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Token de Recuperação</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Cole o token aqui"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-bold py-3"
              >
                {loading ? 'Processando...' : 'Redefinir Senha'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full rounded-xl"
              >
                Solicitar Novo Token
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
