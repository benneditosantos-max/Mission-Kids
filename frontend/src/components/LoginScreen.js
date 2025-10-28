import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Baby } from 'lucide-react';

const ModernLoginScreen = () => {
  const { setUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedType, setSelectedType] = useState(null);

  // Mock data - em produção, buscar do backend
  const mockChildren = [
    { id: '1', name: 'Maria', avatar: '👧' },
    { id: '2', name: 'João', avatar: '👦' },
  ];

  const handleSelectParent = () => {
    // Login direto como pai
    setUser({
      id: 'parent-1',
      name: 'Família',
      role: 'parent',
      email: 'familia@missionkids.com'
    });
  };

  const handleSelectChild = (child) => {
    // Login direto como criança
    setUser({
      id: child.id,
      name: child.name,
      role: 'child',
      avatar: child.avatar,
      email: `${child.name.toLowerCase()}@kids.com`,
      xp: 0,
      level: 1,
      earned: 0
    });
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (type === 'parent') {
      handleSelectParent();
    }
  };

  if (selectedType === 'child') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold font-nunito">
              Selecione a Criança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockChildren.map((child) => (
              <Button
                key={child.id}
                onClick={() => handleSelectChild(child)}
                className="w-full h-20 bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 text-gray-800 rounded-2xl text-xl font-bold"
              >
                <span className="text-4xl mr-3">{child.avatar}</span>
                {child.name}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setSelectedType(null)}
              className="w-full rounded-xl"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white rounded-3xl shadow-2xl">
          <CardHeader className="text-center pt-8">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="text-4xl font-bold font-nunito text-gray-800 mb-2">
              Mission<span className="text-blue-600">Kids</span>
            </h1>
            <p className="text-gray-600 font-nunito">
              Transforme tarefas em diversão!
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="space-y-4 mt-6">
              {/* Botão Criança */}
              <Button
                onClick={() => handleTypeSelect('child')}
                className="w-full h-32 bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 text-gray-800 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center">
                  <div className="text-6xl mb-2">👦</div>
                  <span className="text-xl font-bold">Criança</span>
                </div>
              </Button>

              {/* Botão Pais */}
              <Button
                onClick={() => handleTypeSelect('parent')}
                className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-gray-800 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex flex-col items-center">
                  <div className="text-6xl mb-2">👨‍👩‍👧</div>
                  <span className="text-xl font-bold">Pais</span>
                </div>
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 font-nunito">
                Clique para começar sua aventura!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xs text-white font-medium">XP</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs text-white font-medium">Missões</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs text-white font-medium">Mesada</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernLoginScreen;