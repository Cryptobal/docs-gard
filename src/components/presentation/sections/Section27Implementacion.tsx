'use client';

/**
 * Section27Implementacion - Timeline de implementación
 * 4 semanas para go-live
 */

import { Section27_Implementacion } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Section27ImplementacionProps {
  data: Section27_Implementacion;
}

export function Section27Implementacion({ data }: Section27ImplementacionProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s27-implementacion">
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-full mb-6', theme.accent, 'bg-opacity-20')}>
            <Calendar className={cn('w-8 h-8', theme.accent.replace('bg-', 'text-'))} />
          </div>
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Proceso de implementación
          </h2>
          
          <p className={cn('text-lg md:text-xl mb-2', theme.textMuted)}>
            De la firma del contrato al servicio operativo
          </p>
          
          <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full', theme.accent, 'text-white')}>
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{data.total_duration}</span>
          </div>
        </div>
        
        {/* Timeline */}
        <StaggerContainer className="max-w-4xl mx-auto space-y-8">
          {data.phases.map((phase, index) => (
            <StaggerItem key={index}>
              <div className={cn('relative p-6 md:p-8 rounded-lg border', theme.border, theme.secondary)}>
                {/* Week badge */}
                <div className={cn('absolute -top-4 left-6 px-4 py-1 rounded-full text-sm font-semibold', theme.accent, 'text-white')}>
                  Semana {phase.week}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Left: Title & Description */}
                  <div>
                    <h3 className={cn('text-2xl font-bold mb-3', theme.text)}>
                      {phase.title}
                    </h3>
                    <p className={cn('text-base mb-4', theme.textMuted)}>
                      {phase.description}
                    </p>
                    
                    {/* Client requirements */}
                    {phase.client_requirements && phase.client_requirements.length > 0 && (
                      <div className="mt-4">
                        <h4 className={cn('text-sm font-semibold mb-2', theme.text)}>
                          Necesitamos de ti:
                        </h4>
                        <ul className="space-y-1">
                          {phase.client_requirements.map((req, i) => (
                            <li key={i} className={cn('text-sm flex items-start gap-2', theme.textMuted)}>
                              <span className="mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Deliverables */}
                  <div>
                    <h4 className={cn('text-sm font-semibold mb-3', theme.text)}>
                      Entregables:
                    </h4>
                    <div className="space-y-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0 mt-0.5', theme.accent.replace('bg-', 'text-'))} />
                          <span className={cn('text-sm', theme.text)}>
                            {deliverable}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        
        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className={cn('text-lg mb-4', theme.text)}>
            ¿Necesitas implementación más rápida?
          </p>
          <p className={cn('text-sm', theme.textMuted)}>
            Podemos acelerar el proceso con coordinación intensiva. Consúltanos.
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
