import { useState, useMemo } from 'react';
import { Scale, Printer, Minus, Plus, FlaskConical } from 'lucide-react';
import { useStore, Formula, RawMaterial } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface ProportionReportProps {
  formula: Formula;
  rawMaterials: RawMaterial[];
  desiredQuantity: number;
  scaleFactor: number;
  onClose: () => void;
}

function ProportionReport({ formula, rawMaterials, desiredQuantity, scaleFactor, onClose }: ProportionReportProps) {
  const { companyLogo } = useStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

  const calculateIngredientCost = (materialId: string, quantity: number, variantId?: string) => {
    const unitValue = getMaterialUnitValue(materialId, variantId);
    return unitValue * quantity;
  };

  // Calcular totais com proporção
  const proportionData = useMemo(() => {
    let totalQuantityChemical = 0;
    let totalCost = 0;

    const ingredients = formula.ingredients.map((ing) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      const newQuantity = ing.quantity * scaleFactor;
      const cost = calculateIngredientCost(ing.rawMaterialId, newQuantity, ing.variantId);
      
      if (material?.isChemical !== false) {
        totalQuantityChemical += newQuantity;
      }
      totalCost += cost;

      return {
        ...ing,
        material,
        originalQuantity: ing.quantity,
        newQuantity,
        cost,
      };
    });

    // Calcular porcentagem (apenas químicos)
    const ingredientsWithPercentage = ingredients.map((ing) => ({
      ...ing,
      percentage: ing.material?.isChemical !== false && totalQuantityChemical > 0
        ? ((ing.newQuantity / totalQuantityChemical) * 100)
        : null,
    }));

    return {
      ingredients: ingredientsWithPercentage,
      totalCost,
      totalQuantityChemical,
      costPerUnit: totalCost / desiredQuantity,
    };
  }, [formula, rawMaterials, scaleFactor, desiredQuantity]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoUrl = companyLogo || '';
    const ingredientCount = proportionData.ingredients.length;
    
    // Ajustar tamanhos baseado na quantidade de ingredientes
    const fontSize = ingredientCount > 12 ? '8pt' : ingredientCount > 8 ? '9pt' : '10pt';
    const cellPadding = ingredientCount > 12 ? '4px 6px' : ingredientCount > 8 ? '6px 8px' : '8px 10px';
    const headerFontSize = ingredientCount > 12 ? '7pt' : ingredientCount > 8 ? '8pt' : '9pt';
    const statFontSize = ingredientCount > 12 ? '12pt' : ingredientCount > 8 ? '14pt' : '16pt';
    const titleFontSize = ingredientCount > 12 ? '12pt' : '14pt';
    
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="Logo" style="max-height: 32px; max-width: 100px; object-fit: contain;" />`
      : `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">OC</div>`;

    const ingredientRows = proportionData.ingredients.map((ing, index) => {
      const isChemical = ing.material?.isChemical !== false;
      
      return `
        <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; font-size: ${fontSize};">
            <span style="font-weight: 500;">${ing.material?.name || 'N/A'}</span>
            ${ing.variantName ? ` <span style="color: #8b5cf6; font-style: italic;">(${ing.variantName})</span>` : ''}
            <span style="color: #9ca3af; font-style: italic;"> - ${ing.material?.sku || 'N/A'}</span>
          </td>
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: ${fontSize}; font-family: monospace;">
            ${ing.originalQuantity.toFixed(3)}
          </td>
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #059669; background: #f0fdf4; font-size: ${fontSize}; font-family: monospace;">
            ${ing.newQuantity.toFixed(3)}
          </td>
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: ${fontSize};">
            ${ing.material?.unitType || 'UN'}
          </td>
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: ${fontSize};">
            ${formatCurrency(ing.cost)}
          </td>
          <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: ${fontSize};">
            ${isChemical && ing.percentage !== null ? `${ing.percentage.toFixed(1)}%` : '—'}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proporção - ${formula.name}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            font-size: ${fontSize}; 
            color: #1a1a1a;
            line-height: 1.3;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }
          .page-container {
            width: 100%;
            min-height: 100%;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #3b82f6;
            margin-bottom: 12px;
          }
          .title-section {
            background: linear-gradient(135deg, #eff6ff, #f0fdf4);
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            text-align: center;
          }
          .stat-card.highlight {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }
          .stat-label {
            font-size: 7pt;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .stat-value {
            font-size: ${statFontSize};
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th {
            background: #f1f5f9;
            padding: ${cellPadding};
            text-align: left;
            font-size: ${headerFontSize};
            text-transform: uppercase;
            color: #475569;
            border-bottom: 2px solid #cbd5e1;
          }
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            font-size: 8pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          .scale-info {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .notes-section {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 8px 12px;
            margin-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${logoHtml}
              <div>
                <h1 style="font-size: ${titleFontSize}; color: #1e3a5f; margin-bottom: 2px;">Ohana Clean</h1>
                <p style="font-size: 8pt; color: #64748b;">Proporção de Fórmula</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 8pt; color: #64748b;">Data de Emissão</p>
              <p style="font-weight: 600; font-size: 10pt;">${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div class="title-section">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="font-size: ${titleFontSize}; color: #1e40af; margin-bottom: 2px;">${formula.name}</h2>
                <p style="font-size: 9pt; color: #64748b;">Código: ${formula.code}</p>
              </div>
              <div style="text-align: right;">
                <p style="font-size: 8pt; color: #64748b;">Rendimento Original</p>
                <p style="font-size: ${titleFontSize}; font-weight: 700; color: #059669;">${formula.yield} un</p>
              </div>
            </div>
          </div>

          <div class="scale-info">
            <div style="width: 32px; height: 32px; background: #f59e0b; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <span style="color: white; font-size: 16px;">⚖</span>
            </div>
            <div>
              <p style="font-weight: 600; color: #92400e; font-size: 10pt;">Proporção Aplicada</p>
              <p style="font-size: 9pt; color: #b45309;">
                Quantidade desejada: <strong>${desiredQuantity} un</strong> | 
                Fator de escala: <strong>${scaleFactor.toFixed(4)}x</strong>
              </p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <p class="stat-label">Qtd. Original</p>
              <p class="stat-value" style="color: #6b7280;">${formula.yield} un</p>
            </div>
            <div class="stat-card highlight">
              <p class="stat-label">Qtd. Desejada</p>
              <p class="stat-value" style="color: #059669;">${desiredQuantity} un</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Custo Total</p>
              <p class="stat-value" style="color: #3b82f6;">${formatCurrency(proportionData.totalCost)}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Custo/Unidade</p>
              <p class="stat-value" style="color: #8b5cf6;">${formatCurrency(proportionData.costPerUnit)}</p>
            </div>
          </div>

          <h3 style="font-size: 10pt; margin-bottom: 8px; padding: 6px 10px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
            Ingredientes Proporcionais
          </h3>

          <table>
            <thead>
              <tr>
                <th style="width: auto;">Matéria-Prima</th>
                <th style="width: 70px; text-align: center;">Qtd. Orig.</th>
                <th style="width: 70px; text-align: center; background: #ecfdf5;">Qtd. Prop.</th>
                <th style="width: 50px; text-align: center;">Un.</th>
                <th style="width: 80px; text-align: right;">Custo</th>
                <th style="width: 50px; text-align: center;">%</th>
              </tr>
            </thead>
            <tbody>
              ${ingredientRows}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 600;">
                <td colspan="4" style="padding: ${cellPadding}; border-top: 2px solid #cbd5e1; font-size: ${fontSize};">
                  TOTAL
                </td>
                <td style="padding: ${cellPadding}; text-align: right; border-top: 2px solid #cbd5e1; color: #3b82f6; font-size: 11pt; font-weight: 700;">
                  ${formatCurrency(proportionData.totalCost)}
                </td>
                <td style="padding: ${cellPadding}; text-align: center; border-top: 2px solid #cbd5e1; font-size: ${fontSize};">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>

          ${formula.notes ? `
            <div class="notes-section">
              <h4 style="font-size: 9pt; color: #92400e; margin-bottom: 4px;">📝 Observações</h4>
              <p style="font-size: 9pt; color: #78350f;">${formula.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <span>Ohana Clean - Sistema de Gestão de Produção</span>
            <span>Gerado em ${new Date().toLocaleString('pt-BR')}</span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Relatório de Proporção - {formula.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint}>
              <Printer size={16} />
              Imprimir
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Preview do relatório */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-6 space-y-6">
            {/* Info da Proporção */}
            <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Scale className="text-white" size={24} />
              </div>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">Proporção Aplicada</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Quantidade desejada: <strong>{desiredQuantity} unidades</strong> | 
                  Fator de escala: <strong>{scaleFactor.toFixed(4)}x</strong>
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 text-center">
                <p className="text-xs text-neutral-500 uppercase mb-1">Qtd. Original</p>
                <p className="text-xl font-bold text-neutral-400">{formula.yield} un</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 uppercase mb-1">Qtd. Desejada</p>
                <p className="text-xl font-bold text-green-600">{desiredQuantity} un</p>
              </div>
              <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 text-center">
                <p className="text-xs text-neutral-500 uppercase mb-1">Custo Total</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(proportionData.totalCost)}</p>
              </div>
              <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 text-center">
                <p className="text-xs text-neutral-500 uppercase mb-1">Custo/Unidade</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(proportionData.costPerUnit)}</p>
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-700">
                    <th className="text-left p-3 font-medium text-neutral-600 dark:text-neutral-300">Matéria-Prima</th>
                    <th className="text-center p-3 font-medium text-neutral-600 dark:text-neutral-300">Qtd. Original</th>
                    <th className="text-center p-3 font-medium text-neutral-600 dark:text-neutral-300">Qtd. Proporcional</th>
                    <th className="text-center p-3 font-medium text-neutral-600 dark:text-neutral-300">Unidade</th>
                    <th className="text-right p-3 font-medium text-neutral-600 dark:text-neutral-300">Custo</th>
                    <th className="text-center p-3 font-medium text-neutral-600 dark:text-neutral-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  {proportionData.ingredients.map((ing, index) => (
                    <tr key={index} className="border-b border-neutral-100 dark:border-neutral-700">
                      <td className="p-3">
                        <span className="font-medium text-neutral-900 dark:text-white">{ing.material?.name}</span>
                        {ing.variantName && (
                          <span className="block text-xs text-purple-500">↳ {ing.variantName}</span>
                        )}
                        <span className="block text-xs text-neutral-400 italic">({ing.material?.sku})</span>
                      </td>
                      <td className="p-3 text-center text-neutral-400">{ing.originalQuantity.toFixed(3)}</td>
                      <td className="p-3 text-center font-semibold text-green-600">{ing.newQuantity.toFixed(3)}</td>
                      <td className="p-3 text-center text-neutral-500">{ing.material?.unitType}</td>
                      <td className="p-3 text-right font-medium text-neutral-900 dark:text-white">{formatCurrency(ing.cost)}</td>
                      <td className="p-3 text-center text-neutral-500">
                        {ing.percentage !== null ? `${ing.percentage.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 dark:bg-neutral-700 font-semibold">
                    <td colSpan={4} className="p-3">TOTAL</td>
                    <td className="p-3 text-right text-blue-600">{formatCurrency(proportionData.totalCost)}</td>
                    <td className="p-3 text-center">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormulaProportions() {
  const { formulas, rawMaterials } = useStore();
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [desiredQuantity, setDesiredQuantity] = useState<number>(1);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const selectedFormula = formulas.find(f => f.id === selectedFormulaId);

  // Calcular fator de escala
  const scaleFactor = selectedFormula ? desiredQuantity / selectedFormula.yield : 1;

  // Função para obter valor unitário
  const getMaterialUnitValue = (materialId: string, variantId?: string) => {
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return 0;
    if (material.hasVariants && variantId && material.variants) {
      const variant = material.variants.find(v => v.id === variantId);
      return variant?.unitValue || 0;
    }
    return material.unitValue;
  };

  // Calcular custos proporcionais
  const proportionalData = useMemo(() => {
    if (!selectedFormula) return null;

    let totalCost = 0;
    let totalQuantityChemical = 0;

    const ingredients = selectedFormula.ingredients.map((ing) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      const newQuantity = ing.quantity * scaleFactor;
      const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
      const cost = unitValue * newQuantity;
      
      if (material?.isChemical !== false) {
        totalQuantityChemical += newQuantity;
      }
      totalCost += cost;

      return {
        ...ing,
        material,
        originalQuantity: ing.quantity,
        newQuantity,
        unitValue,
        cost,
      };
    });

    // Adicionar porcentagem
    const ingredientsWithPercentage = ingredients.map((ing) => ({
      ...ing,
      percentage: ing.material?.isChemical !== false && totalQuantityChemical > 0
        ? ((ing.newQuantity / totalQuantityChemical) * 100)
        : null,
    }));

    return {
      ingredients: ingredientsWithPercentage,
      totalCost,
      costPerUnit: totalCost / desiredQuantity,
      originalCost: selectedFormula.ingredients.reduce((total, ing) => {
        const unitValue = getMaterialUnitValue(ing.rawMaterialId, ing.variantId);
        return total + unitValue * ing.quantity;
      }, 0),
    };
  }, [selectedFormula, scaleFactor, desiredQuantity, rawMaterials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Ajustar quantidade com arredondamento
  const adjustQuantity = (delta: number) => {
    const newValue = Math.max(1, desiredQuantity + delta);
    setDesiredQuantity(newValue);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <Scale className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Proporção de Fórmulas
              </h2>
              <p className="text-sm text-neutral-500">
                Calcule as quantidades proporcionais dos ingredientes
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {formulas.length === 0 ? (
            <div className="py-12 text-center">
              <FlaskConical className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" size={48} />
              <p className="text-neutral-500">Nenhuma fórmula cadastrada</p>
              <p className="text-sm text-neutral-400 mt-1">Cadastre uma fórmula primeiro para calcular proporções</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seleção de Fórmula */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Selecione a Fórmula
                  </label>
                  <select
                    value={selectedFormulaId}
                    onChange={(e) => {
                      setSelectedFormulaId(e.target.value);
                      const formula = formulas.find(f => f.id === e.target.value);
                      if (formula) {
                        setDesiredQuantity(formula.yield);
                      }
                    }}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm
                      transition-all duration-200
                      focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100
                      dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="">Escolha uma fórmula...</option>
                    {formulas.map((formula) => (
                      <option key={formula.id} value={formula.id}>
                        {formula.name} ({formula.code}) - Rend: {formula.yield} un
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFormula && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Quantidade Desejada (unidades)
                    </label>
                    <div className="space-y-3">
                      {/* Campo com botões */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustQuantity(-10)}
                          className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <button
                          onClick={() => adjustQuantity(-1)}
                          className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={desiredQuantity}
                          onChange={(e) => setDesiredQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-xl font-bold
                            text-amber-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100
                            dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        />
                        <button
                          onClick={() => adjustQuantity(1)}
                          className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => adjustQuantity(10)}
                          className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Slider */}
                      <div>
                        <input
                          type="range"
                          min="1"
                          max={Math.max(1000, desiredQuantity * 2)}
                          value={desiredQuantity}
                          onChange={(e) => setDesiredQuantity(parseInt(e.target.value))}
                          className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
                            [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        <div className="flex justify-between text-xs text-neutral-400 mt-1">
                          <span>1</span>
                          <span>{Math.max(1000, desiredQuantity * 2)}</span>
                        </div>
                      </div>

                      {/* Atalhos rápidos */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-neutral-500 self-center mr-2">Atalhos:</span>
                        {[10, 25, 50, 100, 200, 500, 1000].map((qty) => (
                          <button
                            key={qty}
                            onClick={() => setDesiredQuantity(qty)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              desiredQuantity === qty
                                ? 'bg-amber-500 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resultados */}
              {selectedFormula && proportionalData && (
                <>
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-neutral-500 uppercase mb-1">Rendimento Original</p>
                      <p className="text-2xl font-bold text-neutral-400">{selectedFormula.yield} un</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 uppercase mb-1">Quantidade Desejada</p>
                      <p className="text-2xl font-bold text-green-600">{desiredQuantity} un</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 uppercase mb-1">Custo Total</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(proportionalData.totalCost)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-600 uppercase mb-1">Custo/Unidade</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(proportionalData.costPerUnit)}</p>
                    </div>
                  </div>

                  {/* Fator de escala */}
                  <div className="flex items-center justify-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <Scale className="text-amber-600" size={24} />
                    <div className="text-center">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Fator de Escala: <strong className="text-lg">{scaleFactor.toFixed(4)}x</strong>
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Todas as quantidades são multiplicadas por este fator
                      </p>
                    </div>
                  </div>

                  {/* Tabela de ingredientes */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-100 dark:bg-neutral-800">
                          <th className="text-left p-4 font-semibold text-neutral-700 dark:text-neutral-300 rounded-tl-xl">
                            Matéria-Prima
                          </th>
                          <th className="text-center p-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            Qtd. Original
                          </th>
                          <th className="text-center p-4 font-semibold text-neutral-700 dark:text-neutral-300 bg-green-100 dark:bg-green-900/30">
                            Qtd. Proporcional
                          </th>
                          <th className="text-center p-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            Unidade
                          </th>
                          <th className="text-right p-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            Custo Unit.
                          </th>
                          <th className="text-right p-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            Custo Total
                          </th>
                          <th className="text-center p-4 font-semibold text-neutral-700 dark:text-neutral-300 rounded-tr-xl">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {proportionalData.ingredients.map((ing, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-neutral-100 dark:border-neutral-700 ${
                              index % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800/50'
                            }`}
                          >
                            <td className="p-4">
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {ing.material?.name}
                              </span>
                              {ing.variantName && (
                                <span className="block text-xs text-purple-500 mt-0.5">
                                  ↳ {ing.variantName}
                                </span>
                              )}
                              <span className="block text-xs text-neutral-400 italic">
                                ({ing.material?.sku})
                              </span>
                            </td>
                            <td className="p-4 text-center text-neutral-500 font-mono">
                              {ing.originalQuantity.toFixed(3)}
                            </td>
                            <td className="p-4 text-center font-bold text-green-600 bg-green-50 dark:bg-green-900/20 font-mono">
                              {ing.newQuantity.toFixed(3)}
                            </td>
                            <td className="p-4 text-center text-neutral-500">
                              {ing.material?.unitType}
                            </td>
                            <td className="p-4 text-right text-neutral-600 dark:text-neutral-400">
                              {formatCurrency(ing.unitValue)}
                            </td>
                            <td className="p-4 text-right font-semibold text-neutral-900 dark:text-white">
                              {formatCurrency(ing.cost)}
                            </td>
                            <td className="p-4 text-center text-neutral-500">
                              {ing.percentage !== null ? `${ing.percentage.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold">
                          <td colSpan={5} className="p-4 rounded-bl-xl text-neutral-700 dark:text-neutral-300">
                            TOTAL
                          </td>
                          <td className="p-4 text-right text-blue-600 text-lg">
                            {formatCurrency(proportionalData.totalCost)}
                          </td>
                          <td className="p-4 text-center rounded-br-xl text-neutral-600 dark:text-neutral-400">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Botão de Relatório */}
                  <div className="flex justify-center">
                    <Button onClick={() => setIsReportOpen(true)} size="lg">
                      <Printer size={18} />
                      Gerar Relatório de Proporção
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relatório */}
      {isReportOpen && selectedFormula && (
        <ProportionReport
          formula={selectedFormula}
          rawMaterials={rawMaterials}
          desiredQuantity={desiredQuantity}
          scaleFactor={scaleFactor}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
