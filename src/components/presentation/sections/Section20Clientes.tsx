'use client';

/**
 * Section20Clientes - Grid de logos de clientes
 * Prueba social y autoridad
 */

import { Section20_Clientes } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Shield } from 'lucide-react';

interface Section20ClientesProps {
  data: Section20_Clientes;
}

export function Section20Clientes({ data }: Section20ClientesProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s20-clientes">
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-full mb-6', theme.accent, 'bg-opacity-20')}>
            <Shield className={cn('w-8 h-8', theme.accent.replace('bg-', 'text-'))} />
          </div>
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Empresas que confían en nosotros
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto', theme.textMuted)}>
            Protegemos operaciones críticas en diversos sectores industriales
          </p>
        </div>
        
        {/* Grid de logos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {data.client_logos.map((logo, index) => (
            <div
              key={index}
              className={cn(
                'relative h-24 rounded-lg border p-4',
                theme.border,
                theme.secondary,
                'flex items-center justify-center',
                'grayscale hover:grayscale-0 transition-all duration-300',
                'hover:scale-105'
              )}
            >
              <Image
                src={logo}
                alt={`Cliente ${index + 1}`}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>
        
        {/* Nota de confidencialidad */}
        {data.confidentiality_note && (
          <div className="mt-12 text-center">
            <p className={cn('text-sm max-w-2xl mx-auto', theme.textMuted)}>
              {data.confidentiality_note}
            </p>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className={cn('text-4xl font-bold mb-2', theme.text)}>200+</div>
            <div className={cn('text-sm', theme.textMuted)}>Clientes activos</div>
          </div>
          <div className="text-center">
            <div className={cn('text-4xl font-bold mb-2', theme.text)}>15+</div>
            <div className={cn('text-sm', theme.textMuted)}>Años de experiencia</div>
          </div>
          <div className="text-center">
            <div className={cn('text-4xl font-bold mb-2', theme.text)}>98%</div>
            <div className={cn('text-sm', theme.textMuted)}>Tasa de retención</div>
          </div>
          <div className="text-center">
            <div className={cn('text-4xl font-bold mb-2', theme.text)}>24/7</div>
            <div className={cn('text-sm', theme.textMuted)}>Soporte disponible</div>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
