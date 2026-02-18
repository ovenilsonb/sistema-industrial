import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Eye, EyeOff, Lock, User, UserPlus } from 'lucide-react';
import { APP_VERSION } from '../constants/version';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const { login, registerUser, loginBackground, companyLogo } = useStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Usuário ou senha inválidos. Verifique se seu cadastro foi aprovado pelo administrador.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    if (!firstName || !lastName || !regEmail || !regUsername || !regPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    const success = registerUser({ firstName, lastName, email: regEmail, username: regUsername, password: regPassword });
    if (success) {
      setRegSuccess('Solicitação enviada! Aguarde a aprovação do administrador.');
      setFirstName(''); setLastName(''); setRegEmail(''); setRegUsername(''); setRegPassword('');
      setTimeout(() => setIsRegistering(false), 3000);
    } else {
      setError('Nome de usuário já existe.');
    }
  };

  // Background style
  const bgStyle: React.CSSProperties = loginBackground
    ? { backgroundImage: `url(${loginBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  if (isRegistering) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
        {/* Overlay when there's a background image */}
        {loginBackground && <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-0" />}
        
        {!loginBackground && (
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10 border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitar Acesso</h1>
            <p className="text-gray-500">Preencha seus dados para cadastro</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>
            )}
            {regSuccess && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center">{regSuccess}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nome</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="João" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Sobrenome</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Silva" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="joao@exemplo.com" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Seu usuário" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Sua senha" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30 mt-2">
              Enviar Solicitação
            </button>

            <div className="text-center mt-4">
              <button type="button" onClick={() => setIsRegistering(false)} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                Voltar para Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
      {/* Overlay when there's a background image */}
      {loginBackground && <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-0" />}

      {!loginBackground && (
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8 relative z-10 border border-white/50">
        <div className="text-center mb-8">
          {/* Logo */}
          {companyLogo ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-4 shadow-lg bg-white p-1">
              <img src={companyLogo} alt="Ohana Clean" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 rotate-3 transition-transform hover:rotate-6 duration-300">
              <span className="text-3xl font-bold text-white">OC</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ohana Clean</h1>
          <p className="text-gray-500">Sistema de Gestão de Produção</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{error}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 ml-1">Usuário</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white" placeholder="Seu usuário" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 focus:bg-white" placeholder="Sua senha" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30">
            Entrar no Sistema
          </button>

          <div className="text-center pt-2">
            <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
              <UserPlus className="w-4 h-4" />
              Solicitar Acesso
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Versão {APP_VERSION} &bull; {new Date().getFullYear()} Ohana Clean
          </p>
        </div>
      </div>
    </div>
  );
}
