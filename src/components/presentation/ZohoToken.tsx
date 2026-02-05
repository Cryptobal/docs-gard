/**
 * ZohoToken - Componente para mostrar tokens de Zoho resaltados
 * Se usa cuando showTokens=true para mostrar el campo real de Zoho
 */

import { cn } from '@/lib/utils';

interface ZohoTokenProps {
  token: string;
  className?: string;
  inline?: boolean;
}

export function ZohoToken({ token, className, inline = false }: ZohoTokenProps) {
  const baseClasses = "font-mono font-bold bg-yellow-400/90 text-slate-900 px-2 py-0.5 rounded shadow-lg border-2 border-yellow-500";
  
  if (inline) {
    return (
      <span className={cn(baseClasses, "inline-block", className)}>
        {token}
      </span>
    );
  }
  
  return (
    <div className={cn(baseClasses, "inline-block", className)}>
      {token}
    </div>
  );
}
