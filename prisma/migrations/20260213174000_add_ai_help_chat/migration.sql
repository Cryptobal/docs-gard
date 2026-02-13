CREATE TABLE "public"."AiChatConversation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."AiChatMessage" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ai_chat_conv_tenant_user"
  ON "public"."AiChatConversation"("tenantId", "userId");

CREATE INDEX "idx_ai_chat_conv_updated_at"
  ON "public"."AiChatConversation"("updatedAt");

CREATE INDEX "idx_ai_chat_msg_conv_created"
  ON "public"."AiChatMessage"("conversation_id", "created_at");

CREATE INDEX "idx_ai_chat_msg_tenant"
  ON "public"."AiChatMessage"("tenant_id");

ALTER TABLE "public"."AiChatConversation"
  ADD CONSTRAINT "AiChatConversation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."AiChatConversation"
  ADD CONSTRAINT "AiChatConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."Admin"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."AiChatMessage"
  ADD CONSTRAINT "AiChatMessage_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "public"."AiChatConversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."AiChatMessage"
  ADD CONSTRAINT "AiChatMessage_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
