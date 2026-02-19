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
      
      if (now - lastEnterTime < 500) {
        submitButtonRef.current?.focus();
        submitButtonRef.current?.click();
        setLastEnterTime(0);
        return;
      }
      
      setLastEnterTime(now);
      
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
    setIsChemical(true); 
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
    setIsChemical(material.isChemical !== false);
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

  // Função que retorna a bolinha de status de validade
  const getExpirationDot = (material: RawMaterial) => {
    if (material.isChemical === false || material.isIndeterminate) {
      return (
        <div className="flex items-center justify-center w-4 h-4 bg-white border border-neutral-300 rounded-full shadow-sm" title="Sem prazo de validade (Indeterminado / Não Químico)">
          <span className="text-[10px] font-bold text-neutral-500 leading-none pb-[1px]">x</span>
        </div>
      );
    }
    if (!material.expirationDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(material.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <div className="w-4 h-4 bg-purple-600 rounded-full shadow-sm" title="Vencido" />;
    if (diffDays <= 7) return <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm" title="1 semana para vencer" />;
    if (diffDays <= 60) return <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-sm" title="Até 2 meses para vencer" />;
    return <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm" title="Dentro do prazo" />;
  };

  const getExpirationStatus = (material: RawMaterial) => {
    if (material.isChemical === false || material.isIndeterminate) {
      return { color: 'bg-white border border-neutral-300 text-neutral-600', text: 'Indeterminado' };
    }
    if (!material.expirationDate) {
      return { color: 'bg-neutral-100 text-neutral-600', text: 'Não informada' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(material.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', text: 'Vencido' };
    }
    if (diffDays <= 7) {
      return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', text: `Vence em ${diffDays}d` };
    }
    if (diffDays <= 60) {
      return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', text: `Vence em ${diffDays}d` };
    }
    return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', text: 'No prazo' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Matérias-Primas</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Gerencie o estoque e custo dos insumos
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus size={20} />
          Nova Matéria-Prima
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={20}
              />
              <Input
                placeholder="Buscar por nome, código ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Foto
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => handleSort('name')}
                  >
                    Nome / SKU
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => handleSort('unitValue')}
                  >
                    Custo Unit.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estoque
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
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredMaterials.map((material) => {
                  const isLowStock = material.currentStock <= material.minStock;
                  const expStatus = getExpirationStatus(material);

                  return (
                    <React.Fragment key={material.id}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {material.imageUrl ? (
                              <img
                                src={material.imageUrl}
                                alt={material.name}
                                className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                                <Package size={20} className="text-neutral-400" />
                              </div>
                            )}
                            
                            {/* Bolinha de Status de Validade */}
                            {getExpirationDot(material)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                              {material.name}
                              {material.status === 'inactive' && (
                                <Badge variant="danger">Inativo</Badge>
                              )}
                              {material.hasVariants && (
                                <Badge variant="warning" className="flex items-center gap-1">
                                  <Layers size={12} />
                                  Variantes
                                </Badge>
                              )}
                            </span>
                            <span className="text-sm text-neutral-500">
                              {material.sku} • {material.supplier}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {material.hasVariants ? (
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              Variado
                            </div>
                          ) : (
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {formatCurrency(material.unitValue)}
                              <span className="text-neutral-500 font-normal ml-1">
                                /{material.unitType}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${
                              isLowStock
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {isLowStock && <AlertCircle size={14} />}
                            {material.currentStock} {material.unitType}
                          </div>
                          {isLowStock && (
                            <div className="text-xs text-red-500 mt-1">
                              Mínimo: {material.minStock}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {material.isChemical !== false ? (
                            <FlaskConical size={18} className="mx-auto text-purple-500" title="Produto Químico" />
                          ) : (
                            <Package size={18} className="mx-auto text-neutral-400" title="Produto Não Químico" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={expStatus.color}>
                            {expStatus.text}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {material.hasVariants && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpanded(material.id)}
                                className="!p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                {expandedRows.includes(material.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateMaterial(material)}
                              className="!p-2 text-neutral-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(material)}
                              className="!p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
                            <code className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                              {variant.sku}
                            </code>
                          </td>
                          <td className="px-6 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-300">
                            {formatCurrency(variant.unitValue)}
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                    >
                      Nenhuma matéria-prima encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
        size="lg"
      >
        <form ref={formContainerRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex gap-6">
            <div className="w-32 flex-shrink-0">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Foto do Produto
              </label>
              <div className="relative group">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-xl object-cover border-2 border-neutral-200 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors bg-neutral-50 dark:bg-neutral-800/50"
                  >
                    <Image size={24} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 text-center px-2">Adicionar foto</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Nome da Matéria-Prima
                  </label>
                  <input
                    {...register('name')}
                    onKeyDown={(e) => handleEnterNavigation(e, 0)}
                    data-field-index="0"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    placeholder="Nome da matéria-prima"
                  />
                  {errors.name?.message && <p className="text-xs text-red-500">{errors.name?.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Código (SKU)
                  </label>
                  <input
                    {...register('sku')}
                    onKeyDown={(e) => handleEnterNavigation(e, 1)}
                    data-field-index="1"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    placeholder="Código/SKU"
                  />
                  {errors.sku?.message && <p className="text-xs text-red-500">{errors.sku?.message}</p>}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChemical}
                        onChange={(e) => setIsChemical(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 dark:border-purple-700 dark:bg-neutral-800"
                      />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
                        <FlaskConical size={16} />
                        Produto Químico
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => setHasVariants(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500 dark:border-purple-700 dark:bg-neutral-800"
                      />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
                        <Layers size={16} />
                        Possui Variantes (Ex: Essências)
                      </span>
                    </label>
                  </div>
                </div>

                {!hasVariants && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Unidade de Medida
                      </label>
                      <select
                        {...register('unitType')}
                        onKeyDown={(e) => handleEnterNavigation(e, 2)}
                        data-field-index="2"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      >
                        {unitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.unitType?.message && <p className="text-xs text-red-500">{errors.unitType?.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Custo Unitário (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          onKeyDown={(e) => handleEnterNavigation(e, 3)}
                          data-field-index="3"
                          value={unitValueInput.toFixed(2).replace('.', ',')}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            const numValue = parseInt(rawValue || '0', 10) / 100;
                            setUnitValueInput(numValue);
                            setValue('unitValue', numValue);
                          }}
                          className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>
                      {errors.unitValue?.message && <p className="text-xs text-red-500">{errors.unitValue?.message}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {hasVariants && (
            <VariantsManager variants={variants} onChange={setVariants} />
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Fornecedor
                </label>
                <input
                  {...register('supplier')}
                  onKeyDown={(e) => handleEnterNavigation(e, 4)}
                  data-field-index="4"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  placeholder="Nome do fornecedor"
                />
                {errors.supplier?.message && <p className="text-xs text-red-500">{errors.supplier?.message}</p>}
              </div>
            </div>

            {/* Grupo de Data de Vencimento e Indeterminado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  disabled={isIndeterminate || !isChemical}
                  {...register('expirationDate')}
                  onKeyDown={(e) => handleEnterNavigation(e, 5)}
                  data-field-index="5"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 disabled:opacity-50 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIndeterminate}
                    onChange={(e) => {
                      setIsIndeterminate(e.target.checked);
                      setValue('isIndeterminate', e.target.checked);
                      if (e.target.checked) setValue('expirationDate', '');
                    }}
                    disabled={!isChemical}
                    className="w-4 h-4 text-purple-600 rounded border-neutral-300 focus:ring-purple-500 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Validade Indeterminada
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Estoque Mín.
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('minStock', { valueAsNumber: true })}
                  onKeyDown={(e) => handleEnterNavigation(e, 6)}
                  data-field-index="6"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                  step="0.01"
                  {...register('currentStock', { valueAsNumber: true })}
                  onKeyDown={(e) => handleEnterNavigation(e, 7)}
                  data-field-index="7"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                onKeyDown={(e) => handleEnterNavigation(e, 8)}
                data-field-index="8"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" ref={submitButtonRef}>
              {editingMaterial ? 'Salvar Alterações' : 'Adicionar Matéria-Prima'}
            </Button>
          </div>
        </form>
      </Modal>

      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Excluir Matéria-Prima"
        >
          <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex gap-3">
              <AlertCircle className="flex-shrink-0" size={20} />
              <p className="text-sm">
                Tem certeza que deseja excluir esta matéria-prima? Esta ação não
                pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}