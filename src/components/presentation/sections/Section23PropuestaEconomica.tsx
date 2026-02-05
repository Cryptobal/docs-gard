'use client';

/**
 * Section23PropuestaEconomica - Pricing con soporte para tokens literales
 */

import { Section23_PropuestaEconomica } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { formatCurrency, formatUF } from '@/lib/utils';
import { FileText, Calendar, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Section23PropuestaEconomicaProps {
  data: Section23_PropuestaEconomica;
  showTokens?: boolean;
}

export function Section23PropuestaEconomica({ data, showTokens = false }: Section23PropuestaEconomicaProps) {
  const theme = useThemeClasses();
  const { pricing } = data;
  
  const formatPrice = (value: number) => {
    // Si showTokens está activo Y el valor es 999999, mostrar token
    if (showTokens && value === 999999) {
      return '[PRECIO]';
    }
    return pricing.currency === 'UF' ? formatUF(value) : formatCurrency(value);
  };
  
  return (
    <SectionWrapper id="s23-propuesta-economica" className="animated-gradient">
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card border border-teal-400/30 glow-teal mb-8"
          >
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Propuesta Económica
            </span>
          </motion.div>
          
          <h2 className={cn(
            'text-4xl md:text-6xl lg:text-7xl font-black mb-6',
            'text-white leading-tight'
          )}>
            Inversión{' '}
            <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              mensual
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto">
            Tarifa todo incluido con transparencia total
          </p>
        </div>
        
        {/* Pricing table (desktop) */}
        <div className="hidden md:block mb-12 max-w-5xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-left font-bold text-white text-lg">
                    Descripción
                  </th>
                  <th className="px-6 py-5 text-center font-bold text-white text-lg">
                    Cant.
                  </th>
                  <th className="px-6 py-5 text-right font-bold text-white text-lg">
                    P. Unitario
                  </th>
                  <th className="px-8 py-5 text-right font-bold text-white text-lg">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricing.items.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="font-semibold text-white">
                        {showTokens && item.description.includes('Guardias') 
                          ? '[ITEM_DESCRIPTION_1]' 
                          : showTokens && item.description.includes('Supervisor')
                          ? '[ITEM_DESCRIPTION_2]'
                          : showTokens
                          ? '[ITEM_DESCRIPTION_N]'
                          : item.description}
                      </div>
                      {item.notes && !showTokens && (
                        <div className="text-sm mt-1 text-white/50">{item.notes}</div>
                      )}
                      {showTokens && (
                        <div className="text-sm mt-1 text-amber-400/70">[ITEM_NOTES]</div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center text-white/80 font-medium">
                      {showTokens ? '[CANT]' : item.quantity}
                    </td>
                    <td className="px-6 py-5 text-right text-white/60">
                      {showTokens ? '[P_UNIT]' : formatPrice(item.unit_price)}
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-white">
                      {showTokens ? '[SUBTOTAL]' : formatPrice(item.subtotal)}
                    </td>
                  </motion.tr>
                ))}
                
                {/* Subtotal */}
                <tr className="border-t-2 border-white/20">
                  <td colSpan={3} className="px-8 py-4 text-right font-bold text-white/80">
                    Subtotal
                  </td>
                  <td className="px-8 py-4 text-right text-xl font-bold text-white">
                    {showTokens ? '[QUOTE_SUBTOTAL]' : formatPrice(pricing.subtotal)}
                  </td>
                </tr>
                
                {/* IVA */}
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-right font-bold text-white/80">
                    IVA (19%)
                  </td>
                  <td className="px-8 py-4 text-right text-xl font-bold text-white">
                    {showTokens ? '[QUOTE_TAX]' : formatPrice(pricing.tax)}
                  </td>
                </tr>
                
                {/* Total */}
                <tr className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 border-t-2 border-teal-400/50">
                  <td colSpan={3} className="px-8 py-6 text-right text-2xl font-black text-white">
                    TOTAL MENSUAL
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-4xl font-black bg-gradient-to-br from-teal-400 to-blue-400 bg-clip-text text-transparent">
                      {showTokens ? '[QUOTE_TOTAL]' : formatPrice(pricing.total)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Cards mobile - CON TOKENS */}
        <div className="md:hidden space-y-4 mb-12">
          {pricing.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-5 border border-white/10"
            >
              <div className="font-bold text-white mb-3">
                {showTokens ? `[ITEM_${index + 1}_DESC]` : item.description}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/50">Cantidad:</span>
                  <span className="ml-2 font-semibold text-white">
                    {showTokens ? '[CANT]' : item.quantity}
                  </span>
                </div>
                <div>
                  <span className="text-white/50">P. Unit:</span>
                  <span className="ml-2 font-semibold text-white">
                    {showTokens ? '[P_UNIT]' : formatPrice(item.unit_price)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-right text-xl font-bold text-teal-400">
                {showTokens ? '[SUBTOTAL]' : formatPrice(item.subtotal)}
              </div>
            </motion.div>
          ))}
          
          {/* Total mobile */}
          <div className="glass-card rounded-xl p-6 border-2 border-teal-400/50 glow-teal">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-white">TOTAL</span>
              <span className="text-3xl font-black bg-gradient-to-br from-teal-400 to-blue-400 bg-clip-text text-transparent">
                {showTokens ? '[TOTAL]' : formatPrice(pricing.total)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Info adicional */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {pricing.payment_terms && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-xl p-6 border border-white/10 hover:border-teal-400/30 transition-all group"
            >
              <FileText className="w-10 h-10 mb-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white mb-2">Forma de Pago</h4>
              <p className="text-sm text-white/70">
                {showTokens ? '[PAYMENT_TERMS]' : pricing.payment_terms}
              </p>
            </motion.div>
          )}
          
          {pricing.billing_frequency && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-6 border border-white/10 hover:border-teal-400/30 transition-all group"
            >
              <Calendar className="w-10 h-10 mb-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white mb-2">Frecuencia</h4>
              <p className="text-sm text-white/70">
                {showTokens ? '[BILLING_FREQ]' : `Facturación ${pricing.billing_frequency === 'monthly' ? 'mensual' : pricing.billing_frequency === 'quarterly' ? 'trimestral' : 'anual'}`}
              </p>
            </motion.div>
          )}
          
          {pricing.adjustment_terms && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-6 border border-white/10 hover:border-teal-400/30 transition-all group"
            >
              <TrendingUp className="w-10 h-10 mb-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white mb-2">Reajuste</h4>
              <p className="text-sm text-white/70">
                {showTokens ? '[ADJUSTMENT]' : pricing.adjustment_terms}
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Notas */}
        {pricing.notes && pricing.notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mb-12"
          >
            <div className="glass-card rounded-xl p-8 border border-white/10">
              <div className="space-y-3">
                {pricing.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-teal-400" />
                    <span className="text-base text-white/80">
                      {showTokens ? `[NOTE_${index + 1}]` : note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-white/60 mb-6">¿Preguntas sobre la propuesta?</p>
          <a
            href="mailto:comercial@gard.cl"
            className="btn-premium inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 shadow-xl shadow-teal-500/30 border-2 border-teal-400/30 transition-all duration-300 hover:scale-105"
          >
            <FileText className="w-5 h-5" />
            Solicitar reunión comercial
          </a>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
