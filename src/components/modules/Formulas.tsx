import { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit2, Trash2, FlaskConical, Eye, GripVertical,
  ChevronDown, ChevronUp, Copy, LayoutGrid, List, SortAsc, Layers,
  FolderPlus, Tag, Settings, Printer, Scale, Save, ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useStore, Formula, UnitType, FormulaIngredient, RawMaterial } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FormulaReport } from '@/components/reports/FormulaReport';
import { ProportionReport } from '@/components/reports/ProportionReport';

const GROUP_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Âmbar', value: '#d97706' },
];

const unitOptions = [
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'LT', label: 'Litro (LT)' },
  { value: 'UNID', label: 'Unidade (UNID)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'CM', label: 'Centímetro (CM)' },
  { value: 'G', label: 'Grama (G)' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string(),
  finalWeight: z.number().min(0.01, 'Peso deve ser maior que 0'),
  finalUnit: z.string().min(1, 'Unidade é obrigatória'),
  yield: z.number().min(1, 'Rendimento deve ser pelo menos 1'),
  notes: z.string(),
  status: z.enum(['draft', 'final']),
  supplyListName: z.string().optional(),
  batchPrefix: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type ViewMode = 'grid' | 'list' | 'alphabetical';
type Tab = 'formulas' | 'proportion';

interface IngredientForm {
  rawMaterialId: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
}

function QuantityInput({ 
  value, 
  onChange,
  placeholder = "0,000"
}: { 
  value: number; 
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const formatDisplay = (val: number) => {
    return val.toFixed(3).replace('.', ',');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(rawValue || '0', 10) / 1000;
    onChange(numValue);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatDisplay(value)}
      onChange={handleChange}
      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
        transition-all duration-200 placeholder:text-neutral-400
        focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
        dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500
        dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
      placeholder={placeholder}
    />
  );
}

function MaterialSelector({
  rawMaterials,
  value,
  variantId,
  onChange,
}: {
  rawMaterials: RawMaterial[];
  value: string;
  variantId?: string;
  onChange: (materialId: string, variantId?: string, variantName?: string) => void;
}) {
  const selectedMaterial = rawMaterials.find(m => m.id === value);
  const hasVariants = selectedMaterial?.hasVariants && selectedMaterial?.variants?.length;

  return (
    <div className="flex flex-col gap-2">
      <select
        value={value}
        onChange={(e) => {
          const material = rawMaterials.find(m => m.id === e.target.value);
          if (material?.hasVariants && material?.variants?.length) {
            onChange(e.target.value, material.variants[0].id, material.variants[0].name);
          } else {
            onChange(e.target.value, undefined, undefined);
          }
        }}
        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
          transition-all duration-200 placeholder:text-neutral-400
          focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
          dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      >
        {rawMaterials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.sku}) {m.hasVariants ? '🔻' : ''}
          </option>
        ))}
      </select>

      {hasVariants && (
        <div className="flex items-center gap-2 pl-2">
          <Layers size={14} className="text-purple-500" />
          <select
            value={variantId || ''}
            onChange={(e) => {
              const variant = selectedMaterial?.variants?.find(v => v.id === e.target.value);
              onChange(value, e.target.value, variant?.name);
            }}
            className="flex-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm
              transition-all duration-200
              focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
              dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          >
            {selectedMaterial?.variants?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} - R$ {v.unitValue.toFixed(2).replace('.', ',')}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function Formulas() {
  const { 
    formulas, rawMaterials, addFormula, updateFormula, deleteFormula, 
    formulaGroups, addFormulaGroup, updateFormulaGroup, deleteFormulaGroup,
    updateFormulaIngredient
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('formulas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupManageModalOpen, setIsGroupManageModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; color: string } | null>(null);
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [viewingFormula, setViewingFormula] = useState<Formula | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientForm[]>([]);
  const [expandedFormulas, setExpandedFormulas] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');
  const [lastEnterTime, setLastEnterTime] = useState(0);
  
  // Proportion Tab States
  const [selectedProportionFormula, setSelectedProportionFormula] = useState<string>('');
  const [proportionQuantity, setProportionQuantity] = useState<number>(0);
  const [isProportionReportOpen, setIsProportionReportOpen] = useState(false);
  const [editingProportionId, setEditingProportionId] = useState<string | null>(null);
  const [editedProportionValue, setEditedProportionValue] = useState<number>(0);
  const [saveProportionConfirm, setSaveProportionConfirm] = useState<{
    ingredientId: string;
    newBaseQuantity: number;
    changeDetails: { ingredientName: string; oldVal: number; newVal: number };
  } | null>(null);

  const formContainerRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleEnterNavigation = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const now = Date.now();
      if (now - lastEnterTime < 500) {
        submitButtonRef.current?.focus();
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
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      return variant?.unitValue || 0;
    }
    return material.unitValue;
  };

  const getIngredientFullName = (materialId: string, _variantId?: string, variantName?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 'Material não encontrado';
    if (material.hasVariants && variantName) {
      return `${material.name} - ${variantName}`;
    }
    return material.name;
  };

  const calculateFormulaCost = (formula: Formula) => {
    return formula.ingredients.reduce((total, ing) => {
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      return total + unitValue * ing.quantity;
    }, 0);
  };

  const calculateIngredientCost = (rawMaterialId: string, quantity: number, variantId?: string) => {
    const unitValue = getMaterialUnitValue(rawMaterialId, variantId);
    return unitValue * quantity;
  };

  const openCreateModal = () => {
    setEditingFormula(null);
    const firstMaterial = rawMaterials[0];
    const initialIngredient: IngredientForm = {
      rawMaterialId: firstMaterial?.id || '',
      quantity: 0,
    };
    if (firstMaterial?.hasVariants && firstMaterial?.variants?.length) {
      initialIngredient.variantId = firstMaterial.variants[0].id;
      initialIngredient.variantName = firstMaterial.variants[0].name;
    }
    setIngredients([initialIngredient]);
    setSelectedGroupId('');
    reset({
      name: '',
      code: '',
      description: '',
      finalWeight: 0,
      finalUnit: 'G',
      yield: 1,
      notes: '',
      status: 'draft',
      supplyListName: '',
      batchPrefix: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (formula: Formula) => {
    setEditingFormula(formula);
    setIngredients(
      formula.ingredients.map((i) => ({
        rawMaterialId: i.rawMaterialId,
        variantId: i.variantId,
        variantName: i.variantName,
        quantity: i.quantity,
      }))
    );
    setSelectedGroupId(formula.groupId || '');
    reset({
      name: formula.name,
      code: formula.code,
      description: formula.description,
      finalWeight: formula.finalWeight,
      finalUnit: formula.finalUnit,
      yield: formula.yield,
      notes: formula.notes,
      status: formula.status,
      supplyListName: formula.supplyListName || '',
      batchPrefix: formula.batchPrefix || '',
    });
    setIsModalOpen(true);
  };

  const duplicateFormula = (formula: Formula) => {
    addFormula({
      name: `${formula.name} (cópia)`,
      code: `${formula.code}-COPY`,
      description: formula.description,
      finalWeight: formula.finalWeight,
      finalUnit: formula.finalUnit,
      yield: formula.yield,
      ingredients: formula.ingredients.map((ing, index) => ({
        ...ing,
        id: `${Date.now()}-${index}`,
      })),
      notes: formula.notes,
      status: 'draft',
    });
  };

  const addIngredient = () => {
    const firstMaterial = rawMaterials[0];
    const newIngredient: IngredientForm = {
      rawMaterialId: firstMaterial?.id || '',
      quantity: 0,
    };
    if (firstMaterial?.hasVariants && firstMaterial?.variants?.length) {
      newIngredient.variantId = firstMaterial.variants[0].id;
      newIngredient.variantName = firstMaterial.variants[0].name;
    }
    setIngredients([newIngredient, ...ingredients]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, materialId: string, variantId?: string, variantName?: string) => {
    const updated = [...ingredients];
    updated[index] = { 
      ...updated[index], 
      rawMaterialId: materialId,
      variantId,
      variantName,
    };
    setIngredients(updated);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], quantity };
    setIngredients(updated);
  };

  const onSubmit = (data: FormData) => {
    const formulaIngredients: FormulaIngredient[] = ingredients.map((ing, index) => ({
      id: `${Date.now()}-${index}`,
      rawMaterialId: ing.rawMaterialId,
      variantId: ing.variantId,
      variantName: ing.variantName,
      quantity: ing.quantity,
      order: index + 1,
    }));

    if (editingFormula) {
      updateFormula(editingFormula.id, {
        ...data,
        finalUnit: data.finalUnit as UnitType,
        ingredients: formulaIngredients,
        groupId: selectedGroupId || undefined,
        supplyListName: data.supplyListName || undefined,
        batchPrefix: data.batchPrefix || undefined,
      });
    } else {
      addFormula({
        ...data,
        finalUnit: data.finalUnit as UnitType,
        ingredients: formulaIngredients,
        groupId: selectedGroupId || undefined,
        supplyListName: data.supplyListName || undefined,
        batchPrefix: data.batchPrefix || undefined,
      });
    }
    setIsModalOpen(false);
    reset();
  };

  const totalIngredientsCost = useMemo(() => {
    return ingredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
    }, 0);
  }, [ingredients, rawMaterials]);

  const getChartData = (formula: Formula) => {
    const totalCost = calculateFormulaCost(formula);
    const chemicalIngredients = formula.ingredients.filter(ing => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      return material?.isChemical !== false; // Include if true or undefined
    });
    
    return chemicalIngredients.map((ing) => {
      const cost = calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
      const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantId, ing.variantName);
      return {
        name: fullName,
        value: cost,
        percentage: totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : '0',
      };
    });
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedFormulas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFormulas(newExpanded);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      addFormulaGroup({ name: newGroupName.trim(), color: newGroupColor });
      setNewGroupName('');
      setNewGroupColor('#3b82f6');
      setIsGroupModalOpen(false);
    }
  };

  const handleEditGroup = () => {
    if (editingGroup && editingGroup.name.trim()) {
      updateFormulaGroup(editingGroup.id, { name: editingGroup.name.trim(), color: editingGroup.color });
      setEditingGroup(null);
      setIsGroupManageModalOpen(false);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    deleteFormulaGroup(groupId);
    setDeleteGroupConfirm(null);
    if (selectedGroupFilter === groupId) {
      setSelectedGroupFilter(null);
    }
  };

  const handlePrintGroupReport = () => {
    const group = formulaGroups.find(g => g.id === selectedGroupFilter);
    if (!group || !selectedGroupFilter) return;

    const groupFormulas = formulas.filter(f => f.groupId === selectedGroupFilter);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatCurrencyLocal = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formulaRows = groupFormulas.map(formula => {
      const cost = calculateFormulaCost(formula);
      const costPerUnit = cost / formula.yield;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formula.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${formula.code}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${formula.yield} un</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrencyLocal(cost)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #16a34a;">${formatCurrencyLocal(costPerUnit)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="padding: 2px 8px; border-radius: 9999px; font-size: 10px; background: ${formula.status === 'final' ? '#dcfce7' : '#fef3c7'}; color: ${formula.status === 'final' ? '#166534' : '#92400e'};">
              ${formula.status === 'final' ? 'Finalizado' : 'Rascunho'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const totalCost = groupFormulas.reduce((total, f) => total + calculateFormulaCost(f), 0);
    const avgCostPerUnit = groupFormulas.length > 0 
      ? groupFormulas.reduce((total, f) => total + (calculateFormulaCost(f) / f.yield), 0) / groupFormulas.length 
      : 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - ${group.name}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 3px solid ${group.color}; margin-bottom: 20px; }
          .group-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; color: white; font-size: 14pt; font-weight: 700; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { padding: 15px; border-radius: 10px; text-align: center; }
          .stat-card label { font-size: 9pt; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 5px; }
          .stat-card .value { font-size: 18pt; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 9pt; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e5e7eb; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="font-size: 20pt; color: #1a1a1a; margin-bottom: 5px;">Relatório por Grupo</h1>
            <p style="color: #64748b;">Ohana Clean - Sistema de Gestão</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10pt; color: #64748b;">Emissão</p>
            <p style="font-weight: 600;">${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <span class="group-badge" style="background: ${group.color};">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5);"></span>
            ${group.name}
          </span>
        </div>

        <div class="stats">
          <div class="stat-card" style="background: #f0f9ff; border: 1px solid #bae6fd;">
            <label>Total de Fórmulas</label>
            <span class="value" style="color: #0369a1;">${groupFormulas.length}</span>
          </div>
          <div class="stat-card" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
            <label>Finalizadas</label>
            <span class="value" style="color: #16a34a;">${groupFormulas.filter(f => f.status === 'final').length}</span>
          </div>
          <div class="stat-card" style="background: #fefce8; border: 1px solid #fde047;">
            <label>Custo Total</label>
            <span class="value" style="color: #ca8a04;">${formatCurrencyLocal(totalCost)}</span>
          </div>
          <div class="stat-card" style="background: #faf5ff; border: 1px solid #e9d5ff;">
            <label>Custo Médio/Un</label>
            <span class="value" style="color: #9333ea;">${formatCurrencyLocal(avgCostPerUnit)}</span>
          </div>
        </div>

        <h3 style="font-size: 12pt; margin-bottom: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid ${group.color};">
          Fórmulas do Grupo
        </h3>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th style="text-align: center;">Rendimento</th>
              <th style="text-align: right;">Custo Total</th>
              <th style="text-align: right;">Custo/Unidade</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${formulaRows}
          </tbody>
        </table>

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

  const filteredFormulas = useMemo(() => {
    let filtered = formulas.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (selectedGroupFilter) {
      filtered = filtered.filter((f) => f.groupId === selectedGroupFilter);
    }
    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [formulas, searchTerm, viewMode, selectedGroupFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // ------------------------------------------------------------------
  // PROPORTION TAB LOGIC
  // ------------------------------------------------------------------

  const handleProportionChange = (val: number) => {
    setProportionQuantity(val);
  };

  const selectedFormulaData = formulas.find(f => f.id === selectedProportionFormula);
  
  const proportionFactor = selectedFormulaData 
    ? proportionQuantity / selectedFormulaData.yield 
    : 1;

  const handleEditProportion = (ingredientId: string, currentPropQuantity: number) => {
    setEditingProportionId(ingredientId);
    setEditedProportionValue(currentPropQuantity);
  };

  const handleSaveProportion = (ingredient: FormulaIngredient) => {
    if (!selectedFormulaData) return;

    // Logic:
    // We have:
    // Q_prop (new) = editedProportionValue
    // Y_target (target yield) = proportionQuantity
    // Y_orig (original yield) = selectedFormulaData.yield
    // We want to find Q_orig_new.
    // Q_prop = Q_orig_new * (Y_target / Y_orig)
    // Q_orig_new = Q_prop * (Y_orig / Y_target)

    if (proportionQuantity <= 0) return;

    const newBaseQuantity = editedProportionValue * (selectedFormulaData.yield / proportionQuantity);
    
    // Prepare log data
    const name = getIngredientFullName(ingredient.rawMaterialId, ingredient.variantId, ingredient.variantName);

    setSaveProportionConfirm({
      ingredientId: ingredient.id,
      newBaseQuantity,
      changeDetails: {
        ingredientName: name,
        oldVal: ingredient.quantity,
        newVal: newBaseQuantity
      }
    });
  };

  const confirmSaveProportion = () => {
    if (saveProportionConfirm && selectedFormulaData) {
      updateFormulaIngredient(
        selectedFormulaData.id,
        saveProportionConfirm.ingredientId,
        saveProportionConfirm.newBaseQuantity,
        saveProportionConfirm.changeDetails
      );
      setEditingProportionId(null);
      setSaveProportionConfirm(null);
    }
  };

  const renderProportionTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Scale className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Calculadora de Proporção
                </h2>
                <p className="text-sm text-neutral-500">Calcule quantidades para diferentes volumes</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Selecione a Fórmula
                </label>
                <select
                  value={selectedProportionFormula}
                  onChange={(e) => {
                    setSelectedProportionFormula(e.target.value);
                    const f = formulas.find(f => f.id === e.target.value);
                    if (f) setProportionQuantity(f.yield);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                    transition-all duration-200 cursor-pointer
                    focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                    dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {formulas.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.yield} un)</option>
                  ))}
                </select>
              </div>

              {selectedFormulaData && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-purple-700 dark:text-purple-300">Rendimento Original</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      {selectedFormulaData.yield} unidades
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700 dark:text-purple-300">Custo Atual</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      {formatCurrency(calculateFormulaCost(selectedFormulaData))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {selectedFormulaData && (
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Quantidade Desejada
                  </label>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => handleProportionChange(Math.max(1, proportionQuantity - 10))}
                        className="w-10 h-10 p-0"
                      >
                        -10
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleProportionChange(Math.max(1, proportionQuantity - 1))}
                        className="w-10 h-10 p-0"
                      >
                        -1
                      </Button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={proportionQuantity}
                          onChange={(e) => handleProportionChange(Number(e.target.value))}
                          className="w-full text-center text-xl font-bold text-purple-600 rounded-xl border border-neutral-200 bg-white py-2
                            focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                            dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleProportionChange(proportionQuantity + 1)}
                        className="w-10 h-10 p-0"
                      >
                        +1
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleProportionChange(proportionQuantity + 10)}
                        className="w-10 h-10 p-0"
                      >
                        +10
                      </Button>
                    </div>
                    
                    <input
                      type="range"
                      min="1"
                      max={selectedFormulaData.yield * 5}
                      value={proportionQuantity}
                      onChange={(e) => handleProportionChange(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:bg-neutral-700"
                    />
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[10, 25, 50, 100, 200, 500, 1000].map(val => (
                        <button
                          key={val}
                          onClick={() => handleProportionChange(val)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                            ${proportionQuantity === val 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedFormulaData && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <List size={18} />
                  Ingredientes Proporcionais
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                    Fator de Escala: <strong className="text-purple-600">{proportionFactor.toFixed(2)}x</strong>
                  </span>
                  <Button onClick={() => setIsProportionReportOpen(true)}>
                    <Printer size={16} />
                    Gerar Relatório
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">Matéria-Prima</th>
                      <th className="px-4 py-3 text-right">Qtd. Original</th>
                      <th className="px-4 py-3 text-right bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300">
                        Qtd. Proporcional
                      </th>
                      <th className="px-4 py-3 text-center">Unidade</th>
                      <th className="px-4 py-3 text-right">Custo Unit.</th>
                      <th className="px-4 py-3 text-right">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {selectedFormulaData.ingredients.map((ing) => {
                      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                      const propQuantity = ing.quantity * proportionFactor;
                      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
                      const propCost = unitValue * propQuantity;
                      const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantId, ing.variantName);

                      return (
                        <tr key={ing.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-3 font-medium">{fullName}</td>
                          <td className="px-4 py-3 text-right text-neutral-500">
                            {ing.quantity.toFixed(3)}
                          </td>
                          <td className="px-4 py-3 text-right bg-green-50/30 dark:bg-green-900/5 font-semibold text-green-600 dark:text-green-400">
                            {editingProportionId === ing.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <QuantityInput
                                  value={editedProportionValue}
                                  onChange={setEditedProportionValue}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveProportion(ing)}
                                  className="!p-1.5 h-8 w-8 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                  title="Salvar e Atualizar Original"
                                >
                                  <Save size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="group/edit cursor-pointer hover:bg-white dark:hover:bg-neutral-700 p-1.5 rounded-lg border border-transparent hover:border-neutral-200 transition-all flex items-center justify-end gap-2"
                                onClick={() => handleEditProportion(ing.id, propQuantity)}
                                title="Clique para alterar este valor e atualizar a fórmula original"
                              >
                                <span className="border-b border-dashed border-green-300 dark:border-green-700">
                                  {propQuantity.toFixed(3)}
                                </span>
                                <Edit2 size={14} className="text-neutral-400 opacity-50 group-hover/edit:opacity-100" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-500">{material?.unitType}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(unitValue)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(propCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right">Custo Total Proporcional</td>
                      <td className="px-4 py-3 text-right text-purple-600">
                        {formatCurrency(calculateFormulaCost(selectedFormulaData) * proportionFactor)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal for Proportion Update */}
      <Modal
        isOpen={!!saveProportionConfirm}
        onClose={() => {
          setSaveProportionConfirm(null);
          setEditingProportionId(null);
        }}
        title="Confirmar Atualização da Fórmula"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-300">
            Você alterou a quantidade proporcional. Deseja atualizar a <strong>Fórmula Original</strong> para refletir essa mudança?
          </p>
          
          {saveProportionConfirm && (
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium mb-2">{saveProportionConfirm.changeDetails.ingredientName}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">Original:</span>
                <span className="font-mono">{saveProportionConfirm.changeDetails.oldVal.toFixed(3)}</span>
                <ArrowRight size={14} className="text-neutral-400" />
                <span className="text-green-600 font-bold font-mono">
                  {saveProportionConfirm.changeDetails.newVal.toFixed(3)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setSaveProportionConfirm(null);
                setEditingProportionId(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmSaveProportion}>
              Confirmar Atualização
            </Button>
          </div>
        </div>
      </Modal>

      {isProportionReportOpen && selectedFormulaData && (
        <ProportionReport
          formula={selectedFormulaData}
          proportionQuantity={proportionQuantity}
          rawMaterials={rawMaterials}
          onClose={() => setIsProportionReportOpen(false)}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'formulas'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('formulas')}
        >
          Fórmulas
          {activeTab === 'formulas' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400" />
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'proportion'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('proportion')}
        >
          Proporção
          {activeTab === 'proportion' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400" />
          )}
        </button>
      </div>

      {activeTab === 'formulas' ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              {/* ... Header Content ... (Same as original) */}
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <FlaskConical className="text-neutral-600 dark:text-neutral-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      Fórmulas
                    </h2>
                    <p className="text-sm text-neutral-500">{formulas.length} produtos cadastrados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                      }`}
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
                    >
                      <SortAsc size={18} />
                    </button>
                  </div>
                  <Button onClick={openCreateModal}>
                    <Plus size={18} />
                    Nova Fórmula
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {/* Filters and List Logic from original file */}
               <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mr-2">
                  <Tag size={14} className="inline mr-1" />
                  Grupos:
                </span>
                <button
                  onClick={() => setSelectedGroupFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedGroupFilter === null
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  Todos ({formulas.length})
                </button>
                {formulaGroups.map((group) => {
                  const count = formulas.filter((f) => f.groupId === group.id).length;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupFilter(group.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedGroupFilter === group.id
                          ? 'text-white shadow-md'
                          : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800'
                      }`}
                      style={{
                        backgroundColor: selectedGroupFilter === group.id ? group.color : undefined,
                        color: selectedGroupFilter === group.id ? 'white' : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name} ({count})
                    </button>
                  );
                })}
                <button
                  onClick={() => setIsGroupModalOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1 transition-colors"
                >
                  <FolderPlus size={12} />
                  + Grupo
                </button>
                {formulaGroups.length > 0 && (
                  <button
                    onClick={() => setIsGroupManageModalOpen(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 flex items-center gap-1 transition-colors"
                  >
                    <Settings size={12} />
                    Gerenciar
                  </button>
                )}
                {selectedGroupFilter && (
                  <button
                    onClick={handlePrintGroupReport}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    <Printer size={12} />
                    Relatório do Grupo
                  </button>
                )}
              </div>
              
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={18} />}
                />
              </div>

              {viewMode === 'list' && (
                <div className="p-4 space-y-2">
                  {filteredFormulas.map((formula) => {
                    const totalCost = calculateFormulaCost(formula);
                    const costPerUnit = totalCost / formula.yield;
                    return (
                      <div key={formula.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FlaskConical size={18} className="text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-neutral-900 dark:text-white">{formula.name}</h3>
                              <Badge variant={formula.status === 'final' ? 'success' : 'warning'} className="text-xs">
                                {formula.status === 'final' ? 'Finalizado' : 'Rascunho'}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-500">{formula.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                            <p className="text-xs text-neutral-500">Custo Total</p>
                            <p className="font-medium text-blue-600">{formatCurrency(totalCost)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500">Custo/Unidade</p>
                            <p className="font-medium text-green-600">{formatCurrency(costPerUnit)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500">Rendimento</p>
                            <p className="font-medium text-neutral-900 dark:text-white">{formula.yield} un.</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setViewingFormula(formula); setIsReportOpen(true); }} className="!p-2" title="Ver Relatório">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => duplicateFormula(formula)} className="!p-2" title="Duplicar">
                              <Copy size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(formula)} className="!p-2" title="Editar">
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(formula.id)} className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(viewMode === 'grid' || viewMode === 'alphabetical') && (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredFormulas.map((formula) => {
                    const totalCost = calculateFormulaCost(formula);
                    const costPerUnit = totalCost / formula.yield;
                    const isExpanded = expandedFormulas.has(formula.id);
                    return (
                      <div key={formula.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{formula.name}</h3>
                                <Badge variant={formula.status === 'final' ? 'success' : 'warning'}>
                                  {formula.status === 'final' ? 'Finalizado' : 'Rascunho'}
                                </Badge>
                                {formula.groupId && (() => {
                                  const group = formulaGroups.find(g => g.id === formula.groupId);
                                  return group ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: group.color }}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                      {group.name}
                                    </span>
                                  ) : null;
                                })()}
                                <code className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{formula.code}</code>
                              </div>
                              <p className="text-sm text-neutral-500 mb-4">{formula.description}</p>
                              <div className="flex flex-wrap gap-6 text-sm">
                                <div><span className="text-neutral-500">Peso/Volume:</span> <span className="font-medium text-neutral-900 dark:text-white">{formula.finalWeight} {formula.finalUnit}</span></div>
                                <div><span className="text-neutral-500">Rendimento:</span> <span className="font-medium text-neutral-900 dark:text-white">{formula.yield} unidades</span></div>
                                <div><span className="text-neutral-500">Custo Total:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(totalCost)}</span></div>
                                <div><span className="text-neutral-500">Custo/Unidade:</span> <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(costPerUnit)}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="ghost" size="sm" onClick={() => { setViewingFormula(formula); setIsReportOpen(true); }} className="!p-2" title="Ver Relatório"><Eye size={16} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => duplicateFormula(formula)} className="!p-2" title="Duplicar"><Copy size={16} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(formula)} className="!p-2" title="Editar"><Edit2 size={16} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(formula.id)} className="!p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir"><Trash2 size={16} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => toggleExpand(formula.id)} className="!p-2" title={isExpanded ? 'Recolher' : 'Expandir'}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Composição</h4>
                                <div className="space-y-2">
                                  {formula.ingredients.map((ing, index) => {
                                    const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
                                    const cost = calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
                                    const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : '0';
                                    const fullName = getIngredientFullName(ing.rawMaterialId, ing.variantId, ing.variantName);
                                    return (
                                      <div key={ing.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                                        <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                          <div>
                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{fullName}</span>
                                            {ing.variantId && <span className="ml-2 text-xs text-purple-500"><Layers size={10} className="inline mr-1" />variante</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-neutral-500">{ing.quantity.toFixed(3)} {material?.unitType}</span>
                                          <span className="font-medium text-neutral-900 dark:text-white">{formatCurrency(cost)}</span>
                                          <span className="text-neutral-400">{percentage}%</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Distribuição de Custos</h4>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie data={getChartData(formula)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {getChartData(formula).map((_, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                      <Legend />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        renderProportionTab()
      )}

      {/* Edit Modal (Updated with Change Log) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFormula ? 'Editar Fórmula' : 'Nova Fórmula'}
        size="xl"
      >
        <form ref={formContainerRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ... Form Fields (Same as original) ... */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Nome do Produto *
              </label>
              <input
                {...register('name')}
                onKeyDown={(e) => handleEnterNavigation(e, 0)}
                data-field-index="0"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Nome do produto"
              />
              {errors.name?.message && <p className="text-xs text-red-500">{errors.name?.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Código
              </label>
              <input
                {...register('code')}
                onKeyDown={(e) => handleEnterNavigation(e, 1)}
                data-field-index="1"
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  transition-all duration-200 placeholder:text-neutral-400
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Código do produto"
              />
              {errors.code?.message && <p className="text-xs text-red-500">{errors.code?.message}</p>}
            </div>
          </div>

          <Input label="Descrição" {...register('description')} error={errors.description?.message} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Peso/Volume Final" type="number" step="0.01" {...register('finalWeight', { valueAsNumber: true })} error={errors.finalWeight?.message} />
            <Select label="Unidade" options={unitOptions} {...register('finalUnit')} error={errors.finalUnit?.message} />
            <Input label="Rendimento (unidades)" type="number" {...register('yield', { valueAsNumber: true })} error={errors.yield?.message} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Ingredientes</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Custo Total:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalIngredientsCost)}</span>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addIngredient}><Plus size={16} />Adicionar</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {ingredients.map((ing, index) => {
                const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                const cost = calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
                return (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-xl ${ing.variantId ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                    <GripVertical className="text-neutral-400 cursor-grab mt-3" size={18} />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <MaterialSelector rawMaterials={rawMaterials} value={ing.rawMaterialId} variantId={ing.variantId} onChange={(materialId, variantId, variantName) => updateIngredient(index, materialId, variantId, variantName)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <QuantityInput value={ing.quantity} onChange={(val) => updateIngredientQuantity(index, val)} />
                          <span className="text-xs text-neutral-500 min-w-[30px]">{material?.unitType}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{formatCurrency(cost)}</span>
                        {ingredients.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredient(index)} className="!p-1 text-red-500"><Trash2 size={14} /></Button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Observações / Instruções</label>
            <textarea {...register('notes')} rows={3} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" placeholder="Instruções para produção..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Status" options={[{ value: 'draft', label: 'Rascunho' }, { value: 'final', label: 'Finalizado' }]} {...register('status')} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Grupo/Categoria</label>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm transition-all duration-200 appearance-none cursor-pointer focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                <option value="">Sem grupo</option>
                {formulaGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </div>
            <Input label="Lista de Insumo" {...register('supplyListName')} placeholder="Ex: Lista A..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Prefixo do Lote" {...register('batchPrefix')} placeholder="Ex: AMAC" className="uppercase" />
          </div>

          {/* Change Log Section */}
          {editingFormula && editingFormula.changeLog && editingFormula.changeLog.length > 0 && (
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">
                Histórico de Alterações (Proporção)
              </h3>
              <div className="space-y-3">
                {editingFormula.changeLog.map((log, index) => (
                  <div key={index} className="text-sm p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700">
                    <div className="flex justify-between text-neutral-500 mb-1">
                      <span>{new Date(log.date).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{log.ingredientName}:</span>
                      <span className="font-mono text-neutral-500">{log.oldVal.toFixed(3)}</span>
                      <ArrowRight size={14} className="text-neutral-400" />
                      <span className="font-mono text-green-600 font-medium">{log.newVal.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingFormula ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Other Modals (Delete, Group, Report) - Same as original */}
      {/* Report Modal */}
      {isReportOpen && viewingFormula && (
        <FormulaReport formula={viewingFormula} rawMaterials={rawMaterials} onClose={() => setIsReportOpen(false)} />
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Tem certeza que deseja excluir esta fórmula?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (deleteConfirm) { deleteFormula(deleteConfirm); setDeleteConfirm(null); } }}>Excluir</Button>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Criar Novo Grupo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Nome do Grupo</label>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Cor do Grupo</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((color) => (
                <button key={color.value} type="button" onClick={() => setNewGroupColor(color.value)} className={`w-10 h-10 rounded-xl transition-all ${newGroupColor === color.value ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: color.value }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsGroupModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}><FolderPlus size={16} />Criar Grupo</Button>
          </div>
        </div>
      </Modal>
      
       {/* Manage Groups Modal */}
      <Modal isOpen={isGroupManageModalOpen} onClose={() => { setIsGroupManageModalOpen(false); setEditingGroup(null); }} title="Gerenciar Grupos" size="md">
        <div className="space-y-4">
          {formulaGroups.length === 0 ? (
            <div className="py-8 text-center text-neutral-500"><Tag className="mx-auto mb-2 text-neutral-300" size={32} /><p>Nenhum grupo cadastrado</p></div>
          ) : (
            <div className="space-y-3">
              {formulaGroups.map((group) => {
                const isEditing = editingGroup?.id === group.id;
                return (
                  <div key={group.id} className={`p-4 rounded-xl border transition-all ${isEditing ? 'border-blue-300 bg-blue-50' : 'border-neutral-200 bg-neutral-50'}`}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input type="text" value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                        <div className="flex flex-wrap gap-1.5">
                          {GROUP_COLORS.map((color) => (
                            <button key={color.value} type="button" onClick={() => setEditingGroup({ ...editingGroup, color: color.value })} className={`w-8 h-8 rounded-lg ${editingGroup.color === color.value ? 'ring-2' : ''}`} style={{ backgroundColor: color.value }} />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" onClick={handleEditGroup}>Salvar</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingGroup(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: group.color }}><Tag size={18} className="text-white" /></span>
                          <div><p className="font-medium">{group.name}</p></div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingGroup({ id: group.id, name: group.name, color: group.color })} className="!p-2"><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteGroupConfirm(group.id)} className="!p-2 text-red-500"><Trash2 size={16} /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-neutral-200"><Button variant="secondary" onClick={() => setIsGroupManageModalOpen(false)}>Fechar</Button></div>
        </div>
      </Modal>

      {/* Delete Group Confirmation Modal */}
      <Modal isOpen={!!deleteGroupConfirm} onClose={() => setDeleteGroupConfirm(null)} title="Excluir Grupo" size="sm">
        <p className="text-neutral-600 mb-2">Tem certeza que deseja excluir este grupo?</p>
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-6">⚠️ As fórmulas deste grupo ficarão sem categoria.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteGroupConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteGroupConfirm && handleDeleteGroup(deleteGroupConfirm)}>Excluir Grupo</Button>
        </div>
      </Modal>
    </div>
  );
}
