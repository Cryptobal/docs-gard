/**
 * API Route para generar PDF completo de presentación usando Playwright
 * 
 * Flujo:
 * 1. Recibe uniqueId de la presentación
 * 2. Valida que la presentación existe y está activa
 * 3. Abre Playwright en viewport 1440x1018 (ratio A4 landscape)
 * 4. Navega a /p/{uniqueId}?mode=pdf (renderiza sin animaciones, layout slide)
 * 5. Fuerza visibilidad de todos los elementos (override framer-motion)
 * 6. Genera PDF landscape A4 con page-breaks entre secciones
 * 7. Retorna PDF como descarga
 * 
 * PRODUCCIÓN: Usa @sparticuz/chromium optimizado para Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import chromiumPkg from '@sparticuz/chromium';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Pro: 60s timeout

interface GeneratePresentationRequest {
  uniqueId: string;
}

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const body: GeneratePresentationRequest = await request.json();
    const { uniqueId } = body;
    
    if (!uniqueId) {
      return NextResponse.json(
        { error: 'Falta uniqueId de la presentación' },
        { status: 400 }
      );
    }
    
    // Validar que la presentación existe
    const presentation = await prisma.presentation.findUnique({
      where: { uniqueId },
    });
    
    if (!presentation) {
      return NextResponse.json(
        { error: 'Presentación no encontrada' },
        { status: 404 }
      );
    }
    
    if (presentation.status === 'draft') {
      return NextResponse.json(
        { error: 'La presentación aún no ha sido enviada' },
        { status: 400 }
      );
    }
    
    // Construir URL de la presentación en modo PDF
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const pdfUrl = `${baseUrl}/p/${uniqueId}?mode=pdf`;
    
    console.log(`[PDF] Generando presentación completa: ${pdfUrl}`);
    
    // Configuración de Chromium para Vercel
    const isDev = process.env.NODE_ENV === 'development';
    const executablePath = isDev 
      ? undefined // En desarrollo usa el chromium local de playwright
      : await chromiumPkg.executablePath();
    
    // Lanzar Playwright
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: isDev ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ] : chromiumPkg.args,
    });
    
    // Viewport: 1440x1018 = ratio exacto A4 landscape (297:210)
    // Esto asegura que 100vh = exactamente una página landscape
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1018 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    
    // Navegar a la presentación en modo PDF
    await page.goto(pdfUrl, { 
      waitUntil: 'networkidle',
      timeout: 45000, // 45s para cargar (incluye imágenes)
    });
    
    // Esperar a que React se hidrate completamente
    await page.waitForTimeout(3000);
    
    // Forzar visibilidad de todos los elementos que framer-motion dejó ocultos
    // Framer-motion aplica inline styles (opacity: 0, transform: translateY(...))
    // a elementos que no han entrado en viewport. Los removemos.
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        
        // Remover inline opacity:0 (framer-motion initial state)
        if (el.style.opacity === '0') {
          el.style.removeProperty('opacity');
        }
        
        // Remover inline transforms de animación (framer-motion initial state)
        // Preservar transforms de layout (como -translate-y-1/2 de Tailwind que van en CSS classes)
        if (el.style.transform) {
          el.style.removeProperty('transform');
        }
      });
    });
    
    // Pequeña pausa después de los cambios de estilo
    await page.waitForTimeout(500);
    
    // Generar PDF - Landscape A4, sin márgenes, con backgrounds
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });
    
    await browser.close();
    browser = null;
    
    // Extraer nombre del cliente para el archivo
    const clientData = presentation.clientData as any;
    const companyName = clientData?.client?.company_name 
      || clientData?.account?.Account_Name 
      || 'Cliente';
    const quoteNumber = clientData?.quote?.number 
      || clientData?.quote?.Quote_Number 
      || '';
    
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_');
    const fileName = `Presentacion_Gard_${safeCompanyName}${quoteNumber ? `_${quoteNumber}` : ''}.pdf`;
    
    console.log(`[PDF] Presentación generada: ${fileName} (${pdfBuffer.length} bytes)`);
    
    // Retornar PDF
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
    
  } catch (error: any) {
    console.error('[PDF] Error generando presentación:', error);
    
    if (browser) {
      try { await browser.close(); } catch {}
    }
    
    return NextResponse.json(
      { error: 'Error generando PDF de la presentación', details: error.message },
      { status: 500 }
    );
  }
}
