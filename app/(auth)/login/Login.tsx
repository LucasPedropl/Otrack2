import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { authService } from '../../../services/authService';
import { useTheme } from '../../../contexts/ThemeContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle for simple registration UI

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let user;
      if (isRegistering) {
         user = await authService.registerWithEmail(email, password, email.split('@')[0]);
      } else {
         user = await authService.loginWithEmail(email, password);
      }
      
      localStorage.setItem('obralog_user', JSON.stringify(user));
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Acesso negado")) {
        setError("Seu email não está cadastrado no sistema.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Email ou senha incorretos.");
      } else if (err.code === 'auth/user-not-found') {
        // If admin, suggest registering
        if (email === 'pedrolucasmota2005@gmail.com') {
            setError("Admin não encontrado. Mude para 'Criar conta' para o primeiro acesso.");
        } else {
            setError("Usuário não encontrado.");
        }
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError('Erro ao conectar. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.loginWithGoogle();
      localStorage.setItem('obralog_user', JSON.stringify(user));
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Acesso negado")) {
        setError("Seu email não está cadastrado no sistema.");
      } else {
        setError('Erro ao conectar com o Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: currentTheme.colors.text }}>
            {isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-sm opacity-70" style={{ color: currentTheme.colors.textSecondary }}>
            {isRegistering ? 'Configure seu acesso inicial' : 'Faça login para acessar o almoxarifado'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20 text-left flex gap-2 items-start">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.text, borderColor: currentTheme.colors.border }}
                        placeholder="seu@email.com"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" style={{ color: currentTheme.colors.text }} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: currentTheme.colors.background, color: currentTheme.colors.text, borderColor: currentTheme.colors.border }}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all hover:opacity-90 mt-2"
                style={{
                    backgroundColor: currentTheme.colors.primary,
                    color: '#ffffff',
                }}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="text-sm">Processando...</span>
                ) : (
                    <>
                        <LogIn size={18} />
                        <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>
                    </>
                )}
            </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: currentTheme.colors.border }}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500" style={{ backgroundColor: currentTheme.colors.card }}>Ou</span>
            </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all hover:bg-gray-100 border relative group overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            color: '#1f2937',
            borderColor: '#e5e7eb'
          }}
          disabled={isLoading}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Continuar com Google</span>
        </button>

        <div className="pt-2 text-center text-sm">
            <button 
                type="button"
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                }}
                className="hover:underline opacity-80 hover:opacity-100"
                style={{ color: currentTheme.colors.primary }}
            >
                {isRegistering ? 'Já tem conta? Faça login' : 'Primeiro acesso? Crie sua conta'}
            </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;