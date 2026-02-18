import { useState } from 'react';
import { useStore, User, ModulePermission } from '@/store/useStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, X, Shield, Trash2, Edit2, Save } from 'lucide-react';
import { cn } from '@/utils/cn';

const MODULES: { id: ModulePermission; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'raw-materials', label: 'Matérias-Primas' },
  { id: 'formulas', label: 'Fórmulas' },
  { id: 'pricing', label: 'Precificação' },
  { id: 'sales', label: 'Vendas' },
  { id: 'factory', label: 'Fábrica' },
  { id: 'stock', label: 'Estoque' },
  { id: 'customers', label: 'Clientes' },
  { id: 'suppliers', label: 'Fornecedores' },
];

export function UserManagement() {
  const { users, updateUser, deleteUser, currentUser } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<ModulePermission[]>([]);

  // Prevent admin from deleting themselves
  const canDelete = (user: User) => user.username !== 'Ovenilson' && user.id !== currentUser?.id;

  const handleToggleActive = (user: User) => {
    updateUser(user.id, { active: !user.active });
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditPermissions(user.permissions);
  };

  const savePermissions = (userId: string) => {
    updateUser(userId, { permissions: editPermissions });
    setEditingId(null);
  };

  const togglePermission = (permission: ModulePermission) => {
    setEditPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Gerenciamento de Usuários</h2>
          <p className="text-neutral-500">Aprovar cadastros e gerenciar permissões</p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0",
                    user.role === 'admin' ? "bg-purple-600" : "bg-blue-500"
                  )}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h3>
                      {user.role === 'admin' && (
                        <Badge variant="info" className="flex items-center gap-1">
                          <Shield size={12} /> Admin
                        </Badge>
                      )}
                      {!user.active && (
                        <Badge variant="warning">Aguardando Aprovação</Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">@{user.username} • {user.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Cadastrado em {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {user.role !== 'admin' && (
                    <Button
                      variant={user.active ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                      className="min-w-[100px]"
                    >
                      {user.active ? "Desativar" : "Aprovar"}
                    </Button>
                  )}
                  
                  {editingId === user.id ? (
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => savePermissions(user.id)}>
                        <Save size={16} /> Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => startEditing(user)}>
                      <Edit2 size={16} className="mr-2" /> Permissões
                    </Button>
                  )}

                  {canDelete(user) && (
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este usuário?')) {
                          deleteUser(user.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Permissions Section */}
              <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Permissões de Acesso
                </h4>
                
                {editingId === user.id ? (
                  <div className="flex flex-wrap gap-2">
                    {MODULES.map((module) => {
                      const isSelected = editPermissions.includes(module.id);
                      return (
                        <button
                          key={module.id}
                          onClick={() => togglePermission(module.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                              : "bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400"
                          )}
                        >
                          {isSelected && <Check size={14} />}
                          {module.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.role === 'admin' ? (
                      <Badge variant="success">Acesso Total</Badge>
                    ) : user.permissions.length > 0 ? (
                      user.permissions.map(p => {
                        const module = MODULES.find(m => m.id === p);
                        return module ? (
                          <Badge key={p} variant="default">{module.label}</Badge>
                        ) : null;
                      })
                    ) : (
                      <span className="text-sm text-neutral-400 italic">Nenhuma permissão atribuída</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
