import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, FlaskConical, Calculator, Users, Truck,
  Menu, X, Sun, Moon, Bell, User as UserIcon, ChevronRight, LogOut, Settings as SettingsIcon,
  Factory as FactoryIcon, Boxes, ShoppingBag, ShieldCheck
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Dashboard } from '@/components/modules/Dashboard';
import { RawMaterials } from '@/components/modules/RawMaterials';
import { Formulas } from '@/components/modules/Formulas';
import { FormulaProportions } from '@/components/modules/FormulaProportions';
import { PricingModule } from '@/components/modules/Pricing';
import { Customers } from '@/components/modules/Customers';
import { Suppliers } from '@/components/modules/Suppliers';
import { Factory } from '@/components/modules/Factory';
import { Stock } from '@/components/modules/Stock';
import { Sales } from '@/components/modules/Sales';
import { UserManagement } from '@/components/modules/UserManagement';
import { Login } from '@/components/Login';
import { Settings } from '@/components/Settings';
import { APP_VERSION } from '@/constants/version';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ModulePermission } from '@/store/useStore';

type View = 'dashboard' | 'raw-materials' | 'formulas' | 'pricing' | 'sales' | 'factory' | 'stock' | 'customers' | 'suppliers' | 'users';
type FormulaTab = 'formulas' | 'proportions';

interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  permission?: ModulePermission;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { id: 'raw-materials', label: 'Matérias-Primas', icon: Package, permission: 'raw-materials' },
  { id: 'formulas', label: 'Fórmulas', icon: FlaskConical, permission: 'formulas' },
  { id: 'pricing', label: 'Precificação', icon: Calculator, permission: 'pricing' },
  { id: 'sales', label: 'Vendas', icon: ShoppingBag, permission: 'sales' },
  { id: 'factory', label: 'Fábrica', icon: FactoryIcon, permission: 'factory' },
  { id: 'stock', label: 'Estoque', icon: Boxes, permission: 'stock' },
  { id: 'customers', label: 'Clientes', icon: Users, permission: 'customers' },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck, permission: 'suppliers' },
  { id: 'users', label: 'Usuários', icon: ShieldCheck, adminOnly: true },
];

const DEFAULT_LOGO_URL = 'https://drive.google.com/uc?export=view&id=1TpRK1Hojd_rhhcCiZ799q8HZQu28Gmu2';

export function App() {
  const { theme, setTheme, rawMaterials, isAuthenticated, currentUser, logout, companyLogo } = useStore();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [formulaTab, setFormulaTab] = useState<FormulaTab>('formulas');
  
  // Compute allowed nav items based on user role and permissions
  const navItems = allNavItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true; // Admin sees everything
    
    if (item.adminOnly) return false; // Non-admins can't see admin-only items
    if (item.permission && currentUser.permissions.includes(item.permission)) return true;
    
    return false;
  });

  // Redirect if current view is not allowed
  useEffect(() => {
    if (isAuthenticated && currentUser && navItems.length > 0) {
      const isAllowed = navItems.some(item => item.id === currentView);
      if (!isAllowed) {
        setCurrentView(navItems[0].id);
      }
    }
  }, [isAuthenticated, currentUser, navItems, currentView]);

  const logoUrl = companyLogo || DEFAULT_LOGO_URL;

  const lowStockCount = rawMaterials.filter(
    (m) => m.currentStock <= m.minStock && m.status === 'active'
  ).length;

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };
    applyTheme();
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const renderContent = () => {
    // Double check permission before rendering
    if (currentView === 'users' && currentUser?.role !== 'admin') return <Dashboard />;

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'raw-materials': return <RawMaterials />;
      case 'formulas':
        return (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
              <button
                onClick={() => setFormulaTab('formulas')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  formulaTab === 'formulas'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                )}
              >
                <FlaskConical size={16} className="inline mr-2" />
                Fórmulas
              </button>
              <button
                onClick={() => setFormulaTab('proportions')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  formulaTab === 'proportions'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                )}
              >
                <Calculator size={16} className="inline mr-2" />
                Proporção
              </button>
            </div>
            {formulaTab === 'formulas' ? <Formulas /> : <FormulaProportions />}
          </div>
        );
      case 'pricing': return <PricingModule />;
      case 'sales': return <Sales />;
      case 'factory': return <Factory />;
      case 'stock': return <Stock />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'users': return <UserManagement />;
      default: return <Dashboard />;
    }
  };

  const getCurrentTitle = () => {
    const item = navItems.find((n) => n.id === currentView);
    return item?.label || 'Dashboard';
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className={cn(
      'min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300',
      'font-sans antialiased'
    )}>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Sair do Sistema
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Tem certeza que deseja sair?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-72 bg-white dark:bg-neutral-900',
          'border-r border-neutral-100 dark:border-neutral-800',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="h-20 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center p-1">
              <img 
                src={logoUrl}
                alt="Ohana Clean"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"><span class="text-white text-lg font-bold">OC</span></div>`;
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                Ohana Clean
              </h1>
              <p className="text-xs text-neutral-400">Sistema de Gestão</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} className="text-neutral-500" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Icon size={20} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'raw-materials' && lowStockCount > 0 && (
                  <Badge variant="warning" className="text-xs">
                    {lowStockCount}
                  </Badge>
                )}
                {isActive && <ChevronRight size={16} className="opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all duration-200"
          >
            <SettingsIcon size={20} />
            <span className="flex-1 text-left">Configurações</span>
            <span className="text-xs text-neutral-400">{APP_VERSION}</span>
          </button>
        </div>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <UserIcon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {currentUser?.firstName || currentUser?.username}
              </p>
              <p className="text-xs text-neutral-500 truncate capitalize">
                {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className={cn(
        'transition-all duration-300',
        'lg:pl-72'
      )}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors lg:hidden"
              >
                <Menu size={20} className="text-neutral-600 dark:text-neutral-400" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {getCurrentTitle()}
                </h2>
                <p className="text-xs text-neutral-500 hidden sm:block">
                  Sistema de Gestão de Produção
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="ghost" size="sm" className="!p-2 relative">
                  <Bell size={20} />
                  {lowStockCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {lowStockCount}
                    </span>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="!p-2"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </main>

        <footer className="py-6 px-4 lg:px-8 text-center text-sm text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
          <p>© 2024 Ohana Clean. Sistema de Gestão de Produção. {APP_VERSION}</p>
        </footer>
      </div>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
