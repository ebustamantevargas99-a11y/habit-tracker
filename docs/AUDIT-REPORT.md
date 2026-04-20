# Reporte de auditoría end-to-end — Ultimate TRACKER

**Fecha:** 2026-04-19
**URL probada:** https://habit-tracker-two-flame.vercel.app
**Metodología:** Playwright (Chromium headless) navegando como usuario real, usando el seed de test user con datos realistas.

---

## Credenciales del usuario de prueba

```
Email:    tester@ultimatetracker.app
Password: TestUT2026!
```

**Perfil del usuario de prueba:**
- Nombre: "Usuario de Prueba"
- 28 años, hombre, 175cm / 72kg
- Nivel: intermedio, actividad moderada
- Intereses activados: entrenamiento, nutrición, mindfulness, productividad, sueño, hidratación, finanzas
- Datos sembrados:
  - 3 hábitos (meditar con racha 12, entrenar con racha 3, leer con racha 5) + 42 logs en 14 días
  - 14 días de mood + sleep
  - 5 transacciones (1 sueldo, 4 gastos) + 1 presupuesto
  - 1 workout "Upper body" (ayer) con press de banca 3 sets
  - 1 proyecto "Ultimate TRACKER" con 3 tareas
  - 1 nota + 3 life areas (Salud 7, Carrera 6, Relaciones 8)

---

## Resumen ejecutivo

**13 tests ejecutados, 13 pasaron.** Navegación completa por todos los módulos.

| Categoría | Cantidad |
|---|---|
| ✅ Funciona correcto | 10 |
| 🟡 Bug encontrado en auditoría | 2 (ya arreglados en commit `4c5f649`) |
| 🔴 Crítico | 0 |

Cero bugs bloqueadores. La app es funcional end-to-end.

---

## Hallazgos detallados

### ✅ Lo que funciona perfecto

| Área | Observación |
|---|---|
| **Login** | Redirige correctamente a `/` tras credenciales válidas. Cookie se setea bien (fix middleware de commit `41c021d`) |
| **Home / Dashboard** | Saludo dinámico visible, botón "Cierre del día → IA" visible en banner |
| **Rebrand** | "Ultimate TRACKER" en sidebar, login, metadata. Playfair Display aplicado en headings |
| **Sidebar filtrado** | Módulos condicionales según `enabledModules` del perfil — funciona correctamente |
| **Workout Logger Pro** (Fitness → Nueva Sesión) | Modal selector de ejercicios abre, búsqueda por "bench" devuelve "Press de banca", los 62 ejercicios del seed están disponibles |
| **Volumen Pro Dashboard** | Renderiza con barras MEV/MAV/MRV correctamente |
| **Navegación SPA** | Finanzas, Nutrición, Productividad, Organización, Bienestar: todas accesibles vía sidebar |
| **Settings** | Los 6 tabs (Perfil, Módulos, Apariencia, Gamificación, Preferencias, Datos) presentes. Módulos tab con toggles. Apariencia con dark mode toggle |
| **AI Export Modal** | Genera prompt exitosamente con datos del usuario |
| **Logout** | Botón funciona, redirige a `/login`, invalida sesión |

### 🟡 Bugs detectados y corregidos en el reporte (commit `4c5f649`)

#### 1. CSP bloqueaba el audio del RestTimer
**Severidad:** Media (funcional, afecta UX)
**Síntoma:** Al terminar el descanso en el logger, el beep de audio no sonaba en producción.
**Causa:** El CSP `default-src 'self'` sin `media-src` explícito bloqueaba el `data:audio/wav` base64 del `AudioContext`.
**Fix:** Añadir `media-src 'self' data: blob:` al Content-Security-Policy en [next.config.js](../next.config.js).

#### 2. FloatingAIButton label oculto en desktop
**Severidad:** Baja (UX)
**Síntoma:** El botón flotante bottom-right solo mostraba el icono ✨ en desktop, sin texto.
**Causa:** `className="hidden sm:inline"` ocultaba el texto en `sm` breakpoint.
**Fix:** Remover el `hidden sm:inline` para mostrar siempre el label "Analizar con IA".

### ⚠️ Ruido (no bloqueador) en la console

**Errores `<path> attribute d: Expected moveto ... "Z"`** en páginas con gráficos.

**Causa:** Recharts genera `<path d="Z"/>` cuando recibe un dataset vacío (usuarios nuevos sin datos suficientes).
**Impacto:** Solo log en console, no afecta funcionamiento ni UX visible.
**Recomendación:** Añadir guards `data.length > 0 ? <Chart/> : <EmptyState/>` en los componentes que usan Recharts. No urgente.

---

## Pendientes detectados (no son bugs, son gaps del producto)

1. **Rutas directas dan 404** — `/fitness`, `/finance`, etc. no son páginas reales, toda la app vive en `/` con SPA routing. Problema si alguien comparte un link directo a una sección. **Fix sugerido:** crear rutas reales por módulo o un handler que redirija `/fitness → /?page=fitness`.

2. **Onboarding flow** — no probado porque el test user tiene `onboardingCompleted=true`. Para probarlo desde cero, hay que crear una cuenta nueva desde `/login → Registrarse`.

3. **Dark mode funcional** — el toggle existe y cambia CSS pero falta probar que NO haya elementos con colores hardcodeados que rompan el tema oscuro.

4. **Mobile responsive** — el test se ejecutó en desktop viewport (default Playwright Chromium). Mobile no probado.

5. **Features del módulo Fitness Pro pendientes:**
   - Botón "Terminar entreno" no probado con serie real (requiere interacción compleja)
   - Timer de descanso — probado el audio fix, queda probar UX completo
   - PR detection automático no probado (requiere 2+ entrenos del mismo ejercicio)

6. **Módulos que pueden necesitar más testing:**
   - Nutrición: crear alimento custom, log comida, calcular macros vs meta
   - Finanzas: crear transacción, presupuesto, ver análisis
   - Planner: daily/weekly/monthly planners
   - Wellness: log mood, sleep, hidratación, medicamentos

---

## Cómo reproducir la auditoría

```bash
# 1. Crear user de prueba (idempotente — resetea data previa)
cd app
npx tsx scripts/create-test-user.ts

# 2. Correr suite completa contra prod
E2E_BASE_URL="https://habit-tracker-two-flame.vercel.app" \
  CI=1 \
  npx playwright test e2e/full-app-audit.spec.ts \
  --project=chromium --reporter=list --workers=1

# 3. Ver screenshots
open test-results/

# 4. Ver reporte JSON
cat test-results/audit-report.json | jq .
```

---

## Archivos creados para esta auditoría

- [`scripts/create-test-user.ts`](../scripts/create-test-user.ts) — Seed del user de prueba con datos realistas
- [`e2e/full-app-audit.spec.ts`](../e2e/full-app-audit.spec.ts) — Suite Playwright de 13 tests
- [`test-results/audit-report.json`](../test-results/audit-report.json) — Reporte JSON generado por los tests
- [`test-results/*.png`](../test-results/) — Screenshots de cada página

---

## Recomendaciones de siguiente iteración

1. **CRÍTICO** — Probar flujo de onboarding desde cero (cuenta nueva). Es el primer contacto del usuario real.
2. **ALTO** — Crear rutas Next reales para `/fitness`, `/finance`, etc. para que los shares funcionen.
3. **MEDIO** — Suite Playwright ampliado: crear un hábito, hacer un entreno completo, registrar mood, etc. (CRUD end-to-end por módulo).
4. **MEDIO** — Probar en viewport mobile (Playwright soporta).
5. **BAJO** — Limpiar errores de consola con guards de Recharts.
