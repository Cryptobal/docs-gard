/**
 * Prisma Seed Script
 * 
 * Poblar la base de datos con datos iniciales
 * 
 * Ejecutar con: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Crear template "Commercial"
  const commercialTemplate = await prisma.template.upsert({
    where: { slug: 'commercial' },
    update: {},
    create: {
      name: 'Propuesta Comercial',
      slug: 'commercial',
      description: 'Template completo para presentaciones comerciales B2B con 28 secciones',
      type: 'presentation',
      category: 'sales',
      active: true,
      isDefault: true,
      thumbnailUrl: null,
    },
  });

  console.log('✅ Template "Commercial" created:', commercialTemplate.id);

  // 2. Crear admin user
  const hashedPassword = await bcrypt.hash('GardSecurity2026!', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'carlos.irigoyen@gard.cl' },
    update: {},
    create: {
      email: 'carlos.irigoyen@gard.cl',
      password: hashedPassword,
      name: 'Carlos Irigoyen',
      role: 'admin',
      active: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // 3. Crear settings por defecto
  const settings = [
    {
      key: 'site_name',
      value: 'Gard Docs',
      type: 'string',
      category: 'general',
    },
    {
      key: 'default_template_id',
      value: commercialTemplate.id,
      type: 'string',
      category: 'general',
    },
    {
      key: 'session_expiry_hours',
      value: '24',
      type: 'number',
      category: 'general',
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Settings created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
