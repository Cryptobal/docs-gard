'use client';

/**
 * Section16NuestraGente - Equipo y cultura
 * Fotos reales del equipo + valores
 */

import { Section16_NuestraGente } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { PhotoMosaic } from '../shared/PhotoMosaic';
import { Heart } from 'lucide-react';

interface Section16NuestraGenteProps {
  data: Section16_NuestraGente;
}

export function Section16NuestraGente({ data }: Section16NuestraGenteProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s16-nuestra-gente" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className={cn('w-16 h-16 mx-auto mb-6', theme.accent.replace('bg-', 'text-'))} />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Nuestra gente
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto mb-8', theme.textMuted)}>
            {data.message}
          </p>
        </div>
        
        {/* Photo mosaic */}
        <div className="mb-16">
          <PhotoMosaic 
            photos={data.photos} 
            columns={3}
            aspectRatio="landscape"
          />
        </div>
        
        {/* Values */}
        <div className="max-w-5xl mx-auto">
          <h3 className={cn('text-2xl font-bold text-center mb-8', theme.text)}>
            Nuestros valores
          </h3>
          
          <StaggerContainer className="grid md:grid-cols-5 gap-6">
            {data.values.map((value, index) => (
              <StaggerItem key={index}>
                <div className={cn(
                  'p-6 rounded-lg border text-center h-full',
                  theme.border,
                  theme.secondary,
                  'hover:scale-105 transition-all'
                )}>
                  <h4 className={cn('text-lg font-bold mb-2', theme.text)}>
                    {value.title}
                  </h4>
                  <p className={cn('text-sm', theme.textMuted)}>
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        
        {/* Bottom stat */}
        <div className="mt-12 text-center">
          <div className={cn('inline-block p-6 rounded-lg border', theme.border, theme.accent, 'bg-opacity-10')}>
            <p className={cn('text-sm font-semibold mb-2', theme.textMuted)}>
              Permanencia promedio
            </p>
            <p className={cn('text-4xl font-bold', theme.accent.replace('bg-', 'text-'))}>
              85%
            </p>
            <p className={cn('text-sm mt-2', theme.textMuted)}>
              vs industria: 50-60%
            </p>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
