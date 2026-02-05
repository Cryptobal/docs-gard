'use client';

/**
 * Section01Hero - Hero que cabe PERFECTO en una pantalla
 * TODO visible sin scroll
 */

import { Section01_Hero, PresentationPayload } from '@/types/presentation';
import { SectionWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { replaceTokens } from '@/lib/tokens';
import Image from 'next/image';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Section01HeroProps {
  data: Section01_Hero;
  payload: PresentationPayload;
  showTokens?: boolean;
}

export function Section01Hero({ data, payload, showTokens = false }: Section01HeroProps) {
  const theme = useThemeClasses();
  
  const headline = showTokens ? data.headline : replaceTokens(data.headline, payload);
  const subheadline = showTokens ? data.subheadline : replaceTokens(data.subheadline, payload);
  const microcopy = showTokens ? data.microcopy : replaceTokens(data.microcopy, payload);
  const personalization = showTokens ? data.personalization : replaceTokens(data.personalization, payload);
  const contactName = showTokens ? '[CONTACT_NAME]' : payload.client.contact_name;
  
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-900/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Content - AJUSTADO PARA CABER COMPLETO */}
      <div className="relative z-10 h-screen flex flex-col justify-center px-4 sm:px-6 md:px-12 py-24 max-w-7xl mx-auto">
        {/* KPI Overlay Desktop - MÁS PEQUEÑO */}
        {data.kpi_overlay && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute top-24 right-6 lg:right-12 hidden lg:block"
          >
            <div className="glass-card p-4 glow-teal rounded-xl border border-teal-400/30">
              <div className="text-4xl font-black mb-1 bg-gradient-to-br from-teal-400 to-blue-400 bg-clip-text text-transparent">
                {data.kpi_overlay.value}
              </div>
              <div className="text-xs font-semibold text-white/80">
                {data.kpi_overlay.label}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Main Content - COMPACTO */}
        <div className="w-full max-w-4xl">
          {/* Badge - COMPACTO con 2 líneas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-4"
          >
            <div className="inline-flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-bold text-white border border-teal-400/30 glow-teal">
                <Sparkles className="w-3 h-3 text-teal-400" />
                {personalization}
              </span>
              <span className="text-xs text-white/60 ml-2">
                Preparado para {contactName}
              </span>
            </div>
          </motion.div>
          
          {/* Headline - REDUCIDO */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 text-white leading-tight tracking-tight text-shadow-lg"
          >
            {headline}
          </motion.h1>
          
          {/* Subheadline - REDUCIDO */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent"
          >
            {subheadline}
          </motion.p>
          
          {/* Microcopy - REDUCIDO */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-sm sm:text-base text-white/70 mb-6 max-w-2xl leading-relaxed"
          >
            {microcopy}
          </motion.p>
          
          {/* CTAs - COMPACTOS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <a
              href={payload.cta.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 transition-all duration-300 hover:scale-105 shadow-lg shadow-teal-500/50 border-2 border-teal-400/50"
            >
              <Calendar className="w-4 h-4" />
              <span>{data.cta_primary_text}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            
            <a
              href={`mailto:${payload.contact.email}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white glass-card border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              <span>{data.cta_secondary_text}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
          
          {/* Trust indicators - COMPACTO */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-wrap items-center gap-3 mt-5 text-xs text-white/60"
          >
            {['Sin costo', 'Respuesta 24h', 'Visita incluida'].map((text, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Scroll indicator - MÁS ABAJO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hidden md:block"
        >
          <ArrowRight className="w-5 h-5 text-white/40 rotate-90" />
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
