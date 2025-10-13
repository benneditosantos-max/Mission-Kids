import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Star, Trophy, Coins, Target, Camera, CheckCircle, 
  Clock, TrendingUp, Award, LogOut, RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ChildDashboard = () => {
  const { user, logout, playSound, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'hero1');

  const avatars = [
    { id: 'hero1', name: '🦸‍♀️ Super Hero', price: 0 },
    { id: 'wizard', name: '🧙‍♂️ Wizard', price: 50 },
    { id: 'knight', name: '⚔️ Knight', price: 100 },
    { id: 'ninja', name: '🥷 Ninja', price: 150 },
    { id: 'pirate', name: '🏴‍☠️ Pirate', price: 200 },
    { id: 'astronaut', name: '👨‍🚀 Astronaut', price: 300 }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, goalsRes, transRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get(`/savings-goals/${user.id}`),
        axios.get(`/transactions/${user.id}`)
      ]);
      
      setTasks(tasksRes.data);
      setSavingsGoals(goalsRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTask(taskId);
    try {
      await axios.post(`/tasks/${taskId}/complete`);
      
      // Play success sound
      playSound('complete');
      toast.success('Missão concluída! 🎉');
      
      // Refresh data
      await fetchData();
      
      // Get updated user info
      const userRes = await axios.get('/users/me');
      updateUser(userRes.data);
      
    } catch (error) {
      toast.error('Erro ao concluir missão');
    } finally {
      setCompletingTask(null);
    }
  };

  const handleAvatarChange = async (avatarId) => {
    const avatar = avatars.find(a => a.id === avatarId);
    if (avatar.price > user.xp) {
      toast.error(`Você precisa de ${avatar.price} XP para desbloquear este avatar`);
      return;
    }

    try {
      await axios.put('/users/avatar', null, { params: { avatar: avatarId } });
      setSelectedAvatar(avatarId);
      updateUser({ ...user, avatar: avatarId });
      playSound('success');
      toast.success('Avatar atualizado! ✨');
    } catch (error) {
      toast.error('Erro ao atualizar avatar');
    }
  };

  const getTaskIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Star className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTaskBadgeColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const allowanceProgress = user ? (user.earned / user.allowance_goal) * 100 : 0;
  const currentLevel = user?.level || 1;
  const xpForNextLevel = currentLevel * 100;
  const currentXp = user?.xp || 0;
  const xpProgress = ((currentXp % 100) / 100) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-nunito text-gray-600">Carregando suas missões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-4 ring-indigo-200">
                <AvatarImage src={`/avatars/${selectedAvatar}.png`} />
                <AvatarFallback className="bg-indigo-600 text-white text-xl">
                  {avatars.find(a => a.id === selectedAvatar)?.name.slice(0, 2) || '🦸'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold font-nunito text-gray-800">Olá, {user?.name}!</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                    Nível {currentLevel}
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-purple-500" />
                    {currentXp} XP
                  </span>
                  <span className="flex items-center">
                    <Coins className="w-4 h-4 mr-1 text-green-500" />
                    R$ {user?.earned?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={logout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* XP Progress */}
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold font-nunito">Nível {currentLevel}</h3>
                  <p className="text-purple-100">Próximo nível: {xpForNextLevel} XP</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <Progress value={xpProgress} className="h-3 bg-purple-300" />
              <p className="text-sm text-purple-100 mt-2">
                {currentXp % 100} / 100 XP para o próximo nível
              </p>
            </CardContent>
          </Card>

          {/* Allowance Progress */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold font-nunito">Mesada</h3>
                  <p className="text-green-100">Meta: R$ {user?.allowance_goal?.toFixed(2) || '0.00'}</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-300" />
              </div>
              <Progress value={allowanceProgress} className="h-3 bg-green-300" />
              <p className="text-sm text-green-100 mt-2">
                R$ {user?.earned?.toFixed(2) || '0.00'} de R$ {user?.allowance_goal?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missions" className="font-nunito" data-testid="missions-tab">🎯 Missões</TabsTrigger>
            <TabsTrigger value="savings" className="font-nunito" data-testid="savings-tab">💰 Poupança</TabsTrigger>
            <TabsTrigger value="avatar" className="font-nunito" data-testid="avatar-tab">🎨 Avatar</TabsTrigger>
          </TabsList>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-4">
            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma missão disponível</h3>
                    <p className="text-gray-500">Seus pais ainda não criaram missões para você!</p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="mission-card hover:shadow-lg transition-all duration-300" data-testid={`task-card-${task.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getTaskIcon(task.status)}
                          <div>
                            <h3 className="font-bold font-nunito text-gray-800">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getTaskBadgeColor(task.status)} font-nunito`}>
                          {task.status === 'approved' ? 'Aprovada' :
                           task.status === 'completed' ? 'Aguardando' : 'Pendente'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-green-600">
                            <Coins className="w-4 h-4 mr-1" />
                            R$ {task.value.toFixed(2)}
                          </span>
                          <span className="flex items-center text-purple-600">
                            <Star className="w-4 h-4 mr-1" />
                            {task.xp} XP
                          </span>
                          <span className="text-gray-500">
                            {task.frequency === 'daily' ? '📅 Diária' :
                             task.frequency === 'weekly' ? '📅 Semanal' : '📅 Mensal'}
                          </span>
                        </div>

                        {task.status === 'pending' && (
                          <Button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTask === task.id}
                            className="bg-indigo-600 hover:bg-indigo-700 font-nunito"
                            data-testid={`complete-task-${task.id}`}
                          >
                            {completingTask === task.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Concluir
                          </Button>
                        )}
                      </div>

                      {task.photo_required && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <div className="flex items-center text-yellow-700">
                            <Camera className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Foto obrigatória</span>
                          </div>
                        </div>
                      )}

                      {task.approval_required && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center text-blue-700">
                            <Award className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Precisa de aprovação dos pais</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings">
            <div className="grid gap-4">
              {savingsGoals.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma meta de poupança</h3>
                    <p className="text-gray-500">Peça para seus pais criarem metas para você!</p>
                  </CardContent>
                </Card>
              ) : (
                savingsGoals.map((goal) => {
                  const progress = (goal.progress / goal.target) * 100;
                  return (
                    <Card key={goal.id} className="hover:shadow-lg transition-shadow" data-testid={`savings-goal-${goal.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold font-nunito text-gray-800">{goal.name}</h3>
                          <Badge variant="outline" className="font-nunito">
                            {progress.toFixed(0)}% completo
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-3 mb-3" />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>R$ {goal.progress.toFixed(2)}</span>
                          <span>Meta: R$ {goal.target.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar">
            <Card>
              <CardHeader>
                <CardTitle className="font-nunito">🎨 Loja de Avatares</CardTitle>
                <CardDescription>
                  Use seu XP para desbloquear novos avatares incríveis!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {avatars.map((avatar) => {
                    const isOwned = avatar.price <= currentXp;
                    const isSelected = selectedAvatar === avatar.id;
                    
                    return (
                      <div
                        key={avatar.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : isOwned
                            ? 'border-gray-200 hover:border-gray-300 bg-white'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }`}
                        onClick={() => isOwned && handleAvatarChange(avatar.id)}
                        data-testid={`avatar-${avatar.id}`}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{avatar.name.slice(0, 2)}</div>
                          <h4 className="font-nunito font-semibold text-sm">{avatar.name.slice(3)}</h4>
                          <div className="mt-2">
                            {avatar.price === 0 ? (
                              <Badge className="bg-green-100 text-green-800">Grátis</Badge>
                            ) : isOwned ? (
                              <Badge className="bg-blue-100 text-blue-800">Desbloqueado</Badge>
                            ) : (
                              <Badge variant="outline">{avatar.price} XP</Badge>
                            )}
                          </div>
                          {isSelected && (
                            <Badge className="bg-indigo-600 text-white mt-1">Ativo</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChildDashboard;