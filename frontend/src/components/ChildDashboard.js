import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Star, Trophy, Coins, Target, LogOut, RefreshCw,
  Plus, ArrowRight, Clock, CheckCircle, Zap
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ModernChildDashboard = () => {
  const { user, logout, playSound, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock tasks for demo - replace with real API calls
  const mockTasks = [
    { id: 1, title: "Arrumar a cama", value: 5.0, xp: 10, status: "pending" },
    { id: 2, title: "Lavar a louça", value: 8.0, xp: 15, status: "pending" },
    { id: 3, title: "Estudar matemática", value: 10.0, xp: 20, status: "completed" }
  ];

  const weeklyData = [
    { day: "Dom", completed: 2 },
    { day: "Seg", completed: 3 },
    { day: "Ter", completed: 1 },
    { day: "Qua", completed: 4 },
    { day: "Qui", completed: 2 },
    { day: "Sex", completed: 5 },
    { day: "Sáb", completed: 3 }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      // Update task locally for demo
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'completed' } : task
      ));
      
      playSound('complete');
      toast.success('Missão concluída! 🎉');
    } catch (error) {
      toast.error('Erro ao concluir missão');
    }
  };

  const currentLevel = user?.level || 1;
  const currentXp = user?.xp || 150;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = ((currentXp % 100) / 100) * 100;
  const balance = user?.earned || 42.50;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-lg font-nunito text-white">Carregando suas missões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-4 ring-white/30">
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xl">
                  👦
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold font-nunito text-white">
                  Mesh
                </h1>
                <p className="text-white/80 text-sm">
                  Bem-vindo, {user?.name || 'Gabriel'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Coins className="w-3 h-3 text-white" />
                </div>
                <span className="text-white font-bold">200</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-white hover:bg-white/20"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl min-h-screen p-6">
          {/* Progress Banner */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Você já ganhou 50 de 100! 🎯
                </h3>
                <Progress value={50} className="w-64 h-3 bg-yellow-200" />
              </div>
              <div className="text-6xl">
                🏆
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-nunito text-gray-800">Tarefas</h2>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl px-6 py-3 font-bold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Tarefa
              </Button>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all duration-300"
                  data-testid={`task-card-${task.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Coins className="w-4 h-4 mr-1 text-green-500" />
                          R$ {task.value.toFixed(2)}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-purple-500" />
                          {task.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {task.status === 'pending' && (
                      <Button
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl px-4 py-2 font-medium"
                        data-testid={`complete-task-${task.id}`}
                      >
                        Concluir
                      </Button>
                    )}
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold font-nunito text-gray-800 mb-4">Resumo da semana</h2>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-end justify-between space-x-2 h-32">
                {weeklyData.map((day, index) => (
                  <div key={day.day} className="flex flex-col items-center space-y-2">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-8 transition-all duration-500"
                      style={{ 
                        height: `${(day.completed / 5) * 100}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs font-medium text-gray-600">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Total de tarefas concluídas esta semana: <span className="font-bold text-blue-600">20</span>
                </p>
              </div>
            </div>
          </div>

          {/* Add Goal Button */}
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-8 py-4 font-bold text-lg shadow-lg"
            >
              <Target className="w-5 h-5 mr-2" />
              Adicionar Meta
            </Button>
          </div>

          {/* Shop Section Preview */}
          <div className="mt-8">
            <h2 className="text-xl font-bold font-nunito text-gray-800 mb-4">Loja</h2>
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Desbloqueie recompensas incríveis!
              </h3>
              <p className="text-gray-600 mb-4">
                Use seus pontos para comprar avatares, jogos e muito mais
              </p>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-2xl px-6 py-3 font-bold"
              >
                Ver Loja
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChildDashboard;