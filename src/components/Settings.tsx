import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { APP_VERSION } from '@/constants/version';
import { BackupRestore, CHANGELOG } from './BackupRestore';
import { Eye, EyeOff, Camera, User, Lock, Image, Check, X } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { companyLogo, setCompanyLogo, loginBackground, setLoginBackground, theme, setTheme, currentUser, updateUser } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [showBackup, setShowBackup] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCompanyLogo(e.target?.result as string);
      setUploadSuccess('logo');
      setTimeout(() => setUploadSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setLoginBackground(e.target?.result as string);
      setUploadSuccess('bg');
      setTimeout(() => setUploadSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const openEditProfile = () => {
    if (!currentUser) return;
    setNewUsername(currentUser.username);
    setNewFirstName(currentUser.firstName);
    setNewLastName(currentUser.lastName);
    setNewEmail(currentUser.email || '');
    setIsEditingProfile(true);
    setProfileMsg({ type: '', text: '' });
  };

  const saveProfile = () => {
    if (!currentUser) return;
    if (!newUsername.trim() || !newFirstName.trim()) {
      setProfileMsg({ type: 'error', text: 'Nome e Usuário são obrigatórios.' });
      return;
    }
    updateUser(currentUser.id, {
      username: newUsername.trim(),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: newEmail.trim(),
    });
    setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    setTimeout(() => {
      setIsEditingProfile(false);
      setProfileMsg({ type: '', text: '' });
    }, 2000);
  };

  const openEditPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(true);
    setProfileMsg({ type: '', text: '' });
  };

  const savePassword = () => {
    if (!currentUser) return;
    if (currentPassword !== currentUser.password) {
      setProfileMsg({ type: 'error', text: 'Senha atual incorreta.' });
      return;
    }
    if (newPassword.length < 4) {
      setProfileMsg({ type: 'error', text: 'Nova senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    updateUser(currentUser.id, { password: newPassword });
    setProfileMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
    setTimeout(() => {
      setIsEditingPassword(false);
      setProfileMsg({ type: '', text: '' });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Versão: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{APP_VERSION}</span>
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

            {/* ===== PROFILE SECTION ===== */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-green-500" />
                Meu Perfil
              </h3>

              {!isEditingProfile && !isEditingPassword ? (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Nome</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentUser?.firstName} {currentUser?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Usuário</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Email</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.email || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Perfil</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
                        {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={openEditProfile}
                      className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Alterar Dados
                    </button>
                    <button
                      onClick={openEditPassword}
                      className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Alterar Senha
                    </button>
                  </div>
                </div>
              ) : isEditingProfile ? (
                <div className="space-y-3">
                  {profileMsg.text && (
                    <div className={`p-3 rounded-lg text-sm text-center ${profileMsg.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {profileMsg.text}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome</label>
                      <input
                        type="text"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sobrenome</label>
                      <input
                        type="text"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Usuário (Login)</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveProfile} className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Salvar
                    </button>
                    <button onClick={() => { setIsEditingProfile(false); setProfileMsg({ type: '', text: '' }); }} className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileMsg.text && (
                    <div className={`p-3 rounded-lg text-sm text-center ${profileMsg.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {profileMsg.text}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Senha Atual</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        placeholder="Digite sua senha atual"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        placeholder="Digite a nova senha"
                      />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={savePassword} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Salvar Senha
                    </button>
                    <button onClick={() => { setIsEditingPassword(false); setProfileMsg({ type: '', text: '' }); }} className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===== LOGIN BACKGROUND SECTION ===== */}
            <div className="bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-900/30 dark:to-sky-800/30 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Image className="w-5 h-5 text-cyan-500" />
                Imagem de Fundo do Login
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Personalize a tela de login com uma imagem de fundo.
              </p>

              {loginBackground ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-cyan-200 dark:border-cyan-700">
                    <img src={loginBackground} alt="Login BG" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-lg">Preview</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label htmlFor="bg-upload" className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors cursor-pointer text-center text-sm flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Alterar Imagem
                    </label>
                    <button onClick={() => setLoginBackground(undefined)} className="flex-1 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors text-sm hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="bg-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-300 dark:border-cyan-600 rounded-xl cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors">
                  <Camera className="w-10 h-10 text-cyan-400" />
                  <span className="mt-2 text-sm text-cyan-600 dark:text-cyan-400 font-medium">Clique para escolher uma imagem</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG (recomendado: 1920x1080px)</span>
                </label>
              )}

              <input ref={bgInputRef} type="file" id="bg-upload" accept="image/*" onChange={handleBgUpload} className="hidden" />

              {uploadSuccess === 'bg' && (
                <div className="mt-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Imagem de fundo atualizada!
                </div>
              )}
            </div>

            {/* ===== LOGO SECTION ===== */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Logomarca da Empresa
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                A logo será exibida nos relatórios e na barra lateral do sistema.
              </p>

              {companyLogo ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-xl p-2 flex items-center justify-center border-2 border-purple-200 dark:border-purple-700">
                    <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="logo-upload" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors cursor-pointer text-center text-sm">
                      Alterar Logo
                    </label>
                    <button onClick={() => setCompanyLogo(undefined)} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors text-sm hover:bg-red-200 dark:hover:bg-red-900/50">
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">Clique para fazer upload da logo</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG ou SVG (recomendado: 200x200px)</span>
                </label>
              )}

              <input ref={fileInputRef} type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />

              {uploadSuccess === 'logo' && (
                <div className="mt-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Logo atualizada com sucesso!
                </div>
              )}
            </div>

            {/* ===== THEME SECTION ===== */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Aparência
              </h3>
              <div className="flex gap-3">
                <button onClick={() => setTheme('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <div className="w-8 h-8 mx-auto bg-white border border-gray-200 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" /></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Claro</span>
                </button>
                <button onClick={() => setTheme('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <div className="w-8 h-8 mx-auto bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" /></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Escuro</span>
                </button>
              </div>
            </div>

            {/* ===== BACKUP SECTION ===== */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Backup e Restauração
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Faça backup dos seus dados ou restaure a partir de um arquivo anterior.</p>
              <button onClick={() => setShowBackup(true)} className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                Abrir Backup e Restauração
              </button>
            </div>

            {/* ===== CHANGELOG SECTION ===== */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Histórico de Versões
              </h3>
              <button onClick={() => setShowChangelog(!showChangelog)} className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                {showChangelog ? 'Ocultar Changelog' : 'Ver Changelog'}
              </button>
              {showChangelog && (
                <div className="mt-4 max-h-60 overflow-y-auto space-y-3">
                  {CHANGELOG.map((release, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">v{release.version}</span>
                        <span className="text-xs text-gray-500">{release.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {release.changes.map((change, cIdx) => (
                          <li key={cIdx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-indigo-500 mt-0.5">•</span>{change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Version Info */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p><strong>Ohana Clean</strong> - Sistema de Gestão de Custos</p>
              <p className="mt-1">Versão {APP_VERSION} • {new Date().getFullYear()}</p>
            </div>
          </div>

          {/* OK Button */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button onClick={onClose} className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
              OK
            </button>
          </div>
        </div>
      </div>

      <BackupRestore isOpen={showBackup} onClose={() => setShowBackup(false)} />
    </>
  );
};
