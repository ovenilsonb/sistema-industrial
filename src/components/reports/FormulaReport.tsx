import { useRef } from 'react';
import { Printer, X, Building2, Calendar, FileText } from 'lucide-react';
import { Formula, RawMaterial, useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';

interface FormulaReportProps {
  formula: Formula;
  rawMaterials: RawMaterial[];
  onClose: () => void;
}

const DEFAULT_LOGO = 'https://drive.google.com/uc?export=view&id=1TpRK1Hojd_rhhcCiZ799q8HZQu28Gmu2';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function FormulaReport({ formula, rawMaterials, onClose }: FormulaReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyLogo } = useStore();
  const logoUrl = companyLogo || DEFAULT_LOGO;

  const formatCurrencyParts = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return formatted;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatQuantity = (value: number) => {
    return value.toFixed(3).replace('.', ',');
  };

  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      return variant?.unitValue || 0;
    }
    
    return material.unitValue;
  };

  const getIngredientFullName = (materialId: string, variantName?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 'Material não encontrado';
    
    if (material.hasVariants && variantName) {
      return `${material.name} - ${variantName}`;
    }
    
    return material.name;
  };

  const getIngredientSku = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return '';
    
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      return variant?.sku || material.sku;
    }
    
    return material.sku;
  };

  const calculateIngredientCost = (rawMaterialId: string, quantity: number, variantId?: string) => {
    const unitValue = getMaterialUnitValue(rawMaterialId, variantId);
    return unitValue * quantity;
  };

  const calculateFormulaCost = () => {
    return formula.ingredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
    }, 0);
  };

  const totalCost = calculateFormulaCost();
  const costPerUnit = totalCost / formula.yield;

  const isIngredientChemical = (materialId: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    return material?.isChemical !== false;
  };

  const totalChemicalQuantity = formula.ingredients.reduce((total, ing) => {
    if (isIngredientChemical(ing.rawMaterialId)) {
      return total + ing.quantity;
    }
    return total;
  }, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Calcular tamanho da fonte baseado no número de ingredientes
    const ingredientCount = formula.ingredients.length;
    let baseFontSize = 10;
    let rowPadding = 8;
    
    if (ingredientCount > 12) {
      baseFontSize = 8;
      rowPadding = 5;
    } else if (ingredientCount > 8) {
      baseFontSize = 9;
      rowPadding = 6;
    }

    const ingredientsRows = formula.ingredients.map((ing, index) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      const cost = calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      const name = getIngredientFullName(ing.rawMaterialId, ing.variantName);
      const sku = getIngredientSku(ing.rawMaterialId, ing.variantId);
      const isChemical = isIngredientChemical(ing.rawMaterialId);
      const percentage = isChemical && totalChemicalQuantity > 0 
        ? ((ing.quantity / totalChemicalQuantity) * 100).toFixed(1) 
        : '—';
      const color = COLORS[index % COLORS.length];
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      
      return `
        <tr style="background: ${bgColor};">
          <td style="padding: ${rowPadding}px 10px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: ${color}; flex-shrink: 0;"></span>
              <span style="font-weight: 500; color: #1f2937;">${name}</span>
              <span style="font-style: italic; color: #6b7280; font-size: ${baseFontSize - 1}pt; margin-left: 6px;">(${sku})</span>
            </div>
          </td>
          <td style="padding: ${rowPadding}px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: 500;">${formatQuantity(ing.quantity)}</td>
          <td style="padding: ${rowPadding}px 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${material?.unitType || ''}</td>
          <td style="padding: ${rowPadding}px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">
            <span style="color: #9ca3af; font-size: ${baseFontSize - 1}pt; margin-right: 3px;">R$</span>
            <span style="font-family: monospace; font-weight: 500;">${formatCurrencyParts(unitValue)}</span>
          </td>
          <td style="padding: ${rowPadding}px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">
            <span style="color: #9ca3af; font-size: ${baseFontSize - 1}pt; margin-right: 3px;">R$</span>
            <span style="font-family: monospace; font-weight: 600;">${formatCurrencyParts(cost)}</span>
          </td>
          <td style="padding: ${rowPadding}px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">${percentage}${isChemical ? '%' : ''}</td>
        </tr>
      `;
    }).join('');

    const isLogoTooLarge = logoUrl.length > 50000;
    const logoHtml = isLogoTooLarge 
      ? `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 6px;"><span style="color: white; font-weight: bold; font-size: 14pt;">OC</span></div>`
      : `<img src="${logoUrl}" alt="Logo" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:6px;\\'><span style=\\'color:white;font-weight:bold;font-size:14pt;\\'>OC</span></div>'" />`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - ${formula.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 25mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            width: 100%;
            height: 100%;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${baseFontSize}pt;
            line-height: 1.4;
            color: #1f2937;
            background: white;
          }
          
          .page {
            width: 100%;
            min-height: 100%;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${baseFontSize}pt;
          }
          
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .page {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #3b82f6; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 45px; height: 45px; border-radius: 8px; overflow: hidden; background: white; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${logoHtml}
              </div>
              <div>
                <div style="font-size: 16pt; font-weight: 700; color: #1f2937;">Ohana Clean</div>
                <div style="font-size: 8pt; color: #6b7280;">Sistema de Gestão de Produção</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 8pt; color: #6b7280;">Data de Emissão</div>
              <div style="font-size: 11pt; font-weight: 600; color: #1f2937;">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          
          <!-- Product Info -->
          <div style="background: #f8fafc; padding: 12px 14px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 14pt; font-weight: 700; color: #1f2937; margin-bottom: 4px;">${formula.name}</div>
                <span style="display: inline-block; background: #e5e7eb; padding: 3px 8px; border-radius: 4px; font-size: 9pt; font-family: monospace; color: #4b5563;">${formula.code}</span>
              </div>
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 8pt; font-weight: 500; ${formula.status === 'final' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                ${formula.status === 'final' ? 'Finalizado' : 'Rascunho'}
              </span>
            </div>
            ${formula.description ? `<div style="font-size: 9pt; color: #64748b; margin-top: 6px;">${formula.description}</div>` : ''}
          </div>
          
          <!-- Stats -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 3px;">Peso/Volume</div>
              <div style="font-size: 13pt; font-weight: 700; color: #1f2937;">${formula.finalWeight} ${formula.finalUnit}</div>
            </div>
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 3px;">Rendimento</div>
              <div style="font-size: 13pt; font-weight: 700; color: #1f2937;">${formula.yield} unid.</div>
            </div>
            <div style="background: #eff6ff; padding: 10px 12px; border-radius: 8px; border: 1px solid #bfdbfe;">
              <div style="font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #3b82f6; margin-bottom: 3px;">Custo Total</div>
              <div style="font-size: 13pt; font-weight: 700; color: #3b82f6;">${formatCurrency(totalCost)}</div>
            </div>
            <div style="background: #f0fdf4; padding: 10px 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <div style="font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 3px;">Custo/Unidade</div>
              <div style="font-size: 13pt; font-weight: 700; color: #16a34a;">${formatCurrency(costPerUnit)}</div>
            </div>
          </div>
          
          <!-- Section Title -->
          <div style="font-size: 11pt; font-weight: 600; color: #1f2937; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb;">
            Composição da Fórmula
          </div>
          
          <!-- Table -->
          <table>
            <thead>
              <tr style="background: #4b5563;">
                <th style="padding: ${rowPadding}px 10px; text-align: left; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Matéria-Prima</th>
                <th style="padding: ${rowPadding}px 10px; text-align: right; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qtd.</th>
                <th style="padding: ${rowPadding}px 10px; text-align: center; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Un.</th>
                <th style="padding: ${rowPadding}px 10px; text-align: right; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Custo Unit.</th>
                <th style="padding: ${rowPadding}px 10px; text-align: right; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Custo Total</th>
                <th style="padding: ${rowPadding}px 10px; text-align: right; color: white; font-size: ${baseFontSize - 1}pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">%</th>
              </tr>
            </thead>
            <tbody>
              ${ingredientsRows}
            </tbody>
            <tfoot>
              <tr style="background: #374151;">
                <td colspan="4" style="padding: 10px; text-align: right; color: white; font-weight: 600;">CUSTO TOTAL DA FÓRMULA</td>
                <td style="padding: 10px; text-align: right; color: white;">
                  <span style="color: #9ca3af; font-size: ${baseFontSize - 1}pt; margin-right: 3px;">R$</span>
                  <span style="font-family: monospace; font-weight: 700; font-size: 12pt;">${formatCurrencyParts(totalCost)}</span>
                </td>
                <td style="padding: 10px; text-align: right; color: white; font-weight: 600;">100%</td>
              </tr>
            </tfoot>
          </table>
          
          ${formula.notes ? `
          <!-- Notes -->
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-top: 16px;">
            <div style="font-size: 10pt; font-weight: 600; color: #92400e; margin-bottom: 4px;">📋 Instruções de Fabricação</div>
            <div style="font-size: 9pt; color: #a16207; line-height: 1.5;">${formula.notes}</div>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 8pt; color: #9ca3af;">Ohana Clean - Sistema de Gestão de Produção</div>
            <div style="font-size: 8pt; color: #9ca3af;">Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
          </div>
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Relatório da Fórmula
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

        {/* Report Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-neutral-800">
          <div 
            ref={reportRef}
            className="bg-white rounded-xl shadow-lg mx-auto p-8"
            style={{ maxWidth: '800px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b-4 border-blue-500 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-neutral-200 p-1 flex items-center justify-center">
                  <img 
                    src={logoUrl} 
                    alt="Ohana Clean" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:8px;"><span style="color:white;font-weight:bold;font-size:18px;">OC</span></div>';
                      }
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Ohana Clean</h1>
                  <p className="text-sm text-neutral-500">Sistema de Gestão de Produção</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <Calendar size={14} />
                  <span>Data de Emissão</span>
                </div>
                <p className="font-semibold text-neutral-900 text-lg">
                  {new Date().toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Product Header */}
            <div className="bg-neutral-50 p-5 rounded-xl mb-6 border border-neutral-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-blue-500" />
                    <h2 className="text-xl font-bold text-neutral-900">{formula.name}</h2>
                  </div>
                  <code className="inline-block bg-neutral-200 px-3 py-1 rounded text-xs font-mono text-neutral-600">
                    {formula.code}
                  </code>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formula.status === 'final' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {formula.status === 'final' ? 'Finalizado' : 'Rascunho'}
                </span>
              </div>
              {formula.description && (
                <p className="text-sm text-neutral-600 mt-3">{formula.description}</p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <label className="text-xs uppercase tracking-wide text-neutral-500 block mb-1">Peso/Volume</label>
                <span className="text-xl font-bold text-neutral-900">{formula.finalWeight} {formula.finalUnit}</span>
              </div>
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <label className="text-xs uppercase tracking-wide text-neutral-500 block mb-1">Rendimento</label>
                <span className="text-xl font-bold text-neutral-900">{formula.yield} unid.</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <label className="text-xs uppercase tracking-wide text-blue-600 block mb-1">Custo Total</label>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(totalCost)}</span>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <label className="text-xs uppercase tracking-wide text-green-600 block mb-1">Custo/Unidade</label>
                <span className="text-xl font-bold text-green-600">{formatCurrency(costPerUnit)}</span>
              </div>
            </div>

            {/* Ingredients Table */}
            <h3 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b-2 border-neutral-200">
              Composição da Fórmula
            </h3>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-neutral-600 text-white">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide font-semibold">Matéria-Prima</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide font-semibold">Quantidade</th>
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-wide font-semibold">Unidade</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide font-semibold">Custo Unit.</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide font-semibold">Custo Total</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {formula.ingredients.map((ing, index) => {
                  const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
                  const cost = calculateIngredientCost(ing.rawMaterialId, ing.quantity, ing.variantId);
                  const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
                  const name = getIngredientFullName(ing.rawMaterialId, ing.variantName);
                  const sku = getIngredientSku(ing.rawMaterialId, ing.variantId);
                  const ingredientIsChemical = isIngredientChemical(ing.rawMaterialId);
                  const percentage = ingredientIsChemical && totalChemicalQuantity > 0 
                    ? ((ing.quantity / totalChemicalQuantity) * 100).toFixed(1) 
                    : '—';

                  return (
                    <tr key={ing.id} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="px-4 py-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-sm shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-neutral-900">{name}</span>
                          <span className="text-neutral-500 italic text-xs ml-2">({sku})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right border-b border-neutral-100 font-mono font-medium">
                        {formatQuantity(ing.quantity)}
                      </td>
                      <td className="px-4 py-3 text-center border-b border-neutral-100 text-neutral-500">{material?.unitType}</td>
                      <td className="px-4 py-3 text-right border-b border-neutral-100">
                        <span className="text-neutral-500 text-xs mr-1">R$</span>
                        <span className="font-mono font-medium">{formatCurrencyParts(unitValue)}</span>
                      </td>
                      <td className="px-4 py-3 text-right border-b border-neutral-100">
                        <span className="text-neutral-500 text-xs mr-1">R$</span>
                        <span className="font-mono font-semibold">{formatCurrencyParts(cost)}</span>
                      </td>
                      <td className="px-4 py-3 text-right border-b border-neutral-100 text-neutral-500 font-medium">
                        {percentage}{ingredientIsChemical ? '%' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-700 text-white">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">CUSTO TOTAL DA FÓRMULA</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-neutral-300 text-xs mr-1">R$</span>
                    <span className="font-bold text-lg font-mono">{formatCurrencyParts(totalCost)}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">100%</td>
                </tr>
              </tfoot>
            </table>

            {/* Notes Section */}
            {formula.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-6">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">📋 Instruções de Fabricação</h4>
                <p className="text-sm text-amber-700 leading-relaxed">{formula.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-neutral-400 text-xs">
                <Building2 size={14} />
                <span>Ohana Clean - Sistema de Gestão de Produção</span>
              </div>
              <p className="text-xs text-neutral-400">
                Documento gerado em {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
