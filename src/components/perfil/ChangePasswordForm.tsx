'use client';

import { useState } from 'react';
import { changePassword } from '@/app/(app)/opai/perfil/actions';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validaciones
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cambiar contraseña. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-teal-400" />
        Cambiar contraseña
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contraseña actual */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-300 mb-1">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
              aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
              aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirmar nueva contraseña */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
              placeholder="Repite tu nueva contraseña"
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

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-teal-900/30 border border-teal-700 px-4 py-3 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-300">Contraseña actualizada correctamente</p>
          </div>
        )}

        {/* Botón */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
