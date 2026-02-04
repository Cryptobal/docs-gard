'use client';

/**
 * Section10Supervision - Supervisión activa en 4 niveles
 * Corazón del sistema de control
 */

import { Section10_Supervision } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Eye, Clock } from 'lucide-react';
import { TrustBadges } from '../shared/TrustBadges';

interface Section10SupervisionProps {
  data: Section10_Supervision;
}

export function Section10Supervision({ data }: Section10SupervisionProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s10-supervision" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Eye className={cn('w-16 h-16 mx-auto mb-6', theme.accent.replace('bg-', 'text-'))} />
          
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Supervisión activa
          </h2>
          
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            El corazón del sistema: verificación permanente en 4 niveles
          </p>
        </div>
        
        {/* Levels */}
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {data.levels.map((level, index) => (
            <StaggerItem key={index}>
              <div className={cn(
                'p-6 rounded-lg border text-center',
                theme.border,
                level.level === 1 ? theme.accent : theme.secondary,
                level.level === 1 && 'text-white'
              )}>
                <div className={cn(
                  'text-3xl font-bold mb-2',
                  level.level === 1 ? 'text-white' : theme.text
                )}>
                  {level.level}
                </div>
                <h4 className={cn(
                  'text-lg font-bold mb-2',
                  level.level === 1 ? 'text-white' : theme.text
                )}>
                  {level.name}
                </h4>
                <p className={cn(
                  'text-sm mb-3',
                  level.level === 1 ? 'text-white/90' : theme.textMuted
                )}>
                  {level.description}
                </p>
                <div className={cn(
                  'text-xs font-semibold',
                  level.level === 1 ? 'text-white/80' : theme.accent.replace('bg-', 'text-')
                )}>
                  {level.frequency}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
        
        {/* Night shift timeline */}
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className={cn('text-2xl font-bold text-center mb-8', theme.text)}>
            Ejemplo: Turno nocturno (20:00 - 08:00)
          </h3>
          
          <div className={cn('rounded-lg border overflow-hidden', theme.border)}>
            {data.night_shift_timeline.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-4 p-4',
                  index % 2 === 0 ? theme.secondary : 'bg-transparent',
                  index < data.night_shift_timeline.length - 1 && 'border-b',
                  theme.border
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0',
                  theme.accent,
                  'bg-opacity-20'
                )}>
                  <Clock className={cn('w-6 h-6', theme.accent.replace('bg-', 'text-'))} />
                  <span className={cn('text-sm font-bold ml-2', theme.text)}>
                    {item.time}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={cn('text-base', theme.text)}>
                    {item.activity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* SLA badges */}
        <div className="max-w-4xl mx-auto">
          <h3 className={cn('text-xl font-bold text-center mb-6', theme.text)}>
            Compromisos de servicio (SLA)
          </h3>
          
          <TrustBadges
            badges={data.sla.map((sla, i) => ({
              icon: 'shield',
              title: `SLA ${i + 1}`,
              value: sla.split(':')[0],
              description: sla,
            }))}
          />
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
