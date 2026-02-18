import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calculator, Package, ShoppingBag, Boxes,
  FileText, ArrowRight, Minus, Plus,
  LayoutGrid, List, SortAsc
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { useStore, Formula, Pricing } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PricingReport } from '@/components/reports/PricingReport';
import { SimulationsTab } from '@/components/modules/Simulations';

type PricingTab = 'pricing' | 'simulations';

const schema = z.object({
  formulaId: z.string().min(1, 'Selecione uma fórmula'),
  retailMarkup: z.number().min(0, 'Markup deve ser positivo'),
  wholesaleMarkup: z.number().min(0, 'Markup deve ser positivo'),
  bundleDiscount: z.number().min(0).max(100, 'Desconto deve estar entre 0 e 100'),
  bundleQuantity: z.number().min(2, 'Quantidade mínima é 2'),
  fixedCosts: z.number().min(0),
  competitorPrice: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

type ViewMode = 'grid' | 'list' | 'alphabetical';

// Componente de Preço de Venda com botões de arredondamento e slider
function SalePriceControl({
  label,
  value,
  onChange,
  costWithFixed,
  type,
  error
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  costWithFixed: number;
  type: 'retail' | 'wholesale';
  error?: string;
}) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDisplay = (val: number) => {
    return val.toFixed(2).replace('.', ',');
  };

  // Calcular markup baseado no preço
  const calculateMarkup = (price: number) => {
    if (costWithFixed <= 0) return 0;
    return ((price - costWithFixed) / costWithFixed) * 100;
  };

  // Arredondar para cima ou para baixo
  const roundUp = () => {
    const base = Math.floor(value) + 1;
    const target = type === 'retail' ? base + 0.95 : base + 0.90;
    if (target <= value) {
      onChange(target + 1);
    } else {
      onChange(target);
    }
  };

  const roundDown = () => {
    const base = Math.floor(value);
    const ending = type === 'retail' ? 0.95 : 0.90;
    let target = base + ending;
    
    if (target >= value) {
      target = (base - 1) + ending;
    }
    
    if (target < costWithFixed) {
      target = costWithFixed;
    }
    
    onChange(Math.max(target, 0));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(rawValue || '0', 10) / 100;
    onChange(numValue);
  };

  // Handler para o slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseFloat(e.target.value);
    onChange(sliderValue);
  };

  const currentMarkup = calculateMarkup(value);
  const profit = value - costWithFixed;
  const margin = value > 0 ? (profit / value) * 100 : 0;

  // Verificar se está no arredondamento correto
  const ending = type === 'retail' ? 0.95 : 0.90;
  const isRounded = Math.abs((value % 1) - ending) < 0.01;

  // Min e max para o slider baseado no custo
  const minPrice = Math.max(costWithFixed, 0);
  const maxPrice = costWithFixed * 4; // até 300% de markup

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      
      {/* Preço de Venda com botões */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={roundDown}
          className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center
            hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
            text-neutral-600 dark:text-neutral-400"
          title={`Arredondar para baixo (${type === 'retail' ? 'x,95' : 'x,90'})`}
        >
          <Minus size={18} />
        </button>
        
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
            R$
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatDisplay(value)}
            onChange={handleInputChange}
            className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-lg font-bold text-center
              transition-all duration-200
              focus:outline-none focus:ring-2
              dark:bg-neutral-800 dark:text-white
              ${isRounded 
                ? 'border-green-400 focus:border-green-500 focus:ring-green-100 dark:border-green-600 dark:focus:ring-green-900' 
                : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-100 dark:border-neutral-700 dark:focus:ring-neutral-700'
              }`}
          />
          {isRounded && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">
              ✓
            </span>
          )}
        </div>
        
        <button
          type="button"
          onClick={roundUp}
          className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center
            hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
            text-neutral-600 dark:text-neutral-400"
          title={`Arredondar para cima (${type === 'retail' ? 'x,95' : 'x,90'})`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Slider horizontal */}
      <div className="px-1">
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step="any"
          value={value}
          onChange={handleSliderChange}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer 
            ${type === 'retail' 
              ? 'bg-blue-200 dark:bg-blue-900 accent-blue-500' 
              : 'bg-green-200 dark:bg-green-900 accent-green-500'
            }`}
          style={{
            background: `linear-gradient(to right, ${type === 'retail' ? '#3b82f6' : '#10b981'} 0%, ${type === 'retail' ? '#3b82f6' : '#10b981'} ${((value - minPrice) / (maxPrice - minPrice)) * 100}%, ${type === 'retail' ? '#dbeafe' : '#dcfce7'} ${((value - minPrice) / (maxPrice - minPrice)) * 100}%, ${type === 'retail' ? '#dbeafe' : '#dcfce7'} 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1">
          <span>{formatCurrency(minPrice)}</span>
          <span>{formatCurrency(maxPrice)}</span>
        </div>
      </div>

      {/* Indicador de arredondamento */}
      <p className={`text-xs text-center ${isRounded ? 'text-green-600' : 'text-neutral-400'}`}>
        {isRounded 
          ? `✓ Preço arredondado para ${type === 'retail' ? 'x,95' : 'x,90'}` 
          : `Ajuste para terminar em ${type === 'retail' ? ',95' : ',90'}`
        }
      </p>

      {/* Markup calculado - DESTAQUE */}
      <div className="bg-amber-400 text-amber-900 px-4 py-3 rounded-xl text-center">
        <p className="text-xs uppercase tracking-wide font-medium mb-1">Markup Aplicado</p>
        <p className="text-2xl font-bold">{currentMarkup.toFixed(1)}%</p>
      </div>

      {/* Informações adicionais */}
      <div className={`p-4 rounded-xl space-y-2 ${
        type === 'retail' 
          ? 'bg-blue-50 dark:bg-blue-900/20' 
          : 'bg-green-50 dark:bg-green-900/20'
      }`}>
        <div className="flex justify-between text-sm">
          <span className={type === 'retail' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}>
            Lucro/unidade:
          </span>
          <span className="font-semibold text-green-600">{formatCurrency(profit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={type === 'retail' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}>
            Margem bruta:
          </span>
          <span className="font-medium">{margin.toFixed(1)}%</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Componente de input compacto com setas
function CompactNumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix,
  suffix,
  isPercentage = false
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  isPercentage?: boolean;
}) {
  const increment = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(min, Math.min(max, inputValue)));
  };

  // Para slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center
            hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
            text-neutral-600 dark:text-neutral-400 shrink-0"
        >
          <Minus size={14} />
        </button>
        
        <div className="relative w-24">
          {prefix && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className={`w-full rounded-lg border border-neutral-200 bg-white py-2 text-center text-sm font-medium
              focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
              dark:border-neutral-700 dark:bg-neutral-800 dark:text-white
              ${prefix ? 'pl-7' : 'px-2'} ${suffix ? 'pr-6' : 'px-2'}`}
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
        
        <button
          type="button"
          onClick={increment}
          className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center
            hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
            text-neutral-600 dark:text-neutral-400 shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Slider para desconto */}
      {isPercentage && (
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={handleSliderChange}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-purple-200 dark:bg-purple-900 accent-purple-500"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, #e9d5ff ${((value - min) / (max - min)) * 100}%, #e9d5ff 100%)`
          }}
        />
      )}
    </div>
  );
}

// Componente de input monetário compacto
function CompactCurrencyInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const formatDisplay = (val: number) => {
    return val.toFixed(2).replace('.', ',');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(rawValue || '0', 10) / 100;
    onChange(numValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="relative w-32">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatDisplay(value)}
          onChange={handleChange}
          className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2 text-sm font-medium text-center
            focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
            dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

export function PricingModule() {
  const { formulas, rawMaterials, pricings, addPricing, updatePricing } = useStore();
  const [activeTab, setActiveTab] = useState<PricingTab>('pricing');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Estados locais para os valores monetários
  const [fixedCostsValue, setFixedCostsValue] = useState(0);
  const [competitorPriceValue, setCompetitorPriceValue] = useState(0);
  
  // Estados para preços de venda
  const [retailPrice, setRetailPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [bundlePrice, setBundlePrice] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      retailMarkup: 150,
      wholesaleMarkup: 100,
      bundleDiscount: 10,
      bundleQuantity: 4,
      fixedCosts: 0,
      competitorPrice: 0,
    },
  });

  const watchedValues = watch();

  // Sincronizar valores monetários com o form
  useEffect(() => {
    setValue('fixedCosts', fixedCostsValue);
  }, [fixedCostsValue, setValue]);

  useEffect(() => {
    setValue('competitorPrice', competitorPriceValue);
  }, [competitorPriceValue, setValue]);

  // Função para obter o valor unitário considerando variantes
  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    
    // Se tem variante selecionada, usa o preço da variante
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      if (variant) {
        return variant.unitValue;
      }
    }
    
    return material.unitValue;
  };

  const calculateFormulaCost = (formula: Formula) => {
    return formula.ingredients.reduce((total, ing) => {
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      return total + unitValue * ing.quantity;
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular markup baseado no preço
  const calculateMarkupFromPrice = (price: number, cost: number) => {
    if (cost <= 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  const calculations = useMemo(() => {
    if (!selectedFormula) return null;

    const totalCost = calculateFormulaCost(selectedFormula);
    const costPerUnit = totalCost / selectedFormula.yield;
    const totalCostWithFixed = costPerUnit + fixedCostsValue;

    // Retail calculations - baseado no preço de venda
    const retailMarkup = calculateMarkupFromPrice(retailPrice, totalCostWithFixed);
    const retailProfit = retailPrice - totalCostWithFixed;
    const retailMargin = retailPrice > 0 ? (retailProfit / retailPrice) * 100 : 0;

    // Wholesale calculations - baseado no preço de venda
    const wholesaleMarkup = calculateMarkupFromPrice(wholesalePrice, totalCostWithFixed);
    const wholesaleProfit = wholesalePrice - totalCostWithFixed;
    const wholesaleMargin = wholesalePrice > 0 ? (wholesaleProfit / wholesalePrice) * 100 : 0;

    // Savings comparison
    const retailVsWholesaveSavings = retailPrice - wholesalePrice;
    const retailVsWholesavePercent = retailPrice > 0 ? (retailVsWholesaveSavings / retailPrice) * 100 : 0;

    // Bundle calculations - Agora usa preço próprio com arredondamento x,80
    const bundleQty = watchedValues.bundleQuantity || 4;
    const bundlePricePerUnit = bundlePrice;
    const bundleTotal = bundlePricePerUnit * bundleQty;
    const bundleSavingsPerUnit = wholesalePrice - bundlePricePerUnit;
    const bundleMarkup = calculateMarkupFromPrice(bundlePricePerUnit, totalCostWithFixed);
    const bundleProfit = bundlePricePerUnit - totalCostWithFixed;
    const bundleMargin = bundlePricePerUnit > 0 ? (bundleProfit / bundlePricePerUnit) * 100 : 0;

    // Break-even analysis
    const fixedCostsTotal = fixedCostsValue * selectedFormula.yield;
    const breakEvenRetail = retailProfit > 0 ? Math.ceil(fixedCostsTotal / retailProfit) : 0;
    const breakEvenWholesale = wholesaleProfit > 0 ? Math.ceil(fixedCostsTotal / wholesaleProfit) : 0;

    return {
      totalCost,
      costPerUnit,
      totalCostWithFixed,
      retail: {
        price: retailPrice,
        rounded: retailPrice,
        suggestedMarkup: retailMarkup,
        profit: retailProfit,
        margin: retailMargin,
      },
      wholesale: {
        price: wholesalePrice,
        rounded: wholesalePrice,
        suggestedMarkup: wholesaleMarkup,
        profit: wholesaleProfit,
        margin: wholesaleMargin,
        savingsVsRetail: retailVsWholesaveSavings,
        savingsPercent: retailVsWholesavePercent,
      },
      bundle: {
        quantity: bundleQty,
        pricePerUnit: bundlePricePerUnit,
        total: bundleTotal,
        savingsPerUnit: bundleSavingsPerUnit,
        discountPercent: wholesalePrice > 0 ? ((wholesalePrice - bundlePricePerUnit) / wholesalePrice) * 100 : 0,
        profit: bundleProfit,
        margin: bundleMargin,
        markup: bundleMarkup,
      },
      breakEven: {
        retail: breakEvenRetail,
        wholesale: breakEvenWholesale,
      },
    };
  }, [selectedFormula, watchedValues, rawMaterials, fixedCostsValue, retailPrice, wholesalePrice]);

  const comparisonData = useMemo(() => {
    if (!calculations) return [];
    return [
      {
        name: 'Varejo',
        preco: calculations.retail.rounded,
        lucro: calculations.retail.profit,
        margem: calculations.retail.margin,
      },
      {
        name: 'Atacado',
        preco: calculations.wholesale.rounded,
        lucro: calculations.wholesale.profit,
        margem: calculations.wholesale.margin,
      },
      {
        name: 'Fardo',
        preco: calculations.bundle.pricePerUnit,
        lucro: calculations.bundle.profit,
        margem: calculations.bundle.margin,
      },
    ];
  }, [calculations]);

  const openModal = (formula: Formula) => {
    setSelectedFormula(formula);
    const existingPricing = pricings.find((p) => p.formulaId === formula.id);
    const cost = calculateFormulaCost(formula);
    const costPerUnit = cost / formula.yield;
    
    if (existingPricing) {
      setEditingPricing(existingPricing);
      setFixedCostsValue(existingPricing.fixedCosts);
      setCompetitorPriceValue(existingPricing.competitorPrice);
      
      // Calcular preços baseados nos markups salvos
      const totalCostWithFixed = costPerUnit + existingPricing.fixedCosts;
      const wholesaleVal = totalCostWithFixed * (1 + existingPricing.wholesaleMarkup / 100);
      setRetailPrice(totalCostWithFixed * (1 + existingPricing.retailMarkup / 100));
      setWholesalePrice(wholesaleVal);
      // Preço do fardo baseado no desconto salvo
      setBundlePrice(wholesaleVal * (1 - existingPricing.bundleDiscount / 100));
      
      reset({
        formulaId: formula.id,
        retailMarkup: existingPricing.retailMarkup,
        wholesaleMarkup: existingPricing.wholesaleMarkup,
        bundleDiscount: existingPricing.bundleDiscount,
        bundleQuantity: existingPricing.bundleQuantity,
        fixedCosts: existingPricing.fixedCosts,
        competitorPrice: existingPricing.competitorPrice,
      });
    } else {
      setEditingPricing(null);
      setFixedCostsValue(0);
      setCompetitorPriceValue(0);
      
      // Definir preços iniciais com markup padrão
      const defaultRetailMarkup = 150;
      const defaultWholesaleMarkup = 100;
      const defaultBundleDiscount = 10;
      const wholesaleVal = costPerUnit * (1 + defaultWholesaleMarkup / 100);
      setRetailPrice(costPerUnit * (1 + defaultRetailMarkup / 100));
      setWholesalePrice(wholesaleVal);
      setBundlePrice(wholesaleVal * (1 - defaultBundleDiscount / 100));
      
      reset({
        formulaId: formula.id,
        retailMarkup: defaultRetailMarkup,
        wholesaleMarkup: defaultWholesaleMarkup,
        bundleDiscount: defaultBundleDiscount,
        bundleQuantity: 4,
        fixedCosts: 0,
        competitorPrice: 0,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    // Calcular markups baseados nos preços de venda
    const cost = selectedFormula ? calculateFormulaCost(selectedFormula) : 0;
    const costPerUnit = selectedFormula ? cost / selectedFormula.yield : 0;
    const totalCostWithFixed = costPerUnit + fixedCostsValue;
    
    const retailMarkup = calculateMarkupFromPrice(retailPrice, totalCostWithFixed);
    const wholesaleMarkup = calculateMarkupFromPrice(wholesalePrice, totalCostWithFixed);
    // Calcular desconto do fardo baseado no preço do atacado
    const bundleDiscount = wholesalePrice > 0 ? ((wholesalePrice - bundlePrice) / wholesalePrice) * 100 : 0;
    
    const submitData = {
      ...data,
      retailMarkup,
      wholesaleMarkup,
      bundleDiscount: Math.max(0, bundleDiscount),
      fixedCosts: fixedCostsValue,
      competitorPrice: competitorPriceValue,
    };
    
    if (editingPricing) {
      updatePricing(editingPricing.id, submitData);
    } else {
      addPricing(submitData);
    }
    setIsModalOpen(false);
  };

  const openReport = () => {
    if (selectedFormula && calculations) {
      setIsReportOpen(true);
    }
  };

  // Filtrar e ordenar fórmulas
  const displayFormulas = useMemo(() => {
    let filtered = formulas.filter((f) => f.status === 'final');
    
    if (viewMode === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  }, [formulas, viewMode]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'pricing'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator size={16} />
            Preços
          </div>
        </button>
        <button
          onClick={() => setActiveTab('simulations')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'simulations'
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} />
            Simulações
          </div>
        </button>
      </div>

      {/* Tab de Simulações */}
      {activeTab === 'simulations' && <SimulationsTab />}

      {/* Tab de Preços */}
      {activeTab === 'pricing' && (
      <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Calculator className="text-neutral-600 dark:text-neutral-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Precificação
                </h2>
                <p className="text-sm text-neutral-500">Calcule preços e margens de lucro</p>
              </div>
            </div>
            
            {/* Botões de visualização */}
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Grid View */}
          {(viewMode === 'grid' || viewMode === 'alphabetical') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayFormulas.map((formula) => {
                const cost = calculateFormulaCost(formula);
                const costPerUnit = cost / formula.yield;
                const pricing = pricings.find((p) => p.formulaId === formula.id);

                return (
                  <Card key={formula.id} hover className="cursor-pointer" onClick={() => openModal(formula)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {formula.name}
                          </h3>
                          <p className="text-sm text-neutral-500">{formula.code}</p>
                        </div>
                        {pricing && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                            Precificado
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Custo/unidade:</span>
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {formatCurrency(costPerUnit)}
                          </span>
                        </div>
                        {pricing && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Varejo:</span>
                              <span className="font-medium text-blue-600">
                                {formatCurrency(costPerUnit * (1 + pricing.retailMarkup / 100))}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Atacado:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(costPerUnit * (1 + pricing.wholesaleMarkup / 100))}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <Button variant="secondary" size="sm" className="w-full mt-4">
                        {pricing ? 'Editar Precificação' : 'Precificar'}
                        <ArrowRight size={16} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {displayFormulas.map((formula) => {
                const cost = calculateFormulaCost(formula);
                const costPerUnit = cost / formula.yield;
                const pricing = pricings.find((p) => p.formulaId === formula.id);

                return (
                  <div 
                    key={formula.id} 
                    onClick={() => openModal(formula)}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calculator size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900 dark:text-white">{formula.name}</h3>
                        <p className="text-sm text-neutral-500">{formula.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Custo</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(costPerUnit)}</p>
                      </div>
                      {pricing && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-blue-500">Varejo</p>
                            <p className="font-medium text-blue-600">{formatCurrency(costPerUnit * (1 + pricing.retailMarkup / 100))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-500">Atacado</p>
                            <p className="font-medium text-green-600">{formatCurrency(costPerUnit * (1 + pricing.wholesaleMarkup / 100))}</p>
                          </div>
                        </>
                      )}
                      {pricing ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                          ✓
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayFormulas.length === 0 && (
            <div className="py-12 text-center">
              <Calculator className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">
                Nenhuma fórmula finalizada disponível para precificação
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Precificação - ${selectedFormula?.name || ''}`}
        size="xl"
      >
        {selectedFormula && calculations && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <input type="hidden" {...register('formulaId')} />

            {/* Cost Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-neutral-500 uppercase mb-1">Custo Total Fórmula</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(calculations.totalCost)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-neutral-500 uppercase mb-1">Custo por Unidade</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(calculations.costPerUnit)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-xs text-neutral-500 uppercase mb-1">Rendimento</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {selectedFormula.yield} unidades
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase mb-1">Custo + Fixos</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(calculations.totalCostWithFixed)}
                </p>
              </div>
            </div>

            {/* Preços de Venda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <ShoppingBag size={16} />
                  Varejo (arredondamento x,95)
                </h3>
                <SalePriceControl
                  label="Preço de Venda"
                  value={retailPrice}
                  onChange={setRetailPrice}
                  costWithFixed={calculations.totalCostWithFixed}
                  type="retail"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Package size={16} />
                  Atacado (arredondamento x,90)
                </h3>
                <SalePriceControl
                  label="Preço de Venda"
                  value={wholesalePrice}
                  onChange={setWholesalePrice}
                  costWithFixed={calculations.totalCostWithFixed}
                  type="wholesale"
                />
              </div>
            </div>

            {/* Resumo Visual - Varejo, Atacado, Custo */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 via-green-50 to-neutral-50 dark:from-blue-900/20 dark:via-green-900/20 dark:to-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                Resumo de Preços e Custos
              </p>
              <div className="grid grid-cols-4 gap-4">
                {/* Custo */}
                <div className="text-center p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Custo + Fixos</p>
                  <p className="text-xl font-bold text-neutral-700 dark:text-neutral-300">{formatCurrency(calculations.totalCostWithFixed)}</p>
                </div>
                {/* Varejo */}
                <div className="text-center p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Varejo</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(retailPrice)}</p>
                  <p className="text-xs text-blue-500 mt-1">Lucro: {formatCurrency(calculations.retail.profit)}</p>
                </div>
                {/* Atacado */}
                <div className="text-center p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
                  <p className="text-xs uppercase tracking-wide text-green-600 mb-1">Atacado</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(wholesalePrice)}</p>
                  <p className="text-xs text-green-500 mt-1">Lucro: {formatCurrency(calculations.wholesale.profit)}</p>
                </div>
                {/* Economia */}
                <div className="text-center p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">Economia Atacado</p>
                  <p className="text-xl font-bold text-amber-700">{formatCurrency(calculations.wholesale.savingsVsRetail)}</p>
                  <p className="text-xs text-amber-500 mt-1">{calculations.wholesale.savingsPercent.toFixed(1)}% de desconto</p>
                </div>
              </div>
            </div>

            {/* Fardo Section - Mesmo formato de Varejo/Atacado */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">Fardo</h4>
                  <span className="text-xs bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">
                    Arredondamento x,80
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Custo Base</p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{formatCurrency(calculations.totalCostWithFixed)}</p>
                  </div>
                  <CompactNumberInput
                    label="Qtd. Fardo"
                    value={watchedValues.bundleQuantity || 4}
                    onChange={(val) => setValue('bundleQuantity', val)}
                    min={2}
                    max={24}
                    step={1}
                    suffix="un"
                  />
                </div>
              </div>

              {/* Preço de Venda do Fardo com arredondamento x,80 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300">
                  Preço de Venda (por unidade no fardo)
                </label>
                
                {/* Preço com botões */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const base = Math.floor(bundlePrice);
                      let target = base + 0.80;
                      if (target >= bundlePrice) {
                        target = (base - 1) + 0.80;
                      }
                      if (target < calculations.totalCostWithFixed) {
                        target = calculations.totalCostWithFixed;
                      }
                      setBundlePrice(Math.max(target, 0));
                    }}
                    className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-800 flex items-center justify-center
                      hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors
                      text-purple-600 dark:text-purple-400"
                    title="Arredondar para baixo (x,80)"
                  >
                    <Minus size={18} />
                  </button>
                  
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-medium">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bundlePrice.toFixed(2).replace('.', ',')}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const numValue = parseInt(rawValue || '0', 10) / 100;
                        setBundlePrice(numValue);
                      }}
                      className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-lg font-bold text-center
                        transition-all duration-200
                        focus:outline-none focus:ring-2
                        dark:bg-neutral-800 dark:text-white
                        ${Math.abs((bundlePrice % 1) - 0.80) < 0.01
                          ? 'border-green-400 focus:border-green-500 focus:ring-green-100 dark:border-green-600 dark:focus:ring-green-900' 
                          : 'border-purple-200 focus:border-purple-400 focus:ring-purple-100 dark:border-purple-700 dark:focus:ring-purple-700'
                        }`}
                    />
                    {Math.abs((bundlePrice % 1) - 0.80) < 0.01 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">
                        ✓
                      </span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const base = Math.floor(bundlePrice) + 1;
                      const target = base + 0.80;
                      if (target <= bundlePrice) {
                        setBundlePrice(target + 1);
                      } else {
                        setBundlePrice(target);
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-800 flex items-center justify-center
                      hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors
                      text-purple-600 dark:text-purple-400"
                    title="Arredondar para cima (x,80)"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Slider horizontal */}
                <div className="px-1">
                  <input
                    type="range"
                    min={calculations.totalCostWithFixed}
                    max={wholesalePrice * 1.1}
                    step="any"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-purple-200 dark:bg-purple-900 accent-purple-500"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((bundlePrice - calculations.totalCostWithFixed) / ((wholesalePrice * 1.1) - calculations.totalCostWithFixed)) * 100}%, #e9d5ff ${((bundlePrice - calculations.totalCostWithFixed) / ((wholesalePrice * 1.1) - calculations.totalCostWithFixed)) * 100}%, #e9d5ff 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-purple-400 mt-1">
                    <span>{formatCurrency(calculations.totalCostWithFixed)}</span>
                    <span>{formatCurrency(wholesalePrice * 1.1)}</span>
                  </div>
                </div>

                {/* Indicador de arredondamento */}
                <p className={`text-xs text-center ${Math.abs((bundlePrice % 1) - 0.80) < 0.01 ? 'text-green-600' : 'text-purple-400'}`}>
                  {Math.abs((bundlePrice % 1) - 0.80) < 0.01 
                    ? '✓ Preço arredondado para x,80' 
                    : 'Ajuste para terminar em ,80'
                  }
                </p>

                {/* Markup calculado - DESTAQUE */}
                <div className="bg-amber-400 text-amber-900 px-4 py-3 rounded-xl text-center">
                  <p className="text-xs uppercase tracking-wide font-medium mb-1">Markup Aplicado</p>
                  <p className="text-2xl font-bold">{calculations.bundle.markup?.toFixed(1) || '0'}%</p>
                </div>

                {/* Informações adicionais */}
                <div className="p-4 rounded-xl bg-purple-100 dark:bg-purple-900/40 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">Lucro/unidade:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(calculations.bundle.profit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">Margem bruta:</span>
                    <span className="font-medium">{calculations.bundle.margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">Economia vs Atacado:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(calculations.bundle.savingsPerUnit)} ({calculations.bundle.discountPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Resumo do Fardo Total */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs uppercase opacity-80 mb-1">Preço Total do Fardo</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculations.bundle.total)}</p>
                    <p className="text-xs opacity-80">{calculations.bundle.quantity} unidades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase opacity-80 mb-1">Lucro Total do Fardo</p>
                    <p className="text-2xl font-bold">{formatCurrency(calculations.bundle.profit * calculations.bundle.quantity)}</p>
                    <p className="text-xs opacity-80">Margem: {calculations.bundle.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings com R$ - Compactos */}
            <div className="flex flex-wrap items-end gap-6">
              <CompactCurrencyInput
                label="Despesas Fixas (por unidade)"
                value={fixedCostsValue}
                onChange={setFixedCostsValue}
              />
              <CompactCurrencyInput
                label="Preço do Concorrente"
                value={competitorPriceValue}
                onChange={setCompetitorPriceValue}
              />
            </div>

            {competitorPriceValue > 0 && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Análise Competitiva
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">Seu preço varejo:</span>
                    <p className="font-semibold">{formatCurrency(calculations.retail.rounded)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Concorrente:</span>
                    <p className="font-semibold">{formatCurrency(competitorPriceValue)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Diferença:</span>
                    <p className={`font-semibold ${
                      calculations.retail.rounded < competitorPriceValue
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(calculations.retail.rounded - competitorPriceValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Chart */}
            <div>
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Comparativo de Preços e Margens
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `R$${v}`} />
                    <YAxis yAxisId="right" orientation="right" unit="%" />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? formatCurrency(value) : value, 
                        name
                      ]} 
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="preco" name="Preço" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Resumo visual dos valores */}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {comparisonData.map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg text-center ${
                    index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 
                    index === 1 ? 'bg-green-50 dark:bg-green-900/20' : 
                    'bg-purple-50 dark:bg-purple-900/20'
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${
                      index === 0 ? 'text-blue-600' : 
                      index === 1 ? 'text-green-600' : 
                      'text-purple-600'
                    }`}>{item.name}</p>
                    <p className={`text-lg font-bold ${
                      index === 0 ? 'text-blue-700' : 
                      index === 1 ? 'text-green-700' : 
                      'text-purple-700'
                    }`}>{formatCurrency(item.preco)}</p>
                    <p className="text-xs text-green-600 font-medium">
                      Lucro: {formatCurrency(item.lucro)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={openReport}>
                <FileText size={18} />
                Ver Relatório
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Precificação
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Full Report Modal */}
      {isReportOpen && selectedFormula && calculations && (
        <PricingReport
          formula={selectedFormula}
          calculations={calculations}
          competitorPrice={competitorPriceValue}
          fixedCosts={fixedCostsValue}
          onClose={() => setIsReportOpen(false)}
        />
      )}
      </>
      )}
    </div>
  );
}
