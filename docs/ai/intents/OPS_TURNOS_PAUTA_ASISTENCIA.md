# Intent: Turnos (ambiguo) -> Pauta mensual / Asistencia diaria / TE

## Intencion del usuario

Preguntas como:
- "Como funciona el sistema de turnos?"
- "Donde veo los turnos?"
- "Quiero revisar turnos de hoy"

## Regla de desambiguacion

- Si dice "turnos de hoy", "presentes/ausentes" -> `Asistencia diaria`.
- Si dice "planificacion", "malla", "rol de turnos", "pautas" -> `Pauta mensual`.
- Si dice "extra", "TE", "horas extra" -> `Turnos Extra`.

## URLs canónicas

- Pauta mensual: `/ops/pauta-mensual`
- Asistencia diaria: `/ops/pauta-diaria`
- Turnos extra: `/te/registro`

## Respuesta esperada (ambiguedad)

Cuando solo diga "turnos", responder opciones:
1. Planificacion del mes (pauta mensual)
2. Ejecucion diaria (asistencia)
3. Turnos extra (TE)
