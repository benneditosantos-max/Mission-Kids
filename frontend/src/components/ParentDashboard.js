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
  Camera, AlertCircle, Trash2, Edit, Eye
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ParentDashboard = () => {
  const { user, logout, playSound } = useAuth();
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);

  // Form states
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

  const [goalForm, setGoalForm] = useState({
    child_id: '',
    name: '',
    target: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [childrenRes, tasksRes] = await Promise.all([
        axios.get('/users/children'),
        axios.get('/tasks')
      ]);
      
      setChildren(childrenRes.data);
      setTasks(tasksRes.data);
      
      if (childrenRes.data.length > 0 && !selectedChild) {
        setSelectedChild(childrenRes.data[0]);
        // Fetch transactions for first child
        const transRes = await axios.get(`/transactions/${childrenRes.data[0].id}`);
        setTransactions(transRes.data);
      }
      
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    try {
      const transRes = await axios.get(`/transactions/${child.id}`);
      setTransactions(transRes.data);
    } catch (error) {
      toast.error('Erro ao carregar transações');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskForm.child_id) {
      toast.error('Selecione uma criança');
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
    
    try {
      await axios.post('/savings-goals', {
        ...goalForm,
        target: parseFloat(goalForm.target)
      });
      
      toast.success('Meta de poupança criada! 🎯');
      setShowCreateGoal(false);
      setGoalForm({
        child_id: '',
        name: '',
        target: 0
      });
      
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar meta');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await axios.post(`/tasks/${taskId}/approve`);
      toast.success('Tarefa aprovada! ⭐');
      playSound('success');
      fetchData();
    } catch (error) {
      toast.error('Erro ao aprovar tarefa');
    }
  };

  const handlePayAllowance = async (childId) => {
    try {
      const response = await axios.post('/allowance/pay', { child_id: childId });
      toast.success(`Mesada paga: R$ ${response.data.amount_paid.toFixed(2)} 💰`);
      playSound('coin');
      fetchData();
      
      // Refresh transactions
      if (selectedChild && selectedChild.id === childId) {
        const transRes = await axios.get(`/transactions/${childId}`);
        setTransactions(transRes.data);
      }
    } catch (error) {
      toast.error('Erro ao pagar mesada');
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const pendingApprovalTasks = tasks.filter(task => task.status === 'completed');

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
                <h1 className="text-2xl font-bold font-nunito text-white">Mesh</h1>
                <p className="text-white/80 text-sm">Bem-vindo, {user?.name || 'Gabriel'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">💰</span>
                </div>
                <span className="text-white font-bold">200</span>
              </div>
              {pendingApprovalTasks.length > 0 && (
                <Badge className="bg-orange-500 text-white font-nunito">
                  {pendingApprovalTasks.length}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                onClick={logout} 
                data-testid="logout-btn"
                className="text-white hover:bg-white/20"
              >
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
          <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0" data-testid="create-task-card">
                <CardContent className="p-6 text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-bold font-nunito">Criar Missão</h3>
                  <p className="text-blue-100 text-sm">Nova tarefa para as crianças</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-nunito">Criar Nova Missão</DialogTitle>
                <DialogDescription>
                  Crie uma nova tarefa para seus filhos completarem
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
                  <Label>Título da Missão</Label>
                  <Input
                    placeholder="Ex: Arrumar a cama"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    data-testid="task-title-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Detalhes da tarefa..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="task-description-input"
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
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={taskForm.frequency} onValueChange={(value) => setTaskForm(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger data-testid="task-frequency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Requer foto de prova</Label>
                    <Switch
                      checked={taskForm.photo_required}
                      onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, photo_required: checked }))}
                      data-testid="task-photo-required-switch"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requer aprovação dos pais</Label>
                    <Switch
                      checked={taskForm.approval_required}
                      onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, approval_required: checked }))}
                      data-testid="task-approval-required-switch"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full font-nunito" data-testid="create-task-submit">
                    Criar Missão
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0" data-testid="create-goal-card">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-bold font-nunito">Criar Meta</h3>
                  <p className="text-green-100 text-sm">Meta de poupança</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-nunito">Criar Meta de Poupança</DialogTitle>
                <DialogDescription>
                  Ajude seus filhos a poupar para algo especial
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Criança</Label>
                  <Select value={goalForm.child_id} onValueChange={(value) => setGoalForm(prev => ({ ...prev, child_id: value }))} required>
                    <SelectTrigger data-testid="goal-child-select">
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
                  <Label>Nome da Meta</Label>
                  <Input
                    placeholder="Ex: Bicicleta nova"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="goal-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valor da Meta (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.50"
                    value={goalForm.target}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, target: e.target.value }))}
                    required
                    data-testid="goal-target-input"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full font-nunito" data-testid="create-goal-submit">
                    Criar Meta
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold font-nunito">Relatórios</h3>
              <p className="text-purple-100 text-sm">Progresso das crianças</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="children" className="font-nunito" data-testid="children-tab">👨‍👩‍👧 Crianças</TabsTrigger>
            <TabsTrigger value="tasks" className="font-nunito" data-testid="tasks-tab">🎯 Missões</TabsTrigger>
            <TabsTrigger value="approvals" className="font-nunito" data-testid="approvals-tab">
              ✅ Aprovações
              {pendingApprovalTasks.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">
                  {pendingApprovalTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-4">
            {children.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma criança cadastrada</h3>
                  <p className="text-gray-500">Cadastre suas crianças para começar!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {children.map((child) => {
                  const allowanceProgress = (child.earned / child.allowance_goal) * 100;
                  const completedTasks = tasks.filter(t => t.child_id === child.id && t.status === 'approved').length;
                  
                  return (
                    <Card key={child.id} className="hover:shadow-lg transition-shadow" data-testid={`child-card-${child.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xl">{child.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold font-nunito">{child.name}</h3>
                              <p className="text-sm text-gray-600">{child.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-purple-600">
                                <Star className="w-4 h-4 mr-1" />
                                Nível {child.level}
                              </span>
                              <span className="flex items-center text-yellow-600">
                                <Trophy className="w-4 h-4 mr-1" />
                                {child.xp} XP
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-700">Mesada Atual</span>
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-lg font-bold text-green-800">R$ {child.earned.toFixed(2)}</p>
                            <p className="text-xs text-green-600">Meta: R$ {child.allowance_goal.toFixed(2)}</p>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-700">Missões</span>
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold text-blue-800">{completedTasks}</p>
                            <p className="text-xs text-blue-600">Concluídas</p>
                          </div>

                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-purple-700">Progresso</span>
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-lg font-bold text-purple-800">{allowanceProgress.toFixed(0)}%</p>
                            <p className="text-xs text-purple-600">Da mesada</p>
                          </div>
                        </div>

                        {child.earned > 0 && (
                          <Button
                            onClick={() => handlePayAllowance(child.id)}
                            className="w-full bg-green-600 hover:bg-green-700 font-nunito"
                            data-testid={`pay-allowance-${child.id}`}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pagar Mesada (R$ {child.earned.toFixed(2)})
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma missão criada</h3>
                    <p className="text-gray-500">Crie a primeira missão para seus filhos!</p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => {
                  const child = children.find(c => c.id === task.child_id);
                  return (
                    <Card key={task.id} className="hover:shadow-lg transition-shadow" data-testid={`task-card-${task.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold font-nunito text-gray-800">{task.title}</h3>
                            <p className="text-sm text-gray-600">Para: {child?.name}</p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                          </div>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status === 'approved' ? 'Aprovada' :
                             task.status === 'completed' ? 'Aguardando' : 'Pendente'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-green-600">
                              <DollarSign className="w-4 h-4 mr-1" />
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
                            {task.photo_required && (
                              <span className="flex items-center text-blue-600">
                                <Camera className="w-4 h-4 mr-1" />
                                Foto
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <div className="grid gap-4">
              {pendingApprovalTasks.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-nunito text-gray-600 mb-2">Nenhuma aprovação pendente</h3>
                    <p className="text-gray-500">Todas as tarefas foram aprovadas! 🎉</p>
                  </CardContent>
                </Card>
              ) : (
                pendingApprovalTasks.map((task) => {
                  const child = children.find(c => c.id === task.child_id);
                  return (
                    <Card key={task.id} className="border-l-4 border-l-orange-400 hover:shadow-lg transition-shadow" data-testid={`approval-task-${task.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold font-nunito text-gray-800">{task.title}</h3>
                            <p className="text-sm text-gray-600">Concluída por: {child?.name}</p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            <Badge className="bg-orange-100 text-orange-800">Aguardando aprovação</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-green-600">
                              <DollarSign className="w-4 h-4 mr-1" />
                              R$ {task.value.toFixed(2)}
                            </span>
                            <span className="flex items-center text-purple-600">
                              <Star className="w-4 h-4 mr-1" />
                              {task.xp} XP
                            </span>
                            <span className="text-gray-500">
                              {task.completed_at && new Date(task.completed_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {task.photo_url && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Foto enviada:</p>
                            <img 
                              src={`${process.env.REACT_APP_BACKEND_URL}${task.photo_url}`} 
                              alt="Prova da tarefa" 
                              className="max-h-32 rounded object-cover"
                            />
                          </div>
                        )}

                        <Button
                          onClick={() => handleApproveTask(task.id)}
                          className="w-full bg-green-600 hover:bg-green-700 font-nunito"
                          data-testid={`approve-task-${task.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar Missão
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParentDashboard;