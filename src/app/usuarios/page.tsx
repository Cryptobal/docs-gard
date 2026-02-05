import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPermission, PERMISSIONS, type Role } from '@/lib/rbac';
import { listUsers, listPendingInvitations } from '@/app/actions/users';
import UsersTable from '@/components/usuarios/UsersTable';
import InvitationsTable from '@/components/usuarios/InvitationsTable';
import InviteUserButton from '@/components/usuarios/InviteUserButton';

export default async function UsuariosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManageUsers = hasPermission(
    session.user.role as Role,
    PERMISSIONS.MANAGE_USERS
  );

  if (!canManageUsers) {
    redirect('/inicio');
  }

  const usersResult = await listUsers();
  const invitationsResult = await listPendingInvitations();

  const users = usersResult.success && usersResult.users ? usersResult.users : [];
  const invitations = invitationsResult.success && invitationsResult.invitations ? invitationsResult.invitations : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Administra los usuarios y permisos de tu equipo
              </p>
            </div>
            <InviteUserButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Usuarios Activos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
            </p>
          </div>
          <UsersTable users={users} currentUserId={session.user.id} />
        </div>

        {invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Invitaciones Pendientes
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {invitations.length}{' '}
                {invitations.length === 1 ? 'invitación' : 'invitaciones'}{' '}
                esperando aceptación
              </p>
            </div>
            <InvitationsTable invitations={invitations} />
          </div>
        )}
      </div>
    </div>
  );
}
