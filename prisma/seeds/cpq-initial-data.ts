/**
 * CPQ INITIAL SEED DATA
 * Catálogos base de Cargos, Roles y Puestos de Trabajo
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedCpqData() {
  console.log("🌱 Seeding CPQ data...");

  const cargos = [
    { name: "Guardia", description: "Personal operativo estándar" },
    { name: "Supervisor", description: "Supervisión de turnos y equipos" },
    { name: "Inspector", description: "Inspección y control de calidad" },
    { name: "Jefe de Turno", description: "Responsable de operación por turno" },
    { name: "Operador CCTV", description: "Monitoreo de cámaras y alarmas" },
  ];

  const roles = [
    { name: "4x4", description: "4 días trabajo / 4 descanso" },
    { name: "5x2", description: "5 días trabajo / 2 descanso" },
    { name: "2x5", description: "2 días trabajo / 5 descanso" },
    { name: "6x1", description: "6 días trabajo / 1 descanso" },
    { name: "7x7", description: "7 días trabajo / 7 descanso" },
    { name: "Turno Especial", description: "Coberturas especiales" },
  ];

  const puestos = [
    { name: "Portería" },
    { name: "Control de Acceso" },
    { name: "CCTV (Centro de Control)" },
    { name: "Ronda" },
    { name: "Supervisión" },
    { name: "Recepción" },
    { name: "Estacionamiento" },
    { name: "Otro" },
  ];

  for (const cargo of cargos) {
    await prisma.cpqCargo.upsert({
      where: { name: cargo.name },
      update: { description: cargo.description },
      create: cargo,
    });
  }

  for (const rol of roles) {
    await prisma.cpqRol.upsert({
      where: { name: rol.name },
      update: { description: rol.description },
      create: rol,
    });
  }

  for (const puesto of puestos) {
    await prisma.cpqPuestoTrabajo.upsert({
      where: { name: puesto.name },
      update: {},
      create: puesto,
    });
  }

  console.log("✅ CPQ data seeded successfully!");
}

export default seedCpqData;
