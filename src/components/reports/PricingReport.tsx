import { useRef } from 'react';
import { Printer, X, Building2, DollarSign, TrendingUp, ShoppingBag, Package, Boxes, Award, Percent, PiggyBank } from 'lucide-react';
import { Formula, useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

interface PricingCalculations {
  totalCost: number;
  costPerUnit: number;
  totalCostWithFixed: number;
  retail: {
    price: number;
    rounded: number;
    suggestedMarkup: number;
    profit: number;
    margin: number;
  };
  wholesale: {
    price: number;
    rounded: number;
    suggestedMarkup: number;
    profit: number;
    margin: number;
    savingsVsRetail: number;
    savingsPercent: number;
  };
  bundle: {
    quantity: number;
    pricePerUnit: number;
    total: number;
    savingsPerUnit: number;
    discountPercent: number;
    profit: number;
    margin: number;
    markup?: number;
  };
  breakEven: {
    retail: number;
    wholesale: number;
  };
}

interface PricingReportProps {
  formula: Formula;
  calculations: PricingCalculations;
  competitorPrice?: number;
  fixedCosts: number;
  onClose: () => void;
}

export function PricingReport({ formula, calculations, fixedCosts, onClose }: PricingReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyLogo } = useStore();
  const logoUrl = companyLogo || 'https://drive.google.com/uc?export=view&id=1TpRK1Hojd_rhhcCiZ799q8HZQu28Gmu2';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular markup do fardo com 2 casas decimais
  const bundleMarkup = calculations.bundle.markup !== undefined 
    ? calculations.bundle.markup.toFixed(2) 
    : (((calculations.bundle.pricePerUnit - calculations.totalCostWithFixed) / calculations.totalCostWithFixed) * 100).toFixed(2);

  const comparisonData = [
    {
      name: 'Varejo',
      preco: calculations.retail.rounded,
      lucro: calculations.retail.profit,
      cor: '#3b82f6',
    },
    {
      name: 'Atacado',
      preco: calculations.wholesale.rounded,
      lucro: calculations.wholesale.profit,
      cor: '#10b981',
    },
    {
      name: 'Fardo',
      preco: calculations.bundle.pricePerUnit,
      lucro: calculations.bundle.profit,
      cor: '#8b5cf6',
    },
  ];

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
          parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:8px;"><span style="color:white;font-weight:bold;font-size:12px;">OC</span></div>`;
        }
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Precificação - ${formula.name}</title>
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
            font-size: 9pt;
            line-height: 1.3;
            color: #1a1a1a;
            background: white;
            width: 210mm;
            min-height: 297mm;
          }
          
          .report-container {
            padding: 5mm;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            border-bottom: 3px solid #3b82f6;
            margin-bottom: 12px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .logo-container {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            max-width: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
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
            width: 30px !important;
            height: 30px !important;
            max-width: 30px !important;
            max-height: 30px !important;
            min-width: 0 !important;
            object-fit: contain !important;
            display: block !important;
          }
          
          .company-info h1 {
            font-size: 14pt;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .company-info p {
            font-size: 8pt;
            color: #666;
          }
          
          .date-section {
            text-align: right;
            font-size: 9pt;
          }
          
          .product-title {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid #3b82f6;
          }
          
          .product-title h2 {
            font-size: 14pt;
            font-weight: 700;
            color: #1e40af;
          }
          
          .product-title .code {
            font-size: 9pt;
            color: #64748b;
            font-family: monospace;
          }
          
          .section {
            margin-bottom: 12px;
          }
          
          .section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
            padding: 6px 10px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
          }
          
          .cost-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          
          .cost-card {
            padding: 10px;
            border-radius: 8px;
            text-align: center;
          }
          
          .cost-card.default { background: #f8fafc; border: 1px solid #e2e8f0; }
          .cost-card.blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; }
          .cost-card.green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; }
          .cost-card.amber { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a; }
          .cost-card.purple { background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 1px solid #e9d5ff; }
          
          .cost-card label {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #64748b;
            display: block;
            margin-bottom: 4px;
          }
          
          .cost-card .value {
            font-size: 12pt;
            font-weight: 700;
          }
          
          .cost-card.default .value { color: #1a1a1a; }
          .cost-card.blue .value { color: #1e40af; }
          .cost-card.green .value { color: #166534; }
          .cost-card.amber .value { color: #b45309; }
          .cost-card.purple .value { color: #7c3aed; }
          
          .pricing-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          
          .pricing-card {
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          
          .pricing-card .header-bar {
            padding: 8px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .pricing-card.retail .header-bar { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
          .pricing-card.wholesale .header-bar { background: linear-gradient(135deg, #10b981, #059669); color: white; }
          .pricing-card.bundle .header-bar { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
          
          .pricing-card .channel-name {
            font-size: 9pt;
            font-weight: 600;
          }
          
          .pricing-card .content {
            padding: 12px;
          }
          
          .pricing-card.retail .content { background: #eff6ff; }
          .pricing-card.wholesale .content { background: #f0fdf4; }
          .pricing-card.bundle .content { background: #faf5ff; }
          
          .price-main {
            text-align: center;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            margin-bottom: 8px;
          }
          
          .price-main .price {
            font-size: 18pt;
            font-weight: 800;
          }
          
          .pricing-card.retail .price { color: #1e40af; }
          .pricing-card.wholesale .price { color: #166534; }
          .pricing-card.bundle .price { color: #7c3aed; }
          
          .price-main .per-unit {
            font-size: 7pt;
            color: #64748b;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          
          .info-item {
            background: rgba(255,255,255,0.7);
            padding: 6px 8px;
            border-radius: 6px;
            text-align: center;
          }
          
          .info-item label {
            font-size: 7pt;
            text-transform: uppercase;
            color: #64748b;
            display: block;
          }
          
          .info-item .value {
            font-size: 10pt;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .info-item .value.green { color: #16a34a; }
          
          .savings-banner {
            margin-top: 6px;
            padding: 6px 8px;
            background: #dcfce7;
            border-radius: 6px;
            text-align: center;
            font-size: 8pt;
            color: #166534;
            font-weight: 500;
          }
          
          .bottom-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px dashed #e2e8f0;
          }
          
          .charts-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .chart-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e2e8f0;
          }
          
          .chart-box h4 {
            font-size: 9pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .analysis-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .analysis-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e2e8f0;
          }
          
          .analysis-box h4 {
            font-size: 9pt;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .breakeven-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          
          .breakeven-card {
            padding: 12px;
            border-radius: 8px;
            text-align: center;
          }
          
          .breakeven-card.blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; }
          .breakeven-card.green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; }
          
          .breakeven-card .label {
            font-size: 8pt;
            color: #64748b;
            margin-bottom: 4px;
          }
          
          .breakeven-card .value {
            font-size: 20pt;
            font-weight: 800;
          }
          
          .breakeven-card.blue .value { color: #1e40af; }
          .breakeven-card.green .value { color: #166534; }
          
          .breakeven-card .unit {
            font-size: 8pt;
            color: #64748b;
          }
          
          .competitor-section {
            background: linear-gradient(135deg, #fefce8, #fef9c3);
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #fde047;
          }
          
          .competitor-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 10px;
          }
          
          .competitor-item {
            text-align: center;
          }
          
          .competitor-item label {
            font-size: 7pt;
            color: #64748b;
            display: block;
            margin-bottom: 2px;
          }
          
          .competitor-item .value {
            font-size: 12pt;
            font-weight: 700;
          }
          
          .competitor-alert {
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 9pt;
            font-weight: 600;
            text-align: center;
          }
          
          .competitor-alert.success { background: #dcfce7; color: #166534; }
          .competitor-alert.warning { background: #fef3c7; color: #92400e; }
          
          .summary-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          
          .summary-card {
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          
          .summary-card .title {
            font-size: 7pt;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          
          .summary-card .value {
            font-size: 11pt;
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .summary-card .subtitle {
            font-size: 8pt;
            color: #64748b;
          }
          
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #94a3b8;
          }

          /* Prevent page breaks inside elements */
          .section, .pricing-cards, .charts-row, .analysis-row, .summary-row {
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

  // Determinar o melhor canal
  const bestChannel = comparisonData.reduce((best, current) => 
    current.lucro > best.lucro ? current : best
  , comparisonData[0]);

  // Melhor margem
  const margins = [
    { name: 'Varejo', margin: calculations.retail.margin },
    { name: 'Atacado', margin: calculations.wholesale.margin },
    { name: 'Fardo', margin: calculations.bundle.margin },
  ];
  const bestMargin = margins.reduce((best, current) => 
    current.margin > best.margin ? current : best
  , margins[0]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Relatório de Precificação
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
            style={{ width: '210mm', minHeight: '297mm', padding: '6mm' }}
          >
            <div className="report-container">
              {/* Header */}
              <div className="header flex justify-between items-center pb-2 border-b-2 border-blue-500 mb-3">
                <div className="logo-section flex items-center gap-2">
                  <div className="logo-container" style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', minHeight: '32px', maxHeight: '32px', borderRadius: '6px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      style={{ width: '28px', height: '28px', maxWidth: '28px', maxHeight: '28px', objectFit: 'contain', display: 'block' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:4px;"><span style="color:white;font-weight:bold;font-size:10px;">OC</span></div>';
                        }
                      }}
                    />
                  </div>
                  <div className="company-info">
                    <h1 className="text-base font-bold text-neutral-900">Ohana Clean</h1>
                    <p className="text-[9px] text-neutral-500">Relatório de Precificação</p>
                  </div>
                </div>
                <div className="date-section text-right">
                  <p className="text-[10px] text-neutral-500">Emissão</p>
                  <p className="font-semibold text-neutral-900 text-xs">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Product Title */}
              <div className="product-title bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg mb-3 border-l-3 border-blue-500">
                <h2 className="text-lg font-bold text-blue-800">{formula.name}</h2>
                <p className="text-xs text-neutral-500">Código: <span className="font-mono">{formula.code}</span> | Rendimento: <span className="font-semibold">{formula.yield} un</span></p>
              </div>

              {/* Section 1: Custos */}
              <div className="section mb-3">
                <h3 className="section-title text-xs font-bold text-neutral-900 mb-2 p-1.5 bg-neutral-50 rounded border-l-2 border-blue-500 flex items-center gap-1.5">
                  <DollarSign size={12} className="text-blue-500" />
                  Análise de Custos
                </h3>
                <div className="cost-grid grid grid-cols-4 gap-1.5">
                  <div className="cost-card default bg-neutral-50 p-2 rounded border border-neutral-200 text-center">
                    <label className="text-[8px] uppercase tracking-wide text-neutral-500 block">Custo Fórmula</label>
                    <span className="value text-sm font-bold text-neutral-900">{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  <div className="cost-card default bg-neutral-50 p-2 rounded border border-neutral-200 text-center">
                    <label className="text-[8px] uppercase tracking-wide text-neutral-500 block">Custo/Un</label>
                    <span className="value text-sm font-bold text-neutral-900">{formatCurrency(calculations.costPerUnit)}</span>
                  </div>
                  <div className="cost-card blue bg-blue-50 p-2 rounded border border-blue-200 text-center">
                    <label className="text-[8px] uppercase tracking-wide text-blue-600 block">Desp. Fixas</label>
                    <span className="value text-sm font-bold text-blue-700">{formatCurrency(fixedCosts)}</span>
                  </div>
                  <div className="cost-card amber bg-amber-50 p-2 rounded border border-amber-200 text-center">
                    <label className="text-[8px] uppercase tracking-wide text-amber-600 block">Custo Total</label>
                    <span className="value text-sm font-bold text-amber-700">{formatCurrency(calculations.totalCostWithFixed)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing Cards */}
              <div className="section mb-3">
                <h3 className="section-title text-xs font-bold text-neutral-900 mb-2 p-1.5 bg-neutral-50 rounded border-l-2 border-green-500 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-green-500" />
                  Preços por Canal
                </h3>
                <div className="pricing-cards grid grid-cols-3 gap-2">
                  {/* Varejo */}
                  <div className="pricing-card retail rounded-lg overflow-hidden border border-blue-200">
                    <div className="header-bar bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 flex items-center gap-1.5">
                      <ShoppingBag size={12} />
                      <span className="channel-name text-[10px] font-semibold">VAREJO</span>
                      <span className="text-[8px] ml-auto opacity-80">x,95</span>
                    </div>
                    <div className="content bg-blue-50 p-2">
                      <div className="price-main text-center pb-2 border-b border-blue-200 mb-2">
                        <p className="price text-xl font-extrabold text-blue-700">{formatCurrency(calculations.retail.rounded)}</p>
                      </div>
                      <div className="info-grid grid grid-cols-2 gap-1">
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Markup</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{calculations.retail.suggestedMarkup.toFixed(1)}%</p>
                        </div>
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Margem</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{calculations.retail.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="mt-1.5 bg-green-100 p-1.5 rounded text-center">
                        <label className="text-[7px] text-green-600 uppercase block">Lucro</label>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(calculations.retail.profit)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Atacado */}
                  <div className="pricing-card wholesale rounded-lg overflow-hidden border border-green-200">
                    <div className="header-bar bg-gradient-to-r from-green-500 to-green-600 text-white p-2 flex items-center gap-1.5">
                      <Package size={12} />
                      <span className="channel-name text-[10px] font-semibold">ATACADO</span>
                      <span className="text-[8px] ml-auto opacity-80">x,90</span>
                    </div>
                    <div className="content bg-green-50 p-2">
                      <div className="price-main text-center pb-2 border-b border-green-200 mb-2">
                        <p className="price text-xl font-extrabold text-green-700">{formatCurrency(calculations.wholesale.rounded)}</p>
                      </div>
                      <div className="info-grid grid grid-cols-2 gap-1">
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Markup</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{calculations.wholesale.suggestedMarkup.toFixed(1)}%</p>
                        </div>
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Margem</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{calculations.wholesale.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="mt-1.5 bg-green-100 p-1.5 rounded text-center">
                        <label className="text-[7px] text-green-600 uppercase block">Lucro</label>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(calculations.wholesale.profit)}</p>
                      </div>
                      <div className="mt-1 bg-emerald-100 p-1 rounded text-center">
                        <p className="text-[8px] text-emerald-700 font-medium">
                          Economia: {formatCurrency(calculations.wholesale.savingsVsRetail)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fardo */}
                  <div className="pricing-card bundle rounded-lg overflow-hidden border border-purple-200">
                    <div className="header-bar bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2 flex items-center gap-1.5">
                      <Boxes size={12} />
                      <span className="channel-name text-[10px] font-semibold">FARDO ({calculations.bundle.quantity}un)</span>
                      <span className="text-[8px] ml-auto opacity-80">x,80</span>
                    </div>
                    <div className="content bg-purple-50 p-2">
                      <div className="price-main text-center pb-2 border-b border-purple-200 mb-2">
                        <p className="price text-xl font-extrabold text-purple-700">{formatCurrency(calculations.bundle.pricePerUnit)}</p>
                        <p className="text-[7px] text-neutral-500">por unidade</p>
                      </div>
                      <div className="info-grid grid grid-cols-2 gap-1">
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Markup</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{bundleMarkup}%</p>
                        </div>
                        <div className="info-item bg-white/70 p-1.5 rounded text-center">
                          <label className="text-[7px] text-neutral-500 uppercase block">Margem</label>
                          <p className="value text-[10px] font-bold text-neutral-900">{calculations.bundle.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="mt-1.5 bg-green-100 p-1.5 rounded text-center">
                        <label className="text-[7px] text-green-600 uppercase block">Lucro/Un</label>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(calculations.bundle.profit)}</p>
                      </div>
                      <div className="mt-1 bg-purple-200 p-1.5 rounded text-center">
                        <p className="text-[7px] text-purple-600">Total Fardo</p>
                        <p className="text-base font-extrabold text-purple-700">{formatCurrency(calculations.bundle.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Espaço removido - Ponto de equilíbrio e Análise competitiva foram removidos */}

              {/* Summary Cards */}
              <div className="summary-row grid grid-cols-3 gap-3 mb-4">
                <div className="summary-card best bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                  <Award size={18} className="text-green-600 mx-auto mb-1" />
                  <p className="title text-[8px] text-neutral-500 uppercase">Maior Lucro</p>
                  <p className="value text-base font-bold text-green-700">{bestChannel.name}</p>
                  <p className="subtitle text-[9px] text-green-600">{formatCurrency(bestChannel.lucro)}/un</p>
                </div>
                <div className="summary-card margin bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                  <Percent size={18} className="text-blue-600 mx-auto mb-1" />
                  <p className="title text-[8px] text-neutral-500 uppercase">Melhor Margem</p>
                  <p className="value text-base font-bold text-blue-700">{bestMargin.name}</p>
                  <p className="subtitle text-[9px] text-blue-600">{bestMargin.margin.toFixed(1)}%</p>
                </div>
                <div className="summary-card volume bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                  <PiggyBank size={18} className="text-purple-600 mx-auto mb-1" />
                  <p className="title text-[8px] text-neutral-500 uppercase">Lucro (100un)</p>
                  <p className="value text-base font-bold text-purple-700">{formatCurrency(calculations.retail.profit * 100)}</p>
                  <p className="subtitle text-[9px] text-purple-600">varejo</p>
                </div>
              </div>

              {/* Gráficos removidos do relatório de impressão */}

              {/* Footer */}
              <div className="footer mt-4 pt-2 border-t border-neutral-200 flex justify-between items-center text-[8px] text-neutral-400">
                <div className="flex items-center gap-1">
                  <Building2 size={10} />
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
