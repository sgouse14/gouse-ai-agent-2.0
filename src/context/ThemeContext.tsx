import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AccentTheme {
  id: string;
  name: string;
  discipline: string;
  description: string;
  materialRef: string;
  colors: {
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
  };
  rgb: string;
}

export type GridIntensity = 'subtle' | 'moderate' | 'prominent' | 'off';

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: 'amber',
    name: 'Drafting Amber',
    discipline: 'Classical Drafting & Joinery',
    description: 'Warm ochre and vintage brass compass tone inspired by traditional architectural vellum.',
    materialRef: 'Polished Brass & Aged Teak',
    colors: {
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
    },
    rgb: '245, 158, 11',
  },
  {
    id: 'cyan',
    name: 'Blueprint Cyan',
    discipline: 'Technical Plotting & CAD',
    description: 'Crisp technical drafting cyan reflecting cyanotype blueprint prints and precision CAD overlays.',
    materialRef: 'Cyanotype & Architectural Glass',
    colors: {
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
    },
    rgb: '6, 182, 212',
  },
  {
    id: 'emerald',
    name: 'Biophilic Sage',
    discipline: 'Sustainable Architecture & Landscape',
    description: 'Calming botanical green inspired by living walls, bioclimatic structures, and green building standards.',
    materialRef: 'Living Flora & Green Slate',
    colors: {
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
    },
    rgb: '16, 185, 129',
  },
  {
    id: 'terracotta',
    name: 'Terracotta Corten',
    discipline: 'Masonry & Structural Steel',
    description: 'Earthy warm copper and fired clay representing weathered Corten facade panels and kiln bricks.',
    materialRef: 'Corten Steel & Fired Terracotta',
    colors: {
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
    },
    rgb: '249, 115, 22',
  },
  {
    id: 'indigo',
    name: 'Nordic Indigo',
    discipline: 'Structural Engineering & BIM',
    description: 'Deep cobalt precision tone reflecting Scandinavian structural frameworks and digital spatial BIM nodes.',
    materialRef: 'Structural Cobalt & Anodized Metal',
    colors: {
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
    },
    rgb: '99, 102, 241',
  },
  {
    id: 'crimson',
    name: 'Bauhaus Crimson',
    discipline: 'Modernist Studio & Theory',
    description: 'Bold iconic Bauhaus red celebrating functionalist theory, Dessau studio typography, and geometric form.',
    materialRef: 'Lacquered Enamel & Modernist Red',
    colors: {
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
    },
    rgb: '244, 63, 94',
  },
  {
    id: 'titanium',
    name: 'Titanium Slate',
    discipline: 'Minimalist Raw Materials',
    description: 'Subtle architectural monochrome reflecting exposed cast-in-place concrete, brushed steel, and slate.',
    materialRef: 'Fair-Face Concrete & Titanium',
    colors: {
      200: '#f1f5f9',
      300: '#e2e8f0',
      400: '#cbd5e1',
      500: '#94a3b8',
      600: '#64748b',
    },
    rgb: '148, 163, 184',
  },
];

interface ThemeContextType {
  currentTheme: AccentTheme;
  setAccentThemeId: (id: string) => void;
  gridIntensity: GridIntensity;
  setGridIntensity: (intensity: GridIntensity) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_accent_theme');
      if (saved && ACCENT_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'amber';
  });

  const [gridIntensity, setGridIntensity] = useState<GridIntensity>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_grid_intensity');
      if (saved && ['subtle', 'moderate', 'prominent', 'off'].includes(saved)) {
        return saved as GridIntensity;
      }
    } catch {
      // Fallback
    }
    return 'subtle';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentTheme = ACCENT_THEMES.find((t) => t.id === themeId) || ACCENT_THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_accent_theme', themeId);
    } catch {
      // Ignore
    }

    // Apply color palette custom properties to documentElement
    const root = document.documentElement;
    root.style.setProperty('--color-amber-200', currentTheme.colors['200']);
    root.style.setProperty('--color-amber-300', currentTheme.colors['300']);
    root.style.setProperty('--color-amber-400', currentTheme.colors['400']);
    root.style.setProperty('--color-amber-500', currentTheme.colors['500']);
    root.style.setProperty('--color-amber-600', currentTheme.colors['600']);
    root.style.setProperty('--accent-primary', currentTheme.colors['500']);
    root.style.setProperty('--accent-rgb', currentTheme.rgb);
    root.setAttribute('data-accent-theme', currentTheme.id);
  }, [currentTheme, themeId]);

  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_grid_intensity', gridIntensity);
    } catch {
      // Ignore
    }
  }, [gridIntensity]);

  const resetToDefaults = () => {
    setThemeId('amber');
    setGridIntensity('subtle');
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setAccentThemeId: setThemeId,
        gridIntensity,
        setGridIntensity,
        isSettingsOpen,
        setIsSettingsOpen,
        resetToDefaults,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
