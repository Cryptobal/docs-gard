'use client';

/**
 * Section09ComoOperamos - Proceso operativo en 7 etapas
 * Muestra el proceso completo con entregables
 */

import { Section09_ComoOperamos } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { ProcessSteps } from '../shared/ProcessSteps';

interface Section09ComoOperamosProps {
  data: Section09_ComoOperamos;
}

export function Section09ComoOperamos({ data }: Section09ComoOperamosProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s09-como-operamos" className={theme.backgroundAlt}>
      <ContainerWrapper size="lg">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4', theme.accent, 'text-white')}>
            Nuestro Proceso
          </div>
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Cómo operamos
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto', theme.textMuted)}>
            Proceso estructurado en 7 etapas con entregables claros
          </p>
        </div>
        
        {/* Process Steps */}
        <ProcessSteps steps={data.stages} />
        
        {/* Bottom note */}
        <div className="mt-12 text-center">
          <div className={cn('inline-block p-6 rounded-lg border', theme.border, theme.secondary)}>
            <p className={cn('text-base', theme.text)}>
              <span className="font-bold">Nota importante:</span> Este no es un proceso lineal. 
              Las etapas 4-7 se ejecutan de manera continua durante todo el servicio.
            </p>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
