'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

/**
 * Cambiar contraseña del usuario autenticado
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'No autenticado' };
  }

  // Validar nueva contraseña
  if (newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }

  // Obtener usuario actual
  const user = await prisma.admin.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  // Verificar contraseña actual
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: 'La contraseña actual es incorrecta' };
  }

  // Verificar que la nueva contraseña sea diferente
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return { success: false, error: 'La nueva contraseña debe ser diferente a la actual' };
  }

  // Actualizar contraseña
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await prisma.admin.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  // Registrar en audit log
  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      userEmail: user.email,
      action: 'user.password_changed',
      entity: 'user',
      entityId: user.id,
    },
  });

  return { success: true };
}
