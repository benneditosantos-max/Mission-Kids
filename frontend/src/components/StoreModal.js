import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ShoppingBag, Package, X, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const StoreModal = ({ isOpen, onClose, userXP, onPurchaseSuccess }) => {
  const [storeItems, setStoreItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  
  const classificationColors = {
    simple: 'bg-gray-100 text-gray-700 border-gray-300',
    common: 'bg-green-100 text-green-700 border-green-300',
    important: 'bg-blue-100 text-blue-700 border-blue-300',
    rare: 'bg-purple-100 text-purple-700 border-purple-300',
    diamond: 'bg-gradient-to-r from-cyan-100 to-blue-100 text-blue-800 border-blue-400'
  };

  const classificationNames = {
    simple: '⚪ Simples',
    common: '🟢 Comum',
    important: '🔵 Importante',
    rare: '🟣 Raro',
    diamond: '💎 Diamante'
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, inventoryRes] = await Promise.all([
        axios.get('/store/items'),
        axios.get('/store/inventory')
      ]);
      
      setStoreItems(itemsRes.data);
      setInventory(inventoryRes.data);
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    if (userXP < item.xp_cost) {
      toast.error(`Você precisa de ${item.xp_cost} XP, mas só tem ${userXP} XP!`);
      return;
    }

    try {
      const response = await axios.post('/store/purchase', { item_id: item.id });
      toast.success(response.data.message);
      
      // Refresh data
      await fetchData();
      
      // Notify parent component
      if (onPurchaseSuccess) {
        onPurchaseSuccess(response.data.new_xp);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao comprar item';
      toast.error(message);
    }
  };

  const handleEquip = async (item) => {
    try {
      const response = await axios.post('/store/equip', { item_id: item.id });
      toast.success(response.data.message);
      await fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao equipar item';
      toast.error(message);
    }
  };

  const handleUnequip = async (itemId) => {
    try {
      const response = await axios.post('/store/unequip', { item_id: itemId });
      toast.success(response.data.message);
      await fetchData();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const isItemOwned = (itemId) => {
    return inventory.some(invItem => invItem.id === itemId);
  };

  const groupedItems = storeItems.reduce((acc, item) => {
    if (!acc[item.classification]) {
      acc[item.classification] = [];
    }
    acc[item.classification].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold font-nunito text-gray-800">
              🎁 Loja de XP
            </DialogTitle>
            <div className="flex items-center space-x-2 bg-purple-100 rounded-2xl px-4 py-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-600">{userXP} XP</span>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="store">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Loja
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Meu Inventário ({inventory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Carregando itens...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([classification, items]) => (
                  <div key={classification}>
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      {classificationNames[classification]}
                      <Badge className={`ml-3 ${classificationColors[classification]}`}>
                        {items.length} itens
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const owned = isItemOwned(item.id);
                        const canAfford = userXP >= item.xp_cost;
                        
                        return (
                          <Card key={item.id} className={`${owned ? 'border-2 border-green-400' : ''} hover:shadow-lg transition-all`}>
                            <CardContent className="p-4">
                              <div className="text-center mb-3">
                                <div className="text-6xl mb-2">{item.asset_url}</div>
                                <h4 className="font-bold text-gray-800">{item.item_name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                <Badge className={`mt-2 text-xs ${classificationColors[classification]}`}>
                                  {item.item_type === 'avatar' ? '👤 Avatar' : '✨ Acessório'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-center space-x-2 mb-3">
                                <Star className="w-4 h-4 text-purple-600" />
                                <span className="font-bold text-purple-600">{item.xp_cost} XP</span>
                              </div>

                              {owned ? (
                                <Badge className="w-full bg-green-500 text-white justify-center py-2">
                                  <Check className="w-4 h-4 mr-1" />
                                  Comprado
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => handlePurchase(item)}
                                  disabled={!canAfford}
                                  className={`w-full ${
                                    canAfford
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                      : 'bg-gray-300'
                                  } text-white rounded-xl`}
                                >
                                  {canAfford ? '🛒 Comprar' : '🔒 XP Insuficiente'}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory">
            {inventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Inventário Vazio</h3>
                <p className="text-gray-500">Compre itens na loja para começar sua coleção!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <div className="text-6xl mb-2">{item.asset_url}</div>
                        <h4 className="font-bold text-gray-800">{item.item_name}</h4>
                        <Badge className={`mt-2 text-xs ${classificationColors[item.classification]}`}>
                          {classificationNames[item.classification]}
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleEquip(item)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl"
                      >
                        ⚡ Equipar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreModal;
