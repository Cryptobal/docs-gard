/**
 * Zod validation schemas for the Document Management System
 */

import { z } from "zod";

// ── Template schemas ─────────────────────────────────────────

const docModuleEnum = z.enum(["crm", "payroll", "legal", "mail", "whatsapp"]);

export const createDocTemplateSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  description: z.string().max(500).optional(),
  content: z.any(), // Tiptap JSON
  module: docModuleEnum,
  category: z.string().min(1, "Categoría requerida"),
  tokensUsed: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  usageSlug: z.string().max(80).optional().nullable(),
});

export const updateDocTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  content: z.any().optional(),
  module: docModuleEnum.optional(),
  category: z.string().min(1).optional(),
  tokensUsed: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  usageSlug: z.string().max(80).optional().nullable(),
  changeNote: z.string().max(200).optional(),
});

// ── Document schemas ─────────────────────────────────────────

export const createDocumentSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().min(1, "Título requerido").max(300),
  content: z.any(), // Tiptap JSON (resolved or with tokens)
  tokenValues: z.record(z.string(), z.string()).optional(),
  module: docModuleEnum,
  category: z.string().min(1, "Categoría requerida"),
  effectiveDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  alertDaysBefore: z.number().int().min(1).max(365).optional(),
  associations: z
    .array(
      z.object({
        entityType: z.string().min(1),
        entityId: z.string().uuid(),
        role: z.enum(["primary", "related", "copy"]).optional(),
      })
    )
    .optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.any().optional(),
  tokenValues: z.record(z.string(), z.string()).optional(),
  status: z
    .enum(["draft", "review", "approved", "active", "expiring", "expired", "renewed"])
    .optional(),
  effectiveDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  alertDaysBefore: z.number().int().min(1).max(365).optional(),
  associations: z
    .array(
      z.object({
        entityType: z.string().min(1),
        entityId: z.string().uuid(),
        role: z.enum(["primary", "related", "copy"]).optional(),
      })
    )
    .optional(),
});

// ── Token resolve schema ─────────────────────────────────────

export const resolveTokensSchema = z.object({
  content: z.any(), // Tiptap JSON with tokens
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  installationId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
});

// ── Digital signature schemas ─────────────────────────────────

export const signatureRequestStatusSchema = z.enum([
  "draft",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
]);

export const signatureRecipientStatusSchema = z.enum([
  "pending",
  "sent",
  "viewed",
  "signed",
  "declined",
  "expired",
]);

export const signatureRecipientRoleSchema = z.enum(["signer", "cc"]);
export const signatureMethodSchema = z.enum(["typed", "drawn", "uploaded"]);

const signatureRecipientInputSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(160),
  email: z.string().email("Email inválido").max(255),
  rut: z.string().max(20).optional().nullable(),
  role: signatureRecipientRoleSchema.default("signer"),
  signingOrder: z.number().int().min(1).default(1),
});

export const createSignatureRequestSchema = z.object({
  message: z.string().max(1500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  recipients: z.array(signatureRecipientInputSchema).min(1, "Debe incluir al menos un firmante"),
});

export const cancelSignatureRequestSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export const signDocumentSchema = z.object({
  token: z.string().min(10),
  signerName: z.string().min(2).max(160),
  signerRut: z.string().max(20).optional().nullable(),
  method: signatureMethodSchema,
  typedName: z.string().max(160).optional().nullable(),
  fontFamily: z.string().max(80).optional().nullable(),
  signatureImageUrl: z.string().url().optional().nullable(),
  acceptedElectronicSignature: z.literal(true),
});

export const declineSignatureSchema = z.object({
  token: z.string().min(10),
  reason: z.string().min(3).max(500),
});
