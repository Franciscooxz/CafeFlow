'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { useBranding, useUpdateBranding } from '@/hooks/useBranding';
import { useBrandStore } from '@/store/brand.store';
import {
  applyBrandVars,
  brandVars,
  BRAND_PRESETS,
  DEFAULT_BRAND_COLOR,
  isLowContrastOnLight,
  isValidHex,
  resizeLogo,
} from '@/lib/brand';
import {
  Palette,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CoffeeCupIcon,
  Check,
} from '@/components/icons';

export function BrandSettingsCard() {
  const { data: branding, isError } = useBranding();
  const updateBranding = useUpdateBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  const [color, setColor] = useState(DEFAULT_BRAND_COLOR);
  const [hexInput, setHexInput] = useState(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!branding) return;
    const initial = isValidHex(branding.brandColor) ? branding.brandColor : DEFAULT_BRAND_COLOR;
    setColor(initial);
    setHexInput(initial);
    setLogoUrl(branding.logoUrl);
  }, [branding]);

  // Vista previa en vivo sobre toda la app; al salir se restaura la marca guardada.
  useEffect(() => {
    if (branding) applyBrandVars(brandVars(color), color);
  }, [color, branding]);
  useEffect(
    () => () => {
      const { vars, color: savedColor } = useBrandStore.getState();
      applyBrandVars(vars, savedColor);
    },
    [],
  );

  const savedColor = isValidHex(branding?.brandColor) ? branding!.brandColor! : DEFAULT_BRAND_COLOR;
  const isDirty = color !== savedColor || logoUrl !== (branding?.logoUrl ?? null);

  const pickColor = (hex: string) => {
    const normalized = hex.toUpperCase();
    setColor(normalized);
    setHexInput(normalized);
  };

  const onHexInput = (value: string) => {
    const v = value.startsWith('#') ? value : `#${value}`;
    setHexInput(v.toUpperCase());
    if (isValidHex(v)) setColor(v.toUpperCase());
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setProcessing(true);
    try {
      setLogoUrl(await resizeLogo(file));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo procesar el logo');
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);
    try {
      await updateBranding.mutateAsync({
        brandColor: color === DEFAULT_BRAND_COLOR ? null : color,
        logoUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join('. ') : msg ?? 'Error al guardar la marca');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-cafe-beige flex items-center gap-2">
        <Palette size={16} className="text-cafe-terracota" />
        <h2 className="font-semibold text-cafe-black text-sm">Marca</h2>
        <span className="text-xs text-cafe-gray ml-auto">Se aplica en todas tus sedes</span>
      </div>

      {isError ? (
        <p className="px-5 py-8 text-sm text-red-500 text-center">No se pudo cargar la marca</p>
      ) : !branding ? (
        // La query arranca deshabilitada hasta que rehidrata la sesión: isLoading sería false.
        <div className="px-5 py-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-cafe-cream rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-5 py-5 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-cafe-beige bg-cafe-cream flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-cafe-grayLight">
                  <CoffeeCupIcon size={32} strokeWidth={1.2} />
                </span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-cafe-black">Logo</p>
              <p className="text-xs text-cafe-gray">
                PNG, JPG, WebP o SVG. Ideal: cuadrado con fondo transparente.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Upload size={14} />}
                  loading={processing}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoUrl ? 'Cambiar' : 'Subir logo'}
                </Button>
                {logoUrl && (
                  <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setLogoUrl(null)}>
                    Quitar
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-cafe-black">Color de marca</p>
              <p className="text-xs text-cafe-gray">
                Botones, selección y acentos. La vista previa se aplica en vivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BRAND_PRESETS.map((p) => {
                const active = p.hex.toUpperCase() === color.toUpperCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.name}
                    onClick={() => pickColor(p.hex)}
                    className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                      active && 'ring-2 ring-offset-2 ring-cafe-black ring-offset-cafe-white',
                    )}
                    style={{ backgroundColor: p.hex }}
                  >
                    {active && <Check size={14} className="text-cafe-onBrand" />}
                  </button>
                );
              })}
              <label
                title="Color personalizado"
                className="w-9 h-9 rounded-full border-2 border-dashed border-cafe-grayLight flex items-center justify-center cursor-pointer overflow-hidden relative hover:scale-110 transition-transform"
              >
                <Palette size={14} className="text-cafe-gray" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => pickColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl border border-cafe-beige shrink-0" style={{ backgroundColor: color }} />
              <input
                value={hexInput}
                onChange={(e) => onHexInput(e.target.value)}
                maxLength={7}
                className="input-field font-mono uppercase max-w-[140px]"
                aria-label="Código hex del color"
              />
              {color !== DEFAULT_BRAND_COLOR && (
                <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => pickColor(DEFAULT_BRAND_COLOR)}>
                  Predeterminado
                </Button>
              )}
            </div>
            {isLowContrastOnLight(color) && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600">
                <AlertTriangle size={14} className="shrink-0 mt-px" />
                Este color es muy claro: los textos y números en color de marca serán difíciles de leer
                sobre fondo blanco. Los botones sí ajustan su texto automáticamente.
              </p>
            )}
          </div>

          {/* Vista previa */}
          <div className="rounded-2xl bg-cafe-cream p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-cafe-gray font-medium">Vista previa</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cafe-terracota text-cafe-onBrand">
                Bebidas calientes
              </span>
              <span className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cafe-white text-cafe-grayDark">
                Panadería
              </span>
              <span className="badge bg-cafe-terracota/10 text-cafe-terracota">Nuevo</span>
              <span className="text-cafe-terracota font-semibold text-sm ml-auto">$12.500</span>
            </div>
            <button type="button" className="btn-primary w-full">Cobrar</button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-green-600 font-medium"
            >
              <CheckCircle2 size={16} />
              Marca guardada
            </motion.div>
          )}

          <Button fullWidth size="lg" onClick={handleSave} loading={updateBranding.isPending} disabled={!isDirty}>
            Guardar marca
          </Button>
        </div>
      )}
    </motion.div>
  );
}
