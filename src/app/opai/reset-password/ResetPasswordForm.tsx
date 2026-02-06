'use client';

import { useState } from 'react';
import { resetPassword } from '../forgot-password/actions';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(email, token, password);
      
      if (result.success) {
        setSuccess(true);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/opai/login?success=password-reset');
        }, 2000);
      } else {
        setError(result.error || 'Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al restablecer contraseña. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-teal-900/30 border border-teal-700 p-6 space-y-4">
        <div className="flex items-center gap-3 text-teal-300">
          <CheckCircle className="h-6 w-6" />
          <h3 className="font-semibold">Contraseña actualizada</h3>
        </div>
        <p className="text-sm text-teal-200">
          Tu contraseña ha sido restablecida correctamente. Redirigiendo al login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
        <p className="text-xs text-slate-400">
          Restablecer contraseña para: <span className="text-teal-400 font-medium">{email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
          Nueva contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-10 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-10 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
            placeholder="Repite tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
      </button>

      <div className="text-center pt-2">
        <Link 
          href="/opai/login" 
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          Volver al login
        </Link>
      </div>
    </form>
  );
}
