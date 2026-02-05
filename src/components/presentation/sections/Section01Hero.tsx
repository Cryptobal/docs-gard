'use client';

/**
 * Section01Hero - Hero 100% responsive, NO cortado
 */

import { Section01_Hero, PresentationPayload } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { replaceTokens } from '@/lib/tokens';
import Image from 'next/image';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Section01HeroProps {
  data: Section01_Hero;
  payload: PresentationPayload;
}

export function Section01Hero({ data, payload }: Section01HeroProps) {
  const theme = useThemeClasses();
  
  const headline = replaceTokens(data.headline, payload);
  const subheadline = replaceTokens(data.subheadline, payload);
  const microcopy = replaceTokens(data.microcopy, payload);
  const personalization = replaceTokens(data.personalization, payload);
  
  return (
    <SectionWrapper id="s01-hero" animation="none" className="relative overflow-hidden p-0">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={data.background_image}
          alt="Hero background"
          fill
          className="object-cover brightness-75"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-900/30" />
        
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Content - AJUSTADO A PANTALLA */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-20 sm:py-24 max-w-7xl mx-auto w-full">
        {/* KPI Overlay Desktop */}
        {data.kpi_overlay && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute top-16 right-4 lg:right-8 hidden lg:block"
          >
            <div className="glass-card p-4 lg:p-6 glow-teal rounded-xl border border-teal-400/30">
              <div className="text-3xl lg:text-5xl font-black mb-2 bg-gradient-to-br from-teal-400 to-blue-400 bg-clip-text text-transparent">
                {data.kpi_overlay.value}
              </div>
              <div className="text-xs lg:text-sm font-semibold text-white/80">
                {data.kpi_overlay.label}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Main Content */}
        <div className="w-full max-w-5xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-4 sm:mb-6"
          >
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass-card text-xs sm:text-sm font-bold text-white border border-teal-400/30 glow-teal">
              <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-teal-400" />
              <span className="truncate max-w-[250px] sm:max-w-none">{personalization}</span>
            </span>
          </motion.div>
          
          {/* Headline - RESPONSIVE */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 text-white leading-[1.1] tracking-tight text-shadow-lg"
          >
            {headline}
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-xl md:text-2xl lg:text-3xl mb-3 sm:mb-4 font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent"
          >
            {subheadline}
          </motion.p>
          
          {/* Microcopy */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-sm sm:text-base md:text-lg text-white/70 mb-6 sm:mb-10 max-w-3xl leading-relaxed"
          >
            {microcopy}
          </motion.p>
          
          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <a
              href={payload.cta.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 transition-all duration-300 hover:scale-105 shadow-xl shadow-teal-500/50 border-2 border-teal-400/50"
            >
              <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="whitespace-nowrap">{data.cta_primary_text}</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </a>
            
            <a
              href={`mailto:${payload.contact.email}`}
              className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white glass-card border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              <span className="whitespace-nowrap">{data.cta_secondary_text}</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </a>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-8 text-xs sm:text-sm text-white/60"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="whitespace-nowrap">Sin costo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="whitespace-nowrap">Respuesta 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '1s' }} />
              <span className="whitespace-nowrap">Visita incluida</span>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/40 text-xs font-semibold tracking-widest uppercase">Scroll</span>
            <ArrowRight className="w-5 h-5 text-white/40 rotate-90" />
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
