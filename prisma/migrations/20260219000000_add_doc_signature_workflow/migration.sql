-- CreateTable: doc_signature_requests
CREATE TABLE "docs"."doc_signature_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "document_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "message" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "doc_signature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: doc_signature_recipients
CREATE TABLE "docs"."doc_signature_recipients" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "request_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rut" TEXT,
    "role" TEXT NOT NULL DEFAULT 'signer',
    "signing_order" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMPTZ(6),
    "signature_method" TEXT,
    "signature_image_url" TEXT,
    "signature_typed_name" TEXT,
    "signature_font_family" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "decline_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_signature_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: doc_signature_requests
CREATE INDEX "idx_doc_signature_requests_tenant" ON "docs"."doc_signature_requests"("tenant_id");
CREATE INDEX "idx_doc_signature_requests_document" ON "docs"."doc_signature_requests"("document_id");
CREATE INDEX "idx_doc_signature_requests_status" ON "docs"."doc_signature_requests"("status");
CREATE INDEX "idx_doc_signature_requests_expires_at" ON "docs"."doc_signature_requests"("expires_at");
CREATE INDEX "idx_doc_signature_requests_created_desc" ON "docs"."doc_signature_requests"("created_at" DESC);

-- CreateIndex: doc_signature_recipients
CREATE UNIQUE INDEX "doc_signature_recipients_token_key" ON "docs"."doc_signature_recipients"("token");
CREATE INDEX "idx_doc_signature_recipients_request" ON "docs"."doc_signature_recipients"("request_id");
CREATE INDEX "idx_doc_signature_recipients_email" ON "docs"."doc_signature_recipients"("email");
CREATE INDEX "idx_doc_signature_recipients_status" ON "docs"."doc_signature_recipients"("status");
CREATE INDEX "idx_doc_signature_recipients_order" ON "docs"."doc_signature_recipients"("signing_order");
CREATE INDEX "idx_doc_signature_recipients_token" ON "docs"."doc_signature_recipients"("token");

-- AddForeignKey
ALTER TABLE "docs"."doc_signature_requests" ADD CONSTRAINT "doc_signature_requests_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "docs"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docs"."doc_signature_recipients" ADD CONSTRAINT "doc_signature_recipients_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "docs"."doc_signature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
