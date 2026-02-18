import { useMemo } from 'react';
import {
  TrendingUp, Package, FlaskConical, DollarSign,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const { rawMaterials, formulas, pricings } = useStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const stats = useMemo(() => {
    const activeRawMaterials = rawMaterials.filter((m) => m.status === 'active');
    const lowStockItems = activeRawMaterials.filter((m) => m.currentStock <= m.minStock);
    const finalFormulas = formulas.filter((f) => f.status === 'final');

    const totalInventoryValue = rawMaterials.reduce(
      (total, m) => total + m.unitValue * m.currentStock,
      0
    );

    const calculateFormulaCost = (formula: typeof formulas[0]) => {
      return formula.ingredients.reduce((total, ing) => {
        const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
        return total + (material ? material.unitValue * ing.quantity : 0);
      }, 0);
    };

    const formulasWithProfit = finalFormulas.map((f) => {
      const cost = calculateFormulaCost(f);
      const costPerUnit = cost / f.yield;
      const pricing = pricings.find((p) => p.formulaId === f.id);
      const retailPrice = pricing
        ? costPerUnit * (1 + pricing.retailMarkup / 100)
        : 0;
      const profit = retailPrice - costPerUnit;
      const margin = retailPrice > 0 ? (profit / retailPrice) * 100 : 0;

      return {
        ...f,
        cost,
        costPerUnit,
        retailPrice,
        profit,
        margin,
      };
    });

    const mostProfitable = [...formulasWithProfit]
      .filter((f) => f.profit > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    const rawMaterialsCost = rawMaterials
      .filter((m) => m.status === 'active')
      .map((m) => ({
        name: m.name,
        value: m.unitValue,
        sku: m.sku,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalPotentialRevenue = formulasWithProfit.reduce(
      (total, f) => total + f.retailPrice * f.yield,
      0
    );

    const totalPotentialProfit = formulasWithProfit.reduce(
      (total, f) => total + f.profit * f.yield,
      0
    );

    return {
      totalRawMaterials: rawMaterials.length,
      activeRawMaterials: activeRawMaterials.length,
      lowStockItems,
      totalFormulas: formulas.length,
      finalFormulas: finalFormulas.length,
      pricedFormulas: pricings.length,
      totalInventoryValue,
      mostProfitable,
      rawMaterialsCost,
      totalPotentialRevenue,
      totalPotentialProfit,
    };
  }, [rawMaterials, formulas, pricings]);

  const profitChartData = stats.mostProfitable.map((f) => ({
    name: f.name.length > 12 ? f.name.substring(0, 12) + '...' : f.name,
    fullName: f.name,
    lucro: f.profit,
    margem: f.margin,
  }));

  const costDistributionData = stats.rawMaterialsCost.map((m, index) => ({
    name: m.name.length > 12 ? m.name.substring(0, 12) + '...' : m.name,
    value: m.value,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Matérias-Primas</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.activeRawMaterials}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {stats.totalRawMaterials} cadastradas
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
                <p className="text-sm text-neutral-500">Fórmulas</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stats.finalFormulas}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {stats.pricedFormulas} precificadas
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <FlaskConical className="text-green-500" size={24} />
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
                  {formatCurrency(stats.totalInventoryValue)}
                </p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <ArrowUpRight size={12} />
                  Atualizado
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <DollarSign className="text-purple-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Lucro Potencial</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalPotentialProfit)}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  por lote produzido
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <TrendingUp className="text-green-500" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de alerta de estoque baixo removido conforme solicitação */}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Profitable Products */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              Produtos Mais Rentáveis
            </h3>
          </CardHeader>
          <CardContent>
            {profitChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => `R$${v.toFixed(0)}`} tick={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={90}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, _name, props) => [
                        formatCurrency(Number(value)),
                        props.payload?.fullName || 'Lucro'
                      ]}
                      labelFormatter={(label) => profitChartData.find(d => d.name === label)?.fullName || label}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="lucro" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-400">
                Nenhum produto precificado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw Materials Cost Distribution */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              Matérias-Primas com Maior Custo
            </h3>
          </CardHeader>
          <CardContent>
            {costDistributionData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-400">
                Nenhuma matéria-prima cadastrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Resumo de Produtos e Margens
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Custo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Preço Varejo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Lucro/Unidade
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Margem
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {stats.mostProfitable.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-500">{product.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">
                      {formatCurrency(product.costPerUnit)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">
                      {formatCurrency(product.retailPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${product.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(product.profit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {product.margin > 30 ? (
                          <ArrowUpRight size={14} className="text-green-500" />
                        ) : (
                          <ArrowDownRight size={14} className="text-amber-500" />
                        )}
                        <span className={product.margin > 30 ? 'text-green-600' : 'text-amber-600'}>
                          {product.margin.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={product.retailPrice > 0 ? 'success' : 'warning'}>
                        {product.retailPrice > 0 ? 'Precificado' : 'Pendente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.mostProfitable.length === 0 && (
            <div className="py-12 text-center text-neutral-400">
              Nenhum produto com precificação definida
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
