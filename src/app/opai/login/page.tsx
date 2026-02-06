/**
 * Página de login - Auth.js v5 Credentials
 * Fuera de (app) para evitar redirect loop - no requiere layout con auth
 * Redirige a /opai/inicio tras login exitoso
 */

import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Iniciar sesión - OPAI',
  description: 'Acceso al panel OPAI',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/opai/inicio';
  const error = params.error;
  const success = params.success;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">OPAI</h1>
          <p className="text-slate-400 mt-1">Iniciar sesión</p>
        </div>
        <LoginForm callbackUrl={callbackUrl} error={error} success={success} />
        <p className="text-center text-sm text-slate-500">
          opai.gard.cl · Gard Security
        </p>
      </div>
    </div>
  );
}
