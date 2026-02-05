/**
 * API Route: /api/presentations
 * 
 * GET  - Listar todas las presentaciones
 * POST - Crear una nueva presentación
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// GET /api/presentations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = status ? { status } : {};

    const [presentations, total] = await Promise.all([
      prisma.presentation.findMany({
        where,
        include: {
          template: true,
          _count: {
            select: { views: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.presentation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: presentations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presentations' },
      { status: 500 }
    );
  }
}

// POST /api/presentations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      templateId,
      clientData,
      recipientEmail,
      recipientName,
      expiresAt,
      notes,
      tags,
    } = body;

    // Validar campos requeridos
    if (!templateId || !clientData) {
      return NextResponse.json(
        { success: false, error: 'templateId and clientData are required' },
        { status: 400 }
      );
    }

    // Verificar que el template existe
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Generar uniqueId URL-friendly
    const uniqueId = `gard-${nanoid(12)}`;

    // Crear presentación
    const presentation = await prisma.presentation.create({
      data: {
        uniqueId,
        templateId,
        clientData,
        recipientEmail,
        recipientName,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        tags: tags || [],
        status: 'draft',
      },
      include: {
        template: true,
      },
    });

    // Incrementar usage count del template
    await prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: presentation,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${uniqueId}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create presentation' },
      { status: 500 }
    );
  }
}
