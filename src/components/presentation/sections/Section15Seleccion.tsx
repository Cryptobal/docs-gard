'use client';

/**
 * Section15Seleccion - Funnel MÁS CLARO + Criterios horizontal
 */

import { Section15_Seleccion } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { Users, Filter, TrendingDown, Brain, Briefcase, RefreshCw, ClipboardCheck, Activity } from 'lucide-react';
import { YouTubeEmbed, extractYouTubeId } from '../shared/YouTubeEmbed';
import { motion } from 'framer-motion';

interface Section15SeleccionProps {
  data: Section15_Seleccion;
}

const criteriaIcons = [Brain, Briefcase, RefreshCw, ClipboardCheck, Activity];

export function Section15Seleccion({ data }: Section15SeleccionProps) {
  const theme = useThemeClasses();
  const maxValue = data.funnel[0]?.quantity || 100;
  
  return (
    <SectionWrapper id="s15-seleccion" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Filter className="w-14 h-14 mx-auto mb-6 text-teal-400" />
          
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white leading-tight">
            Selección rigurosa
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-4">
            De 100 postulantes, solo 12 son asignados
          </p>
          
          <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-teal-400/30">
            <span className="text-4xl font-black text-white">100</span>
            <TrendingDown className="w-6 h-6 text-red-400" />
            <span className="text-4xl font-black text-teal-400">12</span>
          </div>
        </div>
        
        {/* Funnel MÁS CLARO - Con labels */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="space-y-2">
            {data.funnel.map((stage, index) => {
              const widthPercent = (stage.quantity / maxValue) * 100;
              const isLast = index === data.funnel.length - 1;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  {/* Número */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-lg">
                    {stage.quantity}
                  </div>
                  
                  {/* Barra */}
                  <div className="flex-1">
                    <div className={cn(
                      'glass-card px-6 py-4 rounded-xl border-2 transition-all',
                      isLast 
                        ? 'border-teal-400/50 bg-gradient-to-r from-teal-500/30 to-blue-500/30 shadow-xl shadow-teal-500/30' 
                        : 'border-white/10'
                    )}
                    style={{ width: `${Math.max(widthPercent, 50)}%` }}
                    >
                      <h4 className={cn(
                        'font-bold text-sm',
                        isLast ? 'text-white' : 'text-white/80'
                      )}>
                        {stage.stage}
                      </h4>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Criterios - GRID 5x1 HORIZONTAL */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8 text-white">
            Criterios de evaluación
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {data.criteria_table.map((criterion, index) => {
              const Icon = criteriaIcons[index % criteriaIcons.length];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-card p-5 rounded-xl border border-white/10 hover:border-teal-400/30 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-teal-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">
                    {criterion.criterion}
                  </h4>
                  <p className="text-xs text-white/60 leading-snug">
                    {criterion.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Video */}
        <div className="mb-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-6 text-white">
            Proceso de verificación
          </h3>
          <YouTubeEmbed 
            videoId={extractYouTubeId('https://youtu.be/a6TSsPvaoZM')}
            title="Verificación de antecedentes"
          />
        </div>
        
        {/* Stat */}
        <div className="text-center">
          <div className="inline-block glass-card px-8 py-5 rounded-xl border border-teal-400/30">
            <Users className="w-10 h-10 mx-auto mb-3 text-teal-400" />
            <p className="text-sm font-semibold text-white/70 mb-2">
              Tasa de permanencia
            </p>
            <p className="text-4xl font-black text-white">
              {data.retention_rate}
            </p>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
