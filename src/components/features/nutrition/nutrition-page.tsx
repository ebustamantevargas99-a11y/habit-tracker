'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, Search, Plus, Trash2, Check, Clock, Star } from 'lucide-react';
import { colors } from '@/lib/colors';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Recipe {
  id: string;
  name: string;
  calories: number;
  prepTime: number;
  difficulty: number;
  isBookmarked: boolean;
}

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  isCompleted: boolean;
}

interface DailyLogEntry {
  id: string;
  mealType: string;
  meal: Meal;
}

const DAILY_GOALS = {
  calories: 2200,
  protein: 160,
  carbs: 250,
  fat: 70,
};

const SAMPLE_MEALS: Record<string, Meal[]> = {
  breakfast: [
    { id: '1', name: 'Avena con Frutas', calories: 320, protein: 12, carbs: 45, fat: 8 },
    { id: '2', name: 'Huevos Revueltos', calories: 280, protein: 18, carbs: 5, fat: 15 },
    { id: '3', name: 'Yogur Griego', calories: 220, protein: 20, carbs: 15, fat: 6 },
  ],
  lunch: [
    { id: '4', name: 'Arroz con Pollo', calories: 520, protein: 45, carbs: 60, fat: 12 },
    { id: '5', name: 'Ensalada de Atún', calories: 380, protein: 50, carbs: 20, fat: 10 },
    { id: '6', name: 'Filete con Batata', calories: 450, protein: 40, carbs: 55, fat: 8 },
  ],
  dinner: [
    { id: '7', name: 'Salmón a la Parrilla', calories: 420, protein: 55, carbs: 10, fat: 18 },
    { id: '8', name: 'Sopa de Verduras', calories: 280, protein: 15, carbs: 40, fat: 5 },
    { id: '9', name: 'Pollo con Brócoli', calories: 380, protein: 45, carbs: 25, fat: 12 },
  ],
  snacks: [
    { id: '10', name: 'Manzana con Almendras', calories: 180, protein: 6, carbs: 25, fat: 8 },
    { id: '11', name: 'Frutos Secos', calories: 200, protein: 7, carbs: 15, fat: 14 },
    { id: '12', name: 'Plátano', calories: 105, protein: 1, carbs: 27, fat: 0 },
  ],
};

const SAMPLE_RECIPES: Recipe[] = [
  { id: '1', name: 'Arroz con Pollo', calories: 520, prepTime: 40, difficulty: 2, isBookmarked: false },
  { id: '2', name: 'Ceviche', calories: 320, prepTime: 25, difficulty: 3, isBookmarked: true },
  { id: '3', name: 'Tacos al Pastor', calories: 450, prepTime: 35, difficulty: 2, isBookmarked: false },
  { id: '4', name: 'Enchiladas Verdes', calories: 480, prepTime: 45, difficulty: 3, isBookmarked: false },
  { id: '5', name: 'Ropa Vieja', calories: 380, prepTime: 120, difficulty: 2, isBookmarked: true },
  { id: '6', name: 'Causa Limeña', calories: 320, prepTime: 30, difficulty: 3, isBookmarked: false },
  { id: '7', name: 'Chiles Rellenos', calories: 420, prepTime: 50, difficulty: 3, isBookmarked: true },
  { id: '8', name: 'Paella', calories: 550, prepTime: 60, difficulty: 2, isBookmarked: false },
];

const GROCERY_CATEGORIES = [
  { name: 'Frutas', emoji: '🍎' },
  { name: 'Verduras', emoji: '🥬' },
  { name: 'Proteínas', emoji: '🍗' },
  { name: 'Lácteos', emoji: '🥛' },
  { name: 'Granos', emoji: '🌾' },
  { name: 'Otros', emoji: '📦' },
];

// Component: Circular Progress Ring
function CircularProgress({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={colors.lightCream}
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.dark }}>
          {Math.round(value)}
        </div>
        <div style={{ fontSize: '12px', color: colors.medium }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// Component: Meal Planner Tab
function MealPlannerTab() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const mealTypes = [
    { key: 'breakfast', label: 'Desayuno' },
    { key: 'lunch', label: 'Almuerzo' },
    { key: 'dinner', label: 'Cena' },
    { key: 'snacks', label: 'Snacks' },
  ];

  return (
    <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(7, 1fr)`,
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* Header row with day names */}
        <div />
        {days.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.dark,
              paddingBottom: '10px',
            }}
          >
            {day}
          </div>
        ))}

        {/* Meal rows */}
        {mealTypes.map((mealType) => (
          <React.Fragment key={mealType.key}>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.dark,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {mealType.label}
            </div>
            {days.map((day, dayIndex) => (
              <div
                key={`${day}-${mealType.key}`}
                style={{
                  backgroundColor: colors.lightCream,
                  border: `2px solid ${colors.tan}`,
                  borderRadius: '8px',
                  padding: '10px',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {dayIndex === 0 && SAMPLE_MEALS[mealType.key] && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.dark }}>
                        {SAMPLE_MEALS[mealType.key][0].name}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.medium }}>
                        {SAMPLE_MEALS[mealType.key][0].calories} cal
                      </div>
                      <div style={{ fontSize: '9px', color: colors.medium }}>
                        P: {SAMPLE_MEALS[mealType.key][0].protein}g
                      </div>
                    </div>
                  )}
                </div>
                <button
                  style={{
                    backgroundColor: colors.accent,
                    border: 'none',
                    color: colors.paper,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Añadir
                </button>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Component: Daily Log Tab
function DailyLogTab() {
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>([
    { id: '1', mealType: 'Desayuno', meal: SAMPLE_MEALS.breakfast[0] },
    { id: '2', mealType: 'Almuerzo', meal: SAMPLE_MEALS.lunch[0] },
  ]);

  const totalCalories = dailyLog.reduce((sum, entry) => sum + entry.meal.calories, 0);
  const totalProtein = dailyLog.reduce((sum, entry) => sum + entry.meal.protein, 0);
  const totalCarbs = dailyLog.reduce((sum, entry) => sum + entry.meal.carbs, 0);
  const totalFat = dailyLog.reduce((sum, entry) => sum + entry.meal.fat, 0);

  const caloriesTrend = [
    { day: 'Lun', calories: 2150 },
    { day: 'Mar', calories: 2320 },
    { day: 'Mié', calories: 2050 },
    { day: 'Jue', calories: 2400 },
    { day: 'Vie', calories: 2200 },
    { day: 'Sáb', calories: 2480 },
    { day: 'Dom', calories: totalCalories },
  ];

  return (
    <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      {/* Daily Macros Progress */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: colors.dark, marginBottom: '20px' }}>
          Progreso de Hoy
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
        }}>
          <CircularProgress value={totalCalories} max={DAILY_GOALS.calories} label="Calorías" color={colors.warning} />
          <CircularProgress value={totalProtein} max={DAILY_GOALS.protein} label="Proteína (g)" color={colors.success} />
          <CircularProgress value={totalCarbs} max={DAILY_GOALS.carbs} label="Carbohidratos (g)" color={colors.info} />
          <CircularProgress value={totalFat} max={DAILY_GOALS.fat} label="Grasas (g)" color={colors.accent} />
        </div>
      </div>

      {/* Logged Meals */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: colors.dark, marginBottom: '15px' }}>
          Comidas Registradas
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dailyLog.map((entry) => (
            <div
              key={entry.id}
              style={{
                backgroundColor: colors.lightCream,
                border: `1px solid ${colors.tan}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.dark }}>
                  {entry.mealType}: {entry.meal.name}
                </div>
                <div style={{ fontSize: '12px', color: colors.medium }}>
                  {entry.meal.calories} cal | P: {entry.meal.protein}g | C: {entry.meal.carbs}g | F: {entry.meal.fat}g
                </div>
              </div>
              <button
                style={{
                  backgroundColor: colors.dangerLight,
                  border: 'none',
                  color: colors.danger,
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calorie Trend Chart */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: colors.dark, marginBottom: '15px' }}>
          Tendencia de 7 Días
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={caloriesTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.tan} />
            <XAxis dataKey="day" stroke={colors.medium} />
            <YAxis stroke={colors.medium} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.paper,
                border: `2px solid ${colors.tan}`,
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
              {caloriesTrend.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.calories > DAILY_GOALS.calories ? colors.warning : colors.success}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Component: Recipe Book Tab
function RecipeBookTab() {
  const [recipes, setRecipes] = useState<Recipe[]>(SAMPLE_RECIPES);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBookmark = (id: string) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === id ? { ...recipe, isBookmarked: !recipe.isBookmarked } : recipe
      )
    );
  };

  const difficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
  };

  return (
    <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      {/* Search Bar */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: colors.lightCream,
        border: `2px solid ${colors.tan}`,
        borderRadius: '8px',
        paddingLeft: '12px',
      }}>
        <Search size={20} color={colors.medium} />
        <input
          type="text"
          placeholder="Buscar receta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            padding: '10px 12px',
            fontSize: '14px',
            color: colors.dark,
            outline: 'none',
          }}
        />
      </div>

      {/* Recipe Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
      }}>
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            style={{
              backgroundColor: colors.lightCream,
              border: `2px solid ${colors.tan}`,
              borderRadius: '8px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h4 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.dark,
                margin: 0,
                flex: 1,
              }}>
                {recipe.name}
              </h4>
              <button
                onClick={() => toggleBookmark(recipe.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen
                  size={18}
                  fill={recipe.isBookmarked ? colors.accent : 'none'}
                  color={recipe.isBookmarked ? colors.accent : colors.tan}
                />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: colors.medium }}>
              <strong>{recipe.calories}</strong> calorías
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: colors.medium,
            }}>
              <Clock size={14} />
              {recipe.prepTime} min
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: colors.medium,
            }}>
              <Star size={14} />
              {difficultyStars(recipe.difficulty)}
            </div>

            <button
              style={{
                backgroundColor: colors.accent,
                border: 'none',
                color: colors.paper,
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              Ver Receta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component: Grocery List Tab
function GroceryListTab() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([
    { id: '1', name: 'Manzanas', category: 'Frutas', isCompleted: false },
    { id: '2', name: 'Plátanos', category: 'Frutas', isCompleted: true },
    { id: '3', name: 'Brócoli', category: 'Verduras', isCompleted: false },
    { id: '4', name: 'Zanahorias', category: 'Verduras', isCompleted: false },
    { id: '5', name: 'Pechuga de Pollo', category: 'Proteínas', isCompleted: true },
    { id: '6', name: 'Huevos', category: 'Proteínas', isCompleted: false },
    { id: '7', name: 'Leche', category: 'Lácteos', isCompleted: false },
    { id: '8', name: 'Yogur', category: 'Lácteos', isCompleted: false },
    { id: '9', name: 'Arroz Integral', category: 'Granos', isCompleted: false },
    { id: '10', name: 'Avena', category: 'Granos', isCompleted: true },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Otros');

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const newItem: GroceryItem = {
        id: Date.now().toString(),
        name: newItemName,
        category: newItemCategory,
        isCompleted: false,
      };
      setGroceryItems([...groceryItems, newItem]);
      setNewItemName('');
      setNewItemCategory('Otros');
    }
  };

  const toggleItem = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const groupedItems = GROCERY_CATEGORIES.reduce((acc, category) => {
    acc[category.name] = groceryItems.filter((item) => item.category === category.name);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  return (
    <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      {/* Add Item Section */}
      <div style={{
        backgroundColor: colors.lightCream,
        border: `2px solid ${colors.tan}`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
      }}>
        <input
          type="text"
          placeholder="Nombre del artículo"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={{
            flex: 1,
            border: `1px solid ${colors.tan}`,
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '14px',
            color: colors.dark,
          }}
        />
        <select
          value={newItemCategory}
          onChange={(e) => setNewItemCategory(e.target.value)}
          style={{
            border: `1px solid ${colors.tan}`,
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '14px',
            color: colors.dark,
            backgroundColor: colors.paper,
          }}
        >
          {GROCERY_CATEGORIES.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddItem}
          style={{
            backgroundColor: colors.success,
            border: 'none',
            color: colors.paper,
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          Añadir
        </button>
      </div>

      {/* Categorized Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {GROCERY_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.dark,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>{category.emoji}</span>
              {category.name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupedItems[category.name] && groupedItems[category.name].length > 0 ? (
                groupedItems[category.name].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      backgroundColor: colors.lightCream,
                      border: `1px solid ${colors.tan}`,
                      borderRadius: '6px',
                    }}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      style={{
                        backgroundColor: item.isCompleted ? colors.success : colors.paper,
                        border: `2px solid ${colors.success}`,
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {item.isCompleted && <Check size={16} color={colors.paper} />}
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: item.isCompleted ? colors.tan : colors.dark,
                        textDecoration: item.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => setGroceryItems((prev) => prev.filter((i) => i.id !== item.id))}
                      style={{
                        backgroundColor: colors.dangerLight,
                        border: 'none',
                        color: colors.danger,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: colors.tan, fontStyle: 'italic' }}>
                  Sin artículos
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component: Kitchen Conversions Tab
function KitchenConversionsTab() {
  const [amount, setAmount] = useState('1');
  const [fromUnit, setFromUnit] = useState('cup');
  const [toUnit, setToUnit] = useState('ml');
  const [ovenTemp, setOvenTemp] = useState('180');
  const [ovenUnit, setOvenUnit] = useState<'C' | 'F'>('C');

  const volumeConversions: Record<string, number> = {
    cup: 236.588, ml: 1, l: 1000, tbsp: 14.787, tsp: 4.929, oz_fl: 29.574, gal: 3785.41,
  };

  const weightConversions: Record<string, number> = {
    g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
  };

  const volumeUnits = [
    { key: 'cup', label: 'Tazas (cup)' },
    { key: 'ml', label: 'Mililitros (ml)' },
    { key: 'l', label: 'Litros (l)' },
    { key: 'tbsp', label: 'Cucharadas (tbsp)' },
    { key: 'tsp', label: 'Cucharaditas (tsp)' },
    { key: 'oz_fl', label: 'Onzas líq. (fl oz)' },
    { key: 'gal', label: 'Galones' },
  ];

  const weightUnits = [
    { key: 'g', label: 'Gramos (g)' },
    { key: 'kg', label: 'Kilogramos (kg)' },
    { key: 'oz', label: 'Onzas (oz)' },
    { key: 'lb', label: 'Libras (lb)' },
  ];

  const allUnits = [...volumeUnits, ...weightUnits];

  const convert = (): string => {
    const val = parseFloat(amount);
    if (isNaN(val)) return '—';
    const isFromVol = fromUnit in volumeConversions;
    const isToVol = toUnit in volumeConversions;
    const isFromWt = fromUnit in weightConversions;
    const isToWt = toUnit in weightConversions;
    if (isFromVol && isToVol) {
      return (val * volumeConversions[fromUnit] / volumeConversions[toUnit]).toFixed(2);
    }
    if (isFromWt && isToWt) {
      return (val * weightConversions[fromUnit] / weightConversions[toUnit]).toFixed(2);
    }
    return 'No compatible';
  };

  const convertTemp = (): string => {
    const t = parseFloat(ovenTemp);
    if (isNaN(t)) return '—';
    if (ovenUnit === 'C') return `${Math.round(t * 9 / 5 + 32)} °F`;
    return `${Math.round((t - 32) * 5 / 9)} °C`;
  };

  const portionSizes = [
    { food: 'Arroz cocido', portion: '1 taza', grams: '185 g', calories: 205 },
    { food: 'Pechuga de pollo', portion: '1 palma', grams: '120 g', calories: 165 },
    { food: 'Pasta cocida', portion: '1 taza', grams: '140 g', calories: 220 },
    { food: 'Aceite de oliva', portion: '1 cucharada', grams: '14 g', calories: 120 },
    { food: 'Mantequilla', portion: '1 cucharada', grams: '14 g', calories: 100 },
    { food: 'Avena', portion: '½ taza', grams: '40 g', calories: 150 },
    { food: 'Plátano', portion: '1 mediano', grams: '118 g', calories: 105 },
    { food: 'Huevo', portion: '1 grande', grams: '50 g', calories: 72 },
    { food: 'Leche entera', portion: '1 taza', grams: '244 ml', calories: 149 },
    { food: 'Queso cheddar', portion: '1 rebanada', grams: '28 g', calories: 113 },
  ];

  const ovenTemps = [
    { desc: 'Muy bajo', c: '120°C', f: '250°F', uso: 'Merengues, deshidratar' },
    { desc: 'Bajo', c: '150°C', f: '300°F', uso: 'Guisos lentos' },
    { desc: 'Moderado', c: '180°C', f: '350°F', uso: 'Pasteles, galletas' },
    { desc: 'Medio-alto', c: '200°C', f: '400°F', uso: 'Verduras asadas' },
    { desc: 'Alto', c: '220°C', f: '425°F', uso: 'Pizza, pan' },
    { desc: 'Muy alto', c: '250°C', f: '480°F', uso: 'Gratinados, sellado' },
  ];

  const C = colors;
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '10px', padding: '20px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      {/* Unit Converter */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1.1rem' }}>
          🔄 Conversor de Unidades
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '80px' }}>
            <label style={{ fontSize: '0.8rem', color: C.medium, display: 'block', marginBottom: '4px' }}>Cantidad</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '1rem', backgroundColor: C.cream }}
            />
          </div>
          <div style={{ flex: 2, minWidth: '120px' }}>
            <label style={{ fontSize: '0.8rem', color: C.medium, display: 'block', marginBottom: '4px' }}>De</label>
            <select
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream }}
            >
              <optgroup label="Volumen">
                {volumeUnits.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
              </optgroup>
              <optgroup label="Peso">
                {weightUnits.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
              </optgroup>
            </select>
          </div>
          <div style={{ fontSize: '1.5rem', color: C.accent, fontWeight: 'bold', padding: '0 8px' }}>→</div>
          <div style={{ flex: 2, minWidth: '120px' }}>
            <label style={{ fontSize: '0.8rem', color: C.medium, display: 'block', marginBottom: '4px' }}>A</label>
            <select
              value={toUnit}
              onChange={e => setToUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream }}
            >
              <optgroup label="Volumen">
                {volumeUnits.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
              </optgroup>
              <optgroup label="Peso">
                {weightUnits.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: C.lightCream, borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: C.medium }}>{amount} {allUnits.find(u => u.key === fromUnit)?.label} = </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: C.accent }}>{convert()}</span>
          <span style={{ fontSize: '0.9rem', color: C.medium }}> {allUnits.find(u => u.key === toUnit)?.label}</span>
        </div>
      </div>

      {/* Oven Temperature Converter */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1.1rem' }}>
          🌡️ Temperaturas de Horno
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: C.medium, display: 'block', marginBottom: '4px' }}>Temperatura</label>
            <input
              type="number"
              value={ovenTemp}
              onChange={e => setOvenTemp(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '1rem', backgroundColor: C.cream }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: C.medium, display: 'block', marginBottom: '4px' }}>Unidad</label>
            <select
              value={ovenUnit}
              onChange={e => setOvenUnit(e.target.value as 'C' | 'F')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream }}
            >
              <option value="C">°Celsius</option>
              <option value="F">°Fahrenheit</option>
            </select>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: C.lightCream, borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', color: C.accent }}>
            = {convertTemp()}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: C.cream }}>
              {['Nivel', '°C', '°F', 'Uso común'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', color: C.warm, fontWeight: '600', borderBottom: `1px solid ${C.tan}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ovenTemps.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.paper : C.lightCream }}>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.dark, fontWeight: '500' }}>{row.desc}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.dark }}>{row.c}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.dark }}>{row.f}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.medium }}>{row.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portion Guide */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', fontSize: '1.1rem' }}>
          🍽️ Guía de Porciones
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: C.cream }}>
              {['Alimento', 'Porción', 'Peso', 'Calorías'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', color: C.warm, fontWeight: '600', borderBottom: `1px solid ${C.tan}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portionSizes.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.paper : C.lightCream }}>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.dark, fontWeight: '500' }}>{row.food}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.dark }}>{row.portion}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.medium }}>{row.grams}</td>
                <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: C.accent, fontWeight: '600' }}>{row.calories} kcal</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Component: Ingredients Database Tab
function IngredientsTab() {
  const C = colors;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  interface Ingredient {
    name: string;
    category: string;
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    allergens: string[];
    alternatives: string[];
  }

  const ingredients: Ingredient[] = [
    { name: 'Pechuga de Pollo', category: 'Proteínas', cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, allergens: [], alternatives: ['Pavo', 'Tofu'] },
    { name: 'Arroz Blanco', category: 'Granos', cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, allergens: [], alternatives: ['Arroz integral', 'Quinoa'] },
    { name: 'Huevo Entero', category: 'Proteínas', cal: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, allergens: ['Huevo'], alternatives: ['Tofu revuelto', 'Claras'] },
    { name: 'Salmón', category: 'Proteínas', cal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, allergens: ['Pescado'], alternatives: ['Atún', 'Trucha'] },
    { name: 'Avena', category: 'Granos', cal: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, allergens: ['Gluten'], alternatives: ['Quinoa flakes', 'Arroz inflado'] },
    { name: 'Plátano', category: 'Frutas', cal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, allergens: [], alternatives: ['Mango', 'Papaya'] },
    { name: 'Brócoli', category: 'Verduras', cal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, allergens: [], alternatives: ['Coliflor', 'Espinaca'] },
    { name: 'Leche Entera', category: 'Lácteos', cal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, allergens: ['Lácteos'], alternatives: ['Leche de almendra', 'Leche de avena'] },
    { name: 'Aguacate', category: 'Frutas', cal: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, allergens: [], alternatives: ['Aceite de oliva', 'Hummus'] },
    { name: 'Frijoles Negros', category: 'Legumbres', cal: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, allergens: [], alternatives: ['Lentejas', 'Garbanzos'] },
    { name: 'Quinoa', category: 'Granos', cal: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, allergens: [], alternatives: ['Cuscús', 'Bulgur'] },
    { name: 'Yogur Griego', category: 'Lácteos', cal: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0, allergens: ['Lácteos'], alternatives: ['Yogur de coco', 'Skyr'] },
    { name: 'Batata', category: 'Verduras', cal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, allergens: [], alternatives: ['Papa', 'Calabaza'] },
    { name: 'Almendras', category: 'Frutos Secos', cal: 579, protein: 21, carbs: 22, fat: 50, fiber: 13, allergens: ['Frutos secos'], alternatives: ['Nueces', 'Semillas de girasol'] },
    { name: 'Tofu Firme', category: 'Proteínas', cal: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, allergens: ['Soja'], alternatives: ['Tempeh', 'Seitán'] },
    { name: 'Espinaca', category: 'Verduras', cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, allergens: [], alternatives: ['Kale', 'Acelga'] },
    { name: 'Aceite de Oliva', category: 'Grasas', cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, allergens: [], alternatives: ['Aceite de coco', 'Aceite de aguacate'] },
    { name: 'Pasta Integral', category: 'Granos', cal: 124, protein: 5, carbs: 25, fat: 0.5, fiber: 3.2, allergens: ['Gluten'], alternatives: ['Pasta de lentejas', 'Pasta de arroz'] },
  ];

  const categories = ['Todos', ...Array.from(new Set(ingredients.map(i => i.category)))];

  const filtered = ingredients.filter(ing => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'Todos' || ing.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '600px' }}>
      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar ingrediente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream }}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ flex: 1, minWidth: '150px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.tan}`, fontSize: '0.9rem', backgroundColor: C.cream }}
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Results Count */}
      <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 16px 0' }}>
        {filtered.length} ingrediente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Ingredient Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(ing => (
          <div key={ing.name} style={{
            backgroundColor: C.paper, borderRadius: '10px', border: `1px solid ${expanded === ing.name ? C.accent : C.tan}`,
            overflow: 'hidden', transition: 'all 0.2s',
          }}>
            {/* Row */}
            <button onClick={() => setExpanded(expanded === ing.name ? null : ing.name)} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', width: '100%',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: C.dark, flex: 1 }}>{ing.name}</span>
              <span style={{ fontSize: '0.75rem', color: C.warm, backgroundColor: C.lightCream, padding: '4px 10px', borderRadius: '12px' }}>{ing.category}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: C.accent, minWidth: '60px', textAlign: 'right' }}>{ing.cal} kcal</span>
              <span style={{ fontSize: '0.8rem', color: C.warm }}>{expanded === ing.name ? '▲' : '▼'}</span>
            </button>

            {/* Expanded Detail */}
            {expanded === ing.name && (
              <div style={{ padding: '0 18px 18px 18px' }}>
                {/* Macros Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Proteína', value: `${ing.protein}g`, color: '#E74C3C' },
                    { label: 'Carbos', value: `${ing.carbs}g`, color: '#3498DB' },
                    { label: 'Grasa', value: `${ing.fat}g`, color: '#F39C12' },
                    { label: 'Fibra', value: `${ing.fiber}g`, color: '#27AE60' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', padding: '10px', backgroundColor: C.lightCream, borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '0.7rem', color: C.warm }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.8rem', color: C.medium, margin: '0 0 4px 0' }}>
                  <strong>Valores por 100g</strong>
                </p>

                {/* Allergens */}
                {ing.allergens.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.danger }}>⚠️ Alérgenos: </span>
                    {ing.allergens.map(a => (
                      <span key={a} style={{ fontSize: '0.75rem', backgroundColor: C.dangerLight, color: C.danger, padding: '2px 8px', borderRadius: '10px', marginRight: '4px' }}>{a}</span>
                    ))}
                  </div>
                )}

                {/* Alternatives */}
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: C.info }}>🔄 Alternativas: </span>
                  {ing.alternatives.map(a => (
                    <span key={a} style={{ fontSize: '0.75rem', backgroundColor: C.infoLight, color: C.info, padding: '2px 8px', borderRadius: '10px', marginRight: '4px' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Component: Nutrition Page
export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState('planner');

  const tabs = [
    { id: 'planner', label: 'Planificador de Comidas', component: <MealPlannerTab /> },
    { id: 'log', label: 'Registro Diario', component: <DailyLogTab /> },
    { id: 'recipes', label: 'Recetario', component: <RecipeBookTab /> },
    { id: 'grocery', label: 'Lista de Compras', component: <GroceryListTab /> },
    { id: 'conversions', label: 'Conversiones', component: <KitchenConversionsTab /> },
    { id: 'ingredients', label: 'Ingredientes', component: <IngredientsTab /> },
  ];

  return (
    <div style={{
      backgroundColor: colors.warmWhite,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
    }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.brown,
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: 'bold',
            color: colors.cream,
            margin: 0,
          }}
        >
          Nutrición
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: colors.tan,
            margin: '8px 0 0 0',
          }}
        >
          Gestiona tus comidas, recetas y nutrientes
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: `2px solid ${colors.tan}`,
          backgroundColor: colors.cream,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: activeTab === tab.id ? colors.lightCream : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${colors.accent}` : 'none',
              color: activeTab === tab.id ? colors.dark : colors.medium,
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: colors.paper }}>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
