import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/app-store';

// Reset store state before each test
beforeEach(() => {
  useAppStore.setState({
    activePage: 'home',
    sidebarOpen: true,
    fitnessTab: 'entrenamiento',
    financeTab: 'resumen',
    nutritionTab: 'diario',
    organizationTab: 'notas',
    wellnessSubTab: 'sleep',
    productivitySubTab: 'habits',
    planTab: 'today',
    showMonthlySummary: false,
    showWeeklySummary: false,
  });
});

describe('useAppStore — initial state', () => {
  it('activePage defaults to "home"', () => {
    expect(useAppStore.getState().activePage).toBe('home');
  });

  it('sidebarOpen defaults to true', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });

  it('fitnessTab defaults to "entrenamiento"', () => {
    expect(useAppStore.getState().fitnessTab).toBe('entrenamiento');
  });
});

describe('useAppStore — setActivePage()', () => {
  it('changes the active page', () => {
    useAppStore.getState().setActivePage('fitness');
    expect(useAppStore.getState().activePage).toBe('fitness');
  });

  it('successive calls update the page', () => {
    useAppStore.getState().setActivePage('finance');
    useAppStore.getState().setActivePage('vision');
    expect(useAppStore.getState().activePage).toBe('vision');
  });
});

describe('useAppStore — toggleSidebar()', () => {
  it('toggles sidebar from true to false', () => {
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('toggles sidebar back to true on second call', () => {
    useAppStore.getState().toggleSidebar();
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });
});

describe('useAppStore — setPageFromURL()', () => {
  it('sets page correctly with a valid tab', () => {
    useAppStore.getState().setPageFromURL('fitness', 'volumen');
    expect(useAppStore.getState().activePage).toBe('fitness');
    expect(useAppStore.getState().fitnessTab).toBe('volumen');
  });

  it('sets page but ignores invalid tab', () => {
    const before = useAppStore.getState().fitnessTab;
    useAppStore.getState().setPageFromURL('fitness', 'not-a-real-tab');
    expect(useAppStore.getState().activePage).toBe('fitness');
    expect(useAppStore.getState().fitnessTab).toBe(before); // unchanged
  });

  it('sets page without tab', () => {
    useAppStore.getState().setPageFromURL('home');
    expect(useAppStore.getState().activePage).toBe('home');
  });

  it('sets wellness sub-tab for valid value', () => {
    useAppStore.getState().setPageFromURL('wellness', 'hydration');
    expect(useAppStore.getState().wellnessSubTab).toBe('hydration');
  });

  it('sets productivity sub-tab for valid value', () => {
    useAppStore.getState().setPageFromURL('productivity', 'pomodoro');
    expect(useAppStore.getState().productivitySubTab).toBe('pomodoro');
  });

  it('sets plan tab string for valid value', () => {
    useAppStore.getState().setPageFromURL('plan', 'week');
    expect(useAppStore.getState().planTab).toBe('week');
  });
});

describe('useAppStore — modal flags', () => {
  it('setShowMonthlySummary toggles flag', () => {
    useAppStore.getState().setShowMonthlySummary(true);
    expect(useAppStore.getState().showMonthlySummary).toBe(true);
    useAppStore.getState().setShowMonthlySummary(false);
    expect(useAppStore.getState().showMonthlySummary).toBe(false);
  });

  it('setShowWeeklySummary toggles flag', () => {
    useAppStore.getState().setShowWeeklySummary(true);
    expect(useAppStore.getState().showWeeklySummary).toBe(true);
  });
});
