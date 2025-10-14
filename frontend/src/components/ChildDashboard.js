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
import StoreModal from '@/components/StoreModal';

const ModernChildDashboard = () => {
  const { user, logout, playSound, updateUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  const [showStore, setShowStore] = useState(false);

  const weeklyData = [
    { day: "Dom", completed: 2 },
    { day: "Seg", completed: 3 },
    { day: "Ter", completed: 1 },
    { day: "Qua", completed: 4 },
    { day: "Qui", completed: 2 },
    { day: "Sex", completed: 5 },
    { day: "Sáb", completed: 3 }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks
      const tasksResponse = await axios.get('/tasks');
      setTasks(tasksResponse.data || []);
      
      // Fetch financial data
      const financialResponse = await axios.get(`/children/${user.id}/financial`);
      setFinancialData(financialResponse.data);
      setSavingsGoals(financialResponse.data.savings_goals || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    filterTasks();
  }, [tasks, currentFilter]);

  const filterTasks = () => {
    let filtered = [...tasks];
    
    switch (currentFilter) {
      case 'daily':
        filtered = filtered.filter(task => task.frequency === 'daily');
        break;
      case 'weekly':
        filtered = filtered.filter(task => task.frequency === 'weekly');
        break;
      case 'monthly':
        filtered = filtered.filter(task => task.frequency === 'monthly');
        break;
      case 'awaiting':
        filtered = filtered.filter(task => task.status === 'awaiting_validation');
        break;
      case 'pending':
        filtered = filtered.filter(task => task.status === 'pending');
        break;
      case 'all':
      default:
        // Show all tasks
        break;
    }
    
    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.post(`/tasks/${taskId}/complete`);
      
      // Refresh data
      await fetchData();
      
      playSound('complete');
      toast.success('Missão concluída! 🎉');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Erro ao concluir missão');
    }
  };

  const currentLevel = financialData?.level || user?.level || 1;
  const currentXp = financialData?.xp || user?.xp || 0;
  const xpProgress = financialData?.xp_progress || 0;
  const xpForNextLevel = financialData?.xp_for_next_level || 100;
  const balance = financialData?.balance || user?.earned || 0;
  const totalAllowance = financialData?.total_allowance || 0;
  const allowanceGoal = financialData?.allowance_goal || user?.allowance_goal || 50;
  const allowanceProgress = (balance / allowanceGoal) * 100;

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
                <span className="text-white font-bold">{currentXp}</span>
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
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Você já ganhou R$ {balance.toFixed(2)} de R$ {allowanceGoal.toFixed(2)}! 🎯
                </h3>
                <Progress value={Math.min(allowanceProgress, 100)} className="w-full h-3 bg-yellow-200" />
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <span>Nível {currentLevel} - {xpProgress} / {xpForNextLevel} XP</span>
                  <span className="font-bold text-blue-600">{Math.floor(allowanceProgress)}%</span>
                </div>
              </div>
              <div className="text-6xl ml-4">
                🏆
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-nunito text-gray-800">Minhas Tarefas</h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                onClick={() => setCurrentFilter('all')}
                className={`rounded-xl ${currentFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Todas ({tasks.length})
              </Button>
              <Button
                onClick={() => setCurrentFilter('pending')}
                className={`rounded-xl ${currentFilter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Pendentes ({tasks.filter(t => t.status === 'pending').length})
              </Button>
              <Button
                onClick={() => setCurrentFilter('awaiting')}
                className={`rounded-xl ${currentFilter === 'awaiting' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Aguardando Validação ({tasks.filter(t => t.status === 'awaiting_validation').length})
              </Button>
              <Button
                onClick={() => setCurrentFilter('daily')}
                className={`rounded-xl ${currentFilter === 'daily' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Diária
              </Button>
              <Button
                onClick={() => setCurrentFilter('weekly')}
                className={`rounded-xl ${currentFilter === 'weekly' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Semanal
              </Button>
              <Button
                onClick={() => setCurrentFilter('monthly')}
                className={`rounded-xl ${currentFilter === 'monthly' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Mensal
              </Button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600">Nenhuma tarefa encontrada para este filtro!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all duration-300"
                      data-testid={`task-card-${task.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          task.status === 'approved' ? 'bg-green-500' : 
                          task.status === 'awaiting_validation' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}>
                          {task.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : task.status === 'awaiting_validation' ? (
                            <Clock className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-500">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Coins className="w-4 h-4 mr-1 text-green-500" />
                              R$ {task.value.toFixed(2)}
                            </span>
                            <span className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-purple-500" />
                              {task.xp} XP
                            </span>
                            <Badge className="text-xs">
                              {task.frequency === 'daily' ? '📅 Diária' : 
                               task.frequency === 'weekly' ? '📆 Semanal' : '📋 Mensal'}
                            </Badge>
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
                        {task.status === 'awaiting_validation' && (
                          <Badge className="bg-yellow-100 text-yellow-800">⏳ Aguardando aprovação</Badge>
                        )}
                        {task.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">✓ Aprovada</Badge>
                        )}
                        {task.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800">✗ Rejeitada</Badge>
                        )}
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-xl"
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    {[...Array(totalPages)].map((_, index) => (
                      <Button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`rounded-xl ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-xl"
                      variant="outline"
                    >
                      Próximo
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Savings Goals Section */}
          {savingsGoals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold font-nunito text-gray-800 mb-4">Minhas Metas de Poupança</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savingsGoals.map((goal) => (
                  <div key={goal.id} className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{goal.name}</h3>
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="mb-2">
                      <Progress 
                        value={(goal.progress / goal.target) * 100} 
                        className="h-2 bg-purple-200"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        R$ {goal.progress.toFixed(2)} / R$ {goal.target.toFixed(2)}
                      </span>
                      <span className="font-bold text-purple-600">
                        {Math.floor((goal.progress / goal.target) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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