'use client';

/**
 * Section21Sectores - Sectores donde aplicamos
 * 6 industrias con necesidades típicas
 */

import { Section21_Sectores } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Building2, Factory, ShoppingBag, HardHat, Heart, GraduationCap } from 'lucide-react';

interface Section21SectoresProps {
  data: Section21_Sectores;
}

export function Section21Sectores({ data }: Section21SectoresProps) {
  const theme = useThemeClasses();
  
  const icons = [Building2, Factory, ShoppingBag, HardHat, Heart, GraduationCap];
  
  return (
    <SectionWrapper id="s21-sectores">
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4', theme.accent, 'text-white')}>
            Experiencia Vertical
          </div>
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Sectores donde aplicamos
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto', theme.textMuted)}>
            Experiencia probada en múltiples industrias
          </p>
        </div>
        
        {/* Industries grid */}
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.industries.map((industry, index) => {
            const Icon = icons[index % icons.length];
            
            return (
              <StaggerItem key={index}>
                <div className={cn(
                  'p-6 rounded-lg border h-full',
                  theme.border,
                  theme.secondary,
                  'hover:scale-105 transition-all'
                )}>
                  <Icon className={cn('w-10 h-10 mb-4', theme.accent.replace('bg-', 'text-'))} />
                  
                  <h3 className={cn('text-xl font-bold mb-3', theme.text)}>
                    {industry.name}
                  </h3>
                  
                  <ul className="space-y-2">
                    {industry.typical_needs.map((need, i) => (
                      <li key={i} className={cn('text-sm flex items-start gap-2', theme.textMuted)}>
                        <span className="mt-1">•</span>
                        <span>{need}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
        
        {/* Bottom message */}
        <div className="mt-12 text-center">
          <p className={cn('text-base max-w-2xl mx-auto', theme.textMuted)}>
            Cada industria tiene desafíos únicos. Diseñamos el servicio según tus necesidades específicas.
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
