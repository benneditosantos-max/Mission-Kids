import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { 
  Star, Trophy, Coins, LogOut, RefreshCw,
  Target, Zap, Gift, Settings
} from 'lucide-react';

const FirebaseChildDashboard = () => {
  const { currentUser, userProfile, logout, playSound } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState('default.png');

  const avatarOptions = [
    { id: 'default.png', name: '🦸 Super Herói', emoji: '🦸', price: 0 },
    { id: 'princess.png', name: '👸 Princesa', emoji: '👸', price: 50 },
    { id: 'ninja.png', name: '🥷 Ninja', emoji: '🥷', price: 100 },
    { id: 'pirate.png', name: '🏴‍☠️ Pirata', emoji: '🏴‍☠️', price: 150 },
    { id: 'wizard.png', name: '🧙 Mago', emoji: '🧙', price: 200 },
    { id: 'robot.png', name: '🤖 Robô', emoji: '🤖', price: 300 }
  ];

  useEffect(() => {
    if (userProfile) {
      setSelectedAvatar(userProfile.avatar || 'default.png');
      setLoading(false);
    }
  }, [userProfile]);

  const currentLevel = userProfile?.level || 1;
  const currentXp = userProfile?.xp || 0;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = ((currentXp % 100) / 100) * 100;
  const balance = userProfile?.wallet?.balance || 0;
  const tasks = userProfile?.tasks || [];
  const goals = userProfile?.wallet?.goals || [];

  const handleAvatarChange = (avatarId) => {
    const avatar = avatarOptions.find(a => a.id === avatarId);
    if (avatar.price > currentXp) {
      toast.error(`Você precisa de ${avatar.price} XP para desbloquear este avatar`);
      return;
    }

    setSelectedAvatar(avatarId);
    playSound('success');
    // TODO: Update avatar in Firestore
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-nunito text-gray-600">Carregando suas missões...</p>
        </div>
      </div>
    );
  }

  const selectedAvatarData = avatarOptions.find(a => a.id === selectedAvatar);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-4 ring-purple-200">
                <AvatarFallback className="bg-purple-600 text-white text-xl">
                  {selectedAvatarData?.emoji || '👶'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold font-nunito text-gray-800">
                  Olá, {userProfile?.name}! 
                </h1>
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
                    R$ {balance.toFixed(2)}
                  </span>
                </div>
                <Badge className="mt-1 bg-green-100 text-green-800">
                  🔥 Firebase Edition
                </Badge>
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

          {/* Wallet */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold font-nunito">Carteira Virtual</h3>
                  <p className="text-green-100">Saldo disponível</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-300" />
              </div>
              <p className="text-3xl font-bold">R$ {balance.toFixed(2)}</p>
              <p className="text-sm text-green-100 mt-2">
                {goals.length} {goals.length === 1 ? 'meta' : 'metas'} de poupança
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missions" className="font-nunito" data-testid="missions-tab">
              🎯 Missões
            </TabsTrigger>
            <TabsTrigger value="savings" className="font-nunito" data-testid="savings-tab">
              💰 Poupança
            </TabsTrigger>
            <TabsTrigger value="avatar" className="font-nunito" data-testid="avatar-tab">
              🎨 Avatar
            </TabsTrigger>
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
                tasks.map((task, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300" data-testid={`task-card-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          <div>
                            <h3 className="font-bold font-nunito text-gray-800">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 font-nunito">
                          Pendente
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-green-600">
                            <Coins className="w-4 h-4 mr-1" />
                            R$ {task.value?.toFixed(2) || '0.00'}
                          </span>
                          <span className="flex items-center text-purple-600">
                            <Star className="w-4 h-4 mr-1" />
                            {task.xp || 0} XP
                          </span>
                        </div>

                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700 font-nunito"
                          data-testid={`complete-task-${index}`}
                        >
                          Concluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings">
            <div className="grid gap-4">
              {goals.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma meta de poupança</h3>
                    <p className="text-gray-500">Peça para seus pais criarem metas para você!</p>
                  </CardContent>
                </Card>
              ) : (
                goals.map((goal, index) => {
                  const progress = (goal.progress / goal.target) * 100;
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`savings-goal-${index}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold font-nunito text-gray-800">{goal.name}</h3>
                          <Badge variant="outline" className="font-nunito">
                            {progress.toFixed(0)}% completo
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-3 mb-3" />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>R$ {goal.progress?.toFixed(2) || '0.00'}</span>
                          <span>Meta: R$ {goal.target?.toFixed(2) || '0.00'}</span>
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
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4">
                    {selectedAvatarData?.emoji || '👶'}
                  </div>
                  <h3 className="text-lg font-bold font-nunito text-gray-800 mb-2">
                    {selectedAvatarData?.name || 'Avatar'}
                  </h3>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    Nível {currentLevel} • {currentXp} XP
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {avatarOptions.map((avatar) => {
                    const isOwned = avatar.price <= currentXp;
                    const isSelected = selectedAvatar === avatar.id;
                    
                    return (
                      <div
                        key={avatar.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : isOwned
                            ? 'border-gray-200 hover:border-gray-300 bg-white'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }`}
                        onClick={() => isOwned && handleAvatarChange(avatar.id)}
                        data-testid={`avatar-${avatar.id}`}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{avatar.emoji}</div>
                          <h4 className="font-nunito font-semibold text-sm">{avatar.name.slice(2)}</h4>
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
                            <Badge className="bg-purple-600 text-white mt-1">Ativo</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-center">
                    <Gift className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700">
                        Complete missões para ganhar XP e desbloquear novos avatares!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FirebaseChildDashboard;