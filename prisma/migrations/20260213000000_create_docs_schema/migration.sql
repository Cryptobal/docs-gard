-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "docs";

-- CreateTable: doc_templates
CREATE TABLE "docs"."doc_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "module" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tokensUsed" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "doc_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: doc_template_versions
CREATE TABLE "docs"."doc_template_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "change_note" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: documents
CREATE TABLE "docs"."documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "template_id" UUID,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "token_values" JSONB,
    "module" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effective_date" DATE,
    "expiration_date" DATE,
    "renewal_date" DATE,
    "alert_days_before" INTEGER NOT NULL DEFAULT 30,
    "signature_status" TEXT,
    "signed_at" TIMESTAMPTZ(6),
    "signed_by" TEXT,
    "signature_data" JSONB,
    "pdf_url" TEXT,
    "pdf_generated_at" TIMESTAMPTZ(6),
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: doc_associations
CREATE TABLE "docs"."doc_associations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "document_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: doc_history
CREATE TABLE "docs"."doc_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "document_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: doc_templates
CREATE INDEX "idx_doc_templates_tenant" ON "docs"."doc_templates"("tenant_id");
CREATE INDEX "idx_doc_templates_module" ON "docs"."doc_templates"("module");
CREATE INDEX "idx_doc_templates_active" ON "docs"."doc_templates"("is_active");
CREATE UNIQUE INDEX "uq_doc_template_tenant_module_name" ON "docs"."doc_templates"("tenant_id", "module", "name");

-- CreateIndex: doc_template_versions
CREATE INDEX "idx_doc_template_versions_template" ON "docs"."doc_template_versions"("template_id");
CREATE UNIQUE INDEX "uq_doc_template_version" ON "docs"."doc_template_versions"("template_id", "version");

-- CreateIndex: documents
CREATE UNIQUE INDEX "documents_uniqueId_key" ON "docs"."documents"("uniqueId");
CREATE INDEX "idx_documents_tenant" ON "docs"."documents"("tenant_id");
CREATE INDEX "idx_documents_tenant_module" ON "docs"."documents"("tenant_id", "module");
CREATE INDEX "idx_documents_tenant_status" ON "docs"."documents"("tenant_id", "status");
CREATE INDEX "idx_documents_expiration" ON "docs"."documents"("expiration_date");
CREATE INDEX "idx_documents_unique_id" ON "docs"."documents"("uniqueId");

-- CreateIndex: doc_associations
CREATE UNIQUE INDEX "uq_doc_association" ON "docs"."doc_associations"("document_id", "entity_type", "entity_id");
CREATE INDEX "idx_doc_associations_entity" ON "docs"."doc_associations"("entity_type", "entity_id");
CREATE INDEX "idx_doc_associations_document" ON "docs"."doc_associations"("document_id");

-- CreateIndex: doc_history
CREATE INDEX "idx_doc_history_document" ON "docs"."doc_history"("document_id");
CREATE INDEX "idx_doc_history_created_desc" ON "docs"."doc_history"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "docs"."doc_template_versions" ADD CONSTRAINT "doc_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "docs"."doc_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs"."documents" ADD CONSTRAINT "documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "docs"."doc_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs"."doc_associations" ADD CONSTRAINT "doc_associations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "docs"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs"."doc_history" ADD CONSTRAINT "doc_history_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "docs"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
