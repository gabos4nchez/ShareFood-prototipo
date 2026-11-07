// Utilidades generales del prototipo ShareFood.

export const MIN = 60 * 1000;
export const HORA = 60 * MIN;
export const DIA = 24 * HORA;

/** Escapa texto para insertarlo de forma segura en HTML. */
export function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Hora corta en formato colombiano, por ejemplo "8:30 p. m.". */
export function hora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

/** Fecha y hora cortas, por ejemplo "6 nov., 8:30 p. m.". */
export function fechaHora(iso) {
  const d = new Date(iso);
  const f = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return `${f}, ${hora(iso)}`;
}

/** Diferencia legible hasta una fecha futura: "1 h 05 min". */
export function faltan(iso, ahora = Date.now()) {
  let ms = new Date(iso).getTime() - ahora;
  if (ms <= 0) return 'ahora';
  const h = Math.floor(ms / HORA);
  ms -= h * HORA;
  const m = Math.ceil(ms / MIN);
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

/** Inicio de la semana actual (lunes 00:00, hora local). */
export function inicioSemana(ahora = new Date()) {
  const d = new Date(ahora);
  const dia = (d.getDay() + 6) % 7; // lunes = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dia);
  return d.getTime();
}

/** Convierte "HH:MM" de hoy en una fecha ISO. */
export function horaDeHoy(hhmm, base = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/** Convierte una fecha ISO en "HH:MM" para un campo de hora. */
export function aHHMM(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Redondea una marca de tiempo hacia arriba a múltiplos de 5 minutos. */
export function redondear5(ms) {
  const paso = 5 * MIN;
  return Math.ceil(ms / paso) * paso;
}

/** Hash FNV-1a de 32 bits en hexadecimal (suficiente para demostrar el encadenamiento). */
export function hash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function uid(prefijo) {
  return `${prefijo}-${Math.random().toString(36).slice(2, 8)}`;
}
