'use client';

/**
 * Section06CostoReal - Costo real del riesgo
 * Cards de costos ocultos
 */

import { Section06_CostoReal } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp } from 'lucide-react';

interface Section06CostoRealProps {
  data: Section06_CostoReal;
}

export function Section06CostoReal({ data }: Section06CostoRealProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s06-costo-real" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <DollarSign className="w-16 h-16 mx-auto mb-6 text-red-500" />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            El costo real del riesgo
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            Costos ocultos que no aparecen en la factura del proveedor "barato"
          </p>
        </div>
        
        {/* Cost cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {data.cost_cards.map((card, index) => (
            <StaggerItem key={index}>
              <div className={cn(
                'p-6 rounded-lg border border-red-500/30 h-full',
                'bg-red-900/5',
                'hover:scale-105 transition-all'
              )}>
                <TrendingUp className="w-8 h-8 text-red-500 mb-4" />
                
                <h3 className={cn('text-xl font-bold mb-2', theme.text)}>
                  {card.title}
                </h3>
                
                <p className={cn('text-sm mb-4', theme.textMuted)}>
                  {card.description}
                </p>
                
                <div className="pt-4 border-t border-red-500/30">
                  <p className="text-xs text-red-400 font-semibold mb-1">
                    Impacto estimado
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {card.estimated_impact}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        
        {/* Conclusion */}
        <div className={cn('p-8 rounded-lg border text-center max-w-3xl mx-auto', theme.border, theme.secondary)}>
          <p className={cn('text-xl md:text-2xl font-bold', theme.text)}>
            {data.conclusion_note}
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
