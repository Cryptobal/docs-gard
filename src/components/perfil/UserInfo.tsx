import { User, Mail, Shield, Calendar } from 'lucide-react';

interface UserInfoProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
};

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-teal-400" />
        Información de la cuenta
      </h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Nombre</p>
            <p className="text-white font-medium">{user.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Rol</p>
            <p className="text-white font-medium">
              {roleLabels[user.role] || user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
