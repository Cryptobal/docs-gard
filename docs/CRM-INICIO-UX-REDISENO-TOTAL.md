# CRM Inicio — Auditoría UX profunda y rediseño total

Fecha: 2026-02-10  
Ámbito: pantalla `/(app)/crm/page.tsx` (home CRM)

## 1) Diagnóstico de la experiencia actual (antes del rediseño)

### Hallazgos principales

1. **Sin priorización operativa**
   - La vista inicial mostraba módulos y conteos, pero no distinguía urgencias.
   - No existía jerarquía de riesgo (qué hacer primero hoy).

2. **Déficit de contexto ejecutivo**
   - Faltaban KPIs de negocio para lectura rápida: pipeline en valor, forecast ponderado, tasa de cierre, conversión de cotizaciones.
   - Sin indicadores temporales (últimos 7/30 días) para medir evolución.

3. **Baja accionabilidad**
   - Había navegación a módulos, pero no un “centro de ejecución” con CTA directos según estado.
   - Los usuarios debían entrar módulo por módulo para entender prioridades.

4. **Sin orquestación de carga operativa**
   - No había colas visibles de trabajo (leads pendientes, tareas vencidas, seguimientos).
   - Ausencia de una vista unificada de actividad reciente.

5. **Inicio CRM poco orientado a objetivos**
   - La home funcionaba como launcher, no como tablero de gestión comercial.
   - No impulsaba hábitos de operación diaria ni toma de decisiones.

---

## 2) Objetivos UX del rediseño

1. Convertir la home en **cockpit comercial** (no solo navegación).
2. Reducir tiempo de diagnóstico: saber en <30s qué está bien y qué está en riesgo.
3. Facilitar ejecución inmediata con **accesos directos de creación e ingreso**.
4. Integrar señales estratégicas + operativas en una misma pantalla.
5. Mantener consistencia visual con el design system existente (OPAI + shadcn).

---

## 3) Nueva arquitectura de la pantalla

## A. Centro de Alertas CRM
- Alertas priorizadas por severidad (`critical`, `warning`, `info`, `success`).
- Cada alerta incluye:
  - título claro,
  - descripción del impacto,
  - contador,
  - CTA directo a resolución.

Tipos cubiertos:
- tareas vencidas,
- seguimientos vencidos,
- leads sin calificar,
- negocios sin fecha de cierre,
- negocios estancados,
- notificaciones sin leer.

## B. Pulso operativo
- Tarjeta resumida de estado diario:
  - alertas críticas,
  - tareas que vencen hoy,
  - seguimientos de hoy,
  - notificaciones pendientes.

## C. KPIs ejecutivos
- Leads nuevos (7d)
- Aprobación de leads (30d)
- Negocios abiertos
- Pipeline abierto (valor)
- Forecast ponderado
- Tasa de cierre (30d)
- Conversión de cotizaciones (30d)
- Backlog operativo

## D. Accesos directos de creación e ingreso

### Creación rápida
- Crear lead
- Crear cuenta
- Crear negocio
- Crear cotización (CPQ)

### Ingreso por módulo
- Leads, Cuentas, Negocios, Cotizaciones, Contactos, Instalaciones
- Cada acceso con contexto numérico para orientar prioridad.

## E. Embudo comercial (pipeline activo)
- Vista por etapa con:
  - número de negocios,
  - monto por etapa,
  - promedio por negocio,
  - barra de peso relativo.

## F. Colas operativas y actividad
- Leads por atender (ordenados por antigüedad)
- Tareas y seguimientos (horizonte 3 días + vencidos)
- Actividad reciente (notificaciones CRM)
- Próximos cierres (30 días)

---

## 4) Beneficios esperados

1. **Menor fricción operacional**: menos clicks para identificar y ejecutar pendientes.
2. **Mejor control comercial**: lectura simultánea de valor, probabilidad y conversión.
3. **Mayor velocidad de respuesta**: alertas con CTA inmediato.
4. **Mejor disciplina comercial**: visibilidad constante de tareas y seguimientos.
5. **Onboarding más claro**: la home ahora guía qué crear y dónde ingresar.

---

## 5) Evolución recomendada (siguiente iteración)

1. Filtros por responsable/comercial.
2. KPIs comparativos vs período anterior.
3. Objetivos mensuales y cumplimiento (% meta).
4. Alertas inteligentes por riesgo de pérdida (score por estancamiento + probabilidad).
5. Microinteracciones de productividad (marcar tarea/seguimiento desde la home).

---

## 6) Implementación técnica realizada

Archivo actualizado:
- `src/app/(app)/crm/page.tsx`

Se implementó:
- obtención de datos multi-fuente con Prisma,
- cálculo de métricas operativas y estratégicas,
- layout modular con `PageHeader`, `KpiCard`, `Card`, `Badge`, `Button`,
- estructura completa de alertas, KPIs, accesos, embudo, colas y actividad.

