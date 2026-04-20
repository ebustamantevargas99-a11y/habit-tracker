# Ultimate Habit Tracker — Documento Madre del Proyecto

> La biblia de nuestro proyecto. Cada decisión, principio, especificación y estándar que define quiénes somos y hacia dónde vamos. Este documento es la fuente única de verdad.

---

## 1. Visión y Misión

**Visión:** Ser la aplicación #1 del mundo en la categoría de habit trackers. No una app más — la app definitiva que reemplaza a todas las demás porque lo tiene todo en un solo lugar: hábitos, fitness, finanzas, nutrición, bienestar, productividad y planificación de vida.

**Misión:** Dar a cada persona las herramientas visuales e interactivas para ver, medir y sentir su progreso real. Que cada vez que abran la app, sientan que están avanzando. Que los datos cuenten la historia de su transformación.

**Nombre del producto:** Ultimate Habit Tracker (nombre de trabajo — se definirá nombre comercial final antes del lanzamiento).

**Propuesta de valor única:** "Tu vida, medida. Tu progreso, visible. Tu futuro, proyectado." La combinación de dashboards estilo Power BI con una experiencia cálida y motivacional que ningún competidor ofrece. No somos una hoja de cálculo bonita ni una app minimalista — somos un sistema completo de vida con inteligencia analítica.

**Público objetivo primario:** Personas de 20-45 años que buscan mejorar su vida de forma integral, que valoran los datos y la visualización, y que están dispuestas a pagar por una herramienta premium que realmente funcione. Incluye: entusiastas del fitness, profesionales que buscan productividad, personas en procesos de cambio personal, y seguidores de metodologías como Atomic Habits.

**Público objetivo secundario:** Coaches de vida, entrenadores personales y nutricionistas que quieren dar a sus clientes una herramienta de seguimiento profesional.

---

## 2. Principios Fundamentales de Diseño

Estos principios son inamovibles y guían cada decisión de diseño y desarrollo:

**2.1. El progreso debe ser visible y tangible.** Cada dato que el usuario registra debe reflejarse visualmente en dashboards, gráficos, barras de progreso o indicadores. Nunca debe sentir que está llenando datos al vacío. Cada check, cada número, cada registro alimenta algo visual que le motiva.

**2.2. Facilidad primero, completitud después.** La interfaz debe ser fácil de usar a primera vista. Si algo requiere explicación, está mal diseñado. Un usuario nuevo debe poder empezar a trackear en menos de 60 segundos. La complejidad existe para el power user, pero se revela progresivamente (progressive disclosure).

**2.3. Los datos cuentan historias.** No solo mostramos números — contamos historias. "Eres un 3.2% mejor que la semana pasada", "Este mes subiste 5kg en press banca", "Tu mejor streak es de 31 días en lectura". Los datos se convierten en narrativa motivacional.

**2.4. El efecto compuesto como filosofía central.** Basado en Atomic Habits de James Clear: mejorar 1% diario = 3,778% mejor en un año. Cada mejora pequeña se visualiza como parte de una curva exponencial. El usuario debe entender que la constancia es exponencial, no lineal.

**2.5. Warm, no cold.** La estética no es fría ni corporativa. Es cálida, acogedora, como una libreta de cuero con hojas crema. El usuario debe sentir que esta app es "su espacio", no una herramienta más. Los colores marrones/crema transmiten confianza y sofisticación.

**2.6. Cross-pollination de datos.** Los datos de un área alimentan los insights de otra. Si el usuario duerme mejor, le mostramos cómo eso correlaciona con su productividad. Si gasta menos en comida chatarra, le mostramos la conexión con sus metas de nutrición. Todo está conectado.

**2.7. Escalabilidad desde el día uno.** El código se escribe pensando en que será una app web, iOS y Android. Las decisiones técnicas de hoy no deben limitar las posibilidades de mañana.

---

## 3. Identidad Visual

### 3.1. Paleta de Colores

Inspirada en planners de cuero, papel artesanal y la estética Notion premium. La paleta es cálida, sofisticada y no cansa la vista en uso prolongado.

**Colores Base:**

| Nombre      | Hex       | Uso                                              |
|-------------|-----------|--------------------------------------------------|
| Dark        | `#3D2B1F` | Texto principal, sidebar, headers                |
| Brown       | `#6B4226` | Texto secundario, bordes activos                 |
| Medium      | `#8B6542` | Texto terciario, subheadings                     |
| Warm        | `#A0845C` | Texto muted, labels                              |
| Tan         | `#C4A882` | Iconos inactivos, bordes suaves                  |
| Light Tan   | `#D4BEA0` | Backgrounds secundarios, separadores             |
| Cream       | `#EDE0D4` | Bordes, dividers, progress bar backgrounds       |
| Light Cream | `#F5EDE3` | Backgrounds de cards hover                       |
| Warm White  | `#FAF7F3` | Background de top bar, secciones alternadas       |
| Paper       | `#FFFDF9` | Background principal de contenido                |

**Colores Funcionales:**

| Nombre        | Hex       | Uso                                            |
|---------------|-----------|------------------------------------------------|
| Accent        | `#B8860B` | CTAs, elementos activos, highlights principales |
| Accent Light  | `#D4A843` | Hover de accent, fills de gráficos, badges      |
| Accent Glow   | `#F0D78C` | Glow effects, fondos de accent muy suaves       |
| Success       | `#7A9E3E` | Mejoras positivas, checks, habits completados   |
| Success Light | `#D4E6B5` | Backgrounds de success, fills suaves            |
| Warning       | `#D4943A` | Streaks, alertas moderadas, flames              |
| Warning Light | `#F5E0C0` | Backgrounds de warning                          |
| Danger        | `#C0544F` | Declive, alertas, overtraining, gastos excesivos|
| Danger Light  | `#F5D0CE` | Backgrounds de danger                           |
| Info          | `#5A8FA8` | Datos informativos, métricas neutras            |
| Info Light    | `#C8E0EC` | Backgrounds de info                             |

### 3.2. Tipografía

| Elemento       | Fuente                          | Peso | Tamaño  |
|----------------|---------------------------------|------|---------|
| H1 (títulos)   | Georgia, serif                  | 700  | 28-36px |
| H2 (secciones) | Georgia, serif                  | 700  | 20-24px |
| H3 (cards)     | Georgia, serif                  | 700  | 18px    |
| Body           | Inter, system-ui, sans-serif    | 400  | 14px    |
| Labels         | Inter, system-ui, sans-serif    | 600  | 12px    |
| Small/Caption  | Inter, system-ui, sans-serif    | 500  | 11px    |
| Numbers/Stats  | Georgia, serif                  | 800  | 24-36px |

Georgia serif para todo lo que queremos que se sienta "premium" y con personalidad (títulos, números grandes). Inter para todo lo que necesita ser legible y funcional (body text, labels, inputs).

### 3.3. Principios de UI

**Border radius:** 12-16px para cards, 6-10px para botones e inputs, 50% para avatares.

**Sombras:** Sutiles, cálidas. Ejemplo: `box-shadow: 0 4px 12px rgba(61, 43, 31, 0.08)`. Nunca sombras negras frías.

**Bordes:** `1px solid #EDE0D4` (cream) como default. `1px solid #B8860B` (accent) para estados activos.

**Espaciado:** Base de 8px. Padding de cards: 20-24px. Gaps entre cards: 16-20px. Padding de página: 32px.

**Hover effects:** Sutil transform translateY(-2px) con sombra ligeramente mayor. Transiciones de 0.2-0.3s ease.

**Animaciones:** Contadores que se incrementan de 0 al valor real (1.2s). Barras de progreso que crecen (1.5s ease). Nunca animaciones que distraigan del contenido.

---

## 4. Arquitectura de la Aplicación

### 4.1. Estructura de Páginas

La app tiene **9 secciones principales** (1 Home + 8 áreas de vida):

```
Home Dashboard (Inicio)
├── Vision Page       → 4 secciones
├── Plan Page         → 5 secciones
├── Productivity Page → 6 secciones
├── Organization Page → 4 secciones
├── Finance Page      → 8 secciones
├── Fitness Page      → 8+ secciones (la más completa)
├── Nutrition Page    → 5 secciones
└── Wellness Page     → 10 secciones
                      ─────────────
                      50+ secciones totales
                      200+ features
```

### 4.2. Navegación

**Sidebar colapsable** (izquierda):
- Logo + nombre de la app
- 9 items de navegación con iconos
- Cada item se expande para mostrar sub-secciones
- Perfil del usuario al fondo (avatar, nombre, nivel, XP)
- Ancho expandido: 260px. Colapsado: 68px.
- Background: `#3D2B1F` (dark). Texto: cream/tan.

**Top Bar** (superior):
- Botón hamburguesa para colapsar sidebar
- Título de la página actual (Georgia serif)
- Botón "Ver Resumen Mensual" (solo en Home)
- Notificaciones (campana)
- Avatar del usuario

---

## 5. Home Dashboard — El Punto de Entrada

El Home Dashboard es la primera impresión y debe ser WOW. Es donde el usuario ve su vida entera de un vistazo.

### 5.1. Welcome Banner
- Gradient background dark brown
- Fecha actual en español
- Saludo personalizado: "Buenos días/tardes/noches, [Nombre]"
- Frase motivacional rotativa (biblioteca de 50+ frases en español)
- Life Score circular gauge (derecha)

### 5.2. Life Score (0-100)
El Life Score es un número único que representa cómo va tu vida en general. Es el promedio ponderado de las 8 áreas de vida. Se muestra como un gauge circular prominente.

**Fórmula del Life Score:**
```
Life Score = (Vision × 0.10) + (Plan × 0.10) + (Productivity × 0.15) +
             (Organization × 0.08) + (Finance × 0.15) + (Fitness × 0.15) +
             (Nutrition × 0.12) + (Wellness × 0.15)
```

Los pesos reflejan el impacto de cada área en la calidad de vida general. Son configurables por el usuario en Settings.

### 5.3. Métricas Clave (4 cards)
| Métrica | Descripción | Icono | Color |
|---------|-------------|-------|-------|
| vs. Semana Pasada | % de mejora en Life Score | TrendingUp | Success |
| Streak Total | Suma de todos los streaks activos (días) | Flame | Warning |
| Fuerza Promedio | Qué tan arraigados están los hábitos (%) | Award | Info |
| Progreso de Hoy | Hábitos completados hoy / total | Target | Accent |

### 5.4. Hábitos de Hoy (Quick Check-in)
Lista de hábitos agrupados por momento del día:
- Mañana (icono sol)
- Todo el día (icono sol/nube)
- Noche (icono luna)

Cada hábito tiene: checkbox toggle, icono emoji, nombre, streak actual con flame icon. Al hacer check se marca visualmente con background verde suave y línea tachada.

### 5.5. Radar Chart — Tu Vida en Balance
Gráfico de radar con las 8 áreas de vida. Muestra overlay de esta semana vs la semana pasada (línea punteada) para ver mejora visual.

### 5.6. Grid de Áreas (8 cards)
Cada área muestra: icono emoji, nombre, score actual, cambio % vs semana anterior (verde si sube, rojo si baja), barra de progreso con el color de esa área. Hover effect con elevación.

### 5.7. Evolución Semanal (Area Chart)
Gráfico de 12 semanas mostrando la tendencia del Life Score. Incluye línea punteada de proyección futura basada en la tendencia actual.

### 5.8. Efecto Compuesto (Area Chart)
El gráfico más motivacional de la app. Tres líneas:
- **Verde (proyección de mejora):** Si mejoras 0.5% diario → +517% en un año
- **Dorado (progreso real):** Tu línea actual de mejora
- **Rojo punteado (si abandonas):** Lo que pasa si retrocedes 0.5% diario

Basado en la fórmula de James Clear: `(1 + rate)^days - 1`

### 5.9. Heatmap de Consistencia (90 días)
Mapa estilo GitHub con 90 cuadros. Cada cuadro = 1 día. Intensidad de color = % de hábitos completados ese día. 5 niveles de intensidad del cream al dark brown. Hover muestra tooltip con fecha y X/Y hábitos.

### 5.10. Top Streaks & Fuerza de Hábito
Dos cards lado a lado:
- **Top Streaks:** Los 5 hábitos con streak más largo. Medallas oro/plata/bronce. Muestra streak actual y best streak.
- **Fuerza de Hábito:** Todos los hábitos ordenados por fuerza (qué tan arraigados están). Barra de progreso por cada uno con labels: "Arraigado" (80%+), "Formándose" (60-79%), "En progreso" (40-59%), "Nuevo" (<40%).

**Algoritmo de Fuerza de Hábito:**
```
Fuerza = (streak_actual / 66) × 40 + (completados_30d / 30) × 40 + (consistencia_temporal) × 20

Donde:
- 66 días es el promedio para formar un hábito (estudio de Phillippa Lally, UCL)
- completados_30d = días completados en los últimos 30
- consistencia_temporal = 1 si lo hace a la misma hora cada día, decrece con variación
```

### 5.11. Comparativa Semanal (Bar Chart)
Gráfico de barras de las últimas 12 semanas. Cada barra = Life Score de esa semana. La barra de la semana actual está resaltada en accent gold.

### 5.12. Footer Motivacional
Banner dark con mensaje proyectado: "Eres un +X% mejor que la semana pasada. Si mantienes este ritmo, en 6 meses serás una persona completamente diferente. A tu ritmo actual habrás progresado un +Y% en total."

**Fórmula de proyección:** `progreso_6m = ((1 + mejora_semanal/100)^26 - 1) × 100`

---

## 6. Páginas Detalladas por Área

### 6.1. Vision Page

**Propósito:** Definir y mantener enfoque en la vida que el usuario quiere construir.

| Sección | Descripción | Dashboard |
|---------|-------------|-----------|
| Dream Life Vision | Vision board digital con metas por área de vida (salud, finanzas, relaciones, carrera, personal). Timeline visual de logros esperados. Indicador de progreso general. | Vision Board interactivo + Progress Rings |
| Manifestation Planner | Intenciones diarias/semanales/mensuales. Tracker de visualización diaria. Calendario de manifestación con streaks. | Calendar Heatmap + Streak Counter |
| Daily Affirmations | Biblioteca de 500+ afirmaciones por categoría. Afirmaciones personalizadas. Recordatorio diario con rotación. Registro de favoritas. | Card Carousel + Usage Stats |
| Bucket List | Categorías: viajes, experiencias, logros, aprendizaje. Fotos y notas por ítem. Progreso visual completado vs pendiente. | Grid Cards + Completion Bar |

### 6.2. Plan Page

**Propósito:** Planificar el tiempo desde el día hasta el año completo.

| Sección | Descripción | Dashboard |
|---------|-------------|-----------|
| Daily Planner | Time blocking por horas (6am-11pm). Top 3 prioridades. Review del día (1-10). Integración con Habit Tracker. | Timeline + Priority Cards |
| Weekly Planner | Vista de 7 días con drag & drop. Objetivos semanales (máx 5). Reflexión de fin de semana. Vista de carga por día. | 7-Column Grid + Weekly Stats |
| Monthly Planner | Calendario visual con eventos. Metas mensuales con KPIs. Resumen financiero del mes. Month-in-review dashboard. | Calendar View + KPI Cards |
| Quarterly Planner | OKRs (Objectives & Key Results). Proyectos principales. Milestones con fechas límite. Retrospectiva trimestral. | OKR Progress Bars + Timeline |
| Yearly Planner | 12 metas anuales (1/mes). Palabra/tema del año. Yearly overview calendar. Year-in-review con gráficos. | 12-Month Overview + Annual Charts |

### 6.3. Productivity Page

**Propósito:** Maximizar rendimiento con herramientas de productividad profesionales.

| Sección | Descripción | Dashboard |
|---------|-------------|-----------|
| Project Management | Tablero Kanban (To Do/In Progress/Done). Subtareas con checklist. Fechas límite con alertas. Etiquetas prioridad/categoría. Progreso por proyecto (%). | Kanban Board + Progress Bars |
| Meeting Minutes | Template de acta. Participantes y roles. Action items con asignados. Seguimiento de compromisos. | List View + Action Tracker |
| Task List | Matriz Eisenhower (urgente/importante). Tags y filtros. Countdown a fechas límite. Subtareas anidadas. Tareas recurrentes. | Eisenhower Matrix + Task Cards |
| Habit Tracker | Hasta 20 hábitos simultáneos. Streaks con animaciones. Heatmap anual estilo GitHub. Tasa de completación. Badges desbloqueables. Categorías personalizables. | Heatmap + Streaks + Badges |
| Pomodoro Tracker | Timer 25/5 personalizable. Contador de pomodoros diarios. Historial de sesiones. Estadísticas de productividad. Vinculación con tareas/proyectos. | Timer Widget + Focus Stats |
| Work Time Log | Timer inicio/pausa/fin. Categorización por proyecto/cliente. Reporte semanal de horas. Distribución de tiempo. Exportable para facturación. | Pie Chart + Hours Bar Chart |

### 6.4. Organization Page

**Propósito:** Organizar todos los aspectos de la vida personal.

| Sección | Descripción | Dashboard |
|---------|-------------|-----------|
| Cleaning Tracker | Tareas diarias/semanales/mensuales. Asignación por habitación. Checklist visual. Recordatorios automáticos. | Room Grid + Checklist |
| Relationship Tracker | Contactos con cumpleaños y fechas. Frecuencia de contacto deseada vs real. Notas de conversaciones. Regalos. Recordatorios follow-up. | Contact Cards + Timeline |
| Reading Journal | Biblioteca personal con portadas. Estado: leyendo/completado/por leer. Notas y citas favoritas. Calificación. Meta anual con progreso. | Bookshelf Grid + Reading Stats |
| Movies & TV Journal | Catálogo con pósters. Watchlist y vistas. Calificación y reseña. Favoritos y recomendaciones. | Poster Grid + Viewing Stats |

### 6.5. Finance Page

**Propósito:** Control total de las finanzas personales con insights actionables.

| Sección | Descripción | Dashboard |
|---------|-------------|-----------|
| Income Transactions | Registro por fuente. Categorización automática. Ingresos recurrentes vs únicos. Historial con filtros. Totales mensuales/anuales. | Transaction Table + Monthly Chart |
| Expense Transactions | Registro con categoría/subcategoría. Método de pago. Gastos recurrentes destacados. Alertas de gastos inusuales. Búsqueda avanzada. | Transaction Table + Trends |
| Income by Category | Gráfico de torta por fuente. Tendencia mensual. Comparativa mes a mes. Top fuentes. Proyección. | Pie Chart + Trend Lines |
| Expense by Category | Gráfico de torta. Top 5 categorías. Tendencia mensual. Comparativa con presupuesto. Alertas de sobregasto. | Donut Chart + Category Bars |
| Budget Tracker | Presupuesto por categoría. Barra de progreso gasto vs presupuesto. Alertas al 75% y 90%. Rollover. Dashboard resumen con semáforos. | Budget Bars (Green/Yellow/Red) |
| Bill Tracker | Calendario de vencimientos. Estado: pagado/pendiente/vencido. Alertas previas. Historial. Total mensual de fijas. | Calendar + Bill Cards |
| Subscription Tracker | Lista con logos. Costo mensual y anual total. Fecha renovación. Categoría. ROI percibido. | Subscription Cards + Cost Summary |
| Wishlist | Items con imagen y precio. Priorización quiero vs necesito. Plan de ahorro por ítem. Progreso de ahorro. Link de compra. | Product Cards + Savings Progress |

### 6.6. Fitness Page (SECCIÓN ESTRELLA)

**Propósito:** Un gimnasio digital completo. La app dentro de la app. El usuario puede usarla activamente mientras entrena.

#### 6.6.1. Workout Tracker (Modo Entrenamiento Activo)

Esta es la función que se usa EN el gimnasio. Debe ser rápida, intuitiva y funcionar sin fricciones.

**Cada ejercicio muestra:**
- Nombre del ejercicio + grupo muscular con icono
- Referencia de la sesión anterior (peso × reps) en texto fantasma
- Sugerencia de sobrecarga progresiva: "La vez pasada: 60kg × 10. Intenta: 62.5kg × 10 o 60kg × 12"
- Indicador de PR (trofeo dorado) cuando se supera un record

**Campos por cada SET:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Set # | Auto | Número de serie (1, 2, 3...) |
| Peso (kg) | Number input | Peso utilizado |
| Reps | Number input | Repeticiones realizadas |
| RPE | Number 1-10 | Rate of Perceived Exertion (esfuerzo percibido) |

**Botones por ejercicio:** Agregar set (+), eliminar set (-), notas del ejercicio.

**Resumen post-workout:**
- Duración total del entrenamiento
- Volumen total (peso × reps × sets)
- PRs alcanzados en esta sesión
- Comparación vs sesión anterior del mismo workout

#### 6.6.2. Rest Timer (Temporizador de Descanso)

Se muestra al lado del workout (en desktop) o como overlay (en mobile).

**Especificaciones:**
- Countdown visual con círculo SVG que se vacía progresivamente
- Duración default: 60 segundos
- Presets: 30s, 60s, 90s, 120s, 180s (seleccionables con un tap)
- Controles: Play, Pause, Reset
- Opción de sonido on/off
- Auto-start: se puede configurar para iniciar automáticamente al completar un set
- Número grande central mostrando segundos restantes (Georgia serif, 36px)
- Label "Descanso" como título

**Implementación técnica:**
```javascript
useEffect → setInterval(1000ms) → decrementar timeLeft
progress = (timeLeft / duration) × 100
SVG circle: strokeDasharray = circumference, strokeDashoffset = circumference × (1 - progress/100)
```

#### 6.6.3. Volume Tracker por Grupo Muscular

Basado en los conceptos del Dr. Mike Israetel (Renaissance Periodization):

**Métricas de volumen por músculo (series semanales):**

| Músculo | MV (Mantenimiento) | MEV (Mín. Efectivo) | MAV (Máx. Adaptativo) | MRV (Máx. Recuperable) |
|---------|-----|-----|------|------|
| Pecho | 6 | 8 | 12-20 | 22+ |
| Espalda | 6 | 8 | 14-22 | 25+ |
| Hombros (laterales) | 6 | 8 | 16-22 | 26+ |
| Bíceps | 4 | 6 | 14-20 | 22+ |
| Tríceps | 4 | 6 | 10-16 | 18+ |
| Cuádriceps | 6 | 8 | 12-18 | 20+ |
| Isquiotibiales | 4 | 6 | 10-16 | 18+ |
| Glúteos | 4 | 6 | 12-16 | 20+ |
| Core | 0 | 4 | 8-12 | 16+ |
| Pantorrillas | 6 | 8 | 12-16 | 20+ |

**Visualización:** Barra horizontal por músculo con zonas de color:
- Zona verde: MEV a MAV (zona óptima para hipertrofia)
- Zona amarilla: por encima de MAV (acercándose al límite)
- Zona roja: por encima de MRV (overtraining risk)
- Marker del volumen actual del usuario

**Alerta de overtraining:** Cuando el volumen actual supera el 80% del MRV, se muestra una alerta visual: "Cuidado: estás acercándote al volumen máximo recuperable para [músculo]. Considera un deload."

#### 6.6.4. Plan Semanal de Entrenamiento

**Vista:** Grid de 7 días (Lun-Dom) mostrando la rutina planificada.

**Splits prediseñados:**
- PPL (Push/Pull/Legs) — 6 días
- Upper/Lower — 4 días
- Full Body — 3 días
- Bro Split — 5 días
- Custom — El usuario arma su propia distribución

**Cada día muestra:**
- Nombre del workout (ej: "Push Day A")
- Lista de ejercicios con series × reps objetivo
- Volumen total planificado
- Duración estimada
- Estado: completado / pendiente / día de descanso

**Sobrecarga progresiva mensual:**
El plan incluye 4 semanas con progresión automática:
- Semana 1: Peso base × reps base
- Semana 2: Peso base × (reps + 1-2)
- Semana 3: (Peso + 2.5kg) × reps base
- Semana 4: Deload (70% del peso × reps)

#### 6.6.5. Personal Records (PR Board)

**Tabla de PRs:**

| Ejercicio | 1RM | 5RM | 10RM | Cambio Mensual | Fecha del PR |
|-----------|-----|-----|------|----------------|-------------|
| Press Banca | 100kg | 85kg | 70kg | +5kg | 2026-03-28 |
| Sentadilla | 120kg | 100kg | 80kg | +2.5kg | 2026-04-01 |
| Peso Muerto | 140kg | 115kg | 95kg | +5kg | 2026-03-15 |

**Indicadores:**
- Flecha verde arriba: PR mejorado este mes
- Número: kg/lbs de mejora
- Trofeo: cuando se establece un nuevo PR absoluto
- Historial de PR por ejercicio (gráfico de línea)

**Fórmula de 1RM estimado (Epley):**
```
1RM = peso × (1 + reps / 30)
```

#### 6.6.6. Body Metrics Dashboard

**Métricas que se trackean:**

| Métrica | Unidad | Frecuencia de registro | Visualización |
|---------|--------|----------------------|---------------|
| Peso corporal | kg/lbs | Diario o semanal | Line chart con media móvil 7 días |
| Grasa corporal | % | Semanal | Line chart con tendencia |
| IMC | kg/m² | Auto-calculado | Gauge con categoría |
| Pecho | cm | Quincenal/mensual | Radar chart + trend |
| Cintura | cm | Quincenal/mensual | Radar chart + trend |
| Cadera | cm | Quincenal/mensual | Radar chart + trend |
| Brazo derecho | cm | Quincenal/mensual | Radar chart + trend |
| Brazo izquierdo | cm | Quincenal/mensual | Radar chart + trend |
| Antebrazo D | cm | Quincenal/mensual | Radar chart + trend |
| Antebrazo I | cm | Quincenal/mensual | Radar chart + trend |
| Muslo derecho | cm | Quincenal/mensual | Radar chart + trend |
| Muslo izquierdo | cm | Quincenal/mensual | Radar chart + trend |
| Pantorrilla D | cm | Quincenal/mensual | Radar chart + trend |
| Pantorrilla I | cm | Quincenal/mensual | Radar chart + trend |
| Cuello | cm | Mensual | Radar chart + trend |
| Hombros | cm | Mensual | Radar chart + trend |

**Datos de Bioimpedancia (para usuarios con báscula inteligente):**

| Métrica | Unidad | Descripción |
|---------|--------|-------------|
| Agua corporal | % | Porcentaje de agua en el cuerpo |
| Masa muscular | kg | Masa muscular total |
| Masa ósea | kg | Masa ósea estimada |
| Grasa visceral | nivel 1-12 | Grasa alrededor de órganos |
| BMR | kcal | Tasa metabólica basal |
| Edad metabólica | años | Edad estimada según metabolismo |
| Proteína | % | Porcentaje de proteína corporal |

**Fórmula IMC:**
```
IMC = peso (kg) / altura (m)²

Categorías:
< 18.5 = Bajo peso
18.5 - 24.9 = Normal
25.0 - 29.9 = Sobrepeso
30.0+ = Obesidad
```

**Radar Chart corporal:** Muestra todas las medidas en un radar chart normalizado para visualizar proporciones corporales. Se compara con la medición anterior para ver cambios.

#### 6.6.7. Otros trackers de Fitness

| Tracker | Features |
|---------|----------|
| Weight Tracker | Peso diario, media móvil 7 días, meta de peso, countdown a meta, gráfico de tendencia |
| Steps Tracker | Meta diaria (default 10,000), gráfico semanal, heatmap mensual, distancia y calorías estimadas |
| Intermittent Fasting | Protocolos (16/8, 18/6, 20/4, OMAD), timer de ayuno activo, zonas de beneficio, historial |
| Challenges | Retos prediseñados (30 días abs, etc.), progreso día a día, badges de completación |
| Progress Photos | Upload con fecha, comparativa lado a lado, timeline de transformación |

### 6.7. Nutrition Page

| Sección | Features Principales |
|---------|---------------------|
| Recipe Book | Recetas con foto/ingredientes/pasos. Info nutricional auto. Categorías: desayuno/almuerzo/cena/snacks. Tags: vegano, keto, sin gluten. Tiempo/dificultad. |
| Meal Planner | Vista semanal con drag & drop de recetas. Macros diarios auto-calculados. Generador de lista de compras. Calorías totales por día. |
| Grocery List | Generada desde meal plan. Categorización por sección del supermercado. Checklist interactivo. Precios estimados. |
| Ingredients | Búsqueda de ingredientes. Info nutricional por 100g. Alternativas y sustitutos. Alérgenos. |
| Kitchen Conversions | Tazas a gramos, ml a oz, etc. Conversiones por ingrediente. Calculadora de porciones. Temperaturas horno. |

### 6.8. Wellness Page

| Sección | Features Principales |
|---------|---------------------|
| Period Tracker | Calendario de ciclo con predicciones. Síntomas por día. Ánimo vinculado al ciclo. Historial con duración promedio. |
| Sleep & Dream Tracker | Hora acostarse/despertar. Calidad 1-10. Duración total. Registro de sueños. Gráfico de patrones. Factores que afectan sueño. |
| Mood Tracker | Escala de emociones con emojis. Factores que influyen. Tendencia emocional. Correlación con hábitos/sueño. Heatmap mensual. |
| Hydration Tracker | Meta diaria personalizable. Botón rápido para agregar vasos. Visualización de botella llenándose. Streak de meta cumplida. |
| Medication Tracker | Lista con dosis. Horarios de toma. Checklist diario. Inventario y alertas reabastecimiento. Historial adherencia. |
| Symptom Tracker | Catálogo de síntomas. Intensidad 1-10 y duración. Correlación con medicamentos. Timeline. Exportable para médico. |
| Daily Journal | Entrada libre. Prompts diarios aleatorios. Tags y emociones. Búsqueda en entradas pasadas. Streaks de escritura. |
| Gratitude Journal | 3 cosas diarias. Categorías de gratitud. Nube de palabras. Historial con calendario. Streak. |
| Free Your Mind | Escritura libre sin estructura. Timer (5/10/15 min). Sin edición post-escritura (opcional). Contador de palabras. |
| Medical Appointments | Calendario de citas. Doctor, especialidad, ubicación. Notas pre/post cita. Documentos adjuntos. Historial médico. |

---

## 7. Sistema de Resúmenes (Weekly & Monthly)

### 7.1. Resumen Semanal (Weekly Brief)

**Cuándo aparece:** Cada domingo al abrir la app, o accesible en cualquier momento desde el Home.

**Formato:** Card/popup breve, fácil de leer en 30 segundos.

**Contenido:**
- Life Score de la semana vs semana anterior (% cambio)
- Top 3 logros de la semana (auto-detectados por la app)
- 1 área de enfoque sugerida para la próxima semana (la que más bajó o tiene más potencial)
- Tasa de completación de hábitos
- Streak más largo activo
- Frase motivacional relevante

### 7.2. Resumen Mensual (Monthly Deep Dive)

**Cuándo aparece:** El 1er día de cada mes como popup grande, o accesible con el botón "Ver Resumen Mensual" desde el Home.

**Formato:** Modal grande con tabs por área. Cada tab muestra insights específicos del mes.

#### Tab: Overall (Visión General)
- Life Score inicio del mes → fin del mes (con % cambio)
- Radar chart: inicio del mes vs fin del mes (overlay)
- "Eres un X% mejor que hace un mes"
- Top 5 logros del mes
- 2-3 áreas a mejorar el próximo mes
- Proyección: "A este ritmo, en 3 meses tu Life Score será X"

#### Tab: Fitness
Los datos se recopilan automáticamente de los workouts loggeados:
- **PRs del mes:** "Press banca: +5kg, Curl bíceps: +2kg por brazo, Sentadilla: +2.5kg"
- **Estancamientos:** "Peso muerto: sin cambio en 4 semanas. Considera variar la programación."
- **Retrocesos:** "Press militar: -2.5kg. Puede ser fatiga acumulada o falta de sueño."
- **Volumen semanal promedio:** "85 series/semana (↑12% vs mes pasado)"
- **Consistencia:** "Entrenaste X/Y días planificados (Z%)"
- **Cambios corporales:** "Peso: -1.2kg, Grasa corporal: -0.8%, Brazo: +0.5cm"
- **Mejor workout del mes:** el de mayor volumen total

#### Tab: Finanzas
- **Ingresos del mes:** total + % cambio vs mes pasado
- **Gastos por categoría:** "Ocio: $X (↑15%), Educación: $X (↑20%), Comida fuera: $X (↓8%)"
- **Ahorro neto:** "$X este mes (↑/↓ Y% vs mes pasado)"
- **Adherencia al presupuesto:** "Cumpliste tu presupuesto en 6/8 categorías"
- **Suscripciones:** "Total: $X/mes. Cancelaste Y, añadiste Z."
- **Gastos vs ingresos ratio:** visualización de cómo se distribuyó cada peso

#### Tab: Nutrición
- **Adherencia a meal plan:** "Cumpliste tu plan X/30 días (Y%)"
- **Hidratación promedio:** "X.XL/día (↑/↓ Y% vs mes pasado)"
- **Grasa corporal:** "X% (↓Y% vs inicio del mes)"
- **Macros promedio:** distribución de proteína/carbos/grasa
- **Recetas nuevas probadas:** N
- **Comidas fuera de plan:** N días

#### Tab: Productividad
- **Hábitos completados:** "X% (↑Y% vs mes pasado)"
- **Mejor streak del mes:** "X días — [nombre del hábito]"
- **Pomodoros completados:** N (X horas de enfoque)
- **Proyectos avanzados:** lista con % de progreso
- **Tareas completadas:** N total
- **Horas productivas registradas:** N

#### Tab: Bienestar
- **Calidad de sueño promedio:** X/10 (↑/↓ vs mes pasado)
- **Estado de ánimo promedio:** emoji + tendencia
- **Hidratación promedio:** X.XL/día
- **Días de journaling:** N/30
- **Medicación adherencia:** X%
- **Correlaciones detectadas:** "Los días que meditaste, tu mood fue 2 puntos más alto" / "Cuando dormiste +7h, completaste 30% más hábitos"

### 7.3. Lógica de Detección de Insights

El sistema auto-detecta logros, estancamientos y retrocesos:

```
Para cada métrica trackeable:
  cambio = valor_actual - valor_periodo_anterior
  cambio_pct = (cambio / valor_periodo_anterior) × 100

  SI cambio_pct > 5% → LOGRO ("Mejoraste X en Y%")
  SI -2% < cambio_pct < 2% → ESTANCAMIENTO ("X se mantuvo estable")
  SI cambio_pct < -5% → RETROCESO ("X bajó Y%")

  Para PRs fitness:
    SI peso_nuevo > PR_anterior → NUEVO PR ("Nuevo récord en X: +Ykg")
    SI peso_nuevo == PR_anterior por 4+ semanas → PLATEAU ("Considera deload o variación")
```

---

## 8. Sistema de Gamificación

### 8.1. Filosofía

Gamificación LIGERA, no RPG complejo. Basado en la investigación que muestra que el 67% abandona apps RPG-heavy en 4 semanas. Nos enfocamos en:
- Streaks (el motivador #1 comprobado)
- Badges/logros (reconocimiento de hitos)
- Niveles (progresión simple)
- Frases motivacionales (refuerzo positivo)

### 8.2. Sistema de Niveles

| Nivel | Nombre | XP Requerido | Cómo se gana XP |
|-------|--------|-------------|-----------------|
| 1 | Principiante | 0 | — |
| 2 | Explorador | 100 | Completar hábito = 5 XP |
| 3 | Consistente | 300 | Completar todos los hábitos del día = 20 XP |
| 4 | Dedicado | 600 | Streak de 7 días = 50 XP |
| 5 | Imparable | 1000 | Streak de 30 días = 200 XP |
| 6 | Maestro | 2000 | Registrar workout = 15 XP |
| 7 | Legendario | 5000 | Completar un mes al 90%+ = 500 XP |
| 8 | Elite | 10000 | Mejorar Life Score 10+ puntos = 300 XP |
| 9 | Champion | 20000 | — |
| 10 | Ultimate | 50000 | — |

### 8.3. Badges

| Badge | Condición | Icono |
|-------|-----------|-------|
| First Step | Completar primer hábito | 👣 |
| Week Warrior | 7 días consecutivos todos los hábitos | ⚔️ |
| Monthly Master | 30 días consecutivos | 👑 |
| PR Hunter | 10 PRs personales | 🏆 |
| Budget Boss | Cumplir presupuesto 3 meses seguidos | 💰 |
| Sleep Champion | 30 noches de 7+ horas | 😴 |
| Hydration Hero | 30 días meta de agua cumplida | 💧 |
| Bookworm | Leer 12 libros en un año | 📚 |
| Iron Will | Streak de 100 días | 🔥 |
| Life Score 90 | Alcanzar Life Score de 90+ | ⭐ |

### 8.4. Streak Insurance

Feature inspirada en las mejores apps: el usuario puede configurar "días libres" por semana (ej: 1 domingo libre) sin que se rompa su streak. Esto reduce el abandono por frustración y es psicológicamente más saludable.

---

## 9. Stack Tecnológico

### 9.1. Frontend

| Tecnología | Propósito | Versión |
|------------|-----------|---------|
| React | UI framework | 18+ |
| TypeScript | Type safety, mantenibilidad | 5+ |
| Tailwind CSS | Utility-first styling | 3+ |
| Recharts | Gráficos y visualizaciones | 2+ |
| Lucide React | Iconos consistentes | latest |
| Framer Motion | Animaciones fluidas | latest |
| React Router | Navegación SPA | v6 |
| Zustand | State management (ligero, escalable) | latest |
| React Hook Form | Manejo de formularios | latest |
| date-fns | Manejo de fechas | latest |

### 9.2. Backend

| Tecnología | Propósito |
|------------|-----------|
| Node.js + Express | API REST |
| PostgreSQL | Base de datos relacional (datos estructurados de hábitos, finanzas, fitness) |
| Prisma ORM | Type-safe database access |
| Redis | Caché, sesiones, rate limiting |
| JWT + Refresh Tokens | Autenticación |

### 9.3. Infraestructura

| Servicio | Propósito |
|----------|-----------|
| Vercel | Hosting frontend (SSR con Next.js) |
| Railway / Render | Hosting backend + DB |
| Supabase | Alternativa para Auth + DB + Real-time |
| AWS S3 / Cloudflare R2 | Storage de imágenes (progress photos, recetas) |
| Resend | Emails transaccionales |
| Stripe | Procesamiento de pagos (suscripciones) |
| Sentry | Error tracking |
| Posthog / Mixpanel | Analytics de producto |

### 9.4. Mobile (Fase 2)

| Opción | Pros | Cons |
|--------|------|------|
| React Native (Expo) | Reutiliza conocimiento React, una codebase | Performance ligeramente menor |
| Capacitor | Convierte web app a nativa directamente | Limitado en features nativas |
| Flutter | Performance nativa, UI hermosa | Codebase separada (Dart) |

**Decisión recomendada:** React Native con Expo para máxima reutilización de código y lógica de negocio.

### 9.5. Estructura de Carpetas del Proyecto

```
ultimate-habit-tracker/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/           # App Router (Next.js 14+)
│   │   │   ├── components/    # Componentes React
│   │   │   │   ├── ui/        # Componentes base (Button, Card, Input...)
│   │   │   │   ├── charts/    # Componentes de gráficos
│   │   │   │   ├── layout/    # Sidebar, TopBar, etc.
│   │   │   │   └── features/  # Componentes por feature
│   │   │   │       ├── home/
│   │   │   │       ├── fitness/
│   │   │   │       ├── finance/
│   │   │   │       ├── habits/
│   │   │   │       └── ...
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── stores/        # Zustand stores
│   │   │   ├── lib/           # Utilidades, constantes, tipos
│   │   │   ├── styles/        # Tailwind config, globals
│   │   │   └── types/         # TypeScript types/interfaces
│   │   └── public/            # Assets estáticos
│   │
│   └── mobile/                # React Native (Expo) — Fase 2
│       ├── src/
│       └── ...
│
├── packages/
│   ├── shared/                # Lógica compartida web + mobile
│   │   ├── types/             # Tipos compartidos
│   │   ├── utils/             # Funciones de cálculo (Life Score, etc.)
│   │   ├── constants/         # Colores, config, textos
│   │   └── hooks/             # Hooks compartidos
│   │
│   └── api-client/            # Cliente API compartido
│
├── services/
│   └── api/                   # Backend Node.js + Express
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── models/        # Prisma schema
│       │   └── middleware/
│       └── prisma/
│           └── schema.prisma
│
├── turbo.json                 # Turborepo config (monorepo)
├── package.json
└── README.md
```

---

## 10. Modelo de Datos (Schema Simplificado)

### Tablas principales:

```
User
├── id, email, name, avatar, level, xp, created_at
├── settings (JSON: weights, preferences, units)

Habit
├── id, user_id, name, icon, category, time_of_day
├── frequency (daily/weekly/custom), target_days[]
├── streak_current, streak_best, strength

HabitLog
├── id, habit_id, date, completed (boolean), notes

Workout
├── id, user_id, date, name, duration_minutes
├── total_volume, notes

WorkoutExercise
├── id, workout_id, exercise_id, order

WorkoutSet
├── id, workout_exercise_id, set_number
├── weight, reps, rpe, is_pr

Exercise
├── id, name, muscle_group, category, equipment

PersonalRecord
├── id, user_id, exercise_id, weight, reps, date

BodyMetric
├── id, user_id, date, type (weight/bodyfat/chest/arm...)
├── value, unit, method

BioimpedanceLog
├── id, user_id, date, water_pct, muscle_mass
├── bone_mass, visceral_fat, bmr, metabolic_age

Transaction (Finance)
├── id, user_id, date, amount, type (income/expense)
├── category, subcategory, payment_method, description

Budget
├── id, user_id, month, category, amount_limit

MealPlan
├── id, user_id, date, meal_type, recipe_id

Recipe
├── id, user_id, name, ingredients[], instructions[]
├── calories, protein, carbs, fat, prep_time

MoodLog
├── id, user_id, date, mood (1-10), emotions[], factors[]

SleepLog
├── id, user_id, date, bedtime, waketime, quality
├── dreams, factors[]

JournalEntry
├── id, user_id, date, type (daily/gratitude/free)
├── content, tags[]

LifeScore
├── id, user_id, date, overall_score
├── vision, plan, productivity, organization
├── finance, fitness, nutrition, wellness
```

---

## 11. Estrategia de Monetización

### 11.1. Modelo Freemium + Lifetime

| Plan | Precio | Incluye |
|------|--------|---------|
| **Free** | $0 | 3 hábitos, Daily Planner básico, 1 journal, heatmap 30 días. Branding "Powered by UHT" |
| **Pro Monthly** | $4.99/mes | Todo ilimitado. Dashboards completos. Export PDF/CSV. Sin branding. Themes premium. |
| **Pro Annual** | $39.99/año | Todo Pro con 33% de descuento. |
| **Lifetime** | $79.99 una vez | Todo Pro para siempre. Updates gratuitos. Soporte prioritario. Badge exclusivo "Lifetime Member". |

### 11.2. Justificación de Precios

Basado en la investigación de mercado:
- Habitify Pro: $4.99/mes
- Fabulous: $39.99/año
- Streaks: $5.99 one-time (pero con features limitados)
- Way of Life: $4.99 one-time

Nuestro precio Pro se justifica porque incluimos fitness tracker + finance tracker + meal planner + journals en una sola app (valor individual de $20+/mes si se compraran apps separadas).

### 11.3. Estrategia de Conversión Free → Pro

El usuario free experimenta la app durante 7-14 días. En ese período:
- Día 1-3: Configuración y primeros checks. Todo funciona.
- Día 4-7: Ve sus primeros streaks formarse. Se engancha.
- Día 7: Se muestra su primera Weekly Brief. Ve su progreso. Se le ofrece Pro.
- Día 8-14: Intenta agregar hábito #4 → gate. Quiere ver stats avanzadas → gate.
- Día 14: Se muestra trial de 7 días de Pro gratis.

### 11.4. Revenue Adicional (Futuro)

- Templates premium (workout plans, meal plans, budget templates)
- Marketplace de templates creados por la comunidad (comisión 30%)
- Integraciones premium (Apple Health, Google Fit, MyFitnessPal)
- Coaching AI personalizado (basado en los datos del usuario)
- White-label para coaches y entrenadores personales

---

## 12. Roadmap de Desarrollo

### Fase 1 — MVP (Semanas 1-4)
**Objetivo:** Una app usable que demuestre el core value.

- Setup del proyecto (Next.js + TypeScript + Tailwind + Prisma)
- Autenticación (email + Google OAuth)
- Home Dashboard con Life Score, métricas clave, heatmap
- Habit Tracker con streaks, check diario, fuerza de hábito
- Daily Planner básico
- Budget Tracker básico
- Mood Tracker
- Sidebar + navegación completa
- Deploy a Vercel + Railway

### Fase 2 — Core Features (Semanas 5-8)
**Objetivo:** Las funcionalidades que hacen la app completa.

- Fitness completo: Workout Tracker, Rest Timer, Volume Tracker, PR Board
- Body Metrics: peso, grasa, medidas, bioimpedancia
- Finance completo: ingresos, gastos, categorías, bills, suscripciones
- Weekly/Monthly Planner
- Sleep Tracker
- Hydration Tracker
- Weekly Brief popup
- PWA + Offline support

### Fase 3 — Expand (Semanas 9-12)
**Objetivo:** Completar todas las áreas de vida.

- Vision Page completa
- Nutrition: recetas, meal planner, grocery list
- Organization: reading, cleaning, relationships
- Journals: daily, gratitude, free mind
- Medication & Symptom Tracker
- Pomodoro + Work Time Log
- Monthly Summary popup completo
- Sistema de badges y XP

### Fase 4 — Polish & Launch (Semanas 13-16)
**Objetivo:** Producto listo para venta.

- Dashboards Power BI avanzados con correlaciones
- Themes y personalización (3-5 temas de color)
- Export PDF/CSV
- Multi-idioma (ES, EN, PT)
- Onboarding interactivo (tutorial paso a paso)
- Landing page de venta
- Stripe integration
- SEO + meta tags
- Beta testing con 50 usuarios
- Corrección de bugs y performance

### Fase 5 — Mobile + Scale (Semanas 17-24)
**Objetivo:** Estar en App Store y Play Store.

- React Native (Expo) app
- Push notifications
- Apple Health / Google Fit integration
- Widget de iOS/Android para hábitos rápidos
- App Store optimization (ASO)
- Marketing: Product Hunt launch, social media, YouTube demos
- Coaching AI (experimental)

---

## 13. Análisis Competitivo

### 13.1. Competidores Directos

| App | Fortaleza | Debilidad | Cómo les ganamos |
|-----|-----------|-----------|-------------------|
| Habitica | Gamificación RPG adictiva | 67% abandona en 4 semanas. Nada de fitness/finance | App integral con gamificación ligera sostenible |
| Streaks | Design minimalista, Apple ecosystem | Solo 24 hábitos, sin analytics, sin fitness | Analytics Power BI + fitness completo |
| Loop Habit Tracker | Free, open source, "habit strength" | Solo Android, sin finance/fitness/nutrition | Multiplataforma + todas las áreas de vida |
| Strides | 4 tipos de tracker, 150 templates | Sin fitness, sin finance, UI outdated | UX moderna + Power BI dashboards + fitness |
| Productive | Time-of-day organization, challenges | Sin finance, sin fitness tracking, limited analytics | Áreas de vida completas + datos conectados |
| Habitify | Multi-platform, data-rich | Sin fitness, sin finance, costoso | Mejor relación calidad/precio + más completo |
| Finch | Companion-based motivation | Casual, sin datos profundos, sin fitness | Datos + motivación, no solo "cute" |

### 13.2. Nuestra Ventaja Competitiva (Moat)

1. **All-in-one real:** Nadie combina hábitos + fitness profesional + finanzas + nutrición + bienestar en una sola app con dashboards conectados.
2. **Dashboards Power BI:** Ninguna app consumer ofrece este nivel de visualización y análisis de datos.
3. **Efecto compuesto visual:** Somos los únicos que muestran matemáticamente el impacto de la consistencia.
4. **Cross-pollination de datos:** Mostramos correlaciones entre áreas (sueño → productividad, ejercicio → mood).
5. **Resúmenes inteligentes:** Nadie hace monthly reports automáticos cross-area con insights actionables.

---

## 14. Métricas de Éxito del Producto

### 14.1. KPIs de Producto

| Métrica | Target Mes 1 | Target Mes 6 | Target Año 1 |
|---------|-------------|-------------|-------------|
| Usuarios registrados | 500 | 5,000 | 25,000 |
| DAU (Daily Active Users) | 100 | 1,000 | 5,000 |
| Retention D7 | 40% | 50% | 55% |
| Retention D30 | 20% | 30% | 35% |
| Conversión Free → Pro | 3% | 5% | 8% |
| MRR (Monthly Recurring Revenue) | $500 | $5,000 | $25,000 |
| App Store Rating | 4.0 | 4.3 | 4.5+ |
| NPS (Net Promoter Score) | — | 40 | 50+ |

### 14.2. North Star Metric

**"Weekly Active Trackers"** — Usuarios que registran al menos 1 dato en 2+ áreas de vida por semana. Esta métrica captura engagement real y cross-area usage, que es lo que nos diferencia.

---

## 15. Decisiones Técnicas Clave (Registro)

| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2026-04-05 | React como framework principal | Máxima interactividad, ecosistema gigante, ruta clara a React Native |
| 2026-04-05 | Warm brown palette (no colores vibrantes) | Inspirado en planners premium de Etsy. No cansa, se siente premium |
| 2026-04-05 | Recharts para gráficos | Balance perfecto entre power y facilidad. Buena documentación |
| 2026-04-05 | Georgia serif para headings | Transmite sofisticación y calidez. Contrasta bien con Inter |
| 2026-04-05 | Gamificación ligera (streaks + badges), no RPG | 67% abandona RPG en 4 semanas. Streaks son el motivador #1 probado |
| 2026-04-05 | Zustand para state management | Más simple que Redux, suficiente para nuestra escala, excelente DX |
| 2026-04-05 | Monorepo con Turborepo | Comparte código entre web y mobile sin duplicación |
| 2026-04-05 | PostgreSQL como DB | Datos relacionales (hábitos, workouts, finanzas), excelente para queries analíticas |
| 2026-04-05 | Fitness como "crown jewel" | Es el diferenciador. Ningún habit tracker tiene workout tracking profesional |
| 2026-04-05 | Monthly summaries cross-area | El insight que conecta todo. El usuario ve su vida mejorar en números |

---

## 16. Glosario

| Término | Definición |
|---------|-----------|
| Life Score | Puntuación 0-100 que representa el bienestar general del usuario. Promedio ponderado de 8 áreas. |
| Habit Strength | Qué tan arraigado está un hábito (0-100%). Combina streak, consistencia y regularidad temporal. |
| MV | Maintenance Volume — Series mínimas semanales para mantener un músculo. |
| MEV | Minimum Effective Volume — Series mínimas para crecer. |
| MAV | Maximum Adaptive Volume — Rango óptimo de series para hipertrofia. |
| MRV | Maximum Recoverable Volume — Máximo de series antes de overtraining. |
| RPE | Rate of Perceived Exertion — Escala 1-10 de esfuerzo percibido. |
| 1RM | One Rep Max — El peso máximo que puedes levantar una vez. |
| PR | Personal Record — Tu mejor marca en un ejercicio. |
| Compound Effect | El principio de que mejoras pequeñas consistentes producen resultados exponenciales. |
| Progressive Overload | Incremento gradual de peso, reps o series para evitar estancamiento. |
| Deload | Semana de recuperación con reducción de volumen/intensidad (~70%). |
| Cross-pollination | Cuando datos de un área (ej: sueño) informan insights de otra (ej: productividad). |
| Life Area | Una de las 8 categorías principales: Vision, Plan, Productivity, Organization, Finance, Fitness, Nutrition, Wellness. |

---

> Última actualización: 5 de abril, 2026
> Versión del documento: 1.0
> Autor: Eduardo + Claude (AI)
> Estado: Fundamentos completos — listo para fase de desarrollo
