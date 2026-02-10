# QA — Firma Digital de Documentos

Checklist de pruebas manuales para el flujo de firma electrónica. Ejecutar con el servidor en `http://localhost:3000`.

---

## Pre-requisitos

- [ ] Servidor corriendo: `npm run dev` (puerto 3000)
- [ ] Usuario admin/owner logueado en `/opai/login`
- [ ] Al menos un documento en estado draft o approved en `/opai/documentos`
- [ ] Migración de firma aplicada: `npx prisma migrate deploy` (o DB con tablas `doc_signature_requests` y `doc_signature_recipients`)

---

## 1. Enviar documento a firma (admin)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1.1 | Ir a **Documentos** → abrir un documento (draft o approved) | Se ve detalle del documento |
| 1.2 | Click en **"Enviar a firma"** | Se abre modal "Enviar documento a firma" |
| 1.3 | Dejar un solo firmante con nombre/email vacíos y click **"Enviar a firma"** | Mensaje de error: "Todos los destinatarios deben tener nombre y email" |
| 1.4 | Completar nombre y email, rol **Firmante**, orden 1. Click **"Enviar a firma"** | Modal cierra, panel "Firma digital" muestra 1 firmante pendiente |
| 1.5 | Revisar bandeja de entrada del email del firmante | Email "Firma requerida: [título]" con botón/link a `/sign/[token]` |
| 1.6 | Click en **"Enviar a firma"** de nuevo (sin cancelar) | Error o mensaje: ya existe solicitud activa |

**Criterio de aceptación:** Se crea la solicitud, se envía 1 email al firmante del primer orden y el panel muestra estado.

---

## 2. Página pública de firma (firmante)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 2.1 | Abrir en navegador (incógnito o otro navegador) el link del email: `http://localhost:3000/sign/[token]` | Página "Firma electrónica de documento" con título del documento y contenido |
| 2.2 | Revisar que el documento se ve (solo lectura) | Contenido del documento renderizado, sin edición |
| 2.3 | Completar **Nombre completo** y opcional **RUT** | Campos aceptan texto |
| 2.4 | Elegir **Escribir nombre** → elegir estilo → escribir nombre | Vista previa de firma manuscrita |
| 2.5 | Sin marcar el checkbox de aceptación, click **"Firmar documento"** | Botón deshabilitado o validación: debe aceptar firma electrónica |
| 2.6 | Marcar "Acepto firmar este documento electrónicamente (Ley 19.799)" | Checkbox marcado |
| 2.7 | Click **"Firmar documento"** | Mensaje de éxito: "Firma registrada correctamente" |
| 2.8 | Volver a abrir el mismo link `/sign/[token]` | Mismo mensaje de éxito o indicación de que ya firmó (no permite firmar dos veces) |

**Criterio de aceptación:** El firmante puede firmar una sola vez y ve confirmación.

---

## 3. Firma dibujada y subida de imagen

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 3.1 | Con otra solicitud de firma nueva, en `/sign/[token]` elegir **Dibujar firma** | Aparece canvas; se puede dibujar con mouse o dedo |
| 3.2 | Dibujar en el canvas y click **"Firmar documento"** (nombre + checkbox) | Firma se guarda como imagen (method drawn) |
| 3.3 | Con otra solicitud, elegir **Subir imagen** → elegir PNG/JPG < 5MB | Sube y muestra vista previa; al firmar se guarda URL/data |
| 3.4 | Subir archivo > 5MB o no imagen | Error: tamaño o tipo no permitido |

**Criterio de aceptación:** Los tres métodos (escribir, dibujar, subir) funcionan y se persisten.

---

## 4. Múltiples firmantes y orden

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 4.1 | Crear solicitud con 2 firmantes: A (orden 1) y B (orden 2). Enviar | Emails solo a A (primer orden) |
| 4.2 | Abrir link del firmante B (sin que A haya firmado) | Mensaje: "Aún no puedes firmar. Hay firmantes previos pendientes." o similar |
| 4.3 | Firmar con firmante A (link de A) | Éxito; se envía email a B para firmar |
| 4.4 | Abrir link del firmante B | Ya puede firmar; completa y firma |
| 4.5 | Revisar panel en detalle de documento (admin) | Estado "Completado", ambos firmantes con estado "Firmado" |

**Criterio de aceptación:** El orden de firma se respeta; el segundo solo puede firmar después del primero.

---

## 5. Rechazar firma

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 5.1 | Con una solicitud pendiente, en `/sign/[token]` click **"Rechazar firma"** | Aparece prompt para motivo |
| 5.2 | Escribir motivo (mín. 3 caracteres) y confirmar | Mensaje de rechazo; solicitud pasa a cancelada |
| 5.3 | En detalle de documento (admin), panel de firma | Estado cancelado; otros firmantes en "expirado" si los hay |

**Criterio de aceptación:** Rechazar actualiza estado y no permite seguir firmando esa solicitud.

---

## 6. Panel admin: reenviar y cancelar

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 6.1 | En detalle de documento con solicitud activa, click **"Reenviar"** en un firmante pendiente | Se envía nuevo email (o se registra reenvío); `sentAt` actualizado |
| 6.2 | Click **"Cancelar solicitud"** → confirmar | Solicitud y documento pasan a estado cancelado; firmantes pendientes a expirado |
| 6.3 | Ver historial del documento | Aparecen acciones `signature_request_created`, `signature_request_cancelled`, `signed`, etc. |

**Criterio de aceptación:** Reenviar y cancelar funcionan y se reflejan en estado e historial.

---

## 7. PDF firmado

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 7.1 | Con un documento **completado** (todos firmaron), estando logueado como admin ir a detalle del documento | Panel de firma muestra "Completado" |
| 7.2 | Abrir en nueva pestaña: `GET /api/docs/documents/[id]/signed-pdf` (reemplazar [id] por ID del documento) | Descarga o visualización de PDF con contenido + bloque de firmas (nombre, email, RUT, imagen o texto de firma, fecha) |
| 7.3 | Documento sin firma completada: abrir misma URL signed-pdf | 400 "Documento sin firma completada" |

**Criterio de aceptación:** El PDF firmado se genera solo cuando la firma está completada e incluye datos de firmantes.

---

## 8. Cron de expiración y recordatorios

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 8.1 | Crear solicitud con `expiresAt` en el pasado (vía DB o API). Llamar `GET /api/cron/signature-reminders` con header `Authorization: Bearer [CRON_SECRET]` | Solicitud pasa a expired; firmantes pendientes a expired; documento signatureStatus = expired |
| 8.2 | (Opcional) Solicitud activa con firmante que no ha recibido email en 24h: ejecutar cron | Se envía email de recordatorio (SignatureReminderEmail) |

**Criterio de aceptación:** El cron expira solicitudes vencidas y puede enviar recordatorios.

---

## 9. Emails recibidos

| # | Verificación |
|---|--------------|
| 9.1 | **Solicitud:** Asunto "Firma requerida: [título]", cuerpo con link a `/sign/[token]`, botón CTA |
| 9.2 | **Firma registrada (notificación):** Recibida por admin/CC cuando alguien firma; indica quién firmó y fecha |
| 9.3 | **Documento completado:** Recibida por todos (firmantes + CC) cuando todos firmaron; puede incluir link al documento |
| 9.4 | **Recordatorio:** Asunto "Recordatorio de firma", link a `/sign/[token]` |

---

## Resumen de URLs útiles

- App: `http://localhost:3000`
- Login: `http://localhost:3000/opai/login`
- Documentos: `http://localhost:3000/opai/documentos`
- Detalle documento: `http://localhost:3000/opai/documentos/[id]`
- Firma pública: `http://localhost:3000/sign/[token]` (token del email)
- Cron recordatorios: `GET http://localhost:3000/api/cron/signature-reminders` con `Authorization: Bearer [CRON_SECRET]`

---

*Documento de QA para Firma Digital — OPAI Suite.*
