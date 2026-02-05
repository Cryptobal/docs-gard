/**
 * API Route: /api/templates
 * 
 * GET  - Listar todos los templates
 * POST - Crear un nuevo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const type = searchParams.get('type');

    const where: any = {};
    if (active !== null) {
      where.active = active === 'true';
    }
    if (type) {
      where.type = type;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      slug,
      description,
      type,
      category,
      active,
      isDefault,
      thumbnailUrl,
    } = body;

    // Validar campos requeridos
    if (!name || !slug || !type) {
      return NextResponse.json(
        { success: false, error: 'name, slug, and type are required' },
        { status: 400 }
      );
    }

    // Crear template
    const template = await prisma.template.create({
      data: {
        name,
        slug,
        description,
        type,
        category,
        active: active ?? true,
        isDefault: isDefault ?? false,
        thumbnailUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
