-- CreateTable
CREATE TABLE "crm"."crm_whatsapp_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "crm_whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_crm_wa_template_tenant_slug" ON "crm"."crm_whatsapp_templates"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "idx_crm_wa_templates_tenant" ON "crm"."crm_whatsapp_templates"("tenant_id");
