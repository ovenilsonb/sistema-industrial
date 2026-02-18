import { useState, useEffect } from 'react';
import { useStore, SalesOrder, SalesOrderItem, Formula } from '@/store/useStore';
import { 
  Plus, Search, ShoppingBag, 
  Trash2, Edit, Check, X, Printer,
  MoreVertical, Package, Boxes
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SalesReport } from '@/components/reports/SalesReport';

type ViewMode = 'list' | 'blocks';

export function Sales() {
  const { 
    salesOrders, 
    addSalesOrder, 
    updateSalesOrder, 
    deleteSalesOrder,
    formulas,
    pricings,
    rawMaterials,
    addProductionOrder
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<SalesOrder | null>(null);

  // Filtered orders
  const filteredOrders = salesOrders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.saleSequence.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- New Order State ---
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState<'budget' | 'pending_production'>('budget');
  
  // State for the "Add Item" section
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [salesType, setSalesType] = useState<'retail' | 'wholesale' | 'bundle'>('retail');

  // --- Pricing Calculation Logic ---

  // Helper to get raw material cost (handling variants)
  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      if (variant) return variant.unitValue;
    }
    return material.unitValue;
  };

  // Helper to calculate total formula cost
  const calculateFormulaCost = (formula: Formula) => {
    return formula.ingredients.reduce((total, ing) => {
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      return total + unitValue * ing.quantity;
    }, 0);
  };

  // Helper to calculate the final price based on type
  const calculatePrice = (formulaId: string, type: 'retail' | 'wholesale' | 'bundle') => {
    const formula = formulas.find(f => f.id === formulaId);
    const pricing = pricings.find(p => p.formulaId === formulaId);
    
    if (!formula || !pricing) return 0;

    const totalCost = calculateFormulaCost(formula);
    const costPerUnit = totalCost / formula.yield;
    const totalCostWithFixed = costPerUnit + pricing.fixedCosts;

    let finalPrice = 0;

    if (type === 'retail') {
      finalPrice = totalCostWithFixed * (1 + pricing.retailMarkup / 100);
    } else if (type === 'wholesale') {
      finalPrice = totalCostWithFixed * (1 + pricing.wholesaleMarkup / 100);
    } else if (type === 'bundle') {
      // Bundle Price Logic: Wholesale Price * (1 - Discount)
      const wholesalePrice = totalCostWithFixed * (1 + pricing.wholesaleMarkup / 100);
      finalPrice = wholesalePrice * (1 - pricing.bundleDiscount / 100);
    }

    return parseFloat(finalPrice.toFixed(2));
  };

  // Update price when product or sales type changes
  useEffect(() => {
    if (selectedProduct) {
      const price = calculatePrice(selectedProduct, salesType);
      setUnitPrice(price);
    } else {
      setUnitPrice(0);
    }
  }, [selectedProduct, salesType, formulas, pricings, rawMaterials]);


  // --- Handlers ---

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    const formula = formulas.find(f => f.id === selectedProduct);
    if (!formula) return;

    const newItem: SalesOrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      formulaId: formula.id,
      formulaName: formula.name,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      salesType
    };

    setItems([...items, newItem]);
    
    // Reset item form
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
    setSalesType('retail'); // Reset type to default
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.totalPrice, 0);
  };

  const resetForm = () => {
    setCustomerName('');
    setItems([]);
    setNotes('');
    setOrderStatus('budget');
    setEditingOrder(null);
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
    setSalesType('retail');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (order: SalesOrder) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setItems(order.items);
    setNotes(order.notes || '');
    setOrderStatus(order.status === 'completed' || order.status === 'cancelled' ? 'budget' : order.status as any); // Simplification
    setIsModalOpen(true);
  };

  const handleSaveOrder = () => {
    if (!customerName.trim() || items.length === 0) return;

    const total = calculateTotal();
    
    const orderData = {
      customerName,
      date: new Date().toISOString(),
      items,
      subtotal: total,
      discount: 0,
      total,
      status: orderStatus,
      notes,
    };

    if (editingOrder) {
      updateSalesOrder(editingOrder.id, orderData);
      
      // Check if status changed to pending_production (convert budget to sale)
      if (editingOrder.status === 'budget' && orderStatus === 'pending_production') {
        createProductionOrders(editingOrder.id, items);
      }
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      addSalesOrder({ ...orderData, id: newId });
      
      // If creating directly as sale
      if (orderStatus === 'pending_production') {
        createProductionOrders(newId, items);
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  const createProductionOrders = (salesOrderId: string, orderItems: SalesOrderItem[]) => {
    orderItems.forEach(item => {
      const formula = formulas.find(f => f.id === item.formulaId);
      if (formula) {
        addProductionOrder({
          formulaId: formula.id,
          quantity: item.quantity, // Units to produce
          productionDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          notes: `Venda ${salesOrderId}`,
          origin: 'sale',
          saleId: salesOrderId
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
      deleteSalesOrder(id);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: SalesOrder['status']) => {
    const order = salesOrders.find(o => o.id === id);
    if (!order) return;

    updateSalesOrder(id, { status: newStatus });

    // If changing from Budget to Pending, trigger production
    if (order.status === 'budget' && newStatus === 'pending_production') {
      createProductionOrders(id, order.items);
    }
  };
  
  const handlePrintReport = (order: SalesOrder) => {
    setSelectedOrderForReport(order);
    setIsReportOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'budget':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full border border-gray-200">Orçamento</span>;
      case 'pending_production':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200">Pendente</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">Concluído</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full border border-red-100">Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="text-blue-600" />
            Vendas e Orçamentos
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gerencie seus pedidos, orçamentos e vendas
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
          <Plus size={20} className="mr-2" />
          Nova Venda / Orçamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600' : 'text-neutral-500'}`}
          >
            <MoreVertical size={20} className="rotate-90" />
          </button>
          <button
            onClick={() => setViewMode('blocks')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'blocks' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600' : 'text-neutral-500'}`}
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-current rounded-sm" />
              <div className="w-2 h-2 bg-current rounded-sm" />
              <div className="w-2 h-2 bg-current rounded-sm" />
              <div className="w-2 h-2 bg-current rounded-sm" />
            </div>
          </button>
        </div>
      </div>

      {/* Sales List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <ShoppingBag className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Nenhuma venda encontrada</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Comece criando um novo orçamento ou venda.</p>
        </div>
      ) : (
        <div className={viewMode === 'blocks' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`
                bg-white dark:bg-neutral-800 rounded-xl border transition-all duration-200 hover:shadow-md
                ${viewMode === 'list' ? 'flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4' : 'p-6 flex flex-col gap-4'}
                ${order.status === 'completed' 
                  ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10' 
                  : order.status === 'pending_production'
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10'
                    : 'border-neutral-200 dark:border-neutral-700'
                }
              `}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                    {order.saleSequence}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="text-xs text-neutral-400 ml-auto sm:ml-2">
                    {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white truncate">
                  {order.customerName}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {order.items.length} itens • Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                </p>
                {/* Items Summary (for blocks view) */}
                {viewMode === 'blocks' && (
                  <div className="mt-3 space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex justify-between">
                        <span>{item.quantity}x {item.formulaName}</span>
                        <span className="opacity-70">
                          ({item.salesType === 'retail' ? 'Varejo' : item.salesType === 'wholesale' ? 'Atacado' : 'Fardo'})
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-xs text-neutral-400 italic">
                        + {order.items.length - 3} outros itens...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handlePrintReport(order)}
                  title="Imprimir Relatório"
                >
                  <Printer size={18} className="text-neutral-600" />
                </Button>

                {order.status === 'budget' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(order.id, 'pending_production')}
                    title="Aprovar Venda"
                  >
                    <Check size={18} />
                    <span className="ml-1 hidden sm:inline">Aprovar</span>
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEditModal(order)}
                  title="Editar"
                >
                  <Edit size={18} className="text-blue-600" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(order.id)}
                  title="Excluir"
                >
                  <Trash2 size={18} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? `Editar ${editingOrder.saleSequence}` : 'Nova Venda / Orçamento'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Tipo de Registro
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="budget">Orçamento</option>
                <option value="pending_production">Venda (Enviar para Fábrica)</option>
              </select>
            </div>
          </div>

          {/* Add Item Section */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Plus size={16} /> Adicionar Item
            </h4>
            
            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Produto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione um produto...</option>
                  {formulas.filter(f => f.status === 'final').map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              {/* Sales Type Selection - Buttons */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">Tipo de Venda</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSalesType('retail')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${salesType === 'retail' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                  >
                    <ShoppingBag size={16} />
                    Varejo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesType('wholesale')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${salesType === 'wholesale' 
                        ? 'bg-green-600 text-white shadow-md shadow-green-500/20' 
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                  >
                    <Package size={16} />
                    Atacado
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesType('bundle')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${salesType === 'bundle' 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50'}`}
                  >
                    <Boxes size={16} />
                    Fardo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Preço Unit. (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleAddItem} 
                className="w-full" 
                disabled={!selectedProduct || quantity <= 0}
              >
                <Plus size={18} className="mr-2" />
                Adicionar ao Pedido
              </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <h4 className="font-medium text-neutral-900 dark:text-white">Itens do Pedido</h4>
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500 italic text-center py-4">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                        {item.formulaName}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide
                          ${item.salesType === 'retail' ? 'bg-blue-100 text-blue-700' : 
                            item.salesType === 'wholesale' ? 'bg-green-100 text-green-700' : 
                            'bg-purple-100 text-purple-700'}`
                        }>
                          {item.salesType === 'retail' ? 'Varejo' : item.salesType === 'wholesale' ? 'Atacado' : 'Fardo'}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-500">
                        {item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                      </span>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 hover:bg-red-50 rounded-md text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Total */}
            {items.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-lg font-bold text-neutral-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              placeholder="Notas internas..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOrder} disabled={!customerName || items.length === 0}>
              {editingOrder ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      {isReportOpen && selectedOrderForReport && (
        <SalesReport
          sale={selectedOrderForReport}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
