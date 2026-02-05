/**
 * API Route: /api/presentations/[id]
 * 
 * GET    - Obtener una presentación por ID
 * PATCH  - Actualizar una presentación
 * DELETE - Eliminar una presentación
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/presentations/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        template: true,
        views: {
          orderBy: { viewedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!presentation) {
      return NextResponse.json(
        { success: false, error: 'Presentation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: presentation,
    });
  } catch (error) {
    console.error('Error fetching presentation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presentation' },
      { status: 500 }
    );
  }
}

// PATCH /api/presentations/[id]
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Campos actualizables
    const {
      status,
      recipientEmail,
      recipientName,
      notes,
      tags,
      expiresAt,
    } = body;

    const presentation = await prisma.presentation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(recipientEmail && { recipientEmail }),
        ...(recipientName && { recipientName }),
        ...(notes !== undefined && { notes }),
        ...(tags && { tags }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: presentation,
    });
  } catch (error) {
    console.error('Error updating presentation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update presentation' },
      { status: 500 }
    );
  }
}

// DELETE /api/presentations/[id]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    await prisma.presentation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Presentation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete presentation' },
      { status: 500 }
    );
  }
}
