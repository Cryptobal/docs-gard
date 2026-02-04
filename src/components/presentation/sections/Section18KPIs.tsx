'use client';

/**
 * Section18KPIs - Indicadores de gestión
 * 6 KPIs principales con targets
 */

import { Section18_KPIs } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { BarChart3, Target } from 'lucide-react';

interface Section18KPIsProps {
  data: Section18_KPIs;
}

export function Section18KPIs({ data }: Section18KPIsProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s18-kpis" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <BarChart3 className={cn('w-16 h-16 mx-auto mb-6', theme.accent.replace('bg-', 'text-'))} />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Indicadores de gestión (KPIs)
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            Lo que se mide, se controla. Lo que se controla, mejora.
          </p>
        </div>
        
        {/* KPIs grid */}
        <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {data.indicators.map((indicator, index) => (
            <StaggerItem key={index}>
              <div className={cn(
                'p-6 rounded-lg border',
                theme.border,
                theme.secondary
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={cn('text-lg font-bold mb-1', theme.text)}>
                      {indicator.name}
                    </h3>
                    <p className={cn('text-sm', theme.textMuted)}>
                      {indicator.description}
                    </p>
                  </div>
                  
                  <Target className={cn('w-6 h-6 flex-shrink-0', theme.accent.replace('bg-', 'text-'))} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className={cn('text-xs font-semibold mb-1', theme.textMuted)}>
                      Target
                    </p>
                    <p className={cn('text-xl font-bold', theme.accent.replace('bg-', 'text-'))}>
                      {indicator.target}
                    </p>
                  </div>
                  
                  <div>
                    <p className={cn('text-xs font-semibold mb-1', theme.textMuted)}>
                      Medición
                    </p>
                    <p className={cn('text-sm font-semibold', theme.text)}>
                      {indicator.measurement_frequency}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        
        {/* Review note */}
        <div className={cn('p-6 rounded-lg border text-center max-w-3xl mx-auto', theme.border, theme.secondary)}>
          <p className={cn('text-base', theme.text)}>
            {data.review_note}
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
