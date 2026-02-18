import { supabase } from '../lib/supabaseClient';
import { RawMaterial, SalesOrder, ProductionOrder } from '../store/useStore';

/**
 * Exemplo de Camada de Serviço para Supabase
 * Use estas funções para substituir a lógica do useStore.ts quando migrar para o banco online.
 */

// --- Matérias-Primas ---
export const RawMaterialService = {
  async getAll() {
    const { data, error } = await supabase.from('raw_materials').select('*');
    if (error) throw error;
    return data;
  },

  async create(material: Omit<RawMaterial, 'id'>) {
    const { data, error } = await supabase.from('raw_materials').insert(material).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RawMaterial>) {
    const { data, error } = await supabase.from('raw_materials').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

// --- Fórmulas ---
export const FormulaService = {
  async getAll() {
    const { data, error } = await supabase.from('formulas').select('*, formula_ingredients(*)');
    if (error) throw error;
    return data;
  }
};

// --- Vendas ---
export const SalesService = {
  async createOrder(order: SalesOrder) {
    // 1. Criar o pedido
    const { data: orderData, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        client_name: order.customerName,
        status: order.status,
        total_amount: order.total
      })
      .select()
      .single();
    
    if (orderError) throw orderError;

    // 2. Criar os itens
    const items = order.items.map(item => ({
      sales_order_id: orderData.id,
      formula_id: item.formulaId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sales_type: item.salesType
    }));

    const { error: itemsError } = await supabase.from('sales_order_items').insert(items);
    if (itemsError) throw itemsError;

    return orderData;
  }
};

// --- Produção ---
export const ProductionService = {
  async create(order: ProductionOrder) {
    const { data, error } = await supabase.from('production_orders').insert({
      formula_id: order.formulaId,
      quantity: order.quantity,
      status: order.status,
      sales_order_id: order.salesOrderId,
      batch_code: order.batchCode,
      expiration_date: order.expirationDate
    }).select().single();
    
    if (error) throw error;
    return data;
  }
};
