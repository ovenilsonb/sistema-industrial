import { useState, useMemo } from 'react';
import {
  Search, Package, Filter, ArrowUpRight, ArrowDownRight,
  LayoutGrid, List, SortAsc, AlertCircle, Eye, MoreHorizontal,
  DollarSign, History
} from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

type ViewMode = 'grid' | 'list' | 'alphabetical';
type FilterStatus = 'all' | 'available' | 'low' | 'out_of_stock' | 'expired';

export function Stock() {
  const { inventory, formulas, addInventoryMovement } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [movementQuantity, setMovementQuantity] = useState(1);
  const [movementReason, setMovementReason] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'expired') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(i => i.expirationDate < today && i.quantity > 0);
      } else {
        filtered = filtered.filter(i => i.status === statusFilter);
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => {
        const formula = formulas.find(f => f.id === i.formulaId);
        return (
          formula?.name.toLowerCase().includes(term) ||
          formula?.code.toLowerCase().includes(term) ||
          i.batchCode.toLowerCase().includes(term)
        );
      });
    }

    // Sort
    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => {
        const formulaA = formulas.find(f => f.id === a.formulaId)?.name || '';
        const formulaB = formulas.find(f => f.id === b.formulaId)?.name || '';
        return formulaA.localeCompare(formulaB);
      });
    } else {
      // Default sort by creation date (newest first)
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [inventory, formulas, searchTerm, statusFilter, viewMode]);

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const activeBatches = inventory.filter(i => i.quantity > 0).length;
    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringCount = inventory.filter(i => {
      const expDate = new Date(i.expirationDate);
      return i.quantity > 0 && expDate > today && expDate <= thirtyDaysFromNow;
    }).length;

    return { totalItems, activeBatches, totalValue, expiringCount };
  }, [inventory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getDaysUntilExpiration = (dateStr: string) => {
    const today = new Date();
    const expDate = new Date(dateStr);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMovementSubmit = () => {
    if (selectedItem) {
      addInventoryMovement(selectedItem.id, {
        date: new Date().toISOString(),
        type: movementType,
        quantity: movementQuantity,
        reason: movementReason || (movementType === 'in' ? 'Ajuste de Entrada' : 'Venda'),
        notes: movementNotes
      });
      setIsMovementModalOpen(false);
      setMovementReason('');
      setMovementNotes('');
      setMovementQuantity(1);
    }
  };

  const openMovementModal = (item: InventoryItem, type: 'in' | 'out') => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQuantity(1);
    setIsMovementModalOpen(true);
  };

  const openDetailsModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total em Estoque</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.totalItems} un
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Package className="text-blue-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Lotes Ativos</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.activeBatches}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <LayoutGrid className="text-purple-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Valor em Estoque</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <DollarSign className="text-green-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Alertas de Vencimento</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.expiringCount}
                </p>
                <p className="text-xs text-neutral-400 mt-1">Próximos 30 dias</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="text-amber-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <Package className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Estoque de Produtos
                </h2>
                <p className="text-sm text-neutral-500">Gerencie lotes e validade</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600' 
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600' 
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('alphabetical')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'alphabetical' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-600' 
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <SortAsc size={18} />
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por produto, lote ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                <Filter size={14} /> Status:
              </span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'available', label: 'Disponível' },
                { id: 'low', label: 'Baixo Estoque' },
                { id: 'out_of_stock', label: 'Esgotado' },
                { id: 'expired', label: 'Vencido' },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id as FilterStatus)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === status.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid View */}
          {viewMode !== 'list' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const formula = formulas.find(f => f.id === item.formulaId);
                const daysUntilExp = getDaysUntilExpiration(item.expirationDate);
                const isExpired = daysUntilExp < 0;
                
                return (
                  <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{formula?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-500 font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                            {item.batchCode}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.quantity === 0 ? 'bg-red-100 text-red-700' :
                            item.status === 'low' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.quantity === 0 ? 'Esgotado' : item.status === 'low' ? 'Baixo' : 'Disponível'}
                          </span>
                        </div>
                      </div>
                      {isExpired ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                          VENCIDO
                        </span>
                      ) : daysUntilExp <= 30 ? (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                          {daysUntilExp} dias
                        </span>
                      ) : null}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Fabricação:</span>
                        <span className="text-neutral-900 dark:text-white">{new Date(item.productionDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Vencimento:</span>
                        <span className={`${isExpired ? 'text-red-600 font-bold' : 'text-neutral-900 dark:text-white'}`}>
                          {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Custo Unit.:</span>
                        <span className="text-neutral-900 dark:text-white">{formatCurrency(item.unitCost)}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Quantidade</span>
                          <span className="text-lg font-bold text-indigo-600">{item.quantity}</span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.status === 'low' ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min(100, (item.quantity / 100) * 100)}%` }} // Assuming 100 as base for visualization
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1 text-xs"
                        onClick={() => openMovementModal(item, 'in')}
                      >
                        <ArrowDownRight size={14} className="mr-1 text-green-600" /> Entrada
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1 text-xs"
                        onClick={() => openMovementModal(item, 'out')}
                        disabled={item.quantity <= 0}
                      >
                        <ArrowUpRight size={14} className="mr-1 text-red-600" /> Saída
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="px-2"
                        onClick={() => openDetailsModal(item)}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredInventory.map((item) => {
                const formula = formulas.find(f => f.id === item.formulaId);
                const daysUntilExp = getDaysUntilExpiration(item.expirationDate);
                const isExpired = daysUntilExp < 0;

                return (
                  <div key={item.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 dark:text-white">{formula?.name}</h3>
                          {isExpired && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                              VENCIDO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 rounded text-xs">{item.batchCode}</span>
                          <span>• Fab: {new Date(item.productionDate).toLocaleDateString('pt-BR')}</span>
                          <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                            • Venc: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Quantidade</p>
                        <p className={`font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-neutral-900 dark:text-white'}`}>
                          {item.quantity} un
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Valor Total</p>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => openMovementModal(item, 'in')}
                          title="Entrada"
                        >
                          <ArrowDownRight size={18} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => openMovementModal(item, 'out')}
                          disabled={item.quantity <= 0}
                          title="Saída"
                        >
                          <ArrowUpRight size={18} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openDetailsModal(item)}
                          title="Detalhes"
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {filteredInventory.length === 0 && (
            <div className="py-12 text-center text-neutral-500">
              <Package size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <p>Nenhum item encontrado no estoque</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={movementType === 'in' ? 'Registrar Entrada' : 'Registrar Saída'}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Produto</p>
            <p className="font-medium text-neutral-900 dark:text-white">
              {formulas.find(f => f.id === selectedItem?.formulaId)?.name}
            </p>
            <div className="flex gap-4 mt-2 text-sm text-neutral-500">
              <span>Lote: <span className="font-mono">{selectedItem?.batchCode}</span></span>
              <span>Atual: <strong>{selectedItem?.quantity} un</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Quantidade
            </label>
            <Input
              type="number"
              min="1"
              max={movementType === 'out' ? selectedItem?.quantity : undefined}
              value={movementQuantity}
              onChange={(e) => setMovementQuantity(Math.max(1, parseInt(e.target.value) || 0))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Motivo
            </label>
            <select
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">Selecione um motivo...</option>
              {movementType === 'in' ? (
                <>
                  <option value="Produção">Produção</option>
                  <option value="Devolução">Devolução</option>
                  <option value="Ajuste de Estoque">Ajuste de Estoque</option>
                  <option value="Outro">Outro</option>
                </>
              ) : (
                <>
                  <option value="Venda">Venda</option>
                  <option value="Perda/Avaria">Perda/Avaria</option>
                  <option value="Uso Interno">Uso Interno</option>
                  <option value="Ajuste de Estoque">Ajuste de Estoque</option>
                  <option value="Vencimento">Vencimento</option>
                  <option value="Outro">Outro</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Observações
            </label>
            <textarea
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsMovementModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMovementSubmit}
              disabled={movementType === 'out' && (selectedItem?.quantity || 0) < movementQuantity}
              className={movementType === 'in' ? '!bg-green-600 hover:!bg-green-700' : '!bg-red-600 hover:!bg-red-700'}
            >
              Confirmar {movementType === 'in' ? 'Entrada' : 'Saída'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Lote"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-neutral-500">Produto</p>
                <p className="font-semibold text-neutral-900 dark:text-white text-lg">
                  {formulas.find(f => f.id === selectedItem.formulaId)?.name}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-neutral-500">Lote</p>
                <p className="font-mono font-semibold text-neutral-900 dark:text-white text-lg">
                  {selectedItem.batchCode}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center">
                <p className="text-xs text-neutral-500 uppercase">Quantidade</p>
                <p className="font-bold text-xl text-indigo-600">{selectedItem.quantity}</p>
              </div>
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center">
                <p className="text-xs text-neutral-500 uppercase">Custo Unit.</p>
                <p className="font-bold text-xl text-neutral-700 dark:text-neutral-300">{formatCurrency(selectedItem.unitCost)}</p>
              </div>
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center">
                <p className="text-xs text-neutral-500 uppercase">Valor Total</p>
                <p className="font-bold text-xl text-green-600">{formatCurrency(selectedItem.quantity * selectedItem.unitCost)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <History size={18} />
                Histórico de Movimentações
              </h4>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-neutral-500">Data</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-500">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium text-neutral-500">Qtd</th>
                      <th className="px-4 py-2 text-left font-medium text-neutral-500">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {[...selectedItem.movements].reverse().map((movement) => (
                      <tr key={movement.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-4 py-2">
                          {new Date(movement.date).toLocaleDateString('pt-BR')} {new Date(movement.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            movement.type === 'in' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {movement.type === 'in' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {movement.type === 'in' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {movement.quantity}
                        </td>
                        <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                          {movement.reason}
                          {movement.notes && (
                            <p className="text-xs text-neutral-400 italic">{movement.notes}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
