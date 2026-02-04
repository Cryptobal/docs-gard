'use client';

/**
 * Section15Seleccion - Proceso de selección de personal
 * Funnel 100 → 12 + criterios de evaluación
 */

import { Section15_Seleccion } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Users, Filter, TrendingDown } from 'lucide-react';

interface Section15SeleccionProps {
  data: Section15_Seleccion;
}

export function Section15Seleccion({ data }: Section15SeleccionProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s15-seleccion" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Filter className={cn('w-16 h-16 mx-auto mb-6', theme.accent.replace('bg-', 'text-'))} />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Selección rigurosa
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto', theme.textMuted)}>
            De 100 postulantes, solo 12 son asignados
          </p>
        </div>
        
        {/* Funnel visualization */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="space-y-3">
            {data.funnel.map((stage, index) => {
              const width = `${(stage.quantity / data.funnel[0].quantity) * 100}%`;
              const isFirst = index === 0;
              const isLast = index === data.funnel.length - 1;
              
              return (
                <div key={index} className="relative">
                  <div
                    className={cn(
                      'p-4 rounded-lg border transition-all hover:scale-105',
                      theme.border,
                      isLast ? theme.accent : theme.secondary,
                      isLast && 'text-white'
                    )}
                    style={{ width }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'font-semibold',
                        isLast ? 'text-white' : theme.text
                      )}>
                        {stage.stage}
                      </span>
                      <span className={cn(
                        'text-2xl font-bold',
                        isLast ? 'text-white' : theme.accent.replace('bg-', 'text-')
                      )}>
                        {stage.quantity}
                      </span>
                    </div>
                  </div>
                  
                  {!isLast && (
                    <TrendingDown className={cn('absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6', theme.textMuted)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Criteria table */}
        <div className="max-w-4xl mx-auto">
          <h3 className={cn('text-2xl font-bold text-center mb-8', theme.text)}>
            Criterios de evaluación
          </h3>
          
          <div className="space-y-4">
            {data.criteria_table.map((criterion, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4 p-6 rounded-lg border',
                  theme.border,
                  theme.secondary
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  theme.accent,
                  'text-white font-bold'
                )}>
                  {index + 1}
                </div>
                <div>
                  <h4 className={cn('text-lg font-bold mb-1', theme.text)}>
                    {criterion.criterion}
                  </h4>
                  <p className={cn('text-sm', theme.textMuted)}>
                    {criterion.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Retention stat */}
        <div className="mt-12 text-center">
          <div className={cn('inline-block p-6 rounded-lg border', theme.border, theme.secondary)}>
            <Users className={cn('w-10 h-10 mx-auto mb-3', theme.accent.replace('bg-', 'text-'))} />
            <p className={cn('text-sm font-semibold mb-2', theme.textMuted)}>
              Tasa de permanencia
            </p>
            <p className={cn('text-3xl font-bold', theme.text)}>
              {data.retention_rate}
            </p>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
