import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnitType = 'KG' | 'LT' | 'UNID' | 'M' | 'CM' | 'G';
export type UserRole = 'admin' | 'user';
export type ModulePermission = 'dashboard' | 'raw-materials' | 'formulas' | 'pricing' | 'factory' | 'stock' | 'sales' | 'customers' | 'suppliers' | 'users';

export interface User {
  id: string;
  username: string;
  password?: string; // In real app, hash this
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  permissions: ModulePermission[];
  active: boolean;
  createdAt: string;
}

export interface RawMaterialVariant {
  id: string;
  name: string;
  sku: string;
  unitValue: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  unitType: UnitType;
  unitValue: number;
  supplier: string;
  minStock: number;
  currentStock: number;
  createdAt: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  hasVariants?: boolean;
  variants?: RawMaterialVariant[];
  isChemical?: boolean;
  expirationDate?: string;
  isIndeterminate?: boolean;
}

export interface FormulaIngredient {
  id: string;
  rawMaterialId: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  order: number;
}

export interface FormulaGroup {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Formula {
  id: string;
  name: string;
  code: string;
  description: string;
  finalWeight: number;
  finalUnit: UnitType;
  yield: number;
  ingredients: FormulaIngredient[];
  notes: string;
  status: 'draft' | 'final';
  groupId?: string;
  supplyListName?: string;
  batchPrefix?: string;
  changeLog?: {
    date: string;
    ingredientName: string;
    oldVal: number;
    newVal: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrder {
  id: string;
  code: string;
  formulaId: string;
  quantity: number;
  productionDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  batchCode?: string;
  expirationDate?: string;
  origin?: 'manual' | 'sale';
  saleId?: string;
  salesOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrder {
  id: string;
  saleSequence: string;
  customerId?: string;
  customerName: string;
  date: string;
  items: SalesOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'budget' | 'pending_production' | 'completed' | 'cancelled';
  notes?: string;
  productionOrderIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  formulaId: string;
  formulaName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  salesType?: 'retail' | 'wholesale' | 'bundle';
}

export interface BatchConfig {
  [productName: string]: string;
}

export interface InventoryItem {
  id: string;
  formulaId: string;
  batchCode: string;
  productionDate: string;
  expirationDate: string;
  quantity: number;
  unitCost: number;
  status: 'available' | 'low' | 'expired' | 'out_of_stock';
  location?: string;
  notes?: string;
  movements: InventoryMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  notes?: string;
  userId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  cpfCnpj: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
  purchaseHistory: PurchaseRecord[];
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  cnpj: string;
  contactPerson: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
  purchaseHistory: PurchaseRecord[];
}

export interface PurchaseRecord {
  id: string;
  date: string;
  description: string;
  value: number;
  items?: string;
}

export interface Pricing {
  id: string;
  formulaId: string;
  retailMarkup: number;
  wholesaleMarkup: number;
  bundleDiscount: number;
  bundleQuantity: number;
  fixedCosts: number;
  competitorPrice: number;
  createdAt: string;
}

export interface ChangeLog {
  id: string;
  entityType: 'rawMaterial' | 'formula' | 'pricing';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: string;
  userId: string;
  timestamp: string;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null; // Changed from string to User object
  users: User[];
  
  // Auth Actions
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  registerUser: (user: Omit<User, 'id' | 'role' | 'permissions' | 'active' | 'createdAt'>) => boolean;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  companyLogo: string | undefined;
  setCompanyLogo: (logo: string | undefined) => void;
  
  loginBackground: string | undefined;
  setLoginBackground: (bg: string | undefined) => void;
  
  rawMaterials: RawMaterial[];
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'createdAt'>) => void;
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => boolean;
  setRawMaterials: (materials: RawMaterial[]) => void;
  
  formulaGroups: FormulaGroup[];
  addFormulaGroup: (group: Omit<FormulaGroup, 'id' | 'createdAt'>) => void;
  updateFormulaGroup: (id: string, group: Partial<FormulaGroup>) => void;
  deleteFormulaGroup: (id: string) => void;
  
  formulas: Formula[];
  addFormula: (formula: Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFormula: (id: string, formula: Partial<Formula>) => void;
  updateFormulaIngredient: (
    formulaId: string,
    ingredientId: string,
    newBaseQuantity: number,
    changeDetails: { ingredientName: string; oldVal: number; newVal: number }
  ) => void;
  deleteFormula: (id: string) => void;
  setFormulas: (formulas: Formula[]) => void;
  
  pricings: Pricing[];
  addPricing: (pricing: Omit<Pricing, 'id' | 'createdAt'>) => void;
  updatePricing: (id: string, pricing: Partial<Pricing>) => void;
  deletePricing: (id: string) => void;
  setPricings: (pricings: Pricing[]) => void;
  
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'purchaseHistory'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerPurchase: (customerId: string, purchase: Omit<PurchaseRecord, 'id'>) => void;
  
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'purchaseHistory'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addSupplierPurchase: (supplierId: string, purchase: Omit<PurchaseRecord, 'id'>) => void;
  
  changeLogs: ChangeLog[];
  addChangeLog: (log: Omit<ChangeLog, 'id' | 'timestamp'>) => void;
  
  productionOrders: ProductionOrder[];
  addProductionOrder: (order: Omit<ProductionOrder, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => void;
  updateProductionOrder: (id: string, order: Partial<ProductionOrder>) => void;
  deleteProductionOrder: (id: string) => void;
  getNextProductionCode: () => string;
  
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'movements'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addInventoryMovement: (itemId: string, movement: Omit<InventoryMovement, 'id'>) => void;

  salesOrders: SalesOrder[];
  addSalesOrder: (order: Omit<SalesOrder, 'id' | 'saleSequence' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateSalesOrder: (id: string, order: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;
  
  batchConfig: BatchConfig;
  updateBatchConfig: (productName: string, prefix: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Default Admin User
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'Ovenilson',
  password: 'ohana123',
  firstName: 'Ovenilson',
  lastName: 'Admin',
  email: 'admin@ohanaclean.com',
  role: 'admin',
  permissions: ['dashboard', 'raw-materials', 'formulas', 'pricing', 'factory', 'stock', 'sales', 'customers', 'suppliers', 'users'],
  active: true,
  createdAt: new Date().toISOString()
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      users: [DEFAULT_ADMIN],

      login: (username, password) => {
        const { users } = get();
        // Fallback for simple string match if migration hasn't happened yet (sanity check)
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user && user.active) {
          set({ isAuthenticated: true, currentUser: user });
          return true;
        }
        return false;
      },
      
      logout: () => set({ isAuthenticated: false, currentUser: null }),
      
      registerUser: (userData) => {
        const { users } = get();
        if (users.some(u => u.username === userData.username)) {
          return false;
        }
        
        const newUser: User = {
          ...userData,
          id: generateId(),
          role: 'user',
          permissions: ['dashboard', 'sales', 'stock'], // Default permissions
          active: false, // Requires admin approval
          createdAt: new Date().toISOString()
        };
        
        set({ users: [...users, newUser] });
        return true;
      },
      
      updateUser: (id, updates) => {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
          // Update current user if it's the one being edited
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
        }));
      },
      
      deleteUser: (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id)
        }));
      },
      
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      companyLogo: undefined,
      setCompanyLogo: (logo) => set({ companyLogo: logo }),
      
      loginBackground: undefined,
      setLoginBackground: (bg) => set({ loginBackground: bg }),
      
      // ... Raw Materials (Keeping existing data structure)
      rawMaterials: [], // Will be populated by existing persist state logic if any
      addRawMaterial: (material) => {
        const newMaterial: RawMaterial = { ...material, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
        set((state) => ({ rawMaterials: [...state.rawMaterials, newMaterial] }));
        get().addChangeLog({ entityType: 'rawMaterial', entityId: newMaterial.id, action: 'create', changes: JSON.stringify(newMaterial), userId: get().currentUser?.username || 'system' });
      },
      updateRawMaterial: (id, material) => {
        set((state) => ({ rawMaterials: state.rawMaterials.map((m) => m.id === id ? { ...m, ...material } : m) }));
        get().addChangeLog({ entityType: 'rawMaterial', entityId: id, action: 'update', changes: JSON.stringify(material), userId: get().currentUser?.username || 'system' });
      },
      deleteRawMaterial: (id) => {
        const { formulas } = get();
        if (formulas.some((f) => f.ingredients.some((i) => i.rawMaterialId === id))) return false;
        set((state) => ({ rawMaterials: state.rawMaterials.filter((m) => m.id !== id) }));
        get().addChangeLog({ entityType: 'rawMaterial', entityId: id, action: 'delete', changes: '', userId: get().currentUser?.username || 'system' });
        return true;
      },
      setRawMaterials: (materials) => set({ rawMaterials: materials }),
      
      // Formulas
      formulas: [],
      addFormula: (formula) => {
        const now = new Date().toISOString().split('T')[0];
        const newFormula: Formula = { ...formula, id: generateId(), createdAt: now, updatedAt: now };
        set((state) => ({ formulas: [...state.formulas, newFormula] }));
        get().addChangeLog({ entityType: 'formula', entityId: newFormula.id, action: 'create', changes: JSON.stringify(newFormula), userId: get().currentUser?.username || 'system' });
      },
      updateFormula: (id, formula) => {
        set((state) => ({ formulas: state.formulas.map((f) => f.id === id ? { ...f, ...formula, updatedAt: new Date().toISOString().split('T')[0] } : f) }));
        get().addChangeLog({ entityType: 'formula', entityId: id, action: 'update', changes: JSON.stringify(formula), userId: get().currentUser?.username || 'system' });
      },
      updateFormulaIngredient: (formulaId, ingredientId, newBaseQuantity, changeDetails) => {
        set((state) => ({
          formulas: state.formulas.map((f) => {
            if (f.id !== formulaId) return f;
            const updatedIngredients = f.ingredients.map((ing) => ing.id === ingredientId ? { ...ing, quantity: newBaseQuantity } : ing);
            const newLogEntry = { date: new Date().toISOString(), ingredientName: changeDetails.ingredientName, oldVal: changeDetails.oldVal, newVal: changeDetails.newVal };
            return { ...f, ingredients: updatedIngredients, changeLog: [...(f.changeLog || []), newLogEntry], updatedAt: new Date().toISOString().split('T')[0] };
          }),
        }));
      },
      deleteFormula: (id) => {
        set((state) => ({ formulas: state.formulas.filter((f) => f.id !== id), pricings: state.pricings.filter((p) => p.formulaId !== id) }));
        get().addChangeLog({ entityType: 'formula', entityId: id, action: 'delete', changes: '', userId: get().currentUser?.username || 'system' });
      },
      setFormulas: (formulas) => set({ formulas }),
      
      formulaGroups: [],
      addFormulaGroup: (group) => {
        const newGroup: FormulaGroup = { ...group, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
        set((state) => ({ formulaGroups: [...state.formulaGroups, newGroup] }));
      },
      updateFormulaGroup: (id, group) => { set((state) => ({ formulaGroups: state.formulaGroups.map((g) => g.id === id ? { ...g, ...group } : g) })); },
      deleteFormulaGroup: (id) => { set((state) => ({ formulaGroups: state.formulaGroups.filter((g) => g.id !== id), formulas: state.formulas.map((f) => f.groupId === id ? { ...f, groupId: undefined } : f) })); },
      
      pricings: [],
      addPricing: (pricing) => {
        const newPricing: Pricing = { ...pricing, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
        set((state) => ({ pricings: [...state.pricings, newPricing] }));
      },
      updatePricing: (id, pricing) => { set((state) => ({ pricings: state.pricings.map((p) => p.id === id ? { ...p, ...pricing } : p) })); },
      deletePricing: (id) => { set((state) => ({ pricings: state.pricings.filter((p) => p.id !== id) })); },
      setPricings: (pricings) => set({ pricings }),
      
      customers: [],
      addCustomer: (customer) => {
        const newCustomer: Customer = { ...customer, id: generateId(), createdAt: new Date().toISOString().split('T')[0], purchaseHistory: [] };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },
      updateCustomer: (id, customer) => { set((state) => ({ customers: state.customers.map((c) => c.id === id ? { ...c, ...customer } : c) })); },
      deleteCustomer: (id) => { set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })); },
      addCustomerPurchase: (customerId, purchase) => {
        const newPurchase: PurchaseRecord = { ...purchase, id: generateId() };
        set((state) => ({ customers: state.customers.map((c) => c.id === customerId ? { ...c, purchaseHistory: [newPurchase, ...c.purchaseHistory] } : c) }));
      },
      
      suppliers: [],
      addSupplier: (supplier) => {
        const newSupplier: Supplier = { ...supplier, id: generateId(), createdAt: new Date().toISOString().split('T')[0], purchaseHistory: [] };
        set((state) => ({ suppliers: [...state.suppliers, newSupplier] }));
      },
      updateSupplier: (id, supplier) => { set((state) => ({ suppliers: state.suppliers.map((s) => s.id === id ? { ...s, ...supplier } : s) })); },
      deleteSupplier: (id) => { set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) })); },
      addSupplierPurchase: (supplierId, purchase) => {
        const newPurchase: PurchaseRecord = { ...purchase, id: generateId() };
        set((state) => ({ suppliers: state.suppliers.map((s) => s.id === supplierId ? { ...s, purchaseHistory: [newPurchase, ...s.purchaseHistory] } : s) }));
      },
      
      changeLogs: [],
      addChangeLog: (log) => {
        const newLog: ChangeLog = { ...log, id: generateId(), timestamp: new Date().toISOString() };
        set((state) => ({ changeLogs: [newLog, ...state.changeLogs].slice(0, 100) }));
      },
      
      productionOrders: [],
      getNextProductionCode: () => {
        const { productionOrders } = get();
        const currentYear = new Date().getFullYear();
        const yearOrders = productionOrders.filter(o => o.code.includes(`/${currentYear}`));
        return `PROD/${(yearOrders.length + 1).toString().padStart(4, '0')}`;
      },
      addProductionOrder: (order) => {
        const now = new Date().toISOString().split('T')[0];
        const newOrder: ProductionOrder = { ...order, id: generateId(), code: get().getNextProductionCode(), createdAt: now, updatedAt: now };
        set((state) => ({ productionOrders: [...state.productionOrders, newOrder] }));
      },
      updateProductionOrder: (id, order) => { set((state) => ({ productionOrders: state.productionOrders.map((o) => o.id === id ? { ...o, ...order, updatedAt: new Date().toISOString().split('T')[0] } : o) })); },
      deleteProductionOrder: (id) => { set((state) => ({ productionOrders: state.productionOrders.filter((o) => o.id !== id) })); },

      inventory: [],
      addInventoryItem: (item) => {
        const now = new Date().toISOString();
        const newItem: InventoryItem = { ...item, id: generateId(), movements: [{ id: generateId(), date: now, type: 'in', quantity: item.quantity, reason: 'Produção Inicial' }], createdAt: now, updatedAt: now };
        set((state) => ({ inventory: [...state.inventory, newItem] }));
      },
      updateInventoryItem: (id, item) => { set((state) => ({ inventory: state.inventory.map((i) => i.id === id ? { ...i, ...item, updatedAt: new Date().toISOString() } : i) })); },
      deleteInventoryItem: (id) => { set((state) => ({ inventory: state.inventory.filter((i) => i.id !== id) })); },
      addInventoryMovement: (itemId, movement) => {
        set((state) => ({
          inventory: state.inventory.map((item) => {
            if (item.id !== itemId) return item;
            const newQuantity = movement.type === 'in' ? item.quantity + movement.quantity : item.quantity - movement.quantity;
            const newStatus = newQuantity <= 0 ? 'out_of_stock' : (item.status === 'low' && newQuantity > 10) ? 'available' : item.status;
            return { ...item, quantity: Math.max(0, newQuantity), status: newStatus, updatedAt: new Date().toISOString(), movements: [...item.movements, { ...movement, id: generateId() }] };
          }),
        }));
      },

      salesOrders: [],
      addSalesOrder: (order) => {
        const now = new Date().toISOString();
        const { salesOrders } = get();
        const nextSequence = (salesOrders.length + 1).toString().padStart(4, '0');
        const id = 'id' in order ? (order as any).id : generateId();
        const newOrder: SalesOrder = { ...order, id, saleSequence: `#${nextSequence}`, createdAt: now, updatedAt: now };
        set((state) => ({ salesOrders: [...state.salesOrders, newOrder] }));
      },
      updateSalesOrder: (id, order) => { set((state) => ({ salesOrders: state.salesOrders.map((o) => o.id === id ? { ...o, ...order, updatedAt: new Date().toISOString() } : o) })); },
      deleteSalesOrder: (id) => { set((state) => ({ salesOrders: state.salesOrders.filter((o) => o.id !== id) })); },

      batchConfig: {},
      updateBatchConfig: (productName, prefix) => { set((state) => ({ batchConfig: { ...state.batchConfig, [productName]: prefix } })); },
    }),
    {
      name: 'ohana-clean-storage',
      // Migration logic to ensure Admin exists
      onRehydrateStorage: () => (state) => {
        if (state && (!state.users || state.users.length === 0)) {
           // Inject default admin if missing
           state.users = [DEFAULT_ADMIN];
        } else if (state && state.users) {
          // Ensure Admin exists even if other users exist
          const hasAdmin = state.users.some(u => u.username === 'Ovenilson');
          if (!hasAdmin) {
            state.users = [DEFAULT_ADMIN, ...state.users];
          }
        }
      }
    }
  )
);
