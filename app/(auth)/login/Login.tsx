
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { authService } from '../../../services/authService';
import { ArrowRight, LogIn, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const DEFAULT_EMAIL = 'pedro@gmail.com';
const DEFAULT_PASS = 'plm200510';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASS);
  const [rememberMe, setRememberMe] = useState(true); // Padrão marcado para melhor UX
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTheme } = useTheme();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.loginWithEmail(email, password, rememberMe);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao acessar o sistema. Verifique o email e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      await authService.loginWithGoogle(rememberMe);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao acessar com Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Email Corporativo
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: currentTheme.isDark ? `${currentTheme.colors.background}80` : '#fff',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              } as any}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Senha
            </label>
            <div className="relative">
              <input
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors pr-10"
                style={{
                  backgroundColor: currentTheme.isDark ? `${currentTheme.colors.background}80` : '#fff',
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                } as any}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 transition-colors"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 focus:ring-brand-500"
              style={{ accentColor: currentTheme.colors.primary }}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm select-none cursor-pointer" style={{ color: currentTheme.colors.text }}>
              Manter conectado
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#fff'
            }}
            disabled={isLoading || isGoogleLoading}
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: currentTheme.colors.border }}></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white px-2" style={{ backgroundColor: currentTheme.colors.card, color: currentTheme.colors.textSecondary }}>Ou continue com</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium border transition-all hover:bg-black/5 active:scale-[0.98]"
          style={{
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text
          }}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span>Conectando...</span>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </>
          )}
        </button>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
