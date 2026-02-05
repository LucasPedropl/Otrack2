import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/authService';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const ADMIN_EMAIL = 'pedrolucasmota2005@gmail.com';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.login(email);
      // Persist session simply for this demo
      localStorage.setItem('obralog_user', JSON.stringify(user));
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('Erro ao acessar o sistema. Verifique o email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <div className="w-full">
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Email Corporativo
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: currentTheme.isDark ? `${currentTheme.colors.background}80` : '#fff',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
                // We handle ring color via inline style or class, simpler here to rely on browser default or tailwind utility with style overrides
              }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com"
              required
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: currentTheme.colors.textSecondary }}>
            Acesso sem senha configurado para administradores.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: currentTheme.colors.primary,
            color: '#fff'
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <>
              <span>Entrar no Painel</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;