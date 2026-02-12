'use client';

/**
 * PdfModeContext - Contexto para modo PDF
 * Permite que SectionWrapper y otros componentes detecten si están en modo PDF
 */

import { createContext, useContext } from 'react';

const PdfModeContext = createContext(false);

export const PdfModeProvider = PdfModeContext.Provider;
export const usePdfMode = () => useContext(PdfModeContext);
