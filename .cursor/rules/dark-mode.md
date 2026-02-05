# Regla: Dark Mode Obligatorio

## Contexto
Gard Docs usa un diseño premium en dark mode consistente en toda la aplicación.

## Regla
TODAS las páginas, componentes y secciones de la aplicación deben usar dark mode.

## Paleta de Colores

### Backgrounds
- `bg-slate-950` - Fondo principal
- `bg-slate-900` - Cards y secciones
- `bg-slate-800` - Elementos elevados (inputs, selects)

### Borders
- `border-slate-800` - Borders principales
- `border-slate-700` - Borders de elementos interactivos

### Text
- `text-white` - Títulos y texto principal
- `text-slate-300` - Labels y texto secundario
- `text-slate-400` - Descripciones
- `text-slate-500` - Placeholders y texto terciario

### Accents
- `bg-teal-600 hover:bg-teal-500` - Botones primarios
- `text-teal-400` - Enlaces y accents

### Status Colors
- `bg-emerald-600` - Success/Active
- `bg-red-600` - Error/Disabled
- `bg-amber-600` - Warning/Pending

## Ejemplos

### Página
```tsx
<div className="min-h-screen bg-slate-950">
  {/* contenido */}
</div>
```

### Card
```tsx
<div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800">
  {/* contenido */}
</div>
```

### Input
```tsx
<Input className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
```

### Button Primary
```tsx
<Button className="bg-teal-600 hover:bg-teal-500 text-white" />
```

## NO Permitido
❌ `bg-white`, `bg-gray-50`, `text-gray-900` en páginas principales
❌ Light mode en ninguna sección interna
❌ Fondos claros excepto en componentes específicos (dialogs, popovers pueden usar light si es necesario para contraste)

## Excepción
Las presentaciones públicas (/p/*) pueden usar light mode según el diseño del template.
