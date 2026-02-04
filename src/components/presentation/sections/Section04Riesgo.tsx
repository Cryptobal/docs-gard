'use client';

/**
 * Section04Riesgo - El Riesgo Real
 * Rompe la falsa tranquilidad y muestra síntomas de control deficiente
 */

import { Section04_Riesgo } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { AlertTriangle, XCircle } from 'lucide-react';

interface Section04RiesgoProps {
  data: Section04_Riesgo;
}

export function Section04Riesgo({ data }: Section04RiesgoProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s04-riesgo" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header con estadística impactante */}
        <div className="text-center mb-16">
          <div className={cn('inline-block mb-6')}>
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          
          <h2 className={cn(
            'text-3xl md:text-5xl font-bold mb-8 max-w-4xl mx-auto',
            theme.text,
            theme.headlineWeight
          )}>
            {data.headline}
          </h2>
          
          <div className={cn(
            'inline-block px-6 py-4 rounded-lg border border-red-500/30',
            'bg-red-900/10'
          )}>
            <p className="text-2xl md:text-3xl font-bold text-red-400">
              {data.statistic}
            </p>
          </div>
        </div>
        
        {/* Síntomas grid */}
        <div className="max-w-5xl mx-auto">
          <h3 className={cn('text-2xl font-bold text-center mb-8', theme.text)}>
            Síntomas de control deficiente
          </h3>
          
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {data.symptoms.map((symptom, index) => (
              <StaggerItem key={index}>
                <div className={cn(
                  'p-6 rounded-lg border border-red-500/20',
                  'bg-red-900/5 hover:bg-red-900/10 transition-colors',
                  'h-full'
                )}>
                  <XCircle className="w-8 h-8 text-red-500 mb-4" />
                  <h4 className={cn('text-lg font-bold mb-2', theme.text)}>
                    {symptom.title}
                  </h4>
                  <p className={cn('text-sm', theme.textMuted)}>
                    {symptom.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        
        {/* Bottom message */}
        <div className="mt-12 text-center">
          <p className={cn('text-lg', theme.textMuted)}>
            La pregunta no es <span className={cn('font-bold', theme.text)}>"¿tenemos seguridad?"</span>
            <br />
            sino <span className={cn('font-bold', theme.text)}>"¿tenemos control sobre nuestra seguridad?"</span>
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
