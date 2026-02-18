import { useState, useMemo } from 'react';
import {
  Plus, Search, Factory as FactoryIcon, Trash2, Edit2,
  Calendar, Package, Printer, ChevronDown, ChevronUp,
  LayoutGrid, List, SortAsc, CheckCircle, Clock, XCircle, PlayCircle,
  Minus, Scale, Settings
} from 'lucide-react';
import { useStore, ProductionOrder } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type ViewMode = 'grid' | 'list' | 'alphabetical';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'warning', icon: Clock },
  in_progress: { label: 'Em Produção', color: 'info', icon: PlayCircle },
  completed: { label: 'Concluído', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'danger', icon: XCircle },
};

export function Factory() {
  const { 
    productionOrders, 
    addProductionOrder, 
    updateProductionOrder, 
    deleteProductionOrder,
    getNextProductionCode,
    formulas, 
    rawMaterials,
    addInventoryItem,
    inventory,
    batchConfig,
    updateBatchConfig,
    salesOrders,
    updateSalesOrder
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchConfigOpen, setIsBatchConfigOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // Form states
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProductionOrder['status']>('pending');
  const [batchCode, setBatchCode] = useState('');

  const selectedFormula = formulas.find(f => f.id === selectedFormulaId);

  // Auto-generate batch code
  const generateBatchCode = (formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return '';

    let prefix = '';
    // Check global batch config first, then formula specific, then default
    if (batchConfig && batchConfig[formula.name]) {
      prefix = batchConfig[formula.name].toUpperCase();
    } else if (formula.batchPrefix) {
      prefix = formula.batchPrefix.toUpperCase();
    } else {
      // Get first 4 letters, uppercase, remove spaces/accents/special chars
      prefix = formula.name
        .toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^A-Z]/g, "") // Keep only letters
        .substring(0, 4);
    }
      
    // Count existing inventory items for this formula to generate sequential number
    const existingCount = inventory.filter(i => i.formulaId === formulaId).length + 
                          productionOrders.filter(o => o.formulaId === formulaId).length;
    
    const sequence = (existingCount + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  };

  // Update batch code when formula is selected
  const handleFormulaChange = (id: string) => {
    setSelectedFormulaId(id);
    const formula = formulas.find(f => f.id === id);
    if (formula) {
      setQuantity(formula.yield);
      if (!editingOrder) {
        setBatchCode(generateBatchCode(id));
        
        // Default expiration (2 years from now)
        const twoYearsLater = new Date();
        twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
        setExpirationDate(twoYearsLater.toISOString().split('T')[0]);
      }
    }
  };

  // Calcular proporção baseada na quantidade
  const scaleFactor = selectedFormula ? quantity / selectedFormula.yield : 1;

  // Função para obter o valor unitário de uma matéria-prima (considerando variantes)
  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      return variant?.unitValue || 0;
    }
    
    return material.unitValue;
  };

  // Função para obter o nome completo de um ingrediente (material + variante)
  const getIngredientFullName = (materialId: string, variantName?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 'Material não encontrado';
    
    if (material.hasVariants && variantName) {
      return `${material.name} - ${variantName}`;
    }
    
    return material.name;
  };

  const calculateFormulaCost = (formulaId: string, qty: number) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return 0;
    
    const factor = qty / formula.yield;
    return formula.ingredients.reduce((total, ing) => {
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      return total + unitValue * ing.quantity * factor;
    }, 0);
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    const initialFormula = formulas[0];
    setSelectedFormulaId(initialFormula?.id || '');
    setProductionDate(new Date().toISOString().split('T')[0]);
    
    // Default expiration (2 years)
    const twoYearsLater = new Date();
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
    setExpirationDate(twoYearsLater.toISOString().split('T')[0]);
    
    setQuantity(initialFormula?.yield || 1);
    setNotes('');
    setStatus('pending');
    
    if (initialFormula) {
      setBatchCode(generateBatchCode(initialFormula.id));
    } else {
      setBatchCode('');
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (order: ProductionOrder) => {
    setEditingOrder(order);
    setSelectedFormulaId(order.formulaId);
    setProductionDate(order.productionDate);
    setExpirationDate(order.expirationDate || '');
    setQuantity(order.quantity);
    setNotes(order.notes);
    setStatus(order.status);
    setBatchCode(order.batchCode || '');
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedFormulaId) return;

    // Se o status mudou para 'completed', adicionar ao estoque
    const shouldAddToInventory = status === 'completed' && 
      (!editingOrder || editingOrder.status !== 'completed');

    if (shouldAddToInventory) {
      const formula = formulas.find(f => f.id === selectedFormulaId);
      if (formula) {
        // Calcular custo unitário
        const totalCost = calculateFormulaCost(selectedFormulaId, quantity);
        const unitCost = totalCost / quantity;

        addInventoryItem({
          formulaId: selectedFormulaId,
          batchCode: batchCode,
          productionDate: productionDate,
          expirationDate: expirationDate,
          quantity: quantity,
          unitCost: unitCost,
          status: 'available',
          notes: notes,
        });
      }
    }

    // Check for Sales Order completion
    const saleId = editingOrder?.saleId;
    if (status === 'completed' && saleId) {
       const relatedOrders = productionOrders.filter(p => p.saleId === saleId && p.id !== editingOrder?.id);
       const allCompleted = relatedOrders.every(p => p.status === 'completed');
       
       if (allCompleted) {
         updateSalesOrder(saleId, { status: 'completed' });
       }
    }

    if (editingOrder) {
      updateProductionOrder(editingOrder.id, {
        formulaId: selectedFormulaId,
        quantity,
        productionDate,
        status,
        notes,
        batchCode,
        expirationDate,
      });
    } else {
      addProductionOrder({
        formulaId: selectedFormulaId,
        quantity,
        productionDate,
        status,
        notes,
        batchCode,
        expirationDate,
      });
    }
    setIsModalOpen(false);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrders(newExpanded);
  };

  const handlePrintReport = (order: ProductionOrder) => {
    const formula = formulas.find(f => f.id === order.formulaId);
    if (!formula) return;

    const factor = order.quantity / formula.yield;
    const totalCost = calculateFormulaCost(order.formulaId, order.quantity);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Calcular total apenas de produtos químicos para porcentagem
    const totalChemicalQty = formula.ingredients.reduce((total, ing) => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      if (material?.isChemical !== false) {
        return total + (ing.quantity * factor);
      }
      return total;
    }, 0);

    const ingredientRows = formula.ingredients.map((ing) => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      const originalQty = ing.quantity;
      const proportionalQty = ing.quantity * factor;
      const cost = unitValue * proportionalQty;
      const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantName);
      const isChemical = material?.isChemical !== false;
      const percentage = isChemical && totalChemicalQty > 0 
        ? ((proportionalQty / totalChemicalQty) * 100).toFixed(1) 
        : '—';

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <div>
              <span style="font-weight: 500;">${fullName}</span>
              ${ing.variantName ? `<span style="font-style: italic; color: #8b5cf6; margin-left: 4px;">(${ing.variantName})</span>` : ''}
              <span style="font-style: italic; color: #6b7280; margin-left: 8px;">(${material?.sku || ''})</span>
            </div>
            ${!isChemical ? '<span style="font-size: 10px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #6b7280;">Embalagem</span>' : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${originalQty.toFixed(3)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-weight: 600; color: #16a34a; background: #f0fdf4;">${proportionalQty.toFixed(3)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${material?.unitType || ''}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(cost)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${percentage}${percentage !== '—' ? '%' : ''}</td>
        </tr>
      `;
    }).join('');

    const statusConfig = STATUS_CONFIG[order.status];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordem de Produção - ${order.code}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 3px solid #3b82f6; margin-bottom: 20px; }
          .order-code { font-size: 24pt; font-weight: 700; color: #3b82f6; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { padding: 12px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb; }
          .stat-card label { font-size: 9pt; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px; }
          .stat-card .value { font-size: 16pt; font-weight: 700; }
          .supply-list { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; }
          .supply-list-icon { width: 50px; height: 50px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 9pt; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e5e7eb; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #94a3b8; display: flex; justify-content: space-between; }
          .scale-badge { display: inline-flex; align-items: center; gap: 8px; background: #dbeafe; border: 1px solid #3b82f6; padding: 8px 16px; border-radius: 10px; color: #1d4ed8; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="order-code">${order.code}</div>
            <p style="color: #64748b; margin-top: 5px;">Ordem de Produção</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10pt; color: #64748b;">Data de Produção</p>
            <p style="font-size: 14pt; font-weight: 600;">${new Date(order.productionDate).toLocaleDateString('pt-BR')}</p>
            <span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 20px; font-size: 10pt; font-weight: 600; background: ${
              order.status === 'completed' ? '#dcfce7' : 
              order.status === 'in_progress' ? '#dbeafe' : 
              order.status === 'cancelled' ? '#fee2e2' : '#fef3c7'
            }; color: ${
              order.status === 'completed' ? '#166534' : 
              order.status === 'in_progress' ? '#1d4ed8' : 
              order.status === 'cancelled' ? '#dc2626' : '#92400e'
            };">
              ${statusConfig.label}
            </span>
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
          <h2 style="font-size: 18pt; margin-bottom: 5px;">${formula.name}</h2>
          <p style="color: #64748b;">Código: ${formula.code}</p>
        </div>

        ${formula.supplyListName ? `
        <div class="supply-list">
          <div class="supply-list-icon">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div>
            <p style="font-size: 10pt; color: #92400e; text-transform: uppercase;">Lista de Insumo</p>
            <p style="font-size: 16pt; font-weight: 700; color: #78350f;">${formula.supplyListName}</p>
          </div>
        </div>
        ` : ''}

        <div class="stats">
          <div class="stat-card">
            <label>Rendimento Original</label>
            <span class="value" style="color: #64748b;">${formula.yield} un</span>
          </div>
          <div class="stat-card" style="background: #f0fdf4; border-color: #86efac;">
            <label>Quantidade a Produzir</label>
            <span class="value" style="color: #16a34a;">${order.quantity} un</span>
          </div>
          <div class="stat-card">
            <label>Custo Total</label>
            <span class="value" style="color: #3b82f6;">${formatCurrency(totalCost)}</span>
          </div>
          <div class="stat-card">
            <label>Custo/Unidade</label>
            <span class="value" style="color: #8b5cf6;">${formatCurrency(totalCost / order.quantity)}</span>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <span class="scale-badge">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/></svg>
            Fator de Escala: ${scaleFactor.toFixed(2)}x
          </span>
          <span style="font-size: 10pt; color: #64748b; margin-left: 10px;">
            (Todas as quantidades são multiplicadas por este fator)
          </span>
        </div>

        <h3 style="font-size: 12pt; margin-bottom: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
          Lista de Ingredientes
        </h3>

        <table>
          <thead>
            <tr>
              <th>Matéria-Prima</th>
              <th style="text-align: right;">Qtd. Original</th>
              <th style="text-align: right; background: #f0fdf4;">Qtd. Proporcional</th>
              <th style="text-align: center;">Unidade</th>
              <th style="text-align: right;">Custo</th>
              <th style="text-align: center;">%</th>
            </tr>
          </thead>
          <tbody>
            ${ingredientRows}
            <tr style="background: #f8fafc; font-weight: 600;">
              <td style="padding: 10px 8px;" colspan="4">TOTAL</td>
              <td style="padding: 10px 8px; text-align: right; color: #3b82f6;">${formatCurrency(totalCost)}</td>
              <td style="padding: 10px 8px; text-align: center;">100%</td>
            </tr>
          </tbody>
        </table>

        ${order.notes ? `
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
          <h4 style="font-size: 10pt; color: #92400e; margin-bottom: 5px;">OBSERVAÇÕES</h4>
          <p style="color: #78350f;">${order.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <span>Ohana Clean - Sistema de Gestão de Produção</span>
          <span>Gerado em ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredOrders = useMemo(() => {
    let filtered = productionOrders.filter((order) => {
      const formula = formulas.find(f => f.id === order.formulaId);
      return (
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula?.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => {
        const formulaA = formulas.find(f => f.id === a.formulaId)?.name || '';
        const formulaB = formulas.find(f => f.id === b.formulaId)?.name || '';
        return formulaA.localeCompare(formulaB);
      });
    }

    return filtered;
  }, [productionOrders, formulas, searchTerm, viewMode]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <FactoryIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Fábrica
                </h2>
                <p className="text-sm text-neutral-500">{productionOrders.length} ordens de produção</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botões de visualização */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600' 
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Visualização em blocos"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600' 
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Visualização em lista"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('alphabetical')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'alphabetical' 
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600' 
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Ordem alfabética"
                >
                  <SortAsc size={18} />
                </button>
              </div>
              <Button variant="secondary" onClick={() => setIsBatchConfigOpen(true)} className="px-3" title="Configurar Lotes">
                <Settings size={18} />
              </Button>
              <Button onClick={openCreateModal}>
                <Plus size={18} />
                Nova Ordem
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <Input
              placeholder="Buscar por código, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="p-4 space-y-2">
              {filteredOrders.map((order) => {
                const formula = formulas.find(f => f.id === order.formulaId);
                const totalCost = calculateFormulaCost(order.formulaId, order.quantity);
                const statusConfig = STATUS_CONFIG[order.status];
                const StatusIcon = statusConfig.icon;
                const isSaleOrigin = order.origin === 'sale';
                const salesOrder = isSaleOrigin && order.saleId ? salesOrders.find(s => s.id === order.saleId) : null;

                return (
                  <div 
                    key={order.id} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      isSaleOrigin 
                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30' 
                        : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <FactoryIcon size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-blue-600 dark:text-blue-400">{order.code}</h3>
                          <Badge variant={statusConfig.color as 'success' | 'warning' | 'info' | 'danger'} className="text-xs">
                            <StatusIcon size={12} className="mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {isSaleOrigin && (
                            <Badge variant={order.status === 'completed' ? 'success' : 'danger'} className="text-xs">
                              {salesOrder ? `Pedido ${salesOrder.saleSequence}` : 'Venda'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-neutral-900 dark:text-white">{formula?.name || 'Fórmula não encontrada'}</p>
                          {order.batchCode && (
                            <Badge variant="default" className="text-[10px] font-mono">
                              Lote: {order.batchCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Data</p>
                        <p className="font-medium">{new Date(order.productionDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Quantidade</p>
                        <p className="font-medium text-green-600">{order.quantity} un</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Custo Total</p>
                        <p className="font-medium text-blue-600">{formatCurrency(totalCost)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReport(order)}
                          className="!p-2"
                          title="Imprimir"
                        >
                          <Printer size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(order)}
                          className="!p-2"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(order.id)}
                          className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid/Block View */}
          {(viewMode === 'grid' || viewMode === 'alphabetical') && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredOrders.map((order) => {
                const formula = formulas.find(f => f.id === order.formulaId);
                const totalCost = calculateFormulaCost(order.formulaId, order.quantity);
                const costPerUnit = totalCost / order.quantity;
                const isExpanded = expandedOrders.has(order.id);
                const statusConfig = STATUS_CONFIG[order.status];
                const StatusIcon = statusConfig.icon;
                const factor = formula ? order.quantity / formula.yield : 1;
                const isSaleOrigin = order.origin === 'sale';
                const salesOrder = isSaleOrigin && order.saleId ? salesOrders.find(s => s.id === order.saleId) : null;

                return (
                  <div key={order.id} className={`transition-colors ${
                      isSaleOrigin 
                        ? 'bg-red-50 dark:bg-red-900/10' 
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {order.code}
                            </h3>
                            <Badge variant={statusConfig.color as 'success' | 'warning' | 'info' | 'danger'}>
                              <StatusIcon size={14} className="mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {isSaleOrigin && (
                              <Badge variant={order.status === 'completed' ? 'success' : 'danger'}>
                                {salesOrder ? `Pedido ${salesOrder.saleSequence}` : 'Venda'}
                              </Badge>
                            )}
                            {formula?.supplyListName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Package size={12} />
                                {formula.supplyListName}
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
                            {formula?.name || 'Fórmula não encontrada'}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <p className="text-sm text-neutral-500">
                              Código: {formula?.code}
                            </p>
                            {order.batchCode && (
                              <span className="text-sm font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                Lote: {order.batchCode}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-neutral-400" />
                              <span className="text-neutral-500">Data:</span>
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {new Date(order.productionDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <Package size={16} className="text-green-500" />
                              <span className="text-green-700 dark:text-green-400">Quantidade:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {order.quantity} unidades
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                              <Scale size={16} className="text-blue-500" />
                              <span className="text-blue-700 dark:text-blue-400">Escala:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {factor.toFixed(2)}x
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Custo Total:</span>{' '}
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(totalCost)}
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Custo/Unidade:</span>{' '}
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {formatCurrency(costPerUnit)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReport(order)}
                            className="!p-2"
                            title="Imprimir"
                          >
                            <Printer size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(order)}
                            className="!p-2"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(order.id)}
                            className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(order.id)}
                            className="!p-2"
                            title={isExpanded ? 'Recolher' : 'Expandir'}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && formula && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                            Lista de Ingredientes Proporcionais
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                  <th className="py-2 px-3 text-left font-medium text-neutral-500">Matéria-Prima</th>
                                  <th className="py-2 px-3 text-right font-medium text-neutral-500">Qtd. Original</th>
                                  <th className="py-2 px-3 text-right font-medium text-neutral-500 bg-green-50 dark:bg-green-900/20">Qtd. Proporcional</th>
                                  <th className="py-2 px-3 text-center font-medium text-neutral-500">Un</th>
                                  <th className="py-2 px-3 text-right font-medium text-neutral-500">Custo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formula.ingredients.map((ing, index) => {
                                  const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                                  const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
                                  const proportionalQty = ing.quantity * factor;
                                  const cost = unitValue * proportionalQty;
                                  const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantName);

                                  return (
                                    <tr key={index} className="border-b border-neutral-100 dark:border-neutral-700">
                                      <td className="py-2 px-3">
                                        <span className="font-medium">{fullName}</span>
                                        {ing.variantName && (
                                          <span className="ml-2 text-xs text-purple-500 italic">({ing.variantName})</span>
                                        )}
                                        <span className="ml-2 text-xs text-neutral-400 italic">({material?.sku})</span>
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-neutral-500">
                                        {ing.quantity.toFixed(3)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-green-600 bg-green-50 dark:bg-green-900/20">
                                        {proportionalQty.toFixed(3)}
                                      </td>
                                      <td className="py-2 px-3 text-center text-neutral-500">
                                        {material?.unitType}
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium">
                                        {formatCurrency(cost)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-neutral-100 dark:bg-neutral-700 font-semibold">
                                  <td colSpan={4} className="py-2 px-3">TOTAL</td>
                                  <td className="py-2 px-3 text-right text-blue-600">{formatCurrency(totalCost)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                        {order.notes && (
                          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                              Observações
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <FactoryIcon className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">Nenhuma ordem de produção encontrada</p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus size={18} />
                Criar Primeira Ordem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? 'Editar Ordem de Produção' : 'Nova Ordem de Produção'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Código da ordem */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <FactoryIcon className="text-blue-500" size={24} />
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase">Código da Ordem</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {editingOrder?.code || getNextProductionCode()}
                </p>
              </div>
            </div>
          </div>

          {/* Seleção do Produto */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Produto (Fórmula) *
            </label>
            <select
              value={selectedFormulaId}
              onChange={(e) => handleFormulaChange(e.target.value)}
              disabled={!!editingOrder} // Don't allow changing product on edit to avoid messing up batch logic for now
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                transition-all duration-200 appearance-none cursor-pointer
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-50"
            >
              {formulas.map((formula) => (
                <option key={formula.id} value={formula.id}>
                  {formula.name} ({formula.code}) - Rend: {formula.yield} un
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lote */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Lote
              </label>
              <input
                type="text"
                value={batchCode}
                readOnly
                className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm font-mono
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 mt-1">Gerado automaticamente</p>
            </div>

            {/* Vencimento */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                  transition-all duration-200
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Data de Produção */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Data de Produção *
            </label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                transition-all duration-200
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Quantidade com controles */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Quantidade a Produzir *
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 10))}
                  className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Minus size={16} />
                  <span className="sr-only">-10</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg font-bold
                    transition-all duration-200
                    focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100
                    dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 10)}
                  className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Plus size={16} />
                  <span className="sr-only">+10</span>
                </button>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="1"
                max={Math.max(1000, quantity * 2)}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
              />
              
              {/* Atalhos rápidos */}
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 200, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      quantity === val
                        ? 'bg-green-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exibição da Lista de Insumo e Proporção */}
          {selectedFormula && (
            <div className="space-y-4">
              {/* Lista de Insumo */}
              {selectedFormula.supplyListName && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                      <Package className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-medium">Lista de Insumo</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                        {selectedFormula.supplyListName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards de Proporção */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center">
                  <p className="text-xs text-neutral-500 uppercase">Rend. Original</p>
                  <p className="text-xl font-bold text-neutral-700 dark:text-neutral-300">{selectedFormula.yield} un</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-center border-2 border-green-300 dark:border-green-700">
                  <p className="text-xs text-green-600 uppercase">Qtd. Desejada</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">{quantity} un</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-center">
                  <p className="text-xs text-blue-600 uppercase">Fator Escala</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{scaleFactor.toFixed(2)}x</p>
                </div>
              </div>

              {/* Tabela de Ingredientes */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <h4 className="font-medium text-neutral-700 dark:text-neutral-300">
                    Ingredientes com Proporção Aplicada
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left font-medium text-neutral-500">Ingrediente</th>
                        <th className="py-2 px-3 text-right font-medium text-neutral-500">Original</th>
                        <th className="py-2 px-3 text-right font-medium text-neutral-500 bg-green-50 dark:bg-green-900/20">Proporcional</th>
                        <th className="py-2 px-3 text-center font-medium text-neutral-500">Un</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFormula.ingredients.map((ing, index) => {
                        const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                        const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantName);
                        const proportionalQty = ing.quantity * scaleFactor;

                        return (
                          <tr key={index} className="border-b border-neutral-100 dark:border-neutral-800">
                            <td className="py-2 px-3">
                              <span className="font-medium">{fullName}</span>
                              {ing.variantName && (
                                <span className="ml-1 text-xs text-purple-500">({ing.variantName})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-500">
                              {ing.quantity.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-green-600 bg-green-50 dark:bg-green-900/20">
                              {proportionalQty.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 text-center text-neutral-500">
                              {material?.unitType}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custo Total */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Custo Total da Produção</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculateFormulaCost(selectedFormulaId, quantity))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Custo por Unidade</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(calculateFormulaCost(selectedFormulaId, quantity) / quantity)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductionOrder['status'])}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                transition-all duration-200 appearance-none cursor-pointer
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Produção</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                transition-all duration-200
                focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Observações sobre a produção..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedFormulaId}>
              {editingOrder ? 'Salvar Alterações' : 'Criar Ordem'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Tem certeza que deseja excluir esta ordem de produção? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteConfirm) {
                deleteProductionOrder(deleteConfirm);
                setDeleteConfirm(null);
              }
            }}
          >
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Batch Config Modal */}
      <Modal
        isOpen={isBatchConfigOpen}
        onClose={() => setIsBatchConfigOpen(false)}
        title="Configuração de Lotes"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Settings className="text-blue-600 mt-1" size={20} />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Personalizar Prefixos</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Defina os prefixos usados para gerar o número de lote de cada produto.
                  Ex: "AMACIANTE" &rarr; "AMAC".
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {formulas.map(formula => {
              const currentPrefix = batchConfig[formula.name] || 
                                  formula.batchPrefix || 
                                  formula.name.toUpperCase().substring(0, 4);
              
              return (
                <div key={formula.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">{formula.name}</p>
                    <p className="text-xs text-neutral-500">{formula.code}</p>
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full px-3 py-1.5 text-sm font-mono text-center uppercase border border-neutral-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                      value={currentPrefix}
                      onChange={(e) => updateBatchConfig(formula.name, e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button onClick={() => setIsBatchConfigOpen(false)}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
