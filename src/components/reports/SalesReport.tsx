import { useRef } from 'react';
import { SalesOrder, useStore } from '@/store/useStore';
import { Printer, X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SalesReportProps {
  sale: SalesOrder;
  onClose: () => void;
}

export function SalesReport({ sale, onClose }: SalesReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { companyLogo } = useStore();
  const logoUrl = companyLogo || 'https://drive.google.com/uc?export=view&id=1TpRK1Hojd_rhhcCiZ799q8HZQu28Gmu2';

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clone content
    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    
    // Replace logo for print safety
    const logoImg = clonedContent.querySelector('.logo-container img') as HTMLImageElement;
    if (logoImg) {
      if (logoImg.src.length > 50000) { // If base64 is too large
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
        <title>Pedido de Venda - ${sale.saleSequence}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; background: white; width: 210mm; min-height: 297mm; }
          .report-container { padding: 5mm; }
          
          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; margin-bottom: 20px; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .logo-container { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
          .logo-container img { width: 40px; height: 40px; object-fit: contain; }
          .company-info h1 { font-size: 18pt; font-weight: 800; color: #1e40af; line-height: 1.2; }
          .company-info p { font-size: 10pt; color: #64748b; font-weight: 500; }
          .meta-info { text-align: right; }
          .sequence-tag { background: #eff6ff; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12pt; font-weight: 700; display: inline-block; margin-bottom: 4px; border: 1px solid #bfdbfe; }
          
          /* Client Section */
          .section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          .section-title { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
          .client-name { font-size: 14pt; font-weight: 700; color: #1a1a1a; }
          
          /* Table */
          table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; padding: 10px; background: #eff6ff; color: #1e40af; font-size: 9pt; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #bfdbfe; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
          tr:last-child td { border-bottom: none; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .item-name { font-weight: 600; color: #1a1a1a; }
          .item-type { font-size: 8pt; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-left: 6px; display: inline-block; }
          
          /* Totals */
          .totals-section { display: flex; justify-content: flex-end; margin-top: 10px; }
          .totals-box { width: 250px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10pt; }
          .total-row.final { border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 8px; font-size: 14pt; font-weight: 800; color: #1e40af; }
          
          /* Notes */
          .notes-section { margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
          .notes-content { font-style: italic; color: #475569; background: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fef3c7; }
          
          /* Footer */
          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9pt; color: #94a3b8; }
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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" />
            Visualizar Pedido
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
            style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
          >
            <div className="report-container">
              {/* Header */}
              <div className="header">
                <div className="logo-section">
                  <div className="logo-container">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
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
                    <h1>Ohana Clean</h1>
                    <p>Pedido de Venda / Orçamento</p>
                  </div>
                </div>
                <div className="meta-info">
                  <div className="sequence-tag">{sale.saleSequence}</div>
                  <p className="text-sm text-neutral-500">{formatDate(sale.date)}</p>
                  <p className="text-xs font-bold uppercase mt-1 text-neutral-400">
                    {sale.status === 'budget' ? 'Orçamento' : sale.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="section-box">
                <div className="section-title">Cliente</div>
                <div className="client-name">{sale.customerName}</div>
              </div>

              {/* Items Table */}
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-right">Preço Unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <span className="item-name">{item.formulaName}</span>
                        <span className="item-type">
                          {item.salesType === 'retail' ? 'Varejo' : item.salesType === 'wholesale' ? 'Atacado' : 'Fardo'}
                        </span>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="totals-section">
                <div className="totals-box">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="total-row" style={{ color: '#dc2626' }}>
                      <span>Desconto ({sale.discount}%):</span>
                      <span>-{formatCurrency(sale.subtotal * (sale.discount / 100))}</span>
                    </div>
                  )}
                  <div className="total-row final">
                    <span>Total:</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="notes-section">
                  <div className="section-title">Observações</div>
                  <div className="notes-content">{sale.notes}</div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                <p>Ohana Clean - Sistema de Gestão de Produção</p>
                <p>Emitido em {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
