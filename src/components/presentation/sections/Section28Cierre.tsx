'use client';

/**
 * Section28Cierre - CTA Final / Cierre
 * Última sección antes del footer con call-to-action fuerte
 */

import { Section28_Cierre } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Calendar, Mail, ArrowRight } from 'lucide-react';

interface Section28CierreProps {
  data: Section28_Cierre;
}

export function Section28Cierre({ data }: Section28CierreProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s28-cierre" animation="scale" className="relative overflow-hidden">
      {/* Background gradient */}
      <div className={cn('absolute inset-0', theme.background)} />
      
      <ContainerWrapper className="relative z-10 py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Headline */}
          <h2 className={cn(
            'text-4xl md:text-6xl font-bold mb-6',
            'text-white',
            theme.headlineWeight
          )}>
            {data.headline}
          </h2>
          
          {/* Microcopy */}
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
            {data.microcopy}
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href={data.cta_primary.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center justify-center gap-3',
                'px-8 py-5 rounded-lg',
                'text-lg font-semibold text-white',
                theme.accent,
                theme.accentHover,
                'transition-all hover:scale-105',
                'shadow-2xl'
              )}
            >
              <Calendar className="w-6 h-6" />
              {data.cta_primary.text}
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <a
              href={data.cta_secondary.link}
              className={cn(
                'inline-flex items-center justify-center gap-3',
                'px-8 py-5 rounded-lg',
                'text-lg font-semibold text-white',
                'bg-white/10 backdrop-blur-sm border-2 border-white/30',
                'hover:bg-white/20 transition-all'
              )}
            >
              <Mail className="w-6 h-6" />
              {data.cta_secondary.text}
            </a>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Respuesta en 24 horas hábiles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Visita técnica sin costo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Sin compromiso</span>
            </div>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
