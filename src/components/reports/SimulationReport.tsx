import { useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Printer, X, Building2, TrendingUp, Target, DollarSign, ShoppingBag, Package, Boxes } from 'lucide-react';
import { Formula, useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

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

interface SimulationResults {
  formula: Formula;
  adjustedCost: number;
  retail: { price: number; profit: number; qty: number; revenue: number; totalProfit: number };
  wholesale: { price: number; profit: number; qty: number; revenue: number; totalProfit: number };
  bundle: { price: number; profit: number; qty: number; revenue: number; totalProfit: number; bundleQty: number };
  totalRevenue: number;
  totalProfit: number;
  totalUnits: number;
  yearlyProfit: number;
  goalProgress: number;
  unitsToGoal: number;
  projectionData: { month: string; lucro: number; meta: number }[];
  channelData: { name: string; receita: number; lucro: number; unidades: number }[];
  period: string;
  discount: number;
  costIncrease: number;
  goal: number;
}

interface SimulationReportProps {
  simulation: Simulation;
  results: SimulationResults;
  formula: Formula;
  onClose: () => void;
}

export function SimulationReport({ simulation, results, formula, onClose }: SimulationReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyLogo } = useStore();
  const logoUrl = companyLogo || 'https://drive.google.com/uc?export=view&id=1TpRK1Hojd_rhhcCiZ799q8HZQu28Gmu2';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clonar o conteúdo para não afetar o DOM original
    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    
    // Substituir a logo por uma versão segura para impressão
    const logoImg = clonedContent.querySelector('.logo-container img') as HTMLImageElement;
    if (logoImg) {
      // Se for base64 muito grande, substituir por texto
      if (logoImg.src.length > 50000) {
        const parent = logoImg.parentElement;
        if (parent) {
          parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:6px;"><span style="color:white;font-weight:bold;font-size:12px;">OC</span></div>`;
        }
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Simulação - ${simulation.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            width: 210mm;
            min-height: 297mm;
          }
          
          .report-container {
            padding: 8mm;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 3px solid #6366f1;
            margin-bottom: 15px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .logo-container {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
            min-height: 40px !important;
            max-height: 40px !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            padding: 3px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          
          .logo-container img {
            width: 34px !important;
            height: 34px !important;
            max-width: 34px !important;
            max-height: 34px !important;
            min-width: 0 !important;
            object-fit: contain !important;
            display: block !important;
          }
          
          .company-info h1 {
            font-size: 16pt;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .company-info p {
            font-size: 9pt;
            color: #666;
          }
          
          .title-section {
            background: linear-gradient(135deg, #eef2ff, #e0e7ff);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #6366f1;
          }
          
          .title-section h2 {
            font-size: 16pt;
            font-weight: 700;
            color: #4338ca;
            margin-bottom: 5px;
          }
          
          .title-section p {
            font-size: 10pt;
            color: #64748b;
          }
          
          .section {
            margin-bottom: 15px;
          }
          
          .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 3px solid #6366f1;
          }
          
          .params-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .param-card {
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          
          .param-card label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            display: block;
            margin-bottom: 5px;
          }
          
          .param-card .value {
            font-size: 14pt;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .results-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .result-card {
            padding: 15px;
            border-radius: 10px;
            text-align: center;
          }
          
          .result-card.cost { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #fcd34d; }
          .result-card.revenue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border: 1px solid #93c5fd; }
          .result-card.profit { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 1px solid #86efac; }
          .result-card.yearly { background: linear-gradient(135deg, #f3e8ff, #e9d5ff); border: 1px solid #d8b4fe; }
          
          .result-card label {
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 5px;
          }
          
          .result-card.cost label { color: #b45309; }
          .result-card.revenue label { color: #1e40af; }
          .result-card.profit label { color: #166534; }
          .result-card.yearly label { color: #7c3aed; }
          
          .result-card .value {
            font-size: 16pt;
            font-weight: 800;
          }
          
          .result-card.cost .value { color: #b45309; }
          .result-card.revenue .value { color: #1e40af; }
          .result-card.profit .value { color: #166534; }
          .result-card.yearly .value { color: #7c3aed; }
          
          .channels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .channel-card {
            padding: 15px;
            border-radius: 10px;
          }
          
          .channel-card.retail { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #93c5fd; }
          .channel-card.wholesale { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; }
          .channel-card.bundle { background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 1px solid #d8b4fe; }
          
          .channel-card h4 {
            font-size: 11pt;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .channel-card.retail h4 { color: #1e40af; }
          .channel-card.wholesale h4 { color: #166534; }
          .channel-card.bundle h4 { color: #7c3aed; }
          
          .channel-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 10pt;
          }
          
          .channel-row span:first-child { color: #64748b; }
          .channel-row span:last-child { font-weight: 600; color: #1a1a1a; }
          
          .goal-section {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
          }
          
          .goal-section.success { background: #dcfce7; border: 1px solid #86efac; }
          .goal-section.pending { background: #fef3c7; border: 1px solid #fcd34d; }
          
          .goal-bar {
            height: 12px;
            background: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin: 10px 0;
          }
          
          .goal-bar-fill {
            height: 100%;
            border-radius: 6px;
          }
          
          .goal-bar-fill.success { background: #22c55e; }
          .goal-bar-fill.pending { background: #3b82f6; }
          
          .chart-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border: 1px solid #e2e8f0;
          }
          
          .chart-section h4 {
            font-size: 10pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 10px;
          }
          
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #94a3b8;
          }
          
          /* Prevent page breaks */
          .section, .results-grid, .channels-grid, .chart-section {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Relatório de Simulação
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer size={16} />
              Imprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-neutral-800">
          <div 
            ref={reportRef}
            className="bg-white rounded-xl shadow-lg mx-auto"
            style={{ width: '210mm', minHeight: '297mm', padding: '8mm' }}
          >
            <div className="report-container">
              {/* Header */}
              <div className="header flex justify-between items-center pb-3 border-b-2 border-indigo-500 mb-4">
                <div className="logo-section flex items-center gap-3">
                  <div className="logo-container" style={{ width: '40px', height: '40px', minWidth: '40px', maxWidth: '40px', minHeight: '40px', maxHeight: '40px', borderRadius: '8px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      style={{ width: '34px', height: '34px', maxWidth: '34px', maxHeight: '34px', objectFit: 'contain', display: 'block' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:6px;"><span style="color:white;font-weight:bold;font-size:12px;">OC</span></div>';
                        }
                      }}
                    />
                  </div>
                  <div className="company-info">
                    <h1 className="text-lg font-bold text-neutral-900">Ohana Clean</h1>
                    <p className="text-xs text-neutral-500">Relatório de Simulação de Vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Emissão</p>
                  <p className="font-semibold text-neutral-900">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="title-section bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl mb-4 border-l-4 border-indigo-500">
                <h2 className="text-xl font-bold text-indigo-800">{simulation.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Produto: <span className="font-semibold">{formula.name}</span> ({formula.code}) • 
                  Período: <span className="font-semibold">{getPeriodLabel(simulation.period)}</span>
                </p>
              </div>

              {/* Parâmetros da Simulação */}
              <div className="section mb-4">
                <h3 className="section-title text-sm font-bold text-neutral-900 mb-3 p-2 bg-neutral-50 rounded-lg border-l-3 border-indigo-500 flex items-center gap-2">
                  <Target size={14} className="text-indigo-500" />
                  Parâmetros da Simulação
                </h3>
                <div className="params-grid grid grid-cols-4 gap-2">
                  <div className="param-card bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-blue-600 block mb-1">Varejo</label>
                    <span className="value text-lg font-bold text-blue-700">{simulation.retailQty} un</span>
                  </div>
                  <div className="param-card bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-green-600 block mb-1">Atacado</label>
                    <span className="value text-lg font-bold text-green-700">{simulation.wholesaleQty} un</span>
                  </div>
                  <div className="param-card bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-purple-600 block mb-1">Fardos</label>
                    <span className="value text-lg font-bold text-purple-700">{simulation.bundleQty} fardos</span>
                  </div>
                  <div className="param-card bg-amber-50 p-3 rounded-lg border border-amber-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-amber-600 block mb-1">Meta</label>
                    <span className="value text-lg font-bold text-amber-700">{formatCurrency(simulation.goal)}</span>
                  </div>
                </div>
                {(simulation.discount > 0 || simulation.costIncrease > 0) && (
                  <div className="flex gap-3 mt-2">
                    {simulation.discount > 0 && (
                      <div className="flex-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                        <span className="text-xs text-amber-700">Desconto Promocional: <strong>{simulation.discount}%</strong></span>
                      </div>
                    )}
                    {simulation.costIncrease > 0 && (
                      <div className="flex-1 p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                        <span className="text-xs text-red-700">Aumento de Custos: <strong>{simulation.costIncrease}%</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resultados Principais */}
              <div className="section mb-4">
                <h3 className="section-title text-sm font-bold text-neutral-900 mb-3 p-2 bg-neutral-50 rounded-lg border-l-3 border-green-500 flex items-center gap-2">
                  <DollarSign size={14} className="text-green-500" />
                  Resultados Projetados
                </h3>
                <div className="results-grid grid grid-cols-4 gap-2">
                  <div className="result-card cost bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl border border-amber-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-amber-600 block mb-1">Custo Ajustado</label>
                    <span className="value text-xl font-bold text-amber-700">{formatCurrency(results.adjustedCost)}</span>
                  </div>
                  <div className="result-card revenue bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-blue-600 block mb-1">Receita Total</label>
                    <span className="value text-xl font-bold text-blue-700">{formatCurrency(results.totalRevenue)}</span>
                  </div>
                  <div className="result-card profit bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-green-600 block mb-1">Lucro Projetado</label>
                    <span className="value text-xl font-bold text-green-700">{formatCurrency(results.totalProfit)}</span>
                  </div>
                  <div className="result-card yearly bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200 text-center">
                    <label className="text-[9px] uppercase tracking-wide text-purple-600 block mb-1">Projeção Anual</label>
                    <span className="value text-xl font-bold text-purple-700">{formatCurrency(results.yearlyProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Análise por Canal */}
              <div className="section mb-4">
                <h3 className="section-title text-sm font-bold text-neutral-900 mb-3 p-2 bg-neutral-50 rounded-lg border-l-3 border-blue-500 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-500" />
                  Análise por Canal de Venda
                </h3>
                <div className="channels-grid grid grid-cols-3 gap-3">
                  <div className="channel-card retail bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <h4 className="text-base font-bold text-blue-700 mb-3 flex items-center gap-2">
                      <ShoppingBag size={16} />
                      Varejo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Unidades:</span>
                        <span className="font-semibold">{results.retail.qty}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Preço:</span>
                        <span className="font-semibold">{formatCurrency(results.retail.price)}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Receita:</span>
                        <span className="font-semibold">{formatCurrency(results.retail.revenue)}</span>
                      </div>
                      <div className="channel-row flex justify-between border-t border-blue-200 pt-2">
                        <span className="text-blue-600 font-medium">Lucro:</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.retail.totalProfit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="channel-card wholesale bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <h4 className="text-base font-bold text-green-700 mb-3 flex items-center gap-2">
                      <Package size={16} />
                      Atacado
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Unidades:</span>
                        <span className="font-semibold">{results.wholesale.qty}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Preço:</span>
                        <span className="font-semibold">{formatCurrency(results.wholesale.price)}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Receita:</span>
                        <span className="font-semibold">{formatCurrency(results.wholesale.revenue)}</span>
                      </div>
                      <div className="channel-row flex justify-between border-t border-green-200 pt-2">
                        <span className="text-green-600 font-medium">Lucro:</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.wholesale.totalProfit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="channel-card bundle bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <h4 className="text-base font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <Boxes size={16} />
                      Fardo ({results.bundle.bundleQty}un)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Fardos:</span>
                        <span className="font-semibold">{results.bundle.qty}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Preço/un:</span>
                        <span className="font-semibold">{formatCurrency(results.bundle.price)}</span>
                      </div>
                      <div className="channel-row flex justify-between">
                        <span className="text-neutral-500">Receita:</span>
                        <span className="font-semibold">{formatCurrency(results.bundle.revenue)}</span>
                      </div>
                      <div className="channel-row flex justify-between border-t border-purple-200 pt-2">
                        <span className="text-purple-600 font-medium">Lucro:</span>
                        <span className="font-bold text-green-600">{formatCurrency(results.bundle.totalProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise da Meta */}
              <div className={`goal-section p-4 rounded-xl mb-4 ${
                results.goalProgress >= 100 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-neutral-900">Análise da Meta</h4>
                  <span className={`font-bold text-lg ${results.goalProgress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {results.goalProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${results.goalProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(results.goalProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500">Atual: {formatCurrency(results.totalProfit)}</span>
                  <span className="text-neutral-500">Meta: {formatCurrency(results.goal)}</span>
                </div>
                <div className={`mt-3 p-2 rounded-lg text-center font-semibold ${
                  results.goalProgress >= 100 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {results.goalProgress >= 100
                    ? `✅ Meta atingida! Excedente: ${formatCurrency(results.totalProfit - results.goal)}`
                    : `⚠️ Faltam ${formatCurrency(results.goal - results.totalProfit)} (${results.unitsToGoal} unidades no varejo)`
                  }
                </div>
              </div>

              {/* Gráfico de Projeção */}
              <div className="chart-section bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4">
                <h4 className="text-sm font-semibold text-neutral-900 mb-3">Projeção de Lucro Acumulado (12 meses)</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Area
                        type="monotone"
                        dataKey="lucro"
                        name="Lucro"
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
              </div>

              {/* Gráfico Comparativo */}
              <div className="chart-section bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h4 className="text-sm font-semibold text-neutral-900 mb-3">Comparativo por Canal</h4>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.channelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${v}`} />
                      <Legend wrapperStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Footer */}
              <div className="footer mt-6 pt-3 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Building2 size={12} />
                  <span>Ohana Clean - Sistema de Gestão</span>
                </div>
                <p>Gerado em {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
