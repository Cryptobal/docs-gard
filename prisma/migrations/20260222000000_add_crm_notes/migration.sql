-- CreateTable
CREATE TABLE "crm"."notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_crm_notes_tenant" ON "crm"."notes"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_crm_notes_entity" ON "crm"."notes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_crm_notes_created_desc" ON "crm"."notes"("created_at" DESC);
