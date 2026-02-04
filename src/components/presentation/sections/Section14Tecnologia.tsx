'use client';

/**
 * Section14Tecnologia - Tecnología que controla
 * No marketing, beneficios reales
 */

import { Section14_Tecnologia } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Smartphone, Camera, BarChart, Info } from 'lucide-react';

interface Section14TecnologiaProps {
  data: Section14_Tecnologia;
}

export function Section14Tecnologia({ data }: Section14TecnologiaProps) {
  const theme = useThemeClasses();
  
  const icons = [Smartphone, Camera, BarChart];
  
  return (
    <SectionWrapper id="s14-tecnologia" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Smartphone className={cn('w-16 h-16 mx-auto mb-6', theme.accent.replace('bg-', 'text-'))} />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Tecnología que controla
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            No vendemos tecnología. La usamos para verificar que el servicio se cumple.
          </p>
        </div>
        
        {/* Tools grid */}
        <StaggerContainer className="space-y-6 max-w-4xl mx-auto mb-12">
          {data.tools.map((tool, index) => {
            const Icon = icons[index % icons.length];
            
            return (
              <StaggerItem key={index}>
                <div className={cn(
                  'p-6 md:p-8 rounded-lg border',
                  theme.border,
                  theme.secondary
                )}>
                  <div className="grid md:grid-cols-[auto,1fr] gap-6">
                    {/* Icon */}
                    <div className={cn(
                      'w-16 h-16 rounded-lg flex items-center justify-center',
                      theme.accent,
                      'bg-opacity-20'
                    )}>
                      <Icon className={cn('w-8 h-8', theme.accent.replace('bg-', 'text-'))} />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h3 className={cn('text-xl font-bold mb-4', theme.text)}>
                        {tool.name}
                      </h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className={cn('text-xs font-semibold mb-1', theme.textMuted)}>
                            ¿Qué es?
                          </p>
                          <p className={cn('text-sm', theme.text)}>
                            {tool.what_is_it}
                          </p>
                        </div>
                        
                        <div>
                          <p className={cn('text-xs font-semibold mb-1', theme.textMuted)}>
                            ¿Para qué?
                          </p>
                          <p className={cn('text-sm', theme.text)}>
                            {tool.purpose}
                          </p>
                        </div>
                        
                        <div>
                          <p className={cn('text-xs font-semibold mb-1', theme.accent.replace('bg-', 'text-'))}>
                            Beneficio real
                          </p>
                          <p className={cn('text-sm font-semibold', theme.text)}>
                            {tool.real_benefit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
        
        {/* Important note */}
        <div className={cn('p-6 rounded-lg border text-center max-w-3xl mx-auto', theme.border, theme.accent, 'bg-opacity-10')}>
          <Info className={cn('w-8 h-8 mx-auto mb-3', theme.accent.replace('bg-', 'text-'))} />
          <p className={cn('text-base font-semibold', theme.text)}>
            {data.note}
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
