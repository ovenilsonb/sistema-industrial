import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2, AlertCircle, Package, Copy, Image, X, ChevronDown, ChevronUp, Layers, FlaskConical } from 'lucide-react';
import { useStore, RawMaterial, UnitType, RawMaterialVariant } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const unitOptions = [
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'LT', label: 'Litro (LT)' },
  { value: 'UNID', label: 'Unidade (UNID)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'CM', label: 'Centímetro (CM)' },
  { value: 'G', label: 'Grama (G)' },
];

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().min(1, 'Código SKU é obrigatório'),
  unitType: z.string().min(1, 'Tipo de unidade é obrigatório'),
  unitValue: z.number().min(0, 'Valor deve ser 0 ou maior'),
  supplier: z.string().min(1, 'Fornecedor é obrigatório'),
  minStock: z.number().min(0, 'Estoque mínimo deve ser 0 ou maior'),
  currentStock: z.number().min(0, 'Estoque atual deve ser 0 ou maior'),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().optional(),
  hasVariants: z.boolean().optional(),
  expirationDate: z.string().optional(),
  isIndeterminate: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

// Componente para gerenciar variantes
function VariantsManager({
  variants,
  onChange,
}: {
  variants: RawMaterialVariant[];
  onChange: (variants: RawMaterialVariant[]) => void;
}) {
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', unitValue: 0 });

  const addVariant = () => {
    if (newVariant.name && newVariant.sku) {
      const variant: RawMaterialVariant = {
        id: Math.random().toString(36).substring(2, 15),
        name: newVariant.name,
        sku: newVariant.sku,
        unitValue: newVariant.unitValue,
      };
      onChange([...variants, variant]);
      setNewVariant({ name: '', sku: '', unitValue: 0 });
    }
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof RawMaterialVariant, value: string | number) => {
    onChange(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={18} className="text-purple-500" />
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Variantes do Produto</span>
      </div>

      {/* Lista de variantes existentes */}
      {variants.length > 0 && (
        <div className="space-y-2 mb-4">
          {variants.map((variant) => (
            <div key={variant.id} className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome da variante"
                />
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Código SKU"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={variant.unitValue.toFixed(2).replace('.', ',')}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      const numValue = parseInt(rawValue || '0', 10) / 100;
                      updateVariant(variant.id, 'unitValue', numValue);
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeVariant(variant.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para nova variante */}
      <div className="flex items-end gap-2">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Nome da Variante</label>
            <input
              type="text"
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Coco"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Código SKU</label>
            <input
              type="text"
              value={newVariant.sku}
              onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: ESS-COC"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Valor Unitário</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={newVariant.unitValue.toFixed(2).replace('.', ',')}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  const numValue = parseInt(rawValue || '0', 10) / 100;
                  setNewVariant({ ...newVariant, unitValue: numValue });
                }}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={addVariant}
          disabled={!newVariant.name || !newVariant.sku}
          className="!bg-purple-500 hover:!bg-purple-600"
        >
          <Plus size={16} />
          Adicionar
        </Button>
      </div>

      {/* Resumo */}
      {variants.length > 0 && (
        <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{variants.length}</span> variante(s) cadastrada(s) • 
            Preços de <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(Math.min(...variants.map(v => v.unitValue)))}</span> até <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(Math.max(...variants.map(v => v.unitValue)))}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export function RawMaterials() {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof RawMaterial>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [unitValueInput, setUnitValueInput] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<RawMaterialVariant[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isChemical, setIsChemical] = useState(true);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // Função para navegar para o próximo campo ou submeter
  const handleEnterNavigation = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const now = Date.now();
      
      // Se ENTER foi pressionado 2x em menos de 500ms, vai para o botão de submeter
      if (now - lastEnterTime < 500) {
        submitButtonRef.current?.focus();
        submitButtonRef.current?.click();
        setLastEnterTime(0);
        return;
      }
      
      setLastEnterTime(now);
      
      // Busca o próximo campo pelo data-field-index
      const nextField = formContainerRef.current?.querySelector(`[data-field-index="${currentIndex + 1}"]`) as HTMLElement;
      if (nextField) {
        nextField.focus();
      } else {
        submitButtonRef.current?.focus();
      }
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'active',
      unitType: 'KG',
      unitValue: 0,
      minStock: 0,
      currentStock: 0,
      imageUrl: '',
      hasVariants: false,
      expirationDate: '',
      isIndeterminate: false,
    },
  });

  const openCreateModal = () => {
    setEditingMaterial(null);
    setUnitValueInput(0);
    setImagePreview('');
    setHasVariants(false);
    setVariants([]);
    setIsChemical(true); // Por padrão, é produto químico
    setIsIndeterminate(false);
    reset({
      name: '',
      sku: '',
      unitType: 'KG',
      unitValue: 0,
      supplier: '',
      minStock: 0,
      currentStock: 0,
      status: 'active',
      imageUrl: '',
      hasVariants: false,
      expirationDate: '',
      isIndeterminate: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (material: RawMaterial) => {
    setEditingMaterial(material);
    setUnitValueInput(material.unitValue);
    setImagePreview(material.imageUrl || '');
    setHasVariants(material.hasVariants || false);
    setVariants(material.variants || []);
    setIsChemical(material.isChemical !== false); // Se não está definido, assume como químico
    setIsIndeterminate(material.isIndeterminate || false);
    reset({
      name: material.name,
      sku: material.sku,
      unitType: material.unitType,
      unitValue: material.unitValue,
      supplier: material.supplier,
      minStock: material.minStock,
      currentStock: material.currentStock,
      status: material.status,
      imageUrl: material.imageUrl || '',
      hasVariants: material.hasVariants || false,
      expirationDate: material.expirationDate || '',
      isIndeterminate: material.isIndeterminate || false,
    });
    setIsModalOpen(true);
  };

  const duplicateMaterial = (material: RawMaterial) => {
    addRawMaterial({
      name: `${material.name} (cópia)`,
      sku: `${material.sku}-COPY`,
      unitType: material.unitType,
      unitValue: material.unitValue,
      supplier: material.supplier,
      minStock: material.minStock,
      currentStock: material.currentStock,
      status: material.status,
      imageUrl: material.imageUrl,
      hasVariants: material.hasVariants,
      variants: material.variants?.map(v => ({ ...v, id: Math.random().toString(36).substring(2, 15) })),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setValue('imageUrl', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const onSubmit = (data: FormData) => {
    const formData = {
      ...data,
      unitValue: hasVariants ? 0 : unitValueInput,
      unitType: data.unitType as UnitType,
      hasVariants,
      variants: hasVariants ? variants : undefined,
      isChemical,
      isIndeterminate,
      expirationDate: isIndeterminate ? undefined : data.expirationDate,
    };

    if (editingMaterial) {
      updateRawMaterial(editingMaterial.id, formData);
    } else {
      addRawMaterial(formData);
    }
    setIsModalOpen(false);
    reset();
  };

  const handleDelete = (id: string) => {
    const success = deleteRawMaterial(id);
    if (!success) {
      alert('Esta matéria-prima está em uso em uma fórmula e não pode ser excluída.');
    }
    setDeleteConfirm(null);
  };

  const handleSort = (field: keyof RawMaterial) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredMaterials = rawMaterials
    .filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.variants?.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getExpirationStatus = (material: RawMaterial) => {
    // Se não é químico ou é indeterminado -> Branco com X
    if (material.isChemical === false || material.isIndeterminate) {
      return { color: 'bg-white border border-neutral-300', icon: 'X', text: 'Indeterminado / Não Químico' };
    }

    if (!material.expirationDate) {
      return { color: 'bg-neutral-400', icon: '?', text: 'Data não informada' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(material.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Vencido
    if (diffDays < 0) {
      return { color: 'bg-purple-600', text: `Vencido há ${Math.abs(diffDays)} dias` };
    }
    
    // 1 semana (7 dias)
    if (diffDays <= 7) {
      return { color: 'bg-red-500', text: `Vence em ${diffDays} dias` };
    }
    
    // 2 meses (60 dias)
    if (diffDays <= 60) {
      return { color: 'bg-amber-400', text: `Vence em ${diffDays} dias` };
    }

    // Mais de 2 meses
    return { color: 'bg-green-500', text: `Vence em ${diffDays} dias` };
  };

  const lowStockItems = rawMaterials.filter(m => m.currentStock <= m.minStock && m.status === 'active');

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'itens'} com estoque baixo
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Package className="text-neutral-600 dark:text-neutral-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Matérias-Primas
                </h2>
                <p className="text-sm text-neutral-500">{rawMaterials.length} itens cadastrados</p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <Plus size={18} />
              Nova Matéria-Prima
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <Input
              placeholder="Buscar por nome, código, fornecedor ou variante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Foto
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => handleSort('name')}
                  >
                    Nome {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => handleSort('sku')}
                  >
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => handleSort('unitValue')}
                  >
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Químico
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Validade
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredMaterials.map((material) => (
                  <>
                    <tr key={material.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        {material.imageUrl ? (
                          <img 
                            src={material.imageUrl} 
                            alt={material.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Package size={16} className="text-neutral-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {material.hasVariants && (
                            <button
                              onClick={() => toggleRowExpanded(material.id)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                              {expandedRows.includes(material.id) ? (
                                <ChevronUp size={16} className="text-purple-500" />
                              ) : (
                                <ChevronDown size={16} className="text-purple-500" />
                              )}
                            </button>
                          )}
                          <div>
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {material.name}
                            </span>
                            {material.hasVariants && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Layers size={12} className="text-purple-500" />
                                <span className="text-xs text-purple-500">
                                  {material.variants?.length || 0} variantes
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {material.sku}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {material.unitType}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">
                        {material.hasVariants ? (
                          <span className="text-sm text-neutral-500">Varia</span>
                        ) : (
                          formatCurrency(material.unitValue)
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        {material.supplier}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-medium ${
                            material.currentStock <= material.minStock
                              ? 'text-amber-600'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {material.currentStock}/{material.minStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={material.status === 'active' ? 'success' : 'default'}>
                          {material.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {material.isChemical !== false ? (
                          <Badge variant="info" className="gap-1">
                            <FlaskConical size={10} />
                            Químico
                          </Badge>
                        ) : (
                          <Badge variant="default">Não</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center group relative">
                          {(() => {
                            const status = getExpirationStatus(material);
                            return (
                              <>
                                <div 
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${status.color} ${status.icon === 'X' ? 'text-neutral-500' : 'text-white'}`}
                                >
                                  {status.icon}
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                  {status.text}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateMaterial(material)}
                            className="!p-2"
                            title="Duplicar"
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(material)}
                            className="!p-2"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(material.id)}
                            className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* Variantes expandidas */}
                    {material.hasVariants && expandedRows.includes(material.id) && material.variants?.map((variant) => (
                      <tr key={`${material.id}-${variant.id}`} className="bg-purple-50 dark:bg-purple-900/10">
                        <td className="px-6 py-2"></td>
                        <td className="px-6 py-2 pl-14">
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            ↳ {variant.name}
                          </span>
                        </td>
                        <td className="px-6 py-2">
                          <code className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                            {variant.sku}
                          </code>
                        </td>
                        <td className="px-6 py-2 text-sm text-neutral-500">
                          {material.unitType}
                        </td>
                        <td className="px-6 py-2 text-right font-medium text-purple-700 dark:text-purple-300">
                          {formatCurrency(variant.unitValue)}
                        </td>
                        <td colSpan={4}></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredMaterials.length === 0 && (
            <div className="py-12 text-center">
              <Package className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">Nenhuma matéria-prima encontrada</p>
              {searchTerm && (
                <div className="mt-4">
                  <p className="text-sm text-neutral-400 mb-3">
                    Não encontrou "{searchTerm}"?
                  </p>
                  <Button
                    onClick={() => {
                      // Abre o modal de cadastro com o nome preenchido
                      setEditingMaterial(null);
                      setUnitValueInput(0);
                      setImagePreview('');
                      setHasVariants(false);
                      setVariants([]);
                      reset({
                        name: searchTerm,
                        sku: searchTerm.toUpperCase().replace(/\s+/g, '-').substring(0, 10),
                        unitType: 'KG',
                        unitValue: 0,
                        supplier: '',
                        minStock: 0,
                        currentStock: 0,
                        status: 'active',
                        imageUrl: '',
                        hasVariants: false,
                        expirationDate: '',
                        isIndeterminate: false,
                      });
                      setIsModalOpen(true);
                    }}
                    className="!bg-green-600 hover:!bg-green-700"
                  >
                    <Plus size={16} />
                    Cadastrar "{searchTerm}"
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
        size="lg"
      >
        <form ref={formContainerRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Seção de Imagem */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Foto do Produto
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                >
                  <Image size={24} className="text-neutral-400 mb-1" />
                  <span className="text-xs text-neutral-400">Adicionar</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex-1 text-sm text-neutral-500">
                <p>Clique para adicionar uma imagem</p>
                <p className="text-xs mt-1">Formatos: JPG, PNG, GIF (máx. 2MB)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Nome *
              </label>
              <input
                {...register('name')}
                onKeyDown={(e) => handleEnterNavigation(e, 0)}
                data-field-index="0"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Nome da matéria-prima"
              />
              {errors.name?.message && <p className="text-xs text-red-500">{errors.name?.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Código (SKU)
              </label>
              <input
                {...register('sku')}
                onKeyDown={(e) => handleEnterNavigation(e, 1)}
                data-field-index="1"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Código/SKU"
              />
              {errors.sku?.message && <p className="text-xs text-red-500">{errors.sku?.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tipo de Unidade *
              </label>
              <select
                {...register('unitType')}
                onKeyDown={(e) => handleEnterNavigation(e, 2)}
                data-field-index="2"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 appearance-none cursor-pointer
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.unitType?.message && <p className="text-xs text-red-500">{errors.unitType?.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Fornecedor
              </label>
              <input
                {...register('supplier')}
                onKeyDown={(e) => handleEnterNavigation(e, 3)}
                data-field-index="3"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Nome do fornecedor"
              />
              {errors.supplier?.message && <p className="text-xs text-red-500">{errors.supplier?.message}</p>}
            </div>
          </div>

          {/* Toggle para variantes */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
            <input
              type="checkbox"
              id="hasVariants"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="hasVariants" className="flex items-center gap-2 cursor-pointer">
              <Layers size={18} className="text-purple-500" />
              <div>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Este produto tem variantes</span>
                <p className="text-xs text-neutral-500">Ex: Essência com diferentes aromas, cada um com preço diferente</p>
              </div>
            </label>
          </div>

          {/* Se tem variantes, mostra o gerenciador de variantes */}
          {hasVariants ? (
            <VariantsManager variants={variants} onChange={setVariants} />
          ) : (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Valor Unitário *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={unitValueInput.toFixed(2).replace('.', ',')}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(rawValue || '0', 10) / 100;
                    setUnitValueInput(numValue);
                    setValue('unitValue', numValue);
                  }}
                  onKeyDown={(e) => handleEnterNavigation(e, 4)}
                  data-field-index="4"
                  className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm
                    transition-all duration-200 placeholder:text-neutral-400
                    focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                    dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  placeholder="0,00"
                />
              </div>
              {errors.unitValue?.message && <p className="text-xs text-red-500">{errors.unitValue?.message}</p>}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Estoque Mínimo
              </label>
              <input
                type="number"
                {...register('minStock', { valueAsNumber: true })}
                onKeyDown={(e) => handleEnterNavigation(e, 5)}
                data-field-index="5"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="0"
              />
              {errors.minStock?.message && <p className="text-xs text-red-500">{errors.minStock?.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Estoque Atual
              </label>
              <input
                type="number"
                {...register('currentStock', { valueAsNumber: true })}
                onKeyDown={(e) => handleEnterNavigation(e, 6)}
                data-field-index="6"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="0"
              />
              {errors.currentStock?.message && <p className="text-xs text-red-500">{errors.currentStock?.message}</p>}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Status
            </label>
            <select
              {...register('status')}
              onKeyDown={(e) => handleEnterNavigation(e, 7)}
              data-field-index="7"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                transition-all duration-200 appearance-none cursor-pointer
                focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          {/* Toggle Produto Químico */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isChemical ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'} transition-colors`}>
                <FlaskConical size={20} className="text-white" />
              </div>
              <div>
                <span className="font-medium text-neutral-900 dark:text-white">Produto Químico?</span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isChemical 
                    ? 'Entra no cálculo de porcentagem da fórmula' 
                    : 'Não entra no cálculo (ex: embalagem, rótulo, tampa)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChemical(!isChemical)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                isChemical 
                  ? 'bg-blue-500' 
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span 
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  isChemical ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Data de Vencimento
              </label>
              <input
                type="date"
                {...register('expirationDate')}
                disabled={isIndeterminate}
                className={`w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm
                  transition-all duration-200
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:text-white
                  ${isIndeterminate ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed' : 'bg-white dark:bg-neutral-800'}`}
              />
            </div>
            <div className="flex items-end pb-3">
               <div className="flex items-center gap-3 p-3 w-full bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="isIndeterminate"
                  checked={isIndeterminate}
                  onChange={(e) => {
                    setIsIndeterminate(e.target.checked);
                    if (e.target.checked) {
                      setValue('expirationDate', '');
                    }
                  }}
                  className="w-5 h-5 rounded border-neutral-300 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="isIndeterminate" className="flex items-center gap-2 cursor-pointer select-none">
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Indeterminado</span>
                    <p className="text-xs text-neutral-500">Marque se não possui validade</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button ref={submitButtonRef} type="submit">
              {editingMaterial ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Tem certeza que deseja excluir esta matéria-prima? Esta ação não pode ser desfeita.
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
