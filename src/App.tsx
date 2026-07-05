import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import './index.css';

type Tokens = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  radius: number;
  borderWidth: number;
  spacing: number;
  baseSize: number;
  typeScale: number;
};

type Preset = { name: string; tokens: Tokens };

const presets: Preset[] = [
  {
    name: 'Graphite',
    tokens: {
      background: '#0a0a0b',
      surface: '#141517',
      text: '#f0f0f0',
      muted: '#a1a4a5',
      accent: '#ffffff',
      radius: 12,
      borderWidth: 1,
      spacing: 16,
      baseSize: 16,
      typeScale: 1.25,
    },
  },
  {
    name: 'Paper',
    tokens: {
      background: '#f7f4ee',
      surface: '#fffdf9',
      text: '#211f1a',
      muted: '#726c60',
      accent: '#211f1a',
      radius: 6,
      borderWidth: 1,
      spacing: 16,
      baseSize: 16,
      typeScale: 1.2,
    },
  },
  {
    name: 'Indigo',
    tokens: {
      background: '#0b0d1a',
      surface: '#12152b',
      text: '#e8eaf6',
      muted: '#8b90b3',
      accent: '#6e7cf5',
      radius: 16,
      borderWidth: 1,
      spacing: 18,
      baseSize: 16,
      typeScale: 1.3,
    },
  },
  {
    name: 'Terracotta',
    tokens: {
      background: '#f4ece3',
      surface: '#fdf8f2',
      text: '#2c1e15',
      muted: '#8a7466',
      accent: '#c4502c',
      radius: 10,
      borderWidth: 2,
      spacing: 14,
      baseSize: 15,
      typeScale: 1.22,
    },
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function idealInk(hex: string): string {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff')
    ? '#000000'
    : '#ffffff';
}

function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

function buildCss(tokens: Tokens, accentInk: string): string {
  return [
    ':root {',
    `  --color-background: ${tokens.background};`,
    `  --color-surface: ${tokens.surface};`,
    `  --color-text: ${tokens.text};`,
    `  --color-muted: ${tokens.muted};`,
    `  --color-accent: ${tokens.accent};`,
    `  --color-accent-contrast: ${accentInk};`,
    `  --radius: ${tokens.radius}px;`,
    `  --border-width: ${tokens.borderWidth}px;`,
    `  --space-unit: ${tokens.spacing}px;`,
    `  --font-size-base: ${tokens.baseSize}px;`,
    `  --type-scale: ${tokens.typeScale};`,
    '}',
  ].join('\n');
}

function buildJson(tokens: Tokens, accentInk: string): string {
  return JSON.stringify(
    {
      color: {
        background: tokens.background,
        surface: tokens.surface,
        text: tokens.text,
        muted: tokens.muted,
        accent: tokens.accent,
        accentContrast: accentInk,
      },
      shape: {
        radius: `${tokens.radius}px`,
        borderWidth: `${tokens.borderWidth}px`,
      },
      space: { unit: `${tokens.spacing}px` },
      type: { base: `${tokens.baseSize}px`, scale: tokens.typeScale },
    },
    null,
    2,
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
        <code>{value}</code>
      </span>
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        <code>
          {value}
          {unit}
        </code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}

function ContrastBadge({ label, ratio }: { label: string; ratio: number }) {
  const level = wcagLevel(ratio);
  const tone = level === 'Fail' ? 'bad' : level === 'AA Large' ? 'warn' : 'good';
  return (
    <div className={`contrast contrast--${tone}`}>
      <span className="contrast__label">{label}</span>
      <span className="contrast__value">
        {ratio.toFixed(2)}:1 <strong>{level}</strong>
      </span>
    </div>
  );
}

export default function App() {
  const [tokens, setTokens] = useState<Tokens>(presets[0].tokens);
  const [exportFormat, setExportFormat] = useState<'css' | 'json'>('css');
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Tokens>(key: K, value: Tokens[K]) => {
    setTokens((current) => ({ ...current, [key]: value }));
  };

  const accentInk = useMemo(() => idealInk(tokens.accent), [tokens.accent]);

  const previewVars = useMemo(() => {
    const scale = tokens.typeScale;
    const base = tokens.baseSize;
    return {
      '--dt-bg': tokens.background,
      '--dt-surface': tokens.surface,
      '--dt-text': tokens.text,
      '--dt-muted': tokens.muted,
      '--dt-accent': tokens.accent,
      '--dt-accent-ink': accentInk,
      '--dt-radius': `${tokens.radius}px`,
      '--dt-border-w': `${tokens.borderWidth}px`,
      '--dt-space': `${tokens.spacing}px`,
      '--dt-fs-sm': `${(base / scale).toFixed(1)}px`,
      '--dt-fs-body': `${base}px`,
      '--dt-fs-h3': `${(base * scale).toFixed(1)}px`,
      '--dt-fs-h2': `${(base * scale * scale).toFixed(1)}px`,
      '--dt-fs-h1': `${(base * scale * scale * scale).toFixed(1)}px`,
    } as CSSProperties;
  }, [tokens, accentInk]);

  const exportText = useMemo(
    () =>
      exportFormat === 'css'
        ? buildCss(tokens, accentInk)
        : buildJson(tokens, accentInk),
    [exportFormat, tokens, accentInk],
  );

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const textOnBackground = contrastRatio(tokens.text, tokens.background);
  const textOnSurface = contrastRatio(tokens.text, tokens.surface);
  const mutedOnBackground = contrastRatio(tokens.muted, tokens.background);
  const inkOnAccent = contrastRatio(accentInk, tokens.accent);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Design Token Tester</h1>
          <p>
            Ten tokens, one interface. Adjust the system and watch every
            component follow.
          </p>
        </div>
        <div className="presets" role="group" aria-label="Presets">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="preset-button"
              onClick={() => setTokens(preset.tokens)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </header>

      <div className="layout">
        <aside className="controls">
          <section aria-labelledby="color-tokens">
            <h2 id="color-tokens">Color</h2>
            <ColorField
              label="Background"
              value={tokens.background}
              onChange={(v) => set('background', v)}
            />
            <ColorField
              label="Surface"
              value={tokens.surface}
              onChange={(v) => set('surface', v)}
            />
            <ColorField
              label="Text"
              value={tokens.text}
              onChange={(v) => set('text', v)}
            />
            <ColorField
              label="Muted text"
              value={tokens.muted}
              onChange={(v) => set('muted', v)}
            />
            <ColorField
              label="Accent"
              value={tokens.accent}
              onChange={(v) => set('accent', v)}
            />
          </section>

          <section aria-labelledby="shape-tokens">
            <h2 id="shape-tokens">Shape and space</h2>
            <SliderField
              label="Radius"
              value={tokens.radius}
              min={0}
              max={28}
              onChange={(v) => set('radius', v)}
            />
            <SliderField
              label="Border width"
              value={tokens.borderWidth}
              min={0}
              max={4}
              onChange={(v) => set('borderWidth', v)}
            />
            <SliderField
              label="Spacing unit"
              value={tokens.spacing}
              min={8}
              max={28}
              onChange={(v) => set('spacing', v)}
            />
          </section>

          <section aria-labelledby="type-tokens">
            <h2 id="type-tokens">Typography</h2>
            <SliderField
              label="Base size"
              value={tokens.baseSize}
              min={13}
              max={20}
              onChange={(v) => set('baseSize', v)}
            />
            <SliderField
              label="Type scale"
              value={tokens.typeScale}
              min={1.1}
              max={1.45}
              step={0.01}
              unit="x"
              onChange={(v) => set('typeScale', v)}
            />
          </section>

          <section aria-labelledby="contrast-report">
            <h2 id="contrast-report">Contrast (WCAG 2.1)</h2>
            <ContrastBadge label="Text / background" ratio={textOnBackground} />
            <ContrastBadge label="Text / surface" ratio={textOnSurface} />
            <ContrastBadge label="Muted / background" ratio={mutedOnBackground} />
            <ContrastBadge label="Label / accent" ratio={inkOnAccent} />
          </section>
        </aside>

        <main className="stage">
          <div className="preview" style={previewVars}>
            <div className="pv-topbar">
              <span className="pv-brand">
                <span className="pv-brand__dot" aria-hidden="true" />
                Fieldnote
              </span>
              <nav className="pv-nav" aria-label="Preview navigation">
                <span>Overview</span>
                <span>Library</span>
                <span>Settings</span>
              </nav>
              <button type="button" className="pv-button pv-button--primary">
                New entry
              </button>
            </div>

            <div className="pv-hero">
              <h3 className="pv-h1">Every token in its place.</h3>
              <p className="pv-lead">
                This interface is rendered from the ten variables on the left.
                Nothing here has a hardcoded color, size, or corner.
              </p>
              <div className="pv-actions">
                <button type="button" className="pv-button pv-button--primary">
                  Get started
                </button>
                <button type="button" className="pv-button pv-button--ghost">
                  Documentation
                </button>
              </div>
            </div>

            <div className="pv-grid">
              <div className="pv-card">
                <span className="pv-badge">Form</span>
                <h4 className="pv-h3">Join the field notes</h4>
                <p className="pv-body">
                  One email a month on design systems in practice.
                </p>
                <div className="pv-form">
                  <input
                    type="text"
                    placeholder="you@studio.com"
                    aria-label="Email address"
                    readOnly
                  />
                  <button type="button" className="pv-button pv-button--primary">
                    Subscribe
                  </button>
                </div>
              </div>

              <div className="pv-card">
                <span className="pv-badge">Type scale</span>
                <div className="pv-type-row">
                  <span className="pv-type pv-type--h1">Aa</span>
                  <span className="pv-type pv-type--h2">Aa</span>
                  <span className="pv-type pv-type--h3">Aa</span>
                  <span className="pv-type pv-type--body">Aa</span>
                  <span className="pv-type pv-type--sm">Aa</span>
                </div>
                <p className="pv-small">
                  Five steps derived from base size and ratio.
                </p>
              </div>
            </div>
          </div>

          <section className="export" aria-labelledby="export-heading">
            <div className="export__header">
              <h2 id="export-heading">Export</h2>
              <div className="export__actions">
                <div className="segmented" role="group" aria-label="Export format">
                  <button
                    type="button"
                    className={exportFormat === 'css' ? 'is-active' : ''}
                    onClick={() => setExportFormat('css')}
                  >
                    CSS
                  </button>
                  <button
                    type="button"
                    className={exportFormat === 'json' ? 'is-active' : ''}
                    onClick={() => setExportFormat('json')}
                  >
                    JSON
                  </button>
                </div>
                <button type="button" className="copy-button" onClick={copyExport}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <pre>
              <code>{exportText}</code>
            </pre>
          </section>
        </main>
      </div>

      <footer className="footer">
        <p>
          A labs experiment by{' '}
          <a href="https://stephanosue.com" target="_blank" rel="noopener noreferrer">
            Stephano Sue
          </a>
          {' · '}
          <a
            href="https://github.com/ql1max/design-token-tester"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
