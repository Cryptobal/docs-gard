-- Add optional color assignment for CPQ catalogs (puestos/cargos/roles)
ALTER TABLE "cpq"."puestos_trabajo" ADD COLUMN "color_hex" TEXT;
ALTER TABLE "cpq"."cargos" ADD COLUMN "color_hex" TEXT;
ALTER TABLE "cpq"."roles" ADD COLUMN "color_hex" TEXT;
