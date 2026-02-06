'use client';

import { useState } from 'react';
import { authenticate } from './actions';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  callbackUrl: string;
  error?: string;
  success?: string;
}

export function LoginForm({ callbackUrl, error, success }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={authenticate} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      
      {success && (
        <div className="rounded-lg bg-teal-900/30 border border-teal-700 px-4 py-3">
          <p className="text-sm text-teal-300">
            {success === 'password-reset' && '✓ Contraseña actualizada correctamente. Ya puedes iniciar sesión.'}
            {success === 'account-activated' && '✓ Cuenta activada correctamente. Ya puedes iniciar sesión.'}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="admin@gard.cl"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Contraseña
          </label>
          <Link 
            href="/opai/forgot-password" 
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3">
          <p className="text-sm text-red-300">
            {error === 'CredentialsSignin' ? 'Email o contraseña incorrectos.' : 'Error al iniciar sesión.'}
          </p>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
      >
        Entrar
      </button>
    </form>
  );
}
