import { useState, useMemo } from 'react';
import {
  Calculator, Trash2, FileText, TrendingUp,
  ShoppingBag, Package, Boxes, Save, Play, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { useStore, Formula } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SimulationReport } from '@/components/reports/SimulationReport';

interface Simulation {
  id: string;
  name: string;
  formulaId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  retailQty: number;
  wholesaleQty: number;
  bundleQty: number;
  discount: number;
  costIncrease: number;
  goal: number;
  createdAt: string;
}

export function SimulationsTab() {
  const { formulas, rawMaterials, pricings } = useStore();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [retailQty, setRetailQty] = useState(100);
  const [wholesaleQty, setWholesaleQty] = useState(200);
  const [bundleQty, setBundleQty] = useState(50);
  const [discount, setDiscount] = useState(0);
  const [costIncrease, setCostIncrease] = useState(0);
  const [goal, setGoal] = useState(5000);
  const [simulationName, setSimulationName] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

  // Fórmulas finalizadas
  const finalFormulas = formulas.filter((f) => f.status === 'final');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateFormulaCost = (formula: Formula) => {
    return formula.ingredients.reduce((total, ing) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      return total + (material ? material.unitValue * ing.quantity : 0);
    }, 0);
  };

  const simulation = useMemo(() => {
    if (!selectedFormula) return null;

    const formula = formulas.find((f) => f.id === selectedFormula);
    if (!formula) return null;

    const pricing = pricings.find((p) => p.formulaId === selectedFormula);
    if (!pricing) return null;

    const baseCost = calculateFormulaCost(formula);
    const costPerUnit = baseCost / formula.yield;
    const adjustedCost = costPerUnit * (1 + costIncrease / 100);

    // Preços baseados no markup salvo
    const retailPrice = adjustedCost * (1 + pricing.retailMarkup / 100) * (1 - discount / 100);
    const wholesalePrice = adjustedCost * (1 + pricing.wholesaleMarkup / 100) * (1 - discount / 100);
    const bundlePrice = wholesalePrice * (1 - pricing.bundleDiscount / 100);

    // Lucros
    const retailProfit = retailPrice - adjustedCost;
    const wholesaleProfit = wholesalePrice - adjustedCost;
    const bundleProfit = bundlePrice - adjustedCost;

    // Cálculos por período
    const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;

    const totalRetailRevenue = retailQty * retailPrice;
    const totalWholesaleRevenue = wholesaleQty * wholesalePrice;
    const totalBundleRevenue = bundleQty * bundlePrice * pricing.bundleQuantity;

    const totalRetailProfit = retailQty * retailProfit;
    const totalWholesaleProfit = wholesaleQty * wholesaleProfit;
    const totalBundleProfit = bundleQty * bundleProfit * pricing.bundleQuantity;

    const totalRevenue = totalRetailRevenue + totalWholesaleRevenue + totalBundleRevenue;
    const totalProfit = totalRetailProfit + totalWholesaleProfit + totalBundleProfit;
    const totalUnits = retailQty + wholesaleQty + (bundleQty * pricing.bundleQuantity);

    // Projeção anual
    const yearlyProfit = totalProfit * (365 / multiplier);

    // Meta
    const goalProgress = (totalProfit / goal) * 100;
    const unitsToGoal = goal > totalProfit ? Math.ceil((goal - totalProfit) / retailProfit) : 0;

    // Dados para gráfico de projeção
    const projectionData = Array.from({ length: 12 }, (_, i) => ({
      month: `Mês ${i + 1}`,
      lucro: totalProfit * (i + 1),
      meta: goal,
    }));

    // Dados para gráfico de comparação
    const channelData = [
      { name: 'Varejo', receita: totalRetailRevenue, lucro: totalRetailProfit, unidades: retailQty },
      { name: 'Atacado', receita: totalWholesaleRevenue, lucro: totalWholesaleProfit, unidades: wholesaleQty },
      { name: 'Fardo', receita: totalBundleRevenue, lucro: totalBundleProfit, unidades: bundleQty * pricing.bundleQuantity },
    ];

    return {
      formula,
      pricing,
      adjustedCost,
      retail: { price: retailPrice, profit: retailProfit, qty: retailQty, revenue: totalRetailRevenue, totalProfit: totalRetailProfit },
      wholesale: { price: wholesalePrice, profit: wholesaleProfit, qty: wholesaleQty, revenue: totalWholesaleRevenue, totalProfit: totalWholesaleProfit },
      bundle: { price: bundlePrice, profit: bundleProfit, qty: bundleQty, revenue: totalBundleRevenue, totalProfit: totalBundleProfit, bundleQty: pricing.bundleQuantity },
      totalRevenue,
      totalProfit,
      totalUnits,
      yearlyProfit,
      goalProgress,
      unitsToGoal,
      projectionData,
      channelData,
      period,
      discount,
      costIncrease,
      goal,
    };
  }, [selectedFormula, period, retailQty, wholesaleQty, bundleQty, discount, costIncrease, goal, formulas, pricings, rawMaterials]);

  const saveSimulation = () => {
    if (!selectedFormula || !simulationName) return;

    const newSimulation: Simulation = {
      id: Date.now().toString(),
      name: simulationName,
      formulaId: selectedFormula,
      period,
      retailQty,
      wholesaleQty,
      bundleQty,
      discount,
      costIncrease,
      goal,
      createdAt: new Date().toISOString(),
    };

    setSimulations([newSimulation, ...simulations]);
    setSimulationName('');
  };

  const loadSimulation = (sim: Simulation) => {
    setSelectedFormula(sim.formulaId);
    setPeriod(sim.period);
    setRetailQty(sim.retailQty);
    setWholesaleQty(sim.wholesaleQty);
    setBundleQty(sim.bundleQty);
    setDiscount(sim.discount);
    setCostIncrease(sim.costIncrease);
    setGoal(sim.goal);
  };

  const deleteSimulation = (id: string) => {
    setSimulations(simulations.filter((s) => s.id !== id));
  };

  const openReport = (sim: Simulation) => {
    setSelectedSimulation(sim);
    loadSimulation(sim);
    setShowReport(true);
  };

  const getPeriodLabel = (p: string) => {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };
    return labels[p] || p;
  };

  return (
    <div className="space-y-6">
      {/* Configuração da Simulação */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Simulador de Vendas</h3>
              <p className="text-sm text-neutral-500">Configure os parâmetros para simular diferentes cenários</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Produto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Produto
              </label>
              <select
                value={selectedFormula}
                onChange={(e) => setSelectedFormula(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="">Selecione um produto</option>
                {finalFormulas.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Meta de Lucro (R$)
              </label>
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                  focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Quantidades por Canal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag size={16} className="text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">Varejo</span>
              </div>
              <label className="block text-xs text-blue-600 mb-1">Quantidade estimada</label>
              <input
                type="number"
                value={retailQty}
                onChange={(e) => setRetailQty(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm
                  focus:border-blue-400 focus:outline-none
                  dark:border-blue-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">Atacado</span>
              </div>
              <label className="block text-xs text-green-600 mb-1">Quantidade estimada</label>
              <input
                type="number"
                value={wholesaleQty}
                onChange={(e) => setWholesaleQty(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm
                  focus:border-green-400 focus:outline-none
                  dark:border-green-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Boxes size={16} className="text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">Fardos</span>
              </div>
              <label className="block text-xs text-purple-600 mb-1">Quantidade de fardos</label>
              <input
                type="number"
                value={bundleQty}
                onChange={(e) => setBundleQty(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm
                  focus:border-purple-400 focus:outline-none
                  dark:border-purple-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Ajustes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Desconto Promocional (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-amber-200 dark:bg-amber-900 accent-amber-500"
                />
                <span className="w-16 text-center font-medium text-amber-600">{discount}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Aumento de Custos (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={costIncrease}
                  onChange={(e) => setCostIncrease(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-red-200 dark:bg-red-900 accent-red-500"
                />
                <span className="w-16 text-center font-medium text-red-600">{costIncrease}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Simulação */}
      {simulation && (
        <>
          {/* Cards de Resultados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Custo Ajustado</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatCurrency(simulation.adjustedCost)}</p>
                {costIncrease > 0 && (
                  <p className="text-xs text-red-500 mt-1">+{costIncrease}% de aumento</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Receita Total</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(simulation.totalRevenue)}</p>
                <p className="text-xs text-blue-500 mt-1">{simulation.totalUnits} unidades</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-green-600 mb-1">Lucro Projetado</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(simulation.totalProfit)}</p>
                <p className="text-xs text-green-500 mt-1">no período {getPeriodLabel(period).toLowerCase()}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-purple-600 mb-1">Projeção Anual</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(simulation.yearlyProfit)}</p>
                <p className="text-xs text-purple-500 mt-1">lucro estimado</p>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento por Canal */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Distribuição por Canal
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {simulation.channelData.map((channel, index) => (
                  <div
                    key={channel.name}
                    className={`p-4 rounded-xl border ${
                      index === 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                        : index === 1
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                        : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                    }`}
                  >
                    <h4 className={`font-semibold mb-3 ${
                      index === 0 ? 'text-blue-700' : index === 1 ? 'text-green-700' : 'text-purple-700'
                    }`}>
                      {channel.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Unidades:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{channel.unidades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Receita:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{formatCurrency(channel.receita)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Lucro:</span>
                        <span className="font-bold text-green-600">{formatCurrency(channel.lucro)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análise da Meta */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Análise da Meta</h3>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-500">Progresso</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {formatCurrency(simulation.totalProfit)} / {formatCurrency(goal)}
                  </span>
                </div>
                <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      simulation.goalProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(simulation.goalProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-neutral-400">0%</span>
                  <span className={`font-medium ${simulation.goalProgress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {simulation.goalProgress.toFixed(1)}%
                  </span>
                  <span className="text-neutral-400">100%</span>
                </div>
              </div>

              {simulation.goalProgress >= 100 ? (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
                  <p className="text-green-700 dark:text-green-300 font-semibold">
                    ✅ Meta atingida! Lucro excedente: {formatCurrency(simulation.totalProfit - goal)}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-center">
                  <p className="text-amber-700 dark:text-amber-300 font-semibold">
                    ⚠️ Faltam {formatCurrency(goal - simulation.totalProfit)} para atingir a meta
                    ({simulation.unitsToGoal} unidades no varejo)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Projeção */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Projeção de Lucro (12 meses)</h3>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulation.projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="lucro"
                        name="Lucro Acumulado"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="meta"
                        name="Meta"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.1}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Comparação */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900 dark:text-white">Receita vs Lucro por Canal</h3>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={simulation.channelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salvar Simulação */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  placeholder="Nome da simulação..."
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm
                    focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100
                    dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <Button onClick={saveSimulation} disabled={!simulationName}>
                  <Save size={16} />
                  Salvar Simulação
                </Button>
                <Button variant="secondary" onClick={() => setShowReport(true)}>
                  <FileText size={16} />
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Lista de Simulações Salvas */}
      {simulations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Simulações Salvas</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {simulations.map((sim) => {
                const formula = formulas.find((f) => f.id === sim.formulaId);
                return (
                  <div
                    key={sim.id}
                    className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <Calculator size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{sim.name}</p>
                        <p className="text-sm text-neutral-500">
                          {formula?.name} • {getPeriodLabel(sim.period)} • Meta: {formatCurrency(sim.goal)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">
                        {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => loadSimulation(sim)}>
                        <Play size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openReport(sim)}>
                        <FileText size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSimulation(sim.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem inicial */}
      {!selectedFormula && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
            <p className="text-neutral-500">Selecione um produto para iniciar a simulação</p>
          </CardContent>
        </Card>
      )}

      {/* Report Modal */}
      {showReport && simulation && (
        <SimulationReport
          simulation={{
            id: selectedSimulation?.id || 'temp',
            name: selectedSimulation?.name || 'Simulação',
            formulaId: selectedFormula,
            period,
            retailQty,
            wholesaleQty,
            bundleQty,
            discount,
            costIncrease,
            goal,
            createdAt: selectedSimulation?.createdAt || new Date().toISOString(),
          }}
          results={simulation}
          formula={simulation.formula}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
