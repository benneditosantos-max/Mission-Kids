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

const ModernParentDashboard = () => {
  const { user, logout, playSound } = useAuth();
  const [children, setChildren] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Mock data for demo
  const mockChildren = [
    { 
      id: 1, 
      name: 'João', 
      age: 13, 
      email: 'joao@email.com',
      level: 3,
      xp: 150,
      earned: 25.50,
      allowance_goal: 50,
      avatar: '👦'
    },
    { 
      id: 2, 
      name: 'Maria', 
      age: 11, 
      email: 'maria@email.com',
      level: 2,
      xp: 80,
      earned: 15.00,
      allowance_goal: 40,
      avatar: '👧'
    }
  ];

  const mockTasks = [
    { id: 1, title: "Arrumar a cama", child_name: "João", value: 5.0, xp: 10, status: "pending" },
    { id: 2, title: "Lavar louça", child_name: "Maria", value: 8.0, xp: 15, status: "completed" },
    { id: 3, title: "Estudar matemática", child_name: "João", value: 10.0, xp: 20, status: "approved" }
  ];

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
    // Simulate loading
    setTimeout(() => {
      setChildren(mockChildren);
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskForm.title || !taskForm.child_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Mock task creation
      const newTask = {
        id: tasks.length + 1,
        title: taskForm.title,
        description: taskForm.description,
        child_name: children.find(c => c.id == taskForm.child_id)?.name || 'Criança',
        value: parseFloat(taskForm.value),
        xp: parseInt(taskForm.xp),
        status: 'pending'
      };

      setTasks(prev => [...prev, newTask]);
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
      
    } catch (error) {
      toast.error('Erro ao criar tarefa');
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
            <h2 className="text-2xl font-bold font-nunito text-gray-800 mb-6">Seus Filhos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-4xl">{child.avatar}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.age} anos</p>
                    </div>
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

                  <div className="bg-white rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progresso da Mesada</span>
                      <span className="text-sm text-gray-600">{((child.earned / child.allowance_goal) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(child.earned / child.allowance_goal) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                            <SelectItem key={child.id} value={child.id.toString()}>
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
              {tasks.map((task) => (
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
                        <span>Para: {task.child_name}</span>
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
              ))}
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
    </div>
  );
};

export default ModernParentDashboard;