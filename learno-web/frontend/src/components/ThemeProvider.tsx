'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { getStudentCondition } from '@/lib/getStudentCondition';
import { themes, type Condition } from '@/lib/themes';

interface ThemeProviderProps {
  condition?: Condition;
  children: ReactNode;
}

const hexToRgb = (value: string): string => {
  const normalized = value.trim();
  const hex = normalized.startsWith('#') ? normalized.slice(1) : normalized;

  if (hex.length !== 6) {
    return '111 168 220';
  }

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return '111 168 220';
  }

  return `${r} ${g} ${b}`;
};

const conditionUiSettings: Record<
  Condition,
  {
    fontFamily: string;
    dashboardFilter: string;
    fontScale: string;
    particlesOpacity: string;
    particlesCount: string;
    heroGradient: string;
    heroGlow: string;
    cardGradientA: string;
    cardGradientB: string;
    cardRadius: string;
    cardBorderWidth: string;
    cardShadow: string;
    cardNoiseOpacity: string;
    motionDuration: string;
    motionCurve: string;
    attentionRing: string;
    accentSoftOpacity: string;
    progressStripe: string;
    moodScale: string;
    focusGlow: string;
  }
> = {
  default: {
    fontFamily: 'Lexend, "Segoe UI", system-ui, sans-serif',
    dashboardFilter: 'none',
    fontScale: '1',
    particlesOpacity: '0.6',
    particlesCount: '35',
    heroGradient: 'linear-gradient(135deg, #6FA8DC, #A7C7E7)',
    heroGlow: 'rgba(111, 168, 220, 0.24)',
    cardGradientA: 'rgba(111, 168, 220, 0.11)',
    cardGradientB: 'rgba(44, 62, 80, 0.07)',
    cardRadius: '18px',
    cardBorderWidth: '1px',
    cardShadow: '0 12px 32px rgba(34, 54, 72, 0.08)',
    cardNoiseOpacity: '0.04',
    motionDuration: '320ms',
    motionCurve: 'cubic-bezier(0.22, 1, 0.36, 1)',
    attentionRing: 'rgba(111, 168, 220, 0.24)',
    accentSoftOpacity: '0.16',
    progressStripe: 'rgba(255, 255, 255, 0.32)',
    moodScale: '1.05',
    focusGlow: 'rgba(111, 168, 220, 0.18)',
  },
  adhd: {
    fontFamily: 'Lexend, "Segoe UI", system-ui, sans-serif',
    dashboardFilter: 'saturate(0.98) contrast(1.02)',
    fontScale: '1',
    particlesOpacity: '0.52',
    particlesCount: '26',
    heroGradient: 'linear-gradient(140deg, #2C3E50, #5E7896)',
    heroGlow: 'rgba(84, 195, 239, 0.26)',
    cardGradientA: 'rgba(84, 195, 239, 0.14)',
    cardGradientB: 'rgba(111, 168, 220, 0.08)',
    cardRadius: '16px',
    cardBorderWidth: '1px',
    cardShadow: '0 10px 30px rgba(22, 40, 57, 0.08)',
    cardNoiseOpacity: '0.025',
    motionDuration: '180ms',
    motionCurve: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    attentionRing: 'rgba(84, 195, 239, 0.32)',
    accentSoftOpacity: '0.22',
    progressStripe: 'rgba(84, 195, 239, 0.28)',
    moodScale: '1.1',
    focusGlow: 'rgba(84, 195, 239, 0.2)',
  },
  asd: {
    fontFamily: 'Lexend, "Segoe UI", system-ui, sans-serif',
    dashboardFilter: 'hue-rotate(-10deg) saturate(0.84) contrast(1.01) brightness(1.01)',
    fontScale: '1',
    particlesOpacity: '0.3',
    particlesCount: '18',
    heroGradient: 'linear-gradient(145deg, #5E7668, #7A9E87)',
    heroGlow: 'rgba(122, 158, 135, 0.18)',
    cardGradientA: 'rgba(122, 158, 135, 0.11)',
    cardGradientB: 'rgba(196, 168, 130, 0.08)',
    cardRadius: '16px',
    cardBorderWidth: '1px',
    cardShadow: '0 8px 24px rgba(62, 78, 67, 0.08)',
    cardNoiseOpacity: '0.015',
    motionDuration: '460ms',
    motionCurve: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
    attentionRing: 'rgba(122, 158, 135, 0.24)',
    accentSoftOpacity: '0.14',
    progressStripe: 'rgba(255, 255, 255, 0.24)',
    moodScale: '1.03',
    focusGlow: 'rgba(122, 158, 135, 0.15)',
  },
  dyslexia: {
    fontFamily: 'OpenDyslexic, Lexend, Inter, sans-serif',
    dashboardFilter: 'none',
    fontScale: '1.08',
    particlesOpacity: '0.4',
    particlesCount: '22',
    heroGradient: 'linear-gradient(140deg, #6E9CC0, #A9BFD0)',
    heroGlow: 'rgba(110, 156, 192, 0.18)',
    cardGradientA: 'rgba(233, 226, 183, 0.18)',
    cardGradientB: 'rgba(230, 184, 122, 0.1)',
    cardRadius: '14px',
    cardBorderWidth: '1px',
    cardShadow: '0 9px 26px rgba(61, 90, 74, 0.09)',
    cardNoiseOpacity: '0.03',
    motionDuration: '340ms',
    motionCurve: 'cubic-bezier(0.22, 0.9, 0.32, 1)',
    attentionRing: 'rgba(110, 156, 192, 0.22)',
    accentSoftOpacity: '0.18',
    progressStripe: 'rgba(255, 253, 208, 0.36)',
    moodScale: '1.06',
    focusGlow: 'rgba(110, 156, 192, 0.16)',
  },
  dyscalculia: {
    fontFamily: 'Lexend, Inter, system-ui, sans-serif',
    dashboardFilter: 'hue-rotate(-4deg) saturate(0.98) contrast(1.01)',
    fontScale: '1.06',
    particlesOpacity: '0.44',
    particlesCount: '24',
    heroGradient: 'linear-gradient(140deg, #D9935E, #E8B27A)',
    heroGlow: 'rgba(217, 147, 94, 0.2)',
    cardGradientA: 'rgba(233, 188, 133, 0.14)',
    cardGradientB: 'rgba(118, 169, 137, 0.08)',
    cardRadius: '20px',
    cardBorderWidth: '1px',
    cardShadow: '0 11px 28px rgba(153, 107, 71, 0.11)',
    cardNoiseOpacity: '0.025',
    motionDuration: '280ms',
    motionCurve: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    attentionRing: 'rgba(217, 147, 94, 0.25)',
    accentSoftOpacity: '0.2',
    progressStripe: 'rgba(255, 255, 255, 0.3)',
    moodScale: '1.07',
    focusGlow: 'rgba(217, 147, 94, 0.16)',
  },
  anxiety: {
    fontFamily: 'Lexend, "Segoe UI", system-ui, sans-serif',
    dashboardFilter: 'hue-rotate(10deg) saturate(0.84) brightness(1.02)',
    fontScale: '1',
    particlesOpacity: '0.28',
    particlesCount: '16',
    heroGradient: 'linear-gradient(145deg, #8D9BD9, #B1B8E8)',
    heroGlow: 'rgba(177, 184, 232, 0.16)',
    cardGradientA: 'rgba(177, 184, 232, 0.11)',
    cardGradientB: 'rgba(230, 230, 250, 0.1)',
    cardRadius: '22px',
    cardBorderWidth: '1px',
    cardShadow: '0 8px 24px rgba(70, 83, 128, 0.08)',
    cardNoiseOpacity: '0.015',
    motionDuration: '520ms',
    motionCurve: 'cubic-bezier(0.26, 0.85, 0.38, 1)',
    attentionRing: 'rgba(177, 184, 232, 0.2)',
    accentSoftOpacity: '0.12',
    progressStripe: 'rgba(255, 255, 255, 0.22)',
    moodScale: '1.02',
    focusGlow: 'rgba(177, 184, 232, 0.13)',
  },
  depression: {
    fontFamily: 'Lexend, "Segoe UI", system-ui, sans-serif',
    dashboardFilter: 'hue-rotate(16deg) saturate(0.84) brightness(1.03)',
    fontScale: '1',
    particlesOpacity: '0.34',
    particlesCount: '20',
    heroGradient: 'linear-gradient(145deg, #9D7F55, #C89B62)',
    heroGlow: 'rgba(232, 184, 109, 0.2)',
    cardGradientA: 'rgba(232, 184, 109, 0.12)',
    cardGradientB: 'rgba(244, 164, 96, 0.09)',
    cardRadius: '20px',
    cardBorderWidth: '1px',
    cardShadow: '0 10px 26px rgba(112, 85, 47, 0.11)',
    cardNoiseOpacity: '0.02',
    motionDuration: '380ms',
    motionCurve: 'cubic-bezier(0.24, 0.9, 0.32, 1)',
    attentionRing: 'rgba(232, 184, 109, 0.22)',
    accentSoftOpacity: '0.16',
    progressStripe: 'rgba(255, 248, 236, 0.3)',
    moodScale: '1.04',
    focusGlow: 'rgba(232, 184, 109, 0.15)',
  },
};

const applyConditionTheme = (condition: Condition) => {
  const theme = themes[condition] ?? themes.default;
  const root = document.documentElement;

  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }

  root.style.setProperty('--background', theme['--color-bg']);
  root.style.setProperty('--card', theme['--color-surface']);
  root.style.setProperty('--popover', theme['--color-surface']);
  root.style.setProperty('--primary', theme['--color-primary']);
  root.style.setProperty('--accent', theme['--color-accent']);
  root.style.setProperty('--foreground', theme['--color-text']);
  root.style.setProperty('--muted-foreground', theme['--color-text-muted']);
  root.style.setProperty('--border', theme['--color-border']);

  root.style.setProperty('--student-primary-rgb', hexToRgb(theme['--color-primary']));
  root.style.setProperty('--student-accent-rgb', hexToRgb(theme['--color-accent']));

  const ui = conditionUiSettings[condition] ?? conditionUiSettings.default;
  root.style.setProperty('--student-font-family', ui.fontFamily);
  root.style.setProperty('--student-dashboard-filter', ui.dashboardFilter);
  root.style.setProperty('--student-font-scale', ui.fontScale);
  root.style.setProperty('--student-particles-opacity', ui.particlesOpacity);
  root.style.setProperty('--student-particles-count', ui.particlesCount);
  root.style.setProperty('--student-hero-gradient', ui.heroGradient);
  root.style.setProperty('--student-hero-glow', ui.heroGlow);
  root.style.setProperty('--student-card-gradient-a', ui.cardGradientA);
  root.style.setProperty('--student-card-gradient-b', ui.cardGradientB);
  root.style.setProperty('--student-card-radius', ui.cardRadius);
  root.style.setProperty('--student-card-border-width', ui.cardBorderWidth);
  root.style.setProperty('--student-card-shadow', ui.cardShadow);
  root.style.setProperty('--student-card-noise-opacity', ui.cardNoiseOpacity);
  root.style.setProperty('--student-motion-duration', ui.motionDuration);
  root.style.setProperty('--student-motion-curve', ui.motionCurve);
  root.style.setProperty('--student-attention-ring', ui.attentionRing);
  root.style.setProperty('--student-accent-soft-opacity', ui.accentSoftOpacity);
  root.style.setProperty('--student-progress-stripe', ui.progressStripe);
  root.style.setProperty('--student-mood-scale', ui.moodScale);
  root.style.setProperty('--student-focus-glow', ui.focusGlow);
  root.setAttribute('data-student-condition', condition);
};

export function ThemeProvider({ condition = 'default', children }: ThemeProviderProps) {
  const { token } = useStoredAuth();
  const [resolvedCondition, setResolvedCondition] = useState<Condition>(condition);

  useEffect(() => {
    setResolvedCondition(condition);
  }, [condition]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setResolvedCondition(condition);
      return () => {
        isMounted = false;
      };
    }

    getStudentCondition(token)
      .then((nextCondition) => {
        if (isMounted) {
          setResolvedCondition(nextCondition);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedCondition(condition);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [condition, token]);

  useEffect(() => {
    applyConditionTheme(resolvedCondition);
  }, [resolvedCondition]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-student-condition');
    };
  }, []);

  return <>{children}</>;
}
