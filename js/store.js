// Estado del prototipo y reglas de negocio de ShareFood.
// Todo se guarda en localStorage: cada persona que abre el prototipo tiene su propia demostración.

import { MIN, HORA, DIA, hash, uid, inicioSemana, hora } from './util.js';

const CLAVE = 'sharefood-prototipo-v1';

export const ALERGENOS = [
  { id: 'gluten', nombre: 'Gluten' },
  { id: 'leche', nombre: 'Leche' },
  { id: 'huevo', nombre: 'Huevo' },
  { id: 'mani', nombre: 'Maní' },
  { id: 'soya', nombre: 'Soya' },
  { id: 'mariscos', nombre: 'Pescado o mariscos' },
];

export const TIPOS = {
  preparada: 'Comida preparada',
  panaderia: 'Panadería',
  fruta: 'Frutas y verduras',
};

export const CONSERVACION = {
  refrigerado: 'Refrigerado (0 a 4 °C)',
  caliente: 'Caliente (más de 60 °C)',
  ambiente: 'Temperatura ambiente',
};

export const UNIVERSIDADES = [
  { id: 'unal', nombre: 'Universidad Nacional de Colombia, sede Manizales', dominio: 'unal.edu.co' },
  { id: 'ucaldas', nombre: 'Universidad de Caldas', dominio: 'ucaldas.edu.co' },
  { id: 'umanizales', nombre: 'Universidad de Manizales', dominio: 'umanizales.edu.co' },
  { id: 'ucm', nombre: 'Universidad Católica de Manizales', dominio: 'ucm.edu.co' },
  { id: 'autonoma', nombre: 'Universidad Autónoma de Manizales', dominio: 'autonoma.edu.co' },
];

let estado = null;
const oyentes = new Set();

/* ---------- Persistencia ---------- */

export function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    estado = crudo ? JSON.parse(crudo) : semilla();
  } catch {
    estado = semilla();
  }
  procesarVencimientos();
  guardar();
  return estado;
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    /* Sin almacenamiento disponible: la demo sigue funcionando en memoria. */
  }
  oyentes.forEach((fn) => fn(estado));
}

export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function obtener() {
  return estado;
}

export function reiniciar() {
  estado = semilla();
  guardar();
}

/* ---------- Datos iniciales (relativos a la hora actual) ---------- */

function semilla() {
  const ahora = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const s = {
    version: 1,
    params: {
      reservasSemana: 3,
      reservasActivas: 1,
      minutosPrioridad: 15,
      inasistenciasPausa: 2,
      diasPausa: 7,
      horasMaximas: { preparada: 8, panaderia: 24, fruta: 24 },
    },
    estudiante: {
      id: 'est-1',
      seudonimo: 'Estudiante A-27',
      correo: 'estudiante@unal.edu.co',
      universidad: 'unal',
      estado: 'validado',
      prioridad: 'normal',
      alergenos: ['mani'],
      pausaHasta: null,
    },
    restaurantes: [
      { id: 'r1', nombre: 'Restaurante Sazón de Casa', barrio: 'Palogrande', distancia: 450, direccion: 'Cra. 23 con calle 65 (ficticia)', entrada: 'Puerta lateral', x: 32, y: 34 },
      { id: 'r2', nombre: 'Panadería La Espiga', barrio: 'Milán', distancia: 700, direccion: 'Av. Santander, sector Milán (ficticia)', entrada: 'Caja principal, al fondo', x: 64, y: 70 },
      { id: 'r3', nombre: 'Cafetería El Campus', barrio: 'El Cable', distancia: 1200, direccion: 'Calle 65, sector El Cable (ficticia)', entrada: 'Ventanilla lateral', x: 84, y: 18 },
    ],
    restauranteActual: 'r1',
    donaciones: [],
    reservas: [],
    eventos: [],
    notificaciones: [],
    incidencias: [],
  };

  const declaracion = { excedente: true, noServido: true, conservacion: true };

  const d1 = {
    id: 'DON-0412', restaurante: 'r1', tipo: 'preparada', nombre: 'Arroz con pollo y ensalada',
    porcionesPublicadas: 6, porcionesDisponibles: 6, gramos: 350,
    horaPreparacion: iso(ahora - 7 * HORA), conservacion: 'refrigerado', empaque: 'Recipiente cerrado',
    ingredientes: 'Arroz, pechuga de pollo, zanahoria, arveja, cebolla, lechuga, tomate, aceite vegetal, sal.',
    alergenos: [], trazas: 'Puede contener trazas de gluten',
    ventanaInicio: iso(ahora + 60 * MIN), ventanaFin: iso(ahora + 90 * MIN),
    publicadaEn: iso(ahora - 40 * MIN), prioridadHasta: iso(ahora - 25 * MIN), estado: 'publicada', declaracion,
  };
  const d2 = {
    id: 'DON-0413', restaurante: 'r2', tipo: 'panaderia', nombre: 'Pan del día surtido (bolsa)',
    porcionesPublicadas: 6, porcionesDisponibles: 6, gramos: 400,
    horaPreparacion: iso(ahora - 10 * HORA), conservacion: 'ambiente', empaque: 'Bolsa de papel cerrada',
    ingredientes: 'Harina de trigo, mantequilla, huevo, azúcar, levadura, sal.',
    alergenos: ['gluten', 'leche', 'huevo'], trazas: '',
    ventanaInicio: iso(ahora + 20 * MIN), ventanaFin: iso(ahora + 50 * MIN),
    publicadaEn: iso(ahora - 30 * MIN), prioridadHasta: iso(ahora - 15 * MIN), estado: 'publicada', declaracion,
  };
  const d3 = {
    id: 'DON-0414', restaurante: 'r3', tipo: 'preparada', nombre: 'Sándwiches de jamón y queso',
    porcionesPublicadas: 3, porcionesDisponibles: 3, gramos: 220,
    horaPreparacion: iso(ahora - 5 * HORA), conservacion: 'refrigerado', empaque: 'Empaque individual sellado',
    ingredientes: 'Pan tajado, jamón de cerdo, queso, mantequilla.',
    alergenos: ['gluten', 'leche'], trazas: '',
    ventanaInicio: iso(ahora + 45 * MIN), ventanaFin: iso(ahora + 75 * MIN),
    publicadaEn: iso(ahora - 5 * MIN), prioridadHasta: iso(ahora + 10 * MIN), estado: 'publicada', declaracion,
  };
  const ayer = Math.max(ahora - DIA, inicioSemana() + 10 * MIN);
  const d0 = {
    id: 'DON-0411', restaurante: 'r2', tipo: 'panaderia', nombre: 'Pan aliñado (bolsa)',
    porcionesPublicadas: 5, porcionesDisponibles: 5, gramos: 400,
    horaPreparacion: iso(ayer - 9 * HORA), conservacion: 'ambiente', empaque: 'Bolsa de papel cerrada',
    ingredientes: 'Harina de trigo, mantequilla, huevo, sal.', alergenos: ['gluten', 'leche', 'huevo'], trazas: '',
    ventanaInicio: iso(ayer), ventanaFin: iso(ayer + 30 * MIN),
    publicadaEn: iso(ayer - 40 * MIN), prioridadHasta: iso(ayer - 25 * MIN), estado: 'cerrada', declaracion,
  };
  s.donaciones = [d0, d1, d2, d3];

  // Historial con eventos encadenados.
  estado = s;
  registrar('donacion', d0.id, 'Publicada con declaración', 'Encargado La Espiga', ayer - 40 * MIN);
  const rAyer = crearReservaInterna(d0, s.estudiante.id, ayer - 35 * MIN);
  rAyer.estado = 'entregada';
  rAyer.entregadaEn = new Date(ayer + 5 * MIN).toISOString();
  registrar('reserva', rAyer.codigo, 'Entrega confirmada', 'Encargado La Espiga', ayer + 5 * MIN);
  for (let i = 0; i < 2; i += 1) {
    const r = crearReservaInterna(d0, 'otro', ayer - 30 * MIN + i * MIN);
    r.estado = 'entregada';
    r.entregadaEn = new Date(ayer + (8 + i) * MIN).toISOString();
    registrar('reserva', r.codigo, 'Entrega confirmada', 'Encargado La Espiga', ayer + (8 + i) * MIN);
  }
  for (let i = 0; i < 2; i += 1) {
    const r = crearReservaInterna(d0, 'otro', ayer - 20 * MIN + i * MIN);
    r.estado = 'no_recogida';
  }
  registrar('donacion', d0.id, 'Cerrada · 2 reservas no recogidas', 'Sistema', ayer + 30 * MIN);

  registrar('donacion', d1.id, 'Publicada con declaración', 'Encargado turno noche', ahora - 40 * MIN);
  registrar('donacion', d1.id, 'Abierta a todos los validados', 'Sistema', ahora - 25 * MIN);
  const r1 = crearReservaInterna(d1, 'otro', ahora - 20 * MIN);
  registrar('reserva', r1.codigo, 'Ficha aceptada y reserva', r1.codigo, ahora - 20 * MIN);
  registrar('donacion', d2.id, 'Publicada con declaración', 'Encargado La Espiga', ahora - 30 * MIN);
  registrar('donacion', d2.id, 'Abierta a todos los validados', 'Sistema', ahora - 15 * MIN);
  const r2 = crearReservaInterna(d2, 'otro', ahora - 10 * MIN);
  registrar('reserva', r2.codigo, 'Ficha aceptada y reserva', r2.codigo, ahora - 10 * MIN);
  registrar('donacion', d3.id, 'Publicada con declaración', 'Encargado El Campus', ahora - 5 * MIN);

  s.notificaciones = [
    { id: uid('n'), ts: iso(ahora - 5 * MIN), texto: `Nueva donación en Cafetería El Campus. Abre para todos a las ${hora(d3.prioridadHasta)}`, leida: false },
    { id: uid('n'), ts: iso(ahora - 25 * MIN), texto: 'Arroz con pollo y ensalada ya está disponible para reservar en Sazón de Casa.', leida: false },
  ];
  return s;
}

/* ---------- Trazabilidad ---------- */

function registrar(entidad, entidadId, tipo, actor, ts = Date.now()) {
  const anterior = estado.eventos.length ? estado.eventos[estado.eventos.length - 1].hash : '00000000';
  const ev = { id: estado.eventos.length + 1, ts: new Date(ts).toISOString(), entidad, entidadId, tipo, actor, hashAnterior: anterior };
  ev.hash = hash(JSON.stringify([ev.id, ev.ts, ev.entidad, ev.entidadId, ev.tipo, ev.actor, ev.hashAnterior]));
  estado.eventos.push(ev);
  return ev;
}

/** Recalcula la cadena de eventos y dice si alguien alteró el historial. */
export function verificarIntegridad() {
  let anterior = '00000000';
  for (const ev of estado.eventos) {
    const esperado = hash(JSON.stringify([ev.id, ev.ts, ev.entidad, ev.entidadId, ev.tipo, ev.actor, anterior]));
    if (ev.hashAnterior !== anterior || ev.hash !== esperado) return { ok: false, evento: ev.id };
    anterior = ev.hash;
  }
  return { ok: true, total: estado.eventos.length };
}

/* ---------- Consultas ---------- */

export const restaurante = (id) => estado.restaurantes.find((r) => r.id === id);
export const donacion = (id) => estado.donaciones.find((d) => d.id === id);

export function donacionesActivas() {
  return estado.donaciones.filter((d) => d.estado === 'publicada');
}

export function reservaActivaEstudiante() {
  return estado.reservas.find((r) => r.estudiante === estado.estudiante.id && r.estado === 'activa');
}

export function reservasEstudiante() {
  return estado.reservas
    .filter((r) => r.estudiante === estado.estudiante.id)
    .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
}

/** Reservas de la semana que cuentan para el cupo (las canceladas no cuentan). */
export function cupoUsado() {
  const desde = inicioSemana();
  return estado.reservas.filter(
    (r) => r.estudiante === estado.estudiante.id && r.estado !== 'cancelada' && new Date(r.creadaEn).getTime() >= desde,
  ).length;
}

export function enPrioridad(d, ahora = Date.now()) {
  return new Date(d.prioridadHasta).getTime() > ahora;
}

/** Devuelve null si el estudiante puede reservar, o el motivo por el que no puede. */
export function motivoBloqueo(d, ahora = Date.now()) {
  const e = estado.estudiante;
  const p = estado.params;
  if (e.estado !== 'validado') return { tipo: 'validacion', texto: 'Tu universidad todavía no ha confirmado tu elegibilidad.' };
  if (e.pausaHasta && new Date(e.pausaHasta).getTime() > ahora) return { tipo: 'pausa', texto: `Tu cuenta está en pausa hasta el ${new Date(e.pausaHasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} por inasistencias sin cancelar.` };
  if (d.estado !== 'publicada') return { tipo: 'cerrada', texto: 'Esta publicación ya no está disponible.' };
  if (d.porcionesDisponibles <= 0) return { tipo: 'agotada', texto: 'Las porciones se agotaron. Revisa otras donaciones cercanas.' };
  const activas = estado.reservas.filter((r) => r.estudiante === e.id && r.estado === 'activa').length;
  if (activas >= p.reservasActivas) return { tipo: 'activa', texto: 'Ya tienes una reserva activa. Recógela o cancélala para hacer otra.' };
  if (cupoUsado() >= p.reservasSemana) return { tipo: 'cupo', texto: `Ya usaste tus ${p.reservasSemana} reservas de esta semana. El cupo se renueva el lunes.` };
  if (enPrioridad(d, ahora) && e.prioridad !== 'alta') return { tipo: 'prioridad', texto: `Acceso prioritario en curso. Podrás reservar desde las ${hora(d.prioridadHasta)}` };
  return null;
}

/* ---------- Acciones del estudiante ---------- */

function nuevoCodigo() {
  let codigo;
  do {
    codigo = `SF-${String(Math.floor(1000 + Math.random() * 9000))}`;
  } while (estado.reservas.some((r) => r.codigo === codigo));
  return codigo;
}

function crearReservaInterna(d, estudiante, ts = Date.now()) {
  const r = { id: uid('res'), codigo: nuevoCodigo(), donacion: d.id, estudiante, porciones: 1, estado: 'activa', creadaEn: new Date(ts).toISOString(), entregadaEn: null };
  d.porcionesDisponibles -= 1;
  estado.reservas.push(r);
  return r;
}

export function reservar(idDonacion, fichaAceptada) {
  const d = donacion(idDonacion);
  if (!fichaAceptada) return { error: 'Debes leer y aceptar la ficha del alimento antes de reservar.' };
  const bloqueo = motivoBloqueo(d);
  if (bloqueo) return { error: bloqueo.texto };
  const r = crearReservaInterna(d, estado.estudiante.id);
  registrar('reserva', r.codigo, 'Ficha aceptada y reserva', r.codigo);
  notificar(`Reserva confirmada: tu código es ${r.codigo}. Recoge entre ${hora(d.ventanaInicio)} y ${hora(d.ventanaFin)}`);
  guardar();
  return { reserva: r };
}

export function cancelar(idReserva) {
  const r = estado.reservas.find((x) => x.id === idReserva);
  if (!r || r.estado !== 'activa') return { error: 'La reserva ya no está activa.' };
  const d = donacion(r.donacion);
  if (Date.now() >= new Date(d.ventanaInicio).getTime()) {
    return { error: 'La ventana de recogida ya empezó. Si no puedes ir, avisa al establecimiento.' };
  }
  r.estado = 'cancelada';
  d.porcionesDisponibles += r.porciones;
  registrar('reserva', r.codigo, 'Reserva cancelada · porción liberada', r.codigo);
  guardar();
  return { ok: true };
}

export function reportar(idDonacion, tipo, descripcion) {
  const d = donacion(idDonacion);
  const inc = { id: `INC-${String(estado.incidencias.length + 1).padStart(3, '0')}`, ts: new Date().toISOString(), donacion: d.id, tipo, descripcion, estado: 'abierta' };
  estado.incidencias.push(inc);
  registrar('incidencia', inc.id, `Reporte (${tipo}) sobre ${d.id}`, estado.estudiante.seudonimo);
  if (tipo === 'sanitaria' && d.estado === 'publicada') {
    d.estado = 'suspendida';
    registrar('donacion', d.id, 'Suspendida por incidencia sanitaria (RN10)', 'Sistema');
  }
  guardar();
  return inc;
}

export function actualizarEstudiante(cambios) {
  Object.assign(estado.estudiante, cambios);
  guardar();
}

export function solicitarValidacion({ correo, universidad }) {
  const uni = UNIVERSIDADES.find((u) => u.id === universidad);
  if (!uni) return { error: 'Elige tu universidad.' };
  if (!correo.toLowerCase().endsWith(`@${uni.dominio}`)) {
    return { error: `Usa tu correo institucional de ${uni.nombre} (termina en @${uni.dominio}).` };
  }
  Object.assign(estado.estudiante, { correo, universidad, estado: 'pendiente' });
  registrar('estudiante', estado.estudiante.seudonimo, `Solicitud de validación a ${uni.nombre}`, estado.estudiante.seudonimo);
  guardar();
  return { ok: true };
}

/** Simula la respuesta de Bienestar Universitario (solo devuelve elegibilidad y prioridad). */
export function simularRespuestaUniversidad(prioridad) {
  Object.assign(estado.estudiante, { estado: 'validado', prioridad });
  registrar('estudiante', estado.estudiante.seudonimo, `Validado por la universidad · prioridad ${prioridad}`, 'Bienestar Universitario');
  notificar('Tu universidad confirmó tu elegibilidad. Ya puedes reservar.');
  guardar();
}

function notificar(texto) {
  estado.notificaciones.unshift({ id: uid('n'), ts: new Date().toISOString(), texto, leida: false });
}

export function marcarNotificacionesLeidas() {
  estado.notificaciones.forEach((n) => { n.leida = true; });
  guardar();
}

/* ---------- Acciones del establecimiento ---------- */

export function cambiarRestaurante(id) {
  estado.restauranteActual = id;
  guardar();
}

/** Valida y publica un excedente. Devuelve { errores } o { donacion }. */
export function publicar(datos) {
  const errores = {};
  const ahora = Date.now();
  const p = estado.params;
  if (!datos.nombre.trim()) errores.nombre = 'Escribe el nombre del plato.';
  if (!(datos.porciones >= 1 && datos.porciones <= 50)) errores.porciones = 'Indica entre 1 y 50 porciones.';
  if (!datos.horaPreparacion) errores.horaPreparacion = 'Indica la hora de preparación.';
  if (!datos.conservacion) errores.conservacion = 'Indica cómo se ha conservado.';
  if (!datos.ingredientes.trim()) errores.ingredientes = 'Escribe los ingredientes principales.';
  if (!datos.alergenosRevisados) errores.alergenos = 'Marca los alérgenos presentes o «Ninguno».';
  const ini = new Date(datos.ventanaInicio).getTime();
  const fin = new Date(datos.ventanaFin).getTime();
  if (!(ini > ahora)) errores.ventana = 'La ventana de recogida debe empezar después de la hora actual.';
  else if (!(fin > ini)) errores.ventana = 'La hora final debe ser posterior a la inicial.';
  else if (fin - ini > 3 * HORA) errores.ventana = 'La ventana no puede durar más de 3 horas.';
  if (datos.horaPreparacion) {
    const prep = new Date(datos.horaPreparacion).getTime();
    const max = p.horasMaximas[datos.tipo] ?? 8;
    if (prep > ahora) errores.horaPreparacion = 'La hora de preparación no puede estar en el futuro.';
    else if (!errores.ventana && fin - prep > max * HORA) {
      errores.horaPreparacion = `Para ${TIPOS[datos.tipo].toLowerCase()} el máximo es ${max} horas entre la preparación y el fin de la recogida (RN01, valor de demostración).`;
    }
  }
  if (!(datos.declaracion.excedente && datos.declaracion.noServido && datos.declaracion.conservacion)) {
    errores.declaracion = 'Las tres declaraciones son obligatorias para publicar.';
  }
  if (Object.keys(errores).length) return { errores };

  const numero = 412 + estado.donaciones.filter((d) => d.id.startsWith('DON-')).length;
  const d = {
    id: `DON-${String(numero).padStart(4, '0')}`,
    restaurante: estado.restauranteActual,
    tipo: datos.tipo,
    nombre: datos.nombre.trim(),
    porcionesPublicadas: datos.porciones,
    porcionesDisponibles: datos.porciones,
    gramos: datos.gramos || 300,
    horaPreparacion: datos.horaPreparacion,
    conservacion: datos.conservacion,
    empaque: datos.empaque || 'Recipiente cerrado',
    ingredientes: datos.ingredientes.trim(),
    alergenos: datos.alergenos,
    trazas: '',
    ventanaInicio: datos.ventanaInicio,
    ventanaFin: datos.ventanaFin,
    publicadaEn: new Date(ahora).toISOString(),
    prioridadHasta: new Date(ahora + p.minutosPrioridad * MIN).toISOString(),
    estado: 'publicada',
    declaracion: { ...datos.declaracion },
  };
  estado.donaciones.push(d);
  const rest = restaurante(d.restaurante);
  registrar('donacion', d.id, 'Publicada con declaración', `Encargado ${rest.nombre}`);
  notificar(
    estado.estudiante.prioridad === 'alta'
      ? `Acceso prioritario: ${d.nombre} en ${rest.nombre}. Ya puedes reservar.`
      : `Nueva donación en ${rest.nombre}. Abre para todos a las ${hora(d.prioridadHasta)}`,
  );
  guardar();
  return { donacion: d };
}

export function confirmarEntrega(codigo) {
  const limpio = codigo.trim().toUpperCase().replace(/\s+/g, '');
  const normal = limpio.startsWith('SF-') ? limpio : `SF-${limpio.replace(/^SF/, '')}`;
  const r = estado.reservas.find((x) => x.codigo === normal);
  if (!r) return { error: `El código ${normal} no corresponde a ninguna reserva. No entregues.` };
  const d = donacion(r.donacion);
  if (d.restaurante !== estado.restauranteActual) return { error: 'Ese código es de otro establecimiento. No entregues.' };
  if (r.estado === 'entregada') return { error: `El código ${normal} ya se entregó a las ${hora(r.entregadaEn)}` };
  if (r.estado !== 'activa') return { error: `El código ${normal} no está activo (${r.estado.replace('_', ' ')}). No entregues.` };
  r.estado = 'entregada';
  r.entregadaEn = new Date().toISOString();
  registrar('reserva', r.codigo, 'Entrega confirmada', `Encargado ${restaurante(d.restaurante).nombre}`);
  if (r.estudiante === estado.estudiante.id) notificar(`Entrega registrada (${r.codigo}). Buen provecho.`);
  guardar();
  return { reserva: r, donacion: d };
}

/** Simula que otro estudiante reserva (sirve para mostrar la vista del restaurante con más movimiento). */
export function simularReservaExterna(idDonacion) {
  const d = donacion(idDonacion);
  if (!d || d.estado !== 'publicada' || d.porcionesDisponibles <= 0) return null;
  const r = crearReservaInterna(d, 'otro');
  registrar('reserva', r.codigo, 'Ficha aceptada y reserva', r.codigo);
  guardar();
  return r;
}

export function retirarDonacion(idDonacion, actor) {
  const d = donacion(idDonacion);
  d.estado = 'retirada';
  estado.reservas.filter((r) => r.donacion === d.id && r.estado === 'activa').forEach((r) => {
    r.estado = 'cancelada';
    registrar('reserva', r.codigo, 'Cancelada porque la publicación se retiró', 'Sistema');
    if (r.estudiante === estado.estudiante.id) notificar(`La publicación ${d.nombre} se retiró y tu reserva ${r.codigo} se canceló. Tu cupo no se descuenta.`);
  });
  registrar('donacion', d.id, 'Retirada', actor);
  guardar();
}

export function cerrarJornada() {
  const ids = estado.donaciones.filter((d) => d.restaurante === estado.restauranteActual && d.estado === 'publicada').map((d) => d.id);
  ids.forEach((id) => cerrarDonacion(donacion(id), 'Cierre de jornada'));
  aplicarPausas();
  guardar();
  return ids.length;
}

function cerrarDonacion(d, motivo) {
  d.estado = 'cerrada';
  let noRecogidas = 0;
  estado.reservas.filter((r) => r.donacion === d.id && r.estado === 'activa').forEach((r) => {
    r.estado = 'no_recogida';
    noRecogidas += 1;
    registrar('reserva', r.codigo, 'No recogida', 'Sistema');
  });
  registrar('donacion', d.id, `Cerrada (${motivo})${noRecogidas ? ` · ${noRecogidas} no recogida(s)` : ''}`, 'Sistema');
}

/** RN05 y RN08: vence publicaciones y aplica pausas. Se llama al cargar y periódicamente. */
export function procesarVencimientos() {
  const ahora = Date.now();
  let cambios = false;
  estado.donaciones.forEach((d) => {
    if (d.estado === 'publicada' && new Date(d.ventanaFin).getTime() <= ahora) {
      cerrarDonacion(d, 'ventana vencida');
      cambios = true;
    }
  });
  if (aplicarPausas()) cambios = true;
  if (cambios) guardar();
  return cambios;
}

function aplicarPausas() {
  const e = estado.estudiante;
  const p = estado.params;
  const desde = Date.now() - 30 * DIA;
  const faltas = estado.reservas.filter((r) => r.estudiante === e.id && r.estado === 'no_recogida' && new Date(r.creadaEn).getTime() >= desde).length;
  if (faltas >= p.inasistenciasPausa && !(e.pausaHasta && new Date(e.pausaHasta).getTime() > Date.now())) {
    e.pausaHasta = new Date(Date.now() + p.diasPausa * DIA).toISOString();
    registrar('estudiante', e.seudonimo, `Pausa de ${p.diasPausa} días por ${faltas} inasistencias (RN08)`, 'Sistema');
    notificar(`Tu cuenta quedó en pausa ${p.diasPausa} días por ${faltas} reservas no recogidas. Recuerda cancelar si no puedes ir.`);
    return true;
  }
  return false;
}

/* ---------- Coordinación ---------- */

export function actualizarParametros(nuevos) {
  Object.assign(estado.params, nuevos);
  registrar('parametros', 'equidad', `Parámetros actualizados: ${nuevos.reservasSemana} por semana, ${nuevos.reservasActivas} activa(s), ${nuevos.minutosPrioridad} min de prioridad`, 'Coordinación');
  guardar();
}

export function resolverIncidencia(id, accion) {
  const inc = estado.incidencias.find((i) => i.id === id);
  const d = donacion(inc.donacion);
  inc.estado = 'resuelta';
  if (accion === 'reactivar' && d.estado === 'suspendida') {
    d.estado = new Date(d.ventanaFin).getTime() > Date.now() ? 'publicada' : 'cerrada';
    registrar('donacion', d.id, 'Reactivada tras revisión', 'Coordinación');
  } else if (accion === 'retirar') {
    retirarDonacion(d.id, 'Coordinación');
  }
  registrar('incidencia', inc.id, `Resuelta (${accion})`, 'Coordinación');
  guardar();
}

export function indicadores() {
  const entregadas = estado.reservas.filter((r) => r.estado === 'entregada');
  const cerradasConDesenlace = estado.reservas.filter((r) => ['entregada', 'no_recogida'].includes(r.estado));
  const gramos = entregadas.reduce((t, r) => t + (donacion(r.donacion)?.gramos || 0) * r.porciones, 0);
  const beneficiarios = new Set(entregadas.map((r) => (r.estudiante === 'otro' ? r.codigo : r.estudiante))).size;
  return {
    porciones: entregadas.reduce((t, r) => t + r.porciones, 0),
    tasa: cerradasConDesenlace.length ? Math.round((entregadas.length / cerradasConDesenlace.length) * 100) : null,
    kg: gramos / 1000,
    beneficiarios,
    publicadas: estado.donaciones.length,
  };
}

/** RF18: alerta si un establecimiento publica siempre la misma cantidad (posible producción para donar). */
export function alertas() {
  const lista = [];
  estado.restaurantes.forEach((r) => {
    const ds = estado.donaciones.filter((d) => d.restaurante === r.id).slice(-4);
    if (ds.length >= 3 && ds.every((d) => d.porcionesPublicadas === ds[0].porcionesPublicadas)) {
      lista.push({ tipo: 'patron', texto: `${r.nombre} publicó ${ds[0].porcionesPublicadas} porciones en sus últimas ${ds.length} publicaciones. Revisar si son excedentes reales.` });
    }
  });
  estado.incidencias.filter((i) => i.estado === 'abierta').forEach((i) => {
    lista.push({ tipo: 'incidencia', id: i.id, texto: `${i.id} · ${i.tipo} sobre ${i.donacion}: ${i.descripcion || 'sin descripción'}` });
  });
  return lista;
}

export function exportarCSV() {
  const filas = [['id', 'fecha_hora', 'entidad', 'entidad_id', 'evento', 'actor', 'hash_anterior', 'hash']];
  estado.eventos.forEach((e) => filas.push([e.id, e.ts, e.entidad, e.entidadId, e.tipo, e.actor, e.hashAnterior, e.hash]));
  return filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
