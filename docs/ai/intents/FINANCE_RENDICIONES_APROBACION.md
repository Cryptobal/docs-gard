# Intent: Rendiciones pendientes por aprobar

## Intencion del usuario

Preguntas como:
- "Que rendiciones faltan por aprobar?"
- "Cuales tengo pendientes de aprobacion?"
- "Muestrame las rendiciones pendientes"

## Respuesta esperada

1. Usar datos reales (tool), no inferencia.
2. Entregar lista concreta con:
   - codigo,
   - monto,
   - estado,
   - fecha.
3. Si no hay pendientes, decirlo claramente.
4. Agregar acceso operativo:
   - `/finanzas/aprobaciones`
   - `/finanzas/rendiciones`

## Regla funcional

- Si el usuario tiene visibilidad global, se puede responder "todas las pendientes".
- Si no, responder sobre "mis pendientes por aprobar".

## Formato recomendado

- Resumen:
  - "Tienes X rendiciones pendientes por aprobar."
- Listado:
  - `REN-2026-0007 | $120.000 | IN_APPROVAL | 2026-02-13`
- Accion:
  - `Ingresa aca: [Aprobaciones](https://<dominio>/finanzas/aprobaciones)`
