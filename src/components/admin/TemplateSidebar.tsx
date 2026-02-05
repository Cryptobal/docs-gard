'use client';

/**
 * TemplateSidebar - MOBILE FIRST sin scroll externo
 * Header y Footer fijos, solo navegación scrolleable
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Circle, 
  CheckCircle2,
  Eye,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { ThemeVariant } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  label: string;
}

interface SectionGroup {
  name: string;
  sections: Section[];
}

const SECTION_GROUPS: SectionGroup[] = [
  { name: 'INICIO', sections: [{ id: 's01-hero', label: 'Hero' }] },
  { 
    name: 'PROPUESTA VALOR', 
    sections: [
      { id: 's02-executive-summary', label: 'Executive' },
      { id: 's03-transparencia', label: 'Transparencia' },
      { id: 's04-riesgo', label: 'Riesgo' },
    ] 
  },
  { 
    name: 'PROBLEMA', 
    sections: [
      { id: 's05-fallas-modelo', label: 'Fallas' },
      { id: 's06-costo-real', label: 'Costo' },
    ] 
  },
  { 
    name: 'SOLUCIÓN', 
    sections: [
      { id: 's07-sistema-capas', label: 'Sistema' },
      { id: 's08-4-pilares', label: '4 Pilares' },
      { id: 's09-como-operamos', label: 'Operación' },
    ] 
  },
  { 
    name: 'OPERACIÓN', 
    sections: [
      { id: 's10-supervision', label: 'Supervisión' },
      { id: 's11-reportabilidad', label: 'Reportes' },
      { id: 's12-cumplimiento', label: 'Cumplimiento' },
    ] 
  },
  { 
    name: 'CREDENCIALES', 
    sections: [
      { id: 's13-certificaciones', label: 'Certificaciones' },
      { id: 's14-tecnologia', label: 'Tecnología' },
      { id: 's15-seleccion', label: 'Selección' },
      { id: 's16-nuestra-gente', label: 'Gente' },
    ] 
  },
  { 
    name: 'GARANTÍAS', 
    sections: [
      { id: 's17-continuidad', label: 'Continuidad' },
      { id: 's18-kpis', label: 'KPIs' },
    ] 
  },
  { 
    name: 'PRUEBA SOCIAL', 
    sections: [
      { id: 's19-resultados', label: 'Resultados' },
      { id: 's20-clientes', label: 'Clientes' },
      { id: 's21-sectores', label: 'Sectores' },
    ] 
  },
  { 
    name: 'COMERCIAL', 
    sections: [
      { id: 's22-tco', label: 'TCO' },
      { id: 's23-propuesta-economica', label: 'Pricing' },
      { id: 's24-terminos-condiciones', label: 'Términos' },
      { id: 's25-comparacion', label: 'Comparación' },
    ] 
  },
  { 
    name: 'CIERRE', 
    sections: [
      { id: 's26-porque-eligen', label: 'Por Qué' },
      { id: 's27-implementacion', label: 'Timeline' },
      { id: 's28-cierre', label: 'CTA' },
    ] 
  },
];

interface TemplateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeVariant;
  onThemeChange: (theme: ThemeVariant) => void;
  showTokens: boolean;
  onToggleTokens: () => void;
}

export function TemplateSidebar({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  showTokens,
  onToggleTokens,
}: TemplateSidebarProps) {
  const [activeSection, setActiveSection] = useState('s01-hero');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['INICIO', 'PROPUESTA VALOR'])
  );
  
  useEffect(() => {
    // Intersection Observer para active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.5] }
    );
    
    SECTION_GROUPS.forEach((group) => {
      group.sections.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer.observe(element);
      });
    });
    
    // ESC para cerrar
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
          
          {/* Sidebar - SIN SCROLL EXTERNO */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-80 bg-slate-950/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header FIJO - SIN SCROLL */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/50">
              <div>
                <h2 className="text-sm font-black text-white">Preview Navigator</h2>
                <p className="text-[10px] text-white/50">Template: Commercial</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500 border-2 border-red-500/30 hover:border-red-500 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                title="Cerrar (ESC)"
              >
                <X className="w-6 h-6 text-red-400 hover:text-white font-bold" strokeWidth={3} />
              </button>
            </div>
            
            {/* Controls FIJOS - COMPACTO */}
            <div className="flex-shrink-0 p-2.5 space-y-2 border-b border-white/10 bg-slate-900/30">
              {/* Toggle tokens */}
              <button
                onClick={onToggleTokens}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[11px] font-bold',
                  showTokens 
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300' 
                    : 'bg-teal-500/20 border border-teal-400/40 text-teal-300'
                )}
              >
                <span>{showTokens ? '🔤 Tokens' : '📝 Datos'}</span>
                <div className={cn(
                  'w-9 h-5 rounded-full transition-all relative shadow-inner',
                  showTokens ? 'bg-amber-500' : 'bg-teal-500'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all',
                    showTokens ? 'left-0.5' : 'left-[18px]'
                  )} />
                </div>
              </button>
              
              {/* Theme selector */}
              <div>
                <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block px-1">
                  Theme Variant
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['executive', 'ops', 'trust'] as ThemeVariant[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        console.log('Theme clicked:', theme);
                        onThemeChange(theme);
                      }}
                      className={cn(
                        'px-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all',
                        currentTheme === theme
                          ? 'bg-gradient-to-br from-teal-500 to-teal-400 text-white shadow-lg scale-105'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 hover:scale-105'
                      )}
                    >
                      {theme === 'executive' && 'Exec'}
                      {theme === 'ops' && 'Ops'}
                      {theme === 'trust' && 'Trust'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Navigation - SOLO ESTA PARTE TIENE SCROLL INTERNO */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {SECTION_GROUPS.map((group) => {
                const isExpanded = expandedGroups.has(group.name);
                
                return (
                  <div key={group.name}>
                    {/* Group header - COMPACTO */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-wider">
                        {group.name} ({group.sections.length})
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-white/50" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-white/50" />
                      )}
                    </button>
                    
                    {/* Sections */}
                    {isExpanded && (
                      <div className="space-y-0.5 mt-0.5 ml-1">
                        {group.sections.map((section) => {
                          const isActive = activeSection === section.id;
                          
                          return (
                            <button
                              key={section.id}
                              onClick={() => scrollToSection(section.id)}
                              className={cn(
                                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left',
                                isActive
                                  ? 'bg-teal-500/20 border border-teal-400/30 text-white font-bold shadow-lg'
                                  : 'hover:bg-white/5 text-white/60 hover:text-white/90'
                              )}
                            >
                              {isActive ? (
                                <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                              ) : (
                                <Circle className="w-3 h-3 text-white/30 flex-shrink-0" />
                              )}
                              <span className="text-xs">{section.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Footer FIJO - SIN SCROLL */}
            <div className="flex-shrink-0 p-3 border-t border-white/10 space-y-2">
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold text-white/80"
              >
                <LinkIcon className="w-3 h-3" />
                Copiar link
              </button>
              
              <a
                href="/p/demo-polpaico-2026-02"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 transition-all text-xs font-bold text-white shadow-lg"
              >
                <Eye className="w-3 h-3" />
                Ver como cliente
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
