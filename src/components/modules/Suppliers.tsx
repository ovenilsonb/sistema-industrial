import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit2, Trash2, Truck, Eye, Phone, Mail, MapPin,
  LayoutGrid, List, SortAsc, Package, Calendar, DollarSign, User
} from 'lucide-react';
import { useStore, Supplier } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type ViewMode = 'grid' | 'list' | 'alphabetical';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.string().length(0)),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  cnpj: z.string(),
  contactPerson: z.string(),
  notes: z.string(),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

const purchaseSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.number().min(0, 'Valor deve ser positivo'),
  items: z.string(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, addSupplierPurchase } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'active',
    },
  });

  const {
    register: registerPurchase,
    handleSubmit: handleSubmitPurchase,
    reset: resetPurchase,
    formState: { errors: purchaseErrors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      cnpj: '',
      contactPerson: '',
      notes: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      cnpj: supplier.cnpj,
      contactPerson: supplier.contactPerson,
      notes: supplier.notes,
      status: supplier.status,
    });
    setIsModalOpen(true);
  };

  const openHistoryModal = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setIsHistoryOpen(true);
  };

  const openPurchaseModal = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    resetPurchase({
      date: new Date().toISOString().split('T')[0],
      description: '',
      value: 0,
      items: '',
    });
    setIsPurchaseModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, data);
    } else {
      addSupplier(data);
    }
    setIsModalOpen(false);
    reset();
  };

  const onSubmitPurchase = (data: PurchaseFormData) => {
    if (viewingSupplier) {
      addSupplierPurchase(viewingSupplier.id, data);
      setIsPurchaseModalOpen(false);
      resetPurchase();
    }
  };

  const handleDelete = (id: string) => {
    deleteSupplier(id);
    setDeleteConfirm(null);
  };

  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.cnpj.includes(searchTerm) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [suppliers, searchTerm, viewMode]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalPurchases = (supplier: Supplier) => {
    return supplier.purchaseHistory.reduce((total, p) => total + p.value, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Truck className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Fornecedores
                </h2>
                <p className="text-sm text-neutral-500">{suppliers.length} fornecedores cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botões de visualização */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-green-600'
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
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-green-600'
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
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-green-600'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Ordem alfabética"
                >
                  <SortAsc size={18} />
                </button>
              </div>
              <Button onClick={openCreateModal} className="!bg-green-600 hover:!bg-green-700">
                <Plus size={18} />
                Novo Fornecedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <Input
              placeholder="Buscar por nome, email, telefone, CNPJ ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          {/* Grid View */}
          {(viewMode === 'grid' || viewMode === 'alphabetical') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} hover className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {supplier.name}
                          </h3>
                          <Badge variant={supplier.status === 'active' ? 'success' : 'default'}>
                            {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {supplier.contactPerson && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <User size={14} />
                          <span>{supplier.contactPerson}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Phone size={14} />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Mail size={14} />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.city && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <MapPin size={14} />
                          <span>{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="text-sm">
                        <span className="text-neutral-500">Total Compras:</span>
                        <p className="font-semibold text-green-600">{formatCurrency(getTotalPurchases(supplier))}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryModal(supplier)}
                          className="!p-2"
                          title="Ver Histórico"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPurchaseModal(supplier)}
                          className="!p-2 text-green-600"
                          title="Registrar Compra"
                        >
                          <Package size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(supplier)}
                          className="!p-2"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(supplier.id)}
                          className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="p-4 space-y-2">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">{supplier.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {supplier.contactPerson && `${supplier.contactPerson} • `}
                        {supplier.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Total Compras</p>
                      <p className="font-semibold text-green-600">{formatCurrency(getTotalPurchases(supplier))}</p>
                    </div>
                    <Badge variant={supplier.status === 'active' ? 'success' : 'default'}>
                      {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openHistoryModal(supplier)} className="!p-2">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(supplier)} className="!p-2">
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(supplier.id)}
                        className="!p-2 text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredSuppliers.length === 0 && (
            <div className="py-12 text-center">
              <Truck className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">Nenhum fornecedor encontrado</p>
              {searchTerm && (
                <Button variant="secondary" size="sm" onClick={openCreateModal} className="mt-4">
                  <Plus size={16} />
                  Cadastrar "{searchTerm}"
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Empresa"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="CNPJ"
              {...register('cnpj')}
              error={errors.cnpj?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Pessoa de Contato"
              {...register('contactPerson')}
              error={errors.contactPerson?.message}
            />
            <Input
              label="Telefone"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Endereço"
            {...register('address')}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              label="Estado"
              {...register('state')}
              error={errors.state?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Observações
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                transition-all duration-200 placeholder:text-neutral-400
                focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="Notas sobre o fornecedor..."
            />
          </div>

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Ativo' },
              { value: 'inactive', label: 'Inativo' },
            ]}
            {...register('status')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="!bg-green-600 hover:!bg-green-700">
              {editingSupplier ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Histórico de Compras - ${viewingSupplier?.name}`}
        size="lg"
      >
        {viewingSupplier && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Total em Compras</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(getTotalPurchases(viewingSupplier))}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Qtd. Compras</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {viewingSupplier.purchaseHistory.length}
                </p>
              </div>
              <Button size="sm" onClick={() => openPurchaseModal(viewingSupplier)} className="!bg-green-600 hover:!bg-green-700">
                <Plus size={16} />
                Nova Compra
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {viewingSupplier.purchaseHistory.length > 0 ? (
                viewingSupplier.purchaseHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Package size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {purchase.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Calendar size={12} />
                          <span>{new Date(purchase.date).toLocaleDateString('pt-BR')}</span>
                          {purchase.items && (
                            <span className="text-neutral-400">• {purchase.items}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(purchase.value)}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-500">
                  <Package className="mx-auto mb-2 text-neutral-300" size={32} />
                  <p>Nenhuma compra registrada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Registrar Compra de Fornecedor"
        size="md"
      >
        <form onSubmit={handleSubmitPurchase(onSubmitPurchase)} className="space-y-4">
          <Input
            label="Data"
            type="date"
            {...registerPurchase('date')}
            error={purchaseErrors.date?.message}
          />

          <Input
            label="Descrição"
            {...registerPurchase('description')}
            error={purchaseErrors.description?.message}
            placeholder="Ex: Compra de insumos"
          />

          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            {...registerPurchase('value', { valueAsNumber: true })}
            error={purchaseErrors.value?.message}
          />

          <Input
            label="Itens (opcional)"
            {...registerPurchase('items')}
            placeholder="Ex: 10L Essência, 20KG Base"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="!bg-green-600 hover:!bg-green-700">
              <DollarSign size={16} />
              Registrar Compra
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Tem certeza que deseja excluir este fornecedor? O histórico de compras também será removido.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
