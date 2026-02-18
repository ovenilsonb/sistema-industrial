import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit2, Trash2, Users, Eye, Phone, Mail, MapPin,
  LayoutGrid, List, SortAsc, ShoppingBag, Calendar, DollarSign
} from 'lucide-react';
import { useStore, Customer } from '@/store/useStore';
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
  cpfCnpj: z.string(),
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

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, addCustomerPurchase } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
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
    setEditingCustomer(null);
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      cpfCnpj: '',
      notes: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      cpfCnpj: customer.cpfCnpj,
      notes: customer.notes,
      status: customer.status,
    });
    setIsModalOpen(true);
  };

  const openHistoryModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsHistoryOpen(true);
  };

  const openPurchaseModal = (customer: Customer) => {
    setViewingCustomer(customer);
    resetPurchase({
      date: new Date().toISOString().split('T')[0],
      description: '',
      value: 0,
      items: '',
    });
    setIsPurchaseModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      addCustomer(data);
    }
    setIsModalOpen(false);
    reset();
  };

  const onSubmitPurchase = (data: PurchaseFormData) => {
    if (viewingCustomer) {
      addCustomerPurchase(viewingCustomer.id, data);
      setIsPurchaseModalOpen(false);
      resetPurchase();
    }
  };

  const handleDelete = (id: string) => {
    deleteCustomer(id);
    setDeleteConfirm(null);
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.cpfCnpj.includes(searchTerm)
    );

    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [customers, searchTerm, viewMode]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalPurchases = (customer: Customer) => {
    return customer.purchaseHistory.reduce((total, p) => total + p.value, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Users className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Clientes
                </h2>
                <p className="text-sm text-neutral-500">{customers.length} clientes cadastrados</p>
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
              <Button onClick={openCreateModal}>
                <Plus size={18} />
                Novo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          {/* Grid View */}
          {(viewMode === 'grid' || viewMode === 'alphabetical') && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} hover className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {customer.name}
                          </h3>
                          <Badge variant={customer.status === 'active' ? 'success' : 'default'}>
                            {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Mail size={14} />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <MapPin size={14} />
                          <span>{customer.city}{customer.state ? `, ${customer.state}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="text-sm">
                        <span className="text-neutral-500">Total Compras:</span>
                        <p className="font-semibold text-green-600">{formatCurrency(getTotalPurchases(customer))}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryModal(customer)}
                          className="!p-2"
                          title="Ver Histórico"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPurchaseModal(customer)}
                          className="!p-2 text-green-600"
                          title="Adicionar Compra"
                        >
                          <ShoppingBag size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(customer)}
                          className="!p-2"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(customer.id)}
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
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">{customer.name}</h3>
                      <p className="text-sm text-neutral-500">{customer.phone} • {customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Total Compras</p>
                      <p className="font-semibold text-green-600">{formatCurrency(getTotalPurchases(customer))}</p>
                    </div>
                    <Badge variant={customer.status === 'active' ? 'success' : 'default'}>
                      {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openHistoryModal(customer)} className="!p-2">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)} className="!p-2">
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(customer.id)}
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

          {filteredCustomers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">Nenhum cliente encontrado</p>
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
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="CPF/CNPJ"
              {...register('cpfCnpj')}
              error={errors.cpfCnpj?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

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
              placeholder="Notas sobre o cliente..."
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
            <Button type="submit">
              {editingCustomer ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Histórico de Compras - ${viewingCustomer?.name}`}
        size="lg"
      >
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total em Compras</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(getTotalPurchases(viewingCustomer))}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Qtd. Compras</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {viewingCustomer.purchaseHistory.length}
                </p>
              </div>
              <Button size="sm" onClick={() => openPurchaseModal(viewingCustomer)}>
                <Plus size={16} />
                Nova Compra
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {viewingCustomer.purchaseHistory.length > 0 ? (
                viewingCustomer.purchaseHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <ShoppingBag size={16} className="text-green-600" />
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
                  <ShoppingBag className="mx-auto mb-2 text-neutral-300" size={32} />
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
        title="Registrar Compra"
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
            placeholder="Ex: Compra de produtos de limpeza"
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
            placeholder="Ex: 2x Desinfetante, 1x Multiuso"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
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
          Tem certeza que deseja excluir este cliente? O histórico de compras também será removido.
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
