import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Users, CheckCircle, Clock, DollarSign, Star, 
  Settings, LogOut, RefreshCw, Award, Target, TrendingUp,
  Camera, AlertCircle, Trash2, Edit, Eye, Baby
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ParentDashboard = () => {
  const { user, logout, playSound } = useAuth();
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateChild, setShowCreateChild] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  // Child registration form
  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    email: '',
    pin: '',
    allowance_goal: 50
  });

  // Savings goal form
  const [goalForm, setGoalForm] = useState({
    name: '',
    target: 0,
    child_id: ''
  });

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    child_id: '',
    value: 0,
    xp: 0,
    frequency: 'daily',
    photo_required: false,
    approval_required: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [childrenRes, tasksRes, notificationsRes] = await Promise.all([
        axios.get('/users/children'),
        axios.get('/tasks'),
        axios.get('/notifications').catch(() => ({ data: [] }))
      ]);
      
      setChildren(childrenRes.data);
      setTasks(tasksRes.data);
      setNotifications(notificationsRes.data);
      
      // Filter tasks awaiting validation
      const awaitingValidation = tasksRes.data.filter(t => t.status === 'awaiting_validation');
      setPendingTasks(awaitingValidation);
      
      // Fetch savings goals for each child
      const goalsMap = {};
      for (const child of childrenRes.data) {
        try {
          const goalsRes = await axios.get(`/savings-goals/${child.id}`);
          goalsMap[child.id] = goalsRes.data || [];
        } catch (error) {
          goalsMap[child.id] = [];
        }
      }
      setSavingsGoals(goalsMap);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    
    if (!childForm.name || !childForm.age || !childForm.email || !childForm.pin) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (parseInt(childForm.age) < 5 || parseInt(childForm.age) > 18) {
      toast.error('Idade deve estar entre 5 e 18 anos');
      return;
    }

    if (childForm.pin.length !== 4 || !/^\d{4}$/.test(childForm.pin)) {
      toast.error('PIN deve ter exatamente 4 dígitos');
      return;
    }

    try {
      await axios.post('/auth/register', {
        email: childForm.email,
        name: childForm.name,
        password: childForm.pin, // PIN is treated as password for children
        role: 'child',
        pin: childForm.pin,
        parent_id: user.id,
        allowance_goal: parseFloat(childForm.allowance_goal)
      });
      
      toast.success(`${childForm.name} foi cadastrado(a) com sucesso! 👶`);
      setShowCreateChild(false);
      
      // Reset form
      setChildForm({
        name: '',
        age: '',
        email: '',
        pin: '',
        allowance_goal: 50
      });
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao cadastrar criança';
      toast.error(message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskForm.title || !taskForm.child_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await axios.post('/tasks', {
        ...taskForm,
        value: parseFloat(taskForm.value),
        xp: parseInt(taskForm.xp)
      });
      
      toast.success('Tarefa criada com sucesso! 🎯');
      setShowCreateTask(false);
      
      // Reset form
      setTaskForm({
        title: '',
        description: '',
        child_id: '',
        value: 0,
        xp: 0,
        frequency: 'daily',
        photo_required: false,
        approval_required: true
      });
      
      fetchData();
      
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    if (!goalForm.name || !goalForm.target || !goalForm.child_id) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Check if child already has 3 goals
    const childGoals = savingsGoals[goalForm.child_id] || [];
    if (childGoals.length >= 3) {
      toast.error('Cada criança pode ter no máximo 3 metas de poupança');
      return;
    }

    try {
      await axios.post('/savings-goals', {
        child_id: goalForm.child_id,
        name: goalForm.name,
        target: parseFloat(goalForm.target)
      });
      
      toast.success('Meta de poupança criada com sucesso! 🎯');
      setShowGoalDialog(false);
      
      // Reset form
      setGoalForm({
        name: '',
        target: 0,
        child_id: ''
      });
      
      fetchData();
      
    } catch (error) {
      toast.error('Erro ao criar meta de poupança');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Deseja realmente excluir esta meta?')) {
      return;
    }

    try {
      await axios.delete(`/savings-goals/${goalId}`);
      toast.success('Meta excluída com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir meta');
    }
  };

  const openGoalDialog = (childId) => {
    setGoalForm(prev => ({ ...prev, child_id: childId }));
    setShowGoalDialog(true);
  };

  const handleApproveTask = async (taskId) => {
    try {
      await axios.post(`/tasks/${taskId}/approve`);
      toast.success('Tarefa aprovada e creditada! 🎉');
      fetchData();
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Erro ao aprovar tarefa');
    }
  };

  const handleRejectTask = async (taskId) => {
    const reason = window.prompt('Motivo da rejeição (opcional):');
    
    try {
      await axios.post(`/tasks/${taskId}/reject`, { reason: reason || 'Não especificado' });
      toast.success('Tarefa rejeitada');
      fetchData();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error('Erro ao rejeitar tarefa');
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      default: return 'bg-yellow-500 text-white';
    }
  };

  const getTaskStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprovada';
      case 'completed': return 'Aguardando';
      default: return 'Pendente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-lg font-nunito text-white">Carregando painel...</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-nunito text-white">Painel dos Pais</h1>
                <p className="text-white/80 text-sm">Bem-vindo, {user?.name || 'Gabriel'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">👶</span>
                </div>
                <span className="text-white font-bold">{children.length}</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={logout} 
                data-testid="logout-btn"
                className="text-white hover:bg-white/20 rounded-xl"
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
          
          {/* Children Overview */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-nunito text-gray-800">Seus Filhos</h2>
              <Dialog open={showCreateChild} onOpenChange={setShowCreateChild}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl px-6 py-3 font-bold shadow-lg"
                    data-testid="add-child-btn"
                  >
                    <Baby className="w-5 h-5 mr-2" />
                    Adicionar Filho(a)
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-nunito">Cadastrar Nova Criança</DialogTitle>
                    <DialogDescription>
                      Crie uma conta segura para seu filho(a)
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
                        className="rounded-xl"
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
                        className="rounded-xl"
                        data-testid="child-age-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="joao@email.com"
                        value={childForm.email}
                        onChange={(e) => setChildForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="rounded-xl"
                        data-testid="child-email-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>PIN (4 dígitos)</Label>
                      <Input
                        type="password"
                        placeholder="1234"
                        maxLength={4}
                        value={childForm.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setChildForm(prev => ({ ...prev, pin: value }));
                        }}
                        required
                        className="rounded-xl text-center text-2xl tracking-widest font-mono"
                        data-testid="child-pin-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Meta de Mesada (R$)</Label>
                      <Input
                        type="number"
                        min="10"
                        step="5"
                        placeholder="50"
                        value={childForm.allowance_goal}
                        onChange={(e) => setChildForm(prev => ({ ...prev, allowance_goal: e.target.value }))}
                        required
                        className="rounded-xl"
                        data-testid="child-allowance-input"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-bold" 
                        data-testid="create-child-submit"
                      >
                        <Baby className="w-4 h-4 mr-2" />
                        Cadastrar Criança
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {children.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
                <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhuma criança cadastrada</h3>
                <p className="text-gray-500 mb-4">Adicione seus filhos para começar a diversão!</p>
                <Button 
                  onClick={() => setShowCreateChild(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl px-6 py-3 font-bold"
                >
                  <Baby className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Filho(a)
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => (
                  <div key={child.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-4xl">👶</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{child.name}</h3>
                        <p className="text-sm text-gray-600">{child.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openGoalDialog(child.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
                        title="Adicionar Meta"
                      >
                        <Target className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{child.level}</div>
                        <div className="text-xs text-gray-600">Nível</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{child.xp}</div>
                        <div className="text-xs text-gray-600">XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">R$ {child.earned.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Ganho</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso da Mesada</span>
                        <span className="text-sm text-gray-600">{((child.earned / child.allowance_goal) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((child.earned / child.allowance_goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Savings Goals */}
                    {savingsGoals[child.id] && savingsGoals[child.id].length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Metas de Poupança:</div>
                        {savingsGoals[child.id].map((goal) => (
                          <div key={goal.id} className="bg-white rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">{goal.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>R$ {goal.progress.toFixed(2)} / R$ {goal.target.toFixed(2)}</span>
                              <span className="font-bold text-purple-600">{Math.floor((goal.progress / goal.target) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-purple-400 to-pink-400 h-1 rounded-full"
                                style={{ width: `${Math.min((goal.progress / goal.target) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-nunito text-gray-800">Tarefas</h2>
              <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl px-6 py-3 font-bold shadow-lg"
                    data-testid="create-task-btn"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-nunito">Criar Nova Tarefa</DialogTitle>
                    <DialogDescription>
                      Crie uma nova missão para seus filhos
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Criança</Label>
                      <Select value={taskForm.child_id} onValueChange={(value) => setTaskForm(prev => ({ ...prev, child_id: value }))} required>
                        <SelectTrigger data-testid="task-child-select">
                          <SelectValue placeholder="Selecione uma criança" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Título da Tarefa</Label>
                      <Input
                        placeholder="Ex: Arrumar a cama"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                        data-testid="task-title-input"
                        className="rounded-xl"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.50"
                          value={taskForm.value}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, value: e.target.value }))}
                          required
                          data-testid="task-value-input"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>XP</Label>
                        <Input
                          type="number"
                          min="1"
                          value={taskForm.xp}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, xp: e.target.value }))}
                          required
                          data-testid="task-xp-input"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold" 
                        data-testid="create-task-submit"
                      >
                        Criar Tarefa
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhuma tarefa criada</h3>
                  <p className="text-gray-500">Crie a primeira tarefa para seus filhos!</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const child = children.find(c => c.id === task.child_id);
                  return (
                    <div 
                      key={task.id} 
                      className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all duration-300"
                      data-testid={`task-card-${task.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTaskStatusColor(task.status)}`}>
                          {task.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : task.status === 'completed' ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <Star className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Para: {child?.name || 'Criança'}</span>
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1 text-green-500" />
                              R$ {task.value.toFixed(2)}
                            </span>
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-purple-500" />
                              {task.xp} XP
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={`${getTaskStatusColor(task.status)} rounded-xl px-3 py-1`}>
                        {getTaskStatusText(task.status)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h2 className="text-xl font-bold font-nunito text-gray-800 mb-4">Estatísticas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{children.length}</div>
                <div className="text-sm text-purple-700">Filhos</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-blue-700">Tarefas</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {children.reduce((total, child) => total + child.earned, 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Total Ganho</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {children.reduce((total, child) => total + child.xp, 0)}
                </div>
                <div className="text-sm text-yellow-700">XP Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nunito">Criar Meta de Poupança</DialogTitle>
            <DialogDescription>
              Crie até 3 metas de poupança por criança
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Meta</Label>
              <Input
                placeholder="Ex: Bicicleta nova"
                value={goalForm.name}
                onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Valor Alvo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="100.00"
                value={goalForm.target}
                onChange={(e) => setGoalForm(prev => ({ ...prev, target: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-bold"
              >
                <Target className="w-4 h-4 mr-2" />
                Criar Meta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentDashboard;