// src/components/ui/FloatingLabelInput.tsx
import React, { forwardRef, useEffect, useMemo, useState } from 'react';

type CSSDimension = number | string;

type RNKeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'number-pad'
  | 'decimal-pad'
  | 'phone-pad'
  | 'url'
  | 'search';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  // evitamos colisões com props que vamos controlar
  'onChange' | 'size' | 'type' | 'autoCorrect' | 'autoCapitalize' | 'inputMode' | 'pattern'
> & {
  label: string;
  containerWidth?: CSSDimension;
  error?: boolean;

  // compat RN
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  autoCorrect?: boolean | 'on' | 'off';
  autoCapitalize?: 'none' | 'off' | 'on' | 'words' | 'sentences' | 'characters';
  keyboardType?: RNKeyboardType;
};

function mapKeyboard(
  k?: RNKeyboardType,
  secure?: boolean
): Pick<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'pattern' | 'autoComplete'> {
  if (secure) return { type: 'password', inputMode: 'text', autoComplete: 'current-password' };

  switch (k) {
    case 'email-address':
      return { type: 'email', inputMode: 'email', autoComplete: 'email' };
    case 'phone-pad':
      return { type: 'tel', inputMode: 'tel', autoComplete: 'tel' };
    case 'numeric':
    case 'number-pad':
      // evita spinner do number e restringe a dígitos
      return { type: 'text', inputMode: 'numeric', pattern: '[0-9]*', autoComplete: 'off' };
    case 'decimal-pad':
      return { type: 'text', inputMode: 'decimal', autoComplete: 'off' };
    case 'url':
      return { type: 'url', inputMode: 'url', autoComplete: 'url' };
    case 'search':
      return { type: 'search', inputMode: 'search', autoComplete: 'off' };
    default:
      return { type: 'text', inputMode: 'text' };
  }
}

const FloatingLabelInput = forwardRef<HTMLInputElement, Props>(({
  label,
  value,
  onFocus,
  onBlur,
  onChangeText,
  containerWidth = '100%',
  error = false,
  secureTextEntry,
  autoCorrect,
  autoCapitalize = 'off',
  keyboardType,
  style,
  placeholder = '',
  ...rest
}, ref) => {
  const [focused, setFocused] = useState(false);

  // 0 = base, 1 = flutuando
  const [animated, setAnimated] = useState(0);

  const isActive = focused || (!!value && String(value).length > 0);

  useEffect(() => {
    let raf = 0;
    const duration = 160;
    const start = performance.now();
    const from = animated;
    const to = isActive ? 1 : 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 2); // easeOutQuad
      setAnimated(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Interpolações
  const labelTop = useMemo(() => 16 + (-18 - 16) * animated, [animated]); // [16 -> -18]
  const labelFontSize = useMemo(() => 16 + (12 - 16) * animated, [animated]); // [16 -> 12]
  const labelStaticColor = error ? '#d32f2f' : isActive ? '#666' : '#777';

  // keyboard / type mapping
  const mapped = mapKeyboard(keyboardType, secureTextEntry);

  // autoCorrect compat (aceita boolean ou 'on'|'off')
  const autoCorrectString =
    typeof autoCorrect === 'boolean' ? (autoCorrect ? 'on' : 'off') : autoCorrect;

  // autoCapitalize compat: RN usa 'none'
  const autoCapitalizeString = autoCapitalize === 'none' ? 'off' : autoCapitalize;

  return (
    <div style={{ ...styles.container, width: containerWidth }}>
      <label
        style={{
          ...styles.label,
          top: labelTop,
          fontSize: labelFontSize,
          color: labelStaticColor,
          background: 'transparent',
        }}
      >
        {label}
      </label>

      <input
        {...rest}
        {...mapped}
        ref={ref}
        value={value as any}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          onChangeText?.(e.target.value);
        }}
        placeholder={placeholder}
        autoCorrect={autoCorrectString as any}
        spellCheck={autoCorrectString ? autoCorrectString === 'on' : undefined}
        autoCapitalize={autoCapitalizeString as any}
        style={{
          ...styles.input,
          borderColor: error ? '#d32f2f' : '#4f46e5',
          ...(style as React.CSSProperties),
        }}
        aria-invalid={error || undefined}
        aria-label={label}
      />
    </div>
  );
});

export default FloatingLabelInput;

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    marginTop: 12,
    marginBottom: 12,
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingLeft: 4,
    paddingRight: 4,
    lineHeight: 1.2,
    pointerEvents: 'none',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    width: '100%',
    background: 'transparent',
    color: '#111',
    outline: 'none',
    boxSizing: "border-box",
  },
};
