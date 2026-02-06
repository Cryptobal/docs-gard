'use client';

import { useState } from 'react';
import { requestPasswordReset } from './actions';
import { Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-teal-900/30 border border-teal-700 p-6 space-y-4">
        <div className="flex items-center gap-3 text-teal-300">
          <CheckCircle className="h-6 w-6" />
          <h3 className="font-semibold">Correo enviado</h3>
        </div>
        <p className="text-sm text-teal-200 leading-relaxed">
          Si existe una cuenta con el email <strong>{email}</strong>, recibirás un correo con las instrucciones para restablecer tu contraseña.
        </p>
        <p className="text-xs text-teal-300/70">
          Revisa tu bandeja de entrada y la carpeta de spam. El enlace expirará en 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-3 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
            placeholder="admin@gard.cl"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}
