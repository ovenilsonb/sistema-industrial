import { useEffect } from 'react';
import { Formula, RawMaterial, useStore } from '@/store/useStore';

interface ProportionReportProps {
  formula: Formula;
  proportionQuantity: number;
  rawMaterials: RawMaterial[];
  onClose: () => void;
}

export function ProportionReport({ formula, proportionQuantity, rawMaterials, onClose }: ProportionReportProps) {
  const { companyLogo } = useStore();
  
  const proportionFactor = proportionQuantity / formula.yield;
  
  // Calculate costs with the factor
  const calculateCost = (formula: Formula) => {
    return formula.ingredients.reduce((total, ing) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      if (!material) return total;
      
      let unitValue = material.unitValue;
      if (material.hasVariants && ing.variantId && material.variants) {
        const variant = material.variants.find(v => v.id === ing.variantId);
        if (variant) unitValue = variant.unitValue;
      }
      
      return total + (unitValue * ing.quantity * proportionFactor);
    }, 0);
  };

  const totalCost = calculateCost(formula);
  const costPerUnit = totalCost / proportionQuantity;

  useEffect(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onClose();
      return;
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const logoHtml = companyLogo 
      ? `<div class="logo-container" style="width: 50px; height: 50px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e2e8f0; flex-shrink: 0;">
           <img src="${companyLogo}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #06b6d4, #3b82f6);color:white;font-weight:bold;font-size:14px;\'>OC</div>'" />
         </div>`
      : `<div class="logo-container" style="width: 50px; height: 50px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #06b6d4, #3b82f6); flex-shrink: 0;">
           <span style="color: white; font-weight: 800; font-size: 16px; letter-spacing: -0.5px;">OC</span>
         </div>`;

    const ingredientsRows = formula.ingredients.map((ing) => {
      const material = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      const propQty = ing.quantity * proportionFactor;
      
      let unitValue = material?.unitValue || 0;
      let variantLabel = '';
      
      if (material?.hasVariants && ing.variantId && material.variants) {
        const variant = material.variants.find(v => v.id === ing.variantId);
        if (variant) {
          unitValue = variant.unitValue;
          variantLabel = ` <span style="color: #8b5cf6; font-size: 8pt; font-style: italic;">(${variant.name})</span>`;
        }
      }

      const cost = unitValue * propQty;

      return `
        <tr>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500; color: #1e293b;">
              ${material?.name || 'Material não encontrado'}
              ${variantLabel}
              <span style="color: #64748b; font-size: 8pt; margin-left: 4px;">_${material?.sku || ''}_</span>
            </div>
          </td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #64748b;">
            ${ing.quantity.toFixed(3)}
          </td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #16a34a; background-color: #f0fdf4;">
            ${propQty.toFixed(3)}
          </td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #64748b;">
            ${material?.unitType || '-'}
          </td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #64748b;">
            ${formatCurrency(unitValue)}
          </td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1e293b;">
            ${formatCurrency(cost)}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proporção - ${formula.name}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: white; }
          
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9; }
          .company-info h1 { font-size: 16pt; font-weight: 800; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.5px; }
          .company-info p { font-size: 9pt; color: #64748b; font-weight: 500; }
          .meta-info { text-align: right; }
          .meta-info p { font-size: 8pt; color: #94a3b8; margin-bottom: 2px; }
          .meta-info strong { color: #475569; font-weight: 600; }

          .product-header { margin-bottom: 20px; }
          .product-title { font-size: 14pt; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .product-code { font-family: monospace; font-size: 9pt; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; }

          .proportion-box { 
            background: #fffbeb; 
            border: 1px solid #fcd34d; 
            border-radius: 8px; 
            padding: 12px; 
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .proportion-icon {
            width: 40px; height: 40px; background: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14pt;
          }
          .proportion-details h3 { font-size: 10pt; color: #92400e; margin-bottom: 2px; }
          .proportion-details p { font-size: 9pt; color: #b45309; }

          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; }
          .stat-card.highlight { background: #f0fdf4; border-color: #bbf7d0; }
          .stat-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; display: block; }
          .stat-value { font-size: 12pt; font-weight: 700; color: #0f172a; display: block; }
          .stat-card.highlight .stat-value { color: #16a34a; }

          table { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
          th { background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 7pt; padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          td { vertical-align: middle; }
          
          /* Column Widths */
          th:nth-child(1) { width: auto; } /* Matéria-Prima */
          th:nth-child(2) { width: 70px; text-align: right; } /* Qtd Original */
          th:nth-child(3) { width: 80px; text-align: right; } /* Qtd Proporcional */
          th:nth-child(4) { width: 50px; text-align: center; } /* Unidade */
          th:nth-child(5) { width: 80px; text-align: right; } /* Custo Unit */
          th:nth-child(6) { width: 80px; text-align: right; } /* Custo Total */

          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${logoHtml}
            <div class="company-info">
              <h1>Ohana Clean</h1>
              <p>Relatório de Proporção</p>
            </div>
          </div>
          <div class="meta-info">
            <p>EMISSÃO</p>
            <p><strong>${new Date().toLocaleDateString('pt-BR')}</strong></p>
            <p>${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div class="product-header">
          <div class="product-title">${formula.name}</div>
          <span class="product-code">${formula.code}</span>
        </div>

        <div class="proportion-box">
          <div class="proportion-icon">⚖️</div>
          <div class="proportion-details">
            <h3>Proporção Aplicada</h3>
            <p>Quantidade Desejada: <strong>${proportionQuantity} unidades</strong> (Fator: ${proportionFactor.toFixed(2)}x)</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Rendimento Original</span>
            <span class="stat-value">${formula.yield} un</span>
          </div>
          <div class="stat-card highlight">
            <span class="stat-label">Qtd. Desejada</span>
            <span class="stat-value">${proportionQuantity} un</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Custo Total</span>
            <span class="stat-value" style="color: #2563eb;">${formatCurrency(totalCost)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Custo/Unidade</span>
            <span class="stat-value" style="color: #16a34a;">${formatCurrency(costPerUnit)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Matéria-Prima</th>
              <th style="text-align: right;">Qtd. Base</th>
              <th style="text-align: right; background: #f0fdf4; color: #16a34a;">Qtd. Prop.</th>
              <th style="text-align: center;">Unid.</th>
              <th style="text-align: right;">Custo Unit.</th>
              <th style="text-align: right;">Custo Total</th>
            </tr>
          </thead>
          <tbody>
            ${ingredientsRows}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td colspan="5" style="text-align: right; padding: 8px; color: #475569;">TOTAL ESTIMADO</td>
              <td style="text-align: right; padding: 8px; color: #2563eb;">${formatCurrency(totalCost)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <span>Sistema de Gestão de Produção</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    onClose();
  }, [companyLogo, formula, proportionQuantity, rawMaterials, onClose]);

  return null;
}
