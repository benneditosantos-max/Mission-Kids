import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Plus, Users, LogOut, RefreshCw, UserPlus, 
  Star, Trophy, DollarSign, TrendingUp, Baby
} from 'lucide-react';
import { toast } from 'sonner';

const FirebaseParentDashboard = () => {
  const { currentUser, userProfile, logout, registerChild, playSound } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateChild, setShowCreateChild] = useState(false);

  // Child form state
  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    username: '',
    password: '',
    avatar: 'default.png'
  });

  const avatarOptions = [
    { id: 'default.png', name: '🦸 Super Herói', emoji: '🦸' },
    { id: 'princess.png', name: '👸 Princesa', emoji: '👸' },
    { id: 'ninja.png', name: '🥷 Ninja', emoji: '🥷' },
    { id: 'pirate.png', name: '🏴‍☠️ Pirata', emoji: '🏴‍☠️' },
    { id: 'wizard.png', name: '🧙 Mago', emoji: '🧙' },
    { id: 'robot.png', name: '🤖 Robô', emoji: '🤖' }
  ];

  useEffect(() => {
    fetchChildren();
  }, [currentUser, userProfile]);

  const fetchChildren = async () => {
    if (!currentUser || !userProfile) return;

    try {
      const childrenRef = collection(db, 'children');
      const q = query(childrenRef, where('parentId', '==', currentUser.uid));
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const childrenData = [];
        querySnapshot.forEach((doc) => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Erro ao carregar filhos');
      setLoading(false);
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    
    if (!childForm.name || !childForm.age || !childForm.username || !childForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (parseInt(childForm.age) < 5 || parseInt(childForm.age) > 18) {
      toast.error('Idade deve estar entre 5 e 18 anos');
      return;
    }

    if (childForm.password.length !== 4 || !/^\d{4}$/.test(childForm.password)) {
      toast.error('PIN deve ter exatamente 4 dígitos');
      return;
    }

    try {
      await registerChild({
        ...childForm,
        age: parseInt(childForm.age)
      });
      
      setShowCreateChild(false);
      setChildForm({
        name: '',
        age: '',
        username: '',
        password: '',
        avatar: 'default.png'
      });
      
    } catch (error) {
      console.error('Error creating child:', error);
    }
  };

  const getChildStats = (child) => {
    const completedTasks = child.tasks?.filter(t => t.status === 'completed')?.length || 0;
    const totalXP = child.xp || 0;
    const level = child.level || 1;
    const balance = child.wallet?.balance || 0;
    
    return { completedTasks, totalXP, level, balance };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-nunito text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-nunito text-gray-800">
                Painel dos Pais - Firebase
              </h1>
              <p className="text-gray-600">
                Olá, {userProfile?.name}! Gerencie as missões dos seus filhos
              </p>
              <Badge className="mt-1 bg-green-100 text-green-800">
                🔥 Powered by Firebase
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800 font-nunito">
                {children.length} {children.length === 1 ? 'filho' : 'filhos'}
              </Badge>
              <Button variant="outline" onClick={logout} data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Dialog open={showCreateChild} onOpenChange={setShowCreateChild}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0" data-testid="create-child-card">
                <CardContent className="p-6 text-center">
                  <UserPlus className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-bold font-nunito">Adicionar Criança</h3>
                  <p className="text-green-100 text-sm">Criar nova subconta</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-nunito">Adicionar Nova Criança</DialogTitle>
                <DialogDescription>
                  Crie uma subconta segura para seu filho
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateChild} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={childForm.name}
                    onChange={(e) => setChildForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="child-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Idade</Label>
                  <Input
                    type="number"
                    min="5"
                    max="18"
                    placeholder="13"
                    value={childForm.age}
                    onChange={(e) => setChildForm(prev => ({ ...prev, age: e.target.value }))}
                    required
                    data-testid="child-age-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nome de Usuário</Label>
                  <Input
                    placeholder="joao13"
                    value={childForm.username}
                    onChange={(e) => setChildForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                    required
                    data-testid="child-username-input"
                  />
                  <p className="text-xs text-gray-500">
                    Será usado para login (apenas letras e números)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>PIN (4 dígitos)</Label>
                  <Input
                    type="password"
                    placeholder="1234"
                    maxLength={4}
                    value={childForm.password}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setChildForm(prev => ({ ...prev, password: value }));
                    }}
                    required
                    data-testid="child-pin-input"
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <Select value={childForm.avatar} onValueChange={(value) => setChildForm(prev => ({ ...prev, avatar: value }))}>
                    <SelectTrigger data-testid="child-avatar-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.map((avatar) => (
                        <SelectItem key={avatar.id} value={avatar.id}>
                          {avatar.emoji} {avatar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full font-nunito" data-testid="create-child-submit">
                    <Baby className="w-4 h-4 mr-2" />
                    Criar Conta
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold font-nunito">Criar Missão</h3>
              <p className="text-blue-100 text-sm">Nova tarefa gamificada</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold font-nunito">Relatórios</h3>
              <p className="text-purple-100 text-sm">Progresso em tempo real</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="children" className="font-nunito" data-testid="children-tab">
              👨‍👩‍👧 Filhos ({children.length})
            </TabsTrigger>
            <TabsTrigger value="overview" className="font-nunito" data-testid="overview-tab">
              📊 Visão Geral
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-4">
            {children.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma criança cadastrada</h3>
                  <p className="text-gray-500 mb-4">Adicione seus filhos para começar a diversão!</p>
                  <Button 
                    onClick={() => setShowCreateChild(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-nunito"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Criança
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {children.map((child) => {
                  const stats = getChildStats(child);
                  const selectedAvatar = avatarOptions.find(a => a.id === child.avatar);
                  
                  return (
                    <Card key={child.id} className="hover:shadow-lg transition-shadow" data-testid={`child-card-${child.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl">
                              {selectedAvatar?.emoji || '👶'}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold font-nunito">{child.name}</h3>
                              <p className="text-sm text-gray-600">
                                {child.age} anos • @{child.username}
                              </p>
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Criado em {new Date(child.createdAt.toDate()).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-yellow-700">Nível</span>
                              <Trophy className="w-4 h-4 text-yellow-600" />
                            </div>
                            <p className="text-lg font-bold text-yellow-800">{stats.level}</p>
                            <p className="text-xs text-yellow-600">{stats.totalXP} XP total</p>
                          </div>

                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-purple-700">XP</span>
                              <Star className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-lg font-bold text-purple-800">{stats.totalXP}</p>
                            <p className="text-xs text-purple-600">Experiência</p>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-700">Saldo</span>
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-lg font-bold text-green-800">R$ {stats.balance.toFixed(2)}</p>
                            <p className="text-xs text-green-600">Carteira virtual</p>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-700">Missões</span>
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold text-blue-800">{stats.completedTasks}</p>
                            <p className="text-xs text-blue-600">Concluídas</p>
                          </div>
                        </div>

                        <div className="mt-4 flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700 font-nunito flex-1"
                            data-testid={`manage-child-${child.id}`}
                          >
                            Gerenciar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="font-nunito flex-1"
                            data-testid={`view-progress-${child.id}`}
                          >
                            Ver Progresso
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-nunito">📊 Resumo Familiar</CardTitle>
                  <CardDescription>
                    Estatísticas gerais de todos os filhos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-800">{children.length}</p>
                      <p className="text-sm text-blue-600">Filhos cadastrados</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-800">
                        R$ {children.reduce((total, child) => total + (child.wallet?.balance || 0), 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600">Saldo total</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-800">
                        {children.reduce((total, child) => total + (child.xp || 0), 0)}
                      </p>
                      <p className="text-sm text-purple-600">XP total</p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-800">
                        {children.reduce((total, child) => total + (child.tasks?.filter(t => t.status === 'completed')?.length || 0), 0)}
                      </p>
                      <p className="text-sm text-yellow-600">Missões completas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FirebaseParentDashboard;