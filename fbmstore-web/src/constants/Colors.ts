const tintColorLight = '#6366f1'; // Indigo vibrante
const tintColorDark = '#818cf8';

export default {
  light: {
    text: '#1e293b', // Slate 800
    background: '#f8fafc', // Slate 50
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary: '#4f46e5', // Indigo 600 (Cor principal do botão)
    secondary: '#0f172a', // Slate 900 (Cor de destaque/fundo escuro)
    success: '#10b981', // Emerald 500
    danger: '#ef4444', // Red 500
    warning: '#f59e0b',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a', // Slate 900 (Fundo escuro moderno)
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#6366f1', 
    secondary: '#1e293b',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    card: '#1e293b', // Cards escuros
    border: '#334155',
  },
};