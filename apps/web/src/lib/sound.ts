// Un solo AudioContext por pestaña: crear uno por sonido agota el límite del
// navegador. Los navegadores lo dejan "suspended" hasta que el usuario toca la
// página, así que el primer sonido puede no oírse si nadie ha interactuado.
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(frequency: number, startAt: number, duration: number, volume = 0.2) {
  const audio = getContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + startAt + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + startAt);
  osc.stop(audio.currentTime + startAt + duration);
}

/** Pedido nuevo en cocina. */
export function playNewOrderBeep() {
  tone(660, 0, 0.15);
}

/** Pedido listo para recoger (pantalla de clientes). */
export function playReadyChime() {
  tone(784, 0, 0.35, 0.25);
  tone(1047, 0.18, 0.5, 0.25);
}

/** Llamar desde un click: desbloquea el audio para los sonidos automáticos. */
export function unlockAudio() {
  getContext();
}
