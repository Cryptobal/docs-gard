# Asistente IA - Base Gold Standard (Inicial)

Este directorio define la estructura operativa para escalar el asistente a nivel "top":

- `intents/`: playbooks por flujo (preguntas de usuario -> respuesta esperada -> pasos).
- `exceptions/`: manejo de casos borde y respuestas de contingencia.
- `test-sets/`: preguntas canónicas para validar calidad de respuestas.

## Objetivo de calidad

1. Responder la mayoria de preguntas funcionales con pasos accionables.
2. Incluir enlaces claros para navegar a cada flujo.
3. Usar datos reales cuando la pregunta requiera verificacion (nunca inventar).
4. Mantener formato consistente:
   - Para que sirve
   - Donde esta
   - Como se usa
   - Que impacta

## Cadencia recomendada

- Semanal: revisar preguntas no resueltas/fallback.
- Convertir cada gap en:
  - nuevo alias/intencion,
  - ajuste de tool de datos (si aplica),
  - documento en `intents/`,
  - caso de prueba en `test-sets/`.
