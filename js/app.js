// Interfaz del prototipo ShareFood: enrutador por hash y vistas de cada actor.

import * as S from './store.js';
import { esc, hora, fechaHora, faltan, horaDeHoy, aHHMM, redondear5, MIN } from './util.js';
import { icono } from './icons.js';

const $main = document.getElementById('main');
const $top = document.getElementById('topbar');
const $nav = document.getElementById('bottomnav');
const $toast = document.getElementById('toast');

const ui = { filtro: 'todas', fichaAceptada: false, errores: {}, borrador: null, mensajeEntrega: null, ultimaRuta: '' };

/* ---------- Arranque ---------- */

// El arranque está al final del archivo, cuando todas las vistas ya están definidas.

function ruta() {
  const partes = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  return { rol: partes[0] || '', vista: partes[1] || '', id: partes[2] || '' };
}

function render(cambioDeRuta) {
  const r = ruta();
  const clave = `${r.rol}/${r.vista}/${r.id}`;
  if (cambioDeRuta && clave !== ui.ultimaRuta) {
    ui.fichaAceptada = false;
    ui.errores = {};
    ui.mensajeEntrega = null;
    if (!(r.rol === 'restaurante' && r.vista === 'publicar')) ui.borrador = null;
  }
  ui.ultimaRuta = clave;
  document.body.dataset.rol = r.rol || 'inicio';
  pintarBarra(r);
  pintarNav(r);
  let html;
  if (r.rol === 'estudiante') html = vistaEstudiante(r);
  else if (r.rol === 'restaurante') html = vistaRestaurante(r);
  else if (r.rol === 'coordinacion') html = vistaCoordinacion();
  else if (r.rol === 'acerca') html = vistaAcerca();
  else html = vistaInicio();
  const scroll = window.scrollY;
  $main.innerHTML = html;
  if (cambioDeRuta) { window.scrollTo(0, 0); $main.focus({ preventScroll: true }); } else window.scrollTo(0, scroll);
}

function aviso(texto) {
  $toast.textContent = texto;
  $toast.classList.add('visible');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => $toast.classList.remove('visible'), 3800);
}

/* ---------- Barra superior y navegación ---------- */

const NOMBRE_ROL = { estudiante: 'Estudiante', restaurante: 'Establecimiento', coordinacion: 'Coordinación', acerca: 'Acerca del proyecto' };

function pintarBarra(r) {
  const st = S.obtener();
  const sinLeer = st.notificaciones.filter((n) => !n.leida).length;
  const campana = r.rol === 'estudiante'
    ? `<a class="icon-btn" href="#/estudiante/avisos" aria-label="Avisos${sinLeer ? `, ${sinLeer} sin leer` : ''}">${icono('bell')}${sinLeer ? `<span class="dot" aria-hidden="true">${sinLeer}</span>` : ''}</a>`
    : '';
  $top.innerHTML = `
    <a class="brand" href="#/" aria-label="ShareFood, volver al inicio">
      <img src="assets/icon.svg" alt="" width="30" height="30"><span>ShareFood</span>
    </a>
    <div class="top-right">
      ${r.rol ? `<a class="role-chip" href="#/" title="Cambiar de rol" aria-label="${esc(NOMBRE_ROL[r.rol] || '')}: cambiar de rol">${esc(NOMBRE_ROL[r.rol] || '')}<span class="chg"> · cambiar</span></a>` : ''}
      ${campana}
    </div>`;
}

const NAVS = {
  estudiante: [['', 'Donaciones', 'home'], ['reservas', 'Mis reservas', 'ticket'], ['perfil', 'Perfil', 'user']],
  restaurante: [['', 'Hoy', 'store'], ['publicar', 'Publicar', 'plus'], ['historial', 'Historial', 'list']],
  coordinacion: [['', 'Resumen', 'chart'], ['trazabilidad', 'Trazabilidad', 'link'], ['parametros', 'Equidad', 'scale']],
};

function pintarNav(r) {
  const items = NAVS[r.rol];
  if (!items) { $nav.innerHTML = ''; $nav.hidden = true; return; }
  $nav.hidden = false;
  $nav.innerHTML = items.map(([v, etiqueta, ic]) => {
    const activo = (r.vista || '') === v || (v === '' && ['d', 'avisos'].includes(r.vista));
    return `<a href="#/${r.rol}${v ? `/${v}` : ''}" class="${activo ? 'active' : ''}" ${activo ? 'aria-current="page"' : ''}>${icono(ic)}<span>${etiqueta}</span></a>`;
  }).join('');
}

/* ---------- Inicio: elegir rol ---------- */

function vistaInicio() {
  return `
  <section class="wrap hero">
    <p class="eyebrow">Trabajo de grado · Administración de Sistemas Informáticos · UNAL Manizales</p>
    <h1>¿Y si la comida que sobra llegara a quien la necesita?</h1>
    <p class="lead">ShareFood conecta los excedentes reales de restaurantes de Manizales con estudiantes universitarios validados, de forma organizada, trazable y discreta.</p>
    <h2 class="h-sec">Explora el prototipo como…</h2>
    <div class="role-grid">
      ${tarjetaRol('estudiante', 'Estudiante', 'Busca donaciones cercanas, revisa la ficha del alimento y reserva con un código.', 'student')}
      ${tarjetaRol('restaurante', 'Establecimiento', 'Publica un excedente al cierre y confirma las entregas con el código.', 'store')}
      ${tarjetaRol('coordinacion', 'Coordinación', 'Consulta indicadores, el registro de trazabilidad y los parámetros de equidad.', 'chart')}
    </div>
    <p class="muted small">Puedes cambiar de rol cuando quieras desde la barra superior. Prueba publicar como establecimiento y luego reservar como estudiante.</p>
    <p><a class="link-strong" href="#/acerca">Acerca del proyecto ${icono('arrow')}</a></p>
  </section>`;
}

function tarjetaRol(rol, titulo, texto, ic) {
  return `<a class="role-card" href="#/${rol}"><span class="role-ic">${icono(ic)}</span><span class="role-t">${titulo}</span><span class="role-d">${texto}</span><span class="role-go">Entrar ${icono('arrow')}</span></a>`;
}

function vistaAcerca() {
  return `
  <section class="wrap narrow prose">
    <h1>Acerca del proyecto</h1>
    <p>Este prototipo acompaña el trabajo de grado <i>«Reducción del desperdicio de alimentos mediante la redistribución digital de excedentes hacia estudiantes universitarios vulnerables en la ciudad de Manizales: propuesta de diseño de una aplicación web»</i>, de Gabriel Sánchez Cristancho, dirigido por el Ph.D. Jheimer Julián Sepúlveda López (Universidad Nacional de Colombia, sede Manizales, 2026).</p>
    <h2>Qué demuestra</h2>
    <ul>
      <li><b>Usabilidad:</b> reservar en tres pasos y publicar en menos de dos minutos.</li>
      <li><b>Trazabilidad:</b> ficha y declaración obligatorias; cada acción queda en un historial encadenado que no se puede alterar sin detectarlo.</li>
      <li><b>Equidad:</b> validación por la universidad, acceso prioritario, cupo semanal, una reserva activa y pausa por inasistencias.</li>
      <li><b>Discreción:</b> el establecimiento solo ve un código de retiro, nunca el nombre del estudiante.</li>
    </ul>
    <h2>Límites</h2>
    <p>Es un prototipo funcional sin servidor: los datos son ficticios y se guardan solo en este navegador. La validación de la universidad, las notificaciones y el mapa están simulados. Los parámetros (15 minutos, 3 reservas, tiempos máximos) son valores iniciales para una prueba piloto. La aplicación registra la información del alimento, pero no certifica su inocuidad.</p>
    <p class="muted small">Prototipo elaborado con apoyo de Claude (Anthropic, 2026).</p>
    <p><a class="btn" href="#/">Volver al inicio</a></p>
  </section>`;
}

/* ---------- Estudiante ---------- */

function vistaEstudiante(r) {
  if (r.vista === 'd') return vistaDetalle(r.id);
  if (r.vista === 'reservas') return vistaReservas();
  if (r.vista === 'perfil') return vistaPerfil();
  if (r.vista === 'avisos') return vistaAvisos();
  return vistaDonaciones();
}

function cupoHTML() {
  const st = S.obtener();
  const usado = S.cupoUsado();
  const total = st.params.reservasSemana;
  const libre = Math.max(total - usado, 0);
  const pct = Math.min(100, (usado / total) * 100);
  return `<div class="card cupo">
      <div class="row-between"><b>Tu cupo de esta semana</b><span class="muted">${libre} de ${total} disponibles</span></div>
      <div class="bar" role="progressbar" aria-label="Reservas usadas esta semana" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${usado}"><span style="width:${pct}%"></span></div>
      <span class="small muted">Se renueva el lunes. Así más compañeros pueden acceder.</span>
    </div>`;
}

function estadoCuentaHTML() {
  const e = S.obtener().estudiante;
  if (e.estado === 'validado') {
    if (e.pausaHasta && new Date(e.pausaHasta) > new Date()) return `<div class="alert warn">${icono('alert')}<span>Tu cuenta está en pausa hasta el ${new Date(e.pausaHasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} por reservas no recogidas.</span></div>`;
    return '';
  }
  const txt = e.estado === 'pendiente' ? 'Tu universidad está revisando tu solicitud. Mientras tanto puedes explorar.' : 'Para reservar, primero valida que eres estudiante.';
  return `<div class="alert info">${icono('info')}<span>${txt} <a href="#/estudiante/perfil">Ir a mi perfil</a></span></div>`;
}

function vistaDonaciones() {
  const st = S.obtener();
  const e = st.estudiante;
  const activa = S.reservaActivaEstudiante();
  let lista = S.donacionesActivas();
  if (ui.filtro === 'preparada') lista = lista.filter((d) => d.tipo === 'preparada');
  if (ui.filtro === 'panaderia') lista = lista.filter((d) => d.tipo === 'panaderia');
  if (ui.filtro === 'alergenos') lista = lista.filter((d) => !d.alergenos.some((a) => e.alergenos.includes(a)));
  lista.sort((a, b) => S.restaurante(a.restaurante).distancia - S.restaurante(b.restaurante).distancia);
  const filtros = [['todas', 'Todas'], ['preparada', 'Comida preparada'], ['panaderia', 'Panadería'], ['alergenos', 'Sin mis alérgenos']];

  return `
  <section class="wrap">
    ${estadoCuentaHTML()}
    ${activa ? tarjetaReservaActiva(activa) : ''}
    <div class="split">
      <div class="col-main">
        <h1 class="h-page">Hoy hay comida disponible cerca de ti</h1>
        ${cupoHTML()}
        <div class="chips" role="group" aria-label="Filtrar publicaciones">
          ${filtros.map(([v, t]) => `<button class="chip ${ui.filtro === v ? 'on' : ''}" data-action="filtro" data-v="${v}" aria-pressed="${ui.filtro === v}">${t}</button>`).join('')}
        </div>
        <h2 class="h-sub">${lista.length} ${lista.length === 1 ? 'publicación activa' : 'publicaciones activas'}</h2>
        <div class="stack">
          ${lista.length ? lista.map((d, i) => tarjetaDonacion(d, i + 1)).join('') : `<div class="empty">${icono('leaf')}<p>No hay publicaciones con este filtro. Te avisaremos cuando un establecimiento publique.</p></div>`}
        </div>
      </div>
      <div class="col-side">${mapaHTML(lista)}</div>
    </div>
  </section>`;
}

function tarjetaReservaActiva(r) {
  const d = S.donacion(r.donacion);
  const rest = S.restaurante(d.restaurante);
  return `<a class="card active-res" href="#/estudiante/reservas">
    <span class="small strong">Tu reserva activa</span>
    <span class="code-sm">${esc(r.codigo)}</span>
    <span>${esc(d.nombre)} · ${esc(rest.nombre)}</span>
    <span class="pill amber">Recoger ${hora(d.ventanaInicio)} – ${hora(d.ventanaFin)}</span>
  </a>`;
}

function tarjetaDonacion(d, n) {
  const rest = S.restaurante(d.restaurante);
  const e = S.obtener().estudiante;
  const prioridad = S.enPrioridad(d);
  const alergia = d.alergenos.filter((a) => e.alergenos.includes(a));
  const alerg = d.alergenos.length
    ? `Contiene ${d.alergenos.map((a) => S.ALERGENOS.find((x) => x.id === a).nombre.toLowerCase()).join(', ')}`
    : 'Sin alérgenos declarados';
  return `<a class="card don ${prioridad ? 'prio' : ''}" href="#/estudiante/d/${d.id}">
    <span class="row-between"><span class="muted small">${n} · ${esc(rest.nombre)} · ${distancia(rest.distancia)}</span>${icono('chevron')}</span>
    <span class="don-t">${esc(d.nombre)}</span>
    <span class="pills">
      <span class="pill amber">Recoger ${hora(d.ventanaInicio)} – ${hora(d.ventanaFin)}</span>
      <span class="pill green">${d.porcionesDisponibles} de ${d.porcionesPublicadas} ${d.tipo === 'panaderia' ? 'bolsas' : 'porciones'}</span>
      <span class="pill ${alergia.length ? 'red' : 'grey'}">${alergia.length ? `${icono('alert')} Contiene tu alérgeno` : esc(alerg)}</span>
    </span>
    ${prioridad ? `<span class="prio-note">${icono('clock')} ${e.prioridad === 'alta' ? 'Acceso prioritario para ti' : `Acceso prioritario en curso. Abre para todos a las ${hora(d.prioridadHasta)}`}</span>` : ''}
  </a>`;
}

function distancia(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${m} m`;
}

function mapaHTML(lista) {
  const st = S.obtener();
  const vistos = {};
  const pins = lista.map((d, i) => {
    const r = S.restaurante(d.restaurante);
    const k = (vistos[r.id] = (vistos[r.id] ?? -1) + 1);
    return `<a class="pin ${S.enPrioridad(d) ? 'pin-prio' : ''}" style="left:${r.x + k * 9}%;top:${r.y + k * 4}%" href="#/estudiante/d/${d.id}" aria-label="${esc(r.nombre)}: ${esc(d.nombre)}">${i + 1}</a>`;
  }).join('');
  return `<div class="map" role="group" aria-label="Mapa aproximado de establecimientos cercanos">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect width="100" height="100" fill="#E6ECE4"/>
      <path d="M0 26 H100 M0 58 H100 M0 84 H100 M22 0 V100 M52 0 V100 M78 0 V100" stroke="#F7F9F5" stroke-width="3.2"/>
      <path d="M0 96 C30 70 55 92 100 60" stroke="#CFE0EE" stroke-width="4" fill="none"/>
      <rect x="56" y="30" width="18" height="22" rx="3" fill="#D3E2D2"/>
    </svg>
    <span class="me" style="left:44%;top:48%" aria-hidden="true"></span>
    ${pins}
    <span class="map-note">Ubicación aproximada · ${st.estudiante.estado === 'validado' ? 'la dirección exacta aparece al reservar' : 'valida tu cuenta para reservar'}</span>
  </div>`;
}

function vistaDetalle(id) {
  const d = S.donacion(id);
  if (!d) return `<section class="wrap narrow"><p>Esta publicación no existe.</p><a class="btn" href="#/estudiante">Volver</a></section>`;
  const rest = S.restaurante(d.restaurante);
  const bloqueo = S.motivoBloqueo(d);
  const e = S.obtener().estudiante;
  const alergia = d.alergenos.filter((a) => e.alergenos.includes(a));
  const nombresAlerg = d.alergenos.map((a) => S.ALERGENOS.find((x) => x.id === a).nombre);
  return `
  <section class="wrap">
    <a class="back" href="#/estudiante">${icono('back')} Donaciones</a>
    <div class="split">
      <div class="col-main">
        <p class="muted">${esc(rest.nombre)} · ${esc(rest.barrio)} · ${distancia(rest.distancia)}</p>
        <h1 class="h-page">${esc(d.nombre)}</h1>
        <div class="pills">
          <span class="pill green">${d.porcionesDisponibles} de ${d.porcionesPublicadas} disponibles</span>
          <span class="pill grey">Aprox. ${d.gramos} g por porción</span>
          <span class="pill grey">${esc(d.id)}</span>
        </div>
        <div class="card window">${icono('clock')}<div><b>Recoger hoy entre ${hora(d.ventanaInicio)} y ${hora(d.ventanaFin)}</b><span>Al cierre de la jornada. La publicación se retira sola a las ${hora(d.ventanaFin)}</span></div></div>
        <div class="card">
          <h2 class="h-card">Ficha del alimento</h2>
          <dl class="facts">
            <div><dt>Preparado</dt><dd>${fechaHora(d.horaPreparacion)}</dd></div>
            <div><dt>Conservación</dt><dd>${esc(S.CONSERVACION[d.conservacion])}</dd></div>
            <div><dt>Tipo</dt><dd>${esc(S.TIPOS[d.tipo])}</dd></div>
            <div><dt>Empaque</dt><dd>${esc(d.empaque)}</dd></div>
          </dl>
          <hr>
          <dl class="facts one"><div><dt>Ingredientes</dt><dd>${esc(d.ingredientes)}</dd></div></dl>
          <div class="alrg"><span class="dt">Alérgenos declarados</span>
            <div class="pills">${nombresAlerg.length ? nombresAlerg.map((n) => `<span class="pill amber">${esc(n)}</span>`).join('') : '<span class="pill green">Ninguno de la lista</span>'}${d.trazas ? `<span class="pill amber">${esc(d.trazas)}</span>` : ''}</div>
          </div>
          ${alergia.length ? `<div class="alert danger">${icono('alert')}<span>Contiene ${alergia.map((a) => S.ALERGENOS.find((x) => x.id === a).nombre.toLowerCase()).join(', ')}, que marcaste en tu perfil.</span></div>` : ''}
          <hr>
          <p class="decl">${icono('shield')}<span>El establecimiento declaró que es excedente de la jornada, que no viene de platos servidos y que se conservó como se indica. Publicado a las ${hora(d.publicadaEn)}</span></p>
        </div>
      </div>
      <div class="col-side">
        <div class="card sticky">
          <h2 class="h-card">Cómo es la entrega</h2>
          <p>Recibes un código de retiro. Lo dices en «${esc(rest.entrada)}» y te entregan tu porción. El establecimiento no ve tu nombre, solo el código. La dirección exacta aparece al reservar.</p>
          ${bloqueo ? `<div class="alert ${bloqueo.tipo === 'prioridad' ? 'info' : 'warn'}">${icono(bloqueo.tipo === 'prioridad' ? 'clock' : 'alert')}<span>${esc(bloqueo.texto)}</span></div>` : ''}
          <label class="check">
            <input type="checkbox" data-action="aceptar" ${ui.fichaAceptada ? 'checked' : ''} ${bloqueo ? 'disabled' : ''}>
            <span>Leí la ficha. Entiendo que el establecimiento es responsable de la información del alimento y que ShareFood la registra, pero no certifica la inocuidad.</span>
          </label>
          <button class="btn primary block" data-action="reservar" data-id="${d.id}" ${bloqueo || !ui.fichaAceptada ? 'disabled' : ''}>Reservar 1 ${d.tipo === 'panaderia' ? 'bolsa' : 'porción'}</button>
          ${!bloqueo ? `<p class="small muted center">Usará 1 de tus ${Math.max(S.obtener().params.reservasSemana - S.cupoUsado(), 0)} reservas restantes esta semana.</p>` : ''}
          <details class="report">
            <summary>Reportar un problema con esta publicación</summary>
            <form data-form="reporte" data-id="${d.id}">
              <label for="rep-tipo">Tipo de problema</label>
              <select id="rep-tipo" name="tipo">
                <option value="informacion">Información incompleta o incorrecta</option>
                <option value="sanitaria">Alimento en mal estado o riesgo sanitario</option>
                <option value="entrega">Problema durante la entrega</option>
              </select>
              <label for="rep-desc">Cuéntanos qué pasó (opcional)</label>
              <textarea id="rep-desc" name="descripcion" rows="3"></textarea>
              <button class="btn" type="submit">Enviar reporte</button>
              <p class="small muted">Un reporte sanitario suspende la publicación hasta que la coordinación la revise (RN10).</p>
            </form>
          </details>
        </div>
      </div>
    </div>
  </section>`;
}

function vistaReservas() {
  const lista = S.reservasEstudiante();
  const activa = lista.find((r) => r.estado === 'activa');
  const historial = lista.filter((r) => r !== activa);
  const ETQ = { entregada: ['green', 'Entregada'], cancelada: ['grey', 'Cancelada'], no_recogida: ['red', 'No recogida'] };
  return `
  <section class="wrap narrow">
    <h1 class="h-page">Mis reservas</h1>
    ${activa ? reservaGrande(activa) : `<div class="empty">${icono('ticket')}<p>No tienes reservas activas.</p><a class="btn primary" href="#/estudiante">Ver donaciones cercanas</a></div>`}
    <h2 class="h-sub">Historial</h2>
    <div class="stack">
      ${historial.length ? historial.map((r) => {
        const d = S.donacion(r.donacion);
        const [c, t] = ETQ[r.estado];
        return `<div class="card hist"><div><b>${esc(d.nombre)}</b><span class="small muted">${esc(S.restaurante(d.restaurante).nombre)} · ${fechaHora(r.creadaEn)} · ${esc(r.codigo)}</span></div><span class="pill ${c}">${t}</span></div>`;
      }).join('') : '<p class="muted">Aún no hay reservas anteriores.</p>'}
    </div>
  </section>`;
}

function reservaGrande(r) {
  const d = S.donacion(r.donacion);
  const rest = S.restaurante(d.restaurante);
  const empezo = Date.now() >= new Date(d.ventanaInicio).getTime();
  return `
    <div class="confirm">
      <span class="ok-ic">${icono('check')}</span>
      <p class="muted">${esc(d.nombre)} · 1 ${d.tipo === 'panaderia' ? 'bolsa' : 'porción'}</p>
    </div>
    <div class="card code-card">
      <span class="small strong muted">Tu código de retiro</span>
      <span class="code">${esc(r.codigo)}</span>
      <span class="small muted center">Dilo o muéstralo al llegar. El establecimiento solo ve este código, no tu nombre.</span>
    </div>
    <div class="card">
      <p class="iconline">${icono('pin')}<span><b>${esc(rest.nombre)}</b><br>${esc(rest.direccion)} · ${esc(rest.barrio)}<br>Entrega en: ${esc(rest.entrada)}</span></p>
      <p class="iconline amber-t">${icono('clock')}<span><b>Hoy, de ${hora(d.ventanaInicio)} a ${hora(d.ventanaFin)}</b><br>${empezo ? 'La ventana de recogida está abierta.' : `Faltan ${faltan(d.ventanaInicio)} para que abra la ventana.`}</span></p>
    </div>
    <ol class="timeline">
      <li class="done">Reservada · ${hora(r.creadaEn)}</li>
      <li>Recogida (la confirma el establecimiento)</li>
      <li>Cuéntanos cómo te fue (opcional)</li>
    </ol>
    <button class="btn block" data-action="cancelar" data-id="${r.id}" ${empezo ? 'disabled' : ''}>Cancelar reserva</button>
    <p class="small muted center">${empezo ? 'La ventana ya empezó: si no puedes ir, avisa en el establecimiento.' : `Si no puedes ir, cancela antes de las ${hora(d.ventanaInicio)} y la porción queda para otro compañero.`}</p>
    <div class="demo-box">
      <span class="small strong">Demostración</span>
      <span class="small muted">Para ver la otra cara de la entrega, entra como establecimiento (${esc(rest.nombre)}) y escribe el código ${esc(r.codigo)}.</span>
      <button class="btn small-btn" data-action="ir-restaurante" data-id="${rest.id}">Abrir como ${esc(rest.nombre)}</button>
    </div>`;
}

function vistaAvisos() {
  const st = S.obtener();
  const lista = st.notificaciones;
  setTimeout(() => { if (lista.some((n) => !n.leida)) S.marcarNotificacionesLeidas(); }, 1200);
  return `
  <section class="wrap narrow">
    <a class="back" href="#/estudiante">${icono('back')} Donaciones</a>
    <h1 class="h-page">Avisos</h1>
    <div class="stack">${lista.length ? lista.map((n) => `<div class="card notif ${n.leida ? '' : 'unread'}"><span>${esc(n.texto)}</span><span class="small muted">${fechaHora(n.ts)}</span></div>`).join('') : '<p class="muted">Sin avisos.</p>'}</div>
    <p class="small muted">En la versión real llegarían por correo y como notificación del navegador (Amazon SNS).</p>
  </section>`;
}

function vistaPerfil() {
  const st = S.obtener();
  const e = st.estudiante;
  const uni = S.UNIVERSIDADES.find((u) => u.id === e.universidad);
  const errores = ui.errores;
  let bloque;
  if (e.estado === 'sin_registro') {
    bloque = `
      <form class="card form" data-form="registro" novalidate>
        <p class="small muted">Paso 1 de 2</p>
        <h2 class="h-card">Confirma que eres estudiante</h2>
        <p>Tu universidad confirma si cumples los criterios del programa. No tienes que subir documentos de ingresos ni contarle tu situación a nadie.</p>
        <label for="uni">Universidad</label>
        <select id="uni" name="universidad">${S.UNIVERSIDADES.map((u) => `<option value="${u.id}" ${u.id === e.universidad ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>
        <label for="correo">Correo institucional</label>
        <input id="correo" name="correo" type="email" autocomplete="email" value="${esc(e.correo)}" aria-describedby="correo-err" ${errores.correo ? 'aria-invalid="true"' : ''}>
        ${errores.correo ? `<p class="field-err" id="correo-err">${esc(errores.correo)}</p>` : ''}
        <div class="card soft">
          <b>Qué consultará Bienestar Universitario</b>
          <ul class="ticks"><li>Que tienes matrícula activa.</li><li>Si cumples el criterio socioeconómico del programa (por ejemplo, PBM o su equivalente).</li><li>ShareFood solo recibe el resultado: elegible y nivel de prioridad. Nunca tu puntaje.</li></ul>
        </div>
        <label class="check"><input type="checkbox" name="consentimiento" ${errores.consentimiento ? 'aria-invalid="true"' : ''}><span>Autorizo a mi universidad a confirmar mi elegibilidad a ShareFood, según la política de tratamiento de datos (Ley 1581 de 2012).</span></label>
        ${errores.consentimiento ? `<p class="field-err">${esc(errores.consentimiento)}</p>` : ''}
        <button class="btn primary block" type="submit">Enviar solicitud</button>
      </form>`;
  } else if (e.estado === 'pendiente') {
    bloque = `
      <div class="card">
        <p class="small muted">Paso 2 de 2</p>
        <h2 class="h-card">Solicitud enviada a ${esc(uni.nombre)}</h2>
        <p>Te avisaremos cuando tu universidad responda. Mientras tanto puedes explorar las publicaciones.</p>
        <div class="demo-box">
          <span class="small strong">Demostración: simular la respuesta de la universidad</span>
          <div class="row-gap"><button class="btn" data-action="simular-uni" data-v="normal">Elegible · prioridad normal</button><button class="btn" data-action="simular-uni" data-v="alta">Elegible · prioridad alta</button></div>
        </div>
      </div>`;
  } else {
    bloque = `
      <div class="card">
        <div class="row-between"><h2 class="h-card">Cuenta validada</h2><span class="pill green">${icono('check')} Elegible</span></div>
        <dl class="facts">
          <div><dt>Seudónimo</dt><dd>${esc(e.seudonimo)}</dd></div>
          <div><dt>Universidad</dt><dd>${esc(uni?.nombre || '')}</dd></div>
          <div><dt>Correo</dt><dd>${esc(e.correo)}</dd></div>
          <div><dt>Nivel de prioridad</dt><dd>${e.prioridad === 'alta' ? 'Alta' : 'Normal'}</dd></div>
        </dl>
        <div class="demo-box">
          <span class="small strong">Demostración</span>
          <span class="small muted">La prioridad la asigna la universidad. Aquí puedes cambiarla para ver cómo funciona el acceso prioritario.</span>
          <div class="row-gap">
            <button class="btn small-btn" data-action="prioridad" data-v="${e.prioridad === 'alta' ? 'normal' : 'alta'}">Cambiar a prioridad ${e.prioridad === 'alta' ? 'normal' : 'alta'}</button>
            <button class="btn small-btn" data-action="reiniciar-registro">Ver el registro desde cero</button>
          </div>
        </div>
      </div>`;
  }
  return `
  <section class="wrap narrow">
    <h1 class="h-page">Perfil</h1>
    ${bloque}
    <div class="card">
      <h2 class="h-card">Alérgenos o alimentos que debes evitar</h2>
      <p class="small muted">Los usamos para filtrar y avisarte. No se comparten con los establecimientos.</p>
      <div class="chips">${S.ALERGENOS.map((a) => `<button class="chip ${e.alergenos.includes(a.id) ? 'on' : ''}" data-action="alergeno" data-v="${a.id}" aria-pressed="${e.alergenos.includes(a.id)}">${esc(a.nombre)}</button>`).join('')}</div>
    </div>
  </section>`;
}

/* ---------- Establecimiento ---------- */

function selectorRestaurante() {
  const st = S.obtener();
  return `<label class="rest-sel"><span class="small muted">Estás operando como</span>
    <select data-action="restaurante">${st.restaurantes.map((r) => `<option value="${r.id}" ${r.id === st.restauranteActual ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</select>
  </label>`;
}

function vistaRestaurante(r) {
  if (r.vista === 'publicar') return vistaPublicar();
  if (r.vista === 'historial') return vistaHistorial();
  return vistaEntregas();
}

function vistaEntregas() {
  const st = S.obtener();
  const actuales = st.donaciones.filter((d) => d.restaurante === st.restauranteActual && ['publicada', 'suspendida'].includes(d.estado));
  const ids = actuales.map((d) => d.id);
  const reservas = st.reservas.filter((x) => ids.includes(x.donacion));
  const pub = actuales.reduce((t, d) => t + d.porcionesPublicadas, 0);
  const res = reservas.filter((x) => x.estado !== 'cancelada').length;
  const ent = reservas.filter((x) => x.estado === 'entregada').length;
  const ESTADO = { activa: ['amber', 'Por recoger'], entregada: ['green', 'Entregada'], cancelada: ['grey', 'Cancelada · cupo liberado'], no_recogida: ['red', 'No recogida'] };
  const msg = ui.mensajeEntrega;
  return `
  <section class="wrap">
    ${selectorRestaurante()}
    <div class="split">
      <div class="col-main">
        <h1 class="h-page">Recogidas de hoy</h1>
        ${actuales.length ? actuales.map((d) => `<p class="muted">${esc(d.nombre)} · ventana ${hora(d.ventanaInicio)} – ${hora(d.ventanaFin)} ${d.estado === 'suspendida' ? '<span class="pill red">Suspendida por reporte</span>' : ''}</p>`).join('') : '<p class="muted">No tienes publicaciones activas. Si te sobró comida hoy, publícala.</p>'}
        <div class="kpis three">
          <div class="kpi"><b>${pub}</b><span>publicadas</span></div>
          <div class="kpi"><b>${res}</b><span>reservadas</span></div>
          <div class="kpi"><b class="green-t">${ent}</b><span>entregadas</span></div>
        </div>
        <form class="card" data-form="entrega" novalidate>
          <label for="codigo" class="h-card">Confirmar una entrega</label>
          <p class="small muted">Escribe el código que te dice el estudiante. Si no coincide con una reserva de hoy, no entregues.</p>
          <div class="code-row">
            <input id="codigo" name="codigo" class="code-input" placeholder="SF-0000" autocomplete="off" autocapitalize="characters" inputmode="text" aria-describedby="entrega-msg">
            <button class="btn primary" type="submit">Entregar</button>
          </div>
          <div id="entrega-msg" aria-live="polite">${msg ? `<div class="alert ${msg.ok ? 'ok' : 'danger'}">${icono(msg.ok ? 'check' : 'alert')}<span>${esc(msg.texto)}</span></div>` : ''}</div>
        </form>
      </div>
      <div class="col-side">
        <div class="card">
          <h2 class="h-card">Reservas de hoy</h2>
          ${reservas.length ? `<div class="table-wrap"><table><thead><tr><th scope="col">Código</th><th scope="col">Porciones</th><th scope="col">Estado</th></tr></thead><tbody>
            ${reservas.map((x) => `<tr><td class="mono nowrap">${esc(x.codigo)}</td><td>${x.porciones}</td><td><span class="pill ${ESTADO[x.estado][0]}">${ESTADO[x.estado][1]}${x.entregadaEn ? ` ${hora(x.entregadaEn)}` : ''}</span></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted">Todavía no hay reservas.</p>'}
          ${actuales.some((d) => d.estado === 'publicada' && d.porcionesDisponibles > 0) ? `<button class="btn small-btn" data-action="simular-reserva">Simular la reserva de otro estudiante</button>` : ''}
          ${actuales.length ? `<button class="btn block outline-dark" data-action="cerrar-jornada">Cerrar jornada</button><p class="small muted">Al cerrar, las reservas no recogidas quedan registradas y la publicación se archiva.</p>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

function borradorInicial() {
  const ahora = Date.now();
  const ini = redondear5(ahora + 30 * MIN);
  return {
    tipo: 'preparada', nombre: '', porciones: 5, gramos: 350,
    horaPrep: aHHMM(new Date(ahora - 3 * 60 * MIN).toISOString()),
    conservacion: '', ingredientes: '', alergenos: [], ninguno: false,
    desde: aHHMM(new Date(ini).toISOString()), hasta: aHHMM(new Date(ini + 30 * MIN).toISOString()),
    excedente: false, noServido: false, conservacionOk: false,
  };
}

function vistaPublicar() {
  if (!ui.borrador) ui.borrador = borradorInicial();
  const b = ui.borrador;
  const er = ui.errores;
  const errorDe = (k) => (er[k] ? `<p class="field-err" id="err-${k}">${esc(er[k])}</p>` : '');
  const inv = (k) => (er[k] ? `aria-invalid="true" aria-describedby="err-${k}"` : '');
  return `
  <section class="wrap narrow-wide">
    ${selectorRestaurante()}
    <h1 class="h-page">Publicar excedente</h1>
    <p class="muted">Publica solo lo que sobró hoy. Toma menos de dos minutos.</p>
    ${Object.keys(er).length ? `<div class="alert danger" role="alert">${icono('alert')}<span>Revisa ${Object.keys(er).length === 1 ? 'el campo marcado' : `los ${Object.keys(er).length} campos marcados`} antes de publicar.</span></div>` : ''}
    <form class="card form" data-form="publicar" novalidate>
      <div class="grid2">
        <div><label for="tipo">Tipo de alimento</label>
          <select id="tipo" name="tipo">${Object.entries(S.TIPOS).map(([k, v]) => `<option value="${k}" ${b.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label for="nombre">Nombre del plato</label>
          <input id="nombre" name="nombre" value="${esc(b.nombre)}" placeholder="Ej.: Arroz con pollo y ensalada" ${inv('nombre')}>${errorDe('nombre')}</div>
        <div><label for="porciones">Porciones</label>
          <input id="porciones" name="porciones" type="number" min="1" max="50" value="${b.porciones}" ${inv('porciones')}>${errorDe('porciones')}</div>
        <div><label for="horaPrep">Hora de preparación (hoy)</label>
          <input id="horaPrep" name="horaPrep" type="time" value="${b.horaPrep}" ${inv('horaPreparacion')}>${errorDe('horaPreparacion')}</div>
      </div>
      <fieldset ${er.conservacion ? 'aria-invalid="true"' : ''}><legend>¿Cómo se ha conservado?</legend>
        <div class="radios">${Object.entries(S.CONSERVACION).map(([k, v]) => `<label class="radio ${b.conservacion === k ? 'on' : ''}"><input type="radio" name="conservacion" value="${k}" ${b.conservacion === k ? 'checked' : ''}>${v}</label>`).join('')}</div>
        ${errorDe('conservacion')}
      </fieldset>
      <label for="ingredientes">Ingredientes principales</label>
      <textarea id="ingredientes" name="ingredientes" rows="3" placeholder="Ej.: arroz, pollo, zanahoria, arveja…" ${inv('ingredientes')}>${esc(b.ingredientes)}</textarea>${errorDe('ingredientes')}
      <fieldset><legend>Alérgenos presentes</legend>
        <div class="chips">
          ${S.ALERGENOS.map((a) => `<label class="chip ${b.alergenos.includes(a.id) ? 'on' : ''}"><input class="sr" type="checkbox" name="alergenos" value="${a.id}" ${b.alergenos.includes(a.id) ? 'checked' : ''}>${esc(a.nombre)}</label>`).join('')}
          <label class="chip ${b.ninguno ? 'on' : ''}"><input class="sr" type="checkbox" name="ninguno" ${b.ninguno ? 'checked' : ''}>Ninguno</label>
        </div>${errorDe('alergenos')}
      </fieldset>
      <fieldset><legend>Ventana de recogida (hoy)</legend>
        <div class="grid2">
          <div><label for="desde">Desde</label><input id="desde" name="desde" type="time" value="${b.desde}" ${inv('ventana')}></div>
          <div><label for="hasta">Hasta</label><input id="hasta" name="hasta" type="time" value="${b.hasta}" ${inv('ventana')}></div>
        </div>${errorDe('ventana')}
        <p class="small muted">La publicación se retira sola al terminar la ventana.</p>
      </fieldset>
      <fieldset class="card soft"><legend>Declaración del establecimiento</legend>
        <label class="check"><input type="checkbox" name="excedente" ${b.excedente ? 'checked' : ''}><span>Es excedente de la jornada. No se preparó para donar.</span></label>
        <label class="check"><input type="checkbox" name="noServido" ${b.noServido ? 'checked' : ''}><span>No proviene de platos servidos a clientes.</span></label>
        <label class="check"><input type="checkbox" name="conservacionOk" ${b.conservacionOk ? 'checked' : ''}><span>Se manipuló y conservó según la Resolución 2674 de 2013, en recipiente cerrado.</span></label>
        ${errorDe('declaracion')}
      </fieldset>
      <button class="btn primary block" type="submit">Publicar ${b.porciones || ''} ${b.tipo === 'panaderia' ? 'bolsas' : 'porciones'}</button>
      <p class="small muted center">Se avisará primero a estudiantes con prioridad y, ${S.obtener().params.minutosPrioridad} minutos después, a todos los beneficiarios validados.</p>
      <button class="btn small-btn" type="button" data-action="autocompletar">Demostración: llenar con un ejemplo</button>
    </form>
  </section>`;
}

function vistaHistorial() {
  const st = S.obtener();
  const ds = st.donaciones.filter((d) => d.restaurante === st.restauranteActual).slice().reverse();
  const ESTADO = { publicada: ['green', 'Publicada'], cerrada: ['grey', 'Cerrada'], retirada: ['grey', 'Retirada'], suspendida: ['red', 'Suspendida'] };
  return `
  <section class="wrap narrow">
    ${selectorRestaurante()}
    <h1 class="h-page">Historial de publicaciones</h1>
    <div class="stack">${ds.length ? ds.map((d) => {
      const rs = st.reservas.filter((r) => r.donacion === d.id);
      const ent = rs.filter((r) => r.estado === 'entregada').length;
      return `<div class="card hist"><div><b>${esc(d.nombre)}</b><span class="small muted">${esc(d.id)} · ${fechaHora(d.publicadaEn)} · ${ent} de ${d.porcionesPublicadas} entregadas</span></div>
        <div class="row-gap"><span class="pill ${ESTADO[d.estado][0]}">${ESTADO[d.estado][1]}</span>${d.estado === 'publicada' ? `<button class="btn small-btn" data-action="retirar" data-id="${d.id}">Retirar</button>` : ''}</div></div>`;
    }).join('') : '<p class="muted">Sin publicaciones.</p>'}</div>
  </section>`;
}

/* ---------- Coordinación ---------- */

function vistaCoordinacion() {
  const r = ruta();
  if (r.vista === 'trazabilidad') return vistaTrazabilidad();
  if (r.vista === 'parametros') return vistaParametros();
  const k = S.indicadores();
  const al = S.alertas();
  const st = S.obtener();
  const eventos = st.eventos.slice(-6).reverse();
  return `
  <section class="wrap">
    <p class="muted">Coordinación · Bienestar Universitario</p>
    <h1 class="h-page">Resumen de la operación</h1>
    <div class="kpis four">
      <div class="kpi"><b>${k.porciones}</b><span>porciones entregadas</span></div>
      <div class="kpi"><b>${k.tasa === null ? '—' : `${k.tasa} %`}</b><span>tasa de recogida</span></div>
      <div class="kpi"><b>${k.kg.toFixed(1).replace('.', ',')} kg</b><span>alimento aprovechado (estimado)</span></div>
      <div class="kpi"><b>${k.beneficiarios}</b><span>beneficiarios atendidos</span></div>
    </div>
    <p class="small muted">Calculado con los datos de esta demostración.</p>
    <div class="split">
      <div class="col-main">
        <div class="card">
          <div class="row-between"><h2 class="h-card">Últimos eventos</h2><a href="#/coordinacion/trazabilidad">Ver todo</a></div>
          ${tablaEventos(eventos)}
        </div>
      </div>
      <div class="col-side">
        <div class="card">
          <h2 class="h-card">Alertas para revisar</h2>
          ${al.length ? al.map((a) => `<div class="alert ${a.tipo === 'patron' ? 'warn' : 'danger'}">${icono('alert')}<span>${esc(a.texto)}${a.id ? `<span class="row-gap"><button class="btn small-btn" data-action="incidencia" data-id="${a.id}" data-v="reactivar">Reactivar publicación</button><button class="btn small-btn" data-action="incidencia" data-id="${a.id}" data-v="retirar">Retirar publicación</button></span>` : ''}</span></div>`).join('') : '<p class="muted">Sin alertas. Prueba reportar un problema sanitario como estudiante.</p>'}
        </div>
      </div>
    </div>
  </section>`;
}

function tablaEventos(eventos) {
  return `<div class="table-wrap"><table><thead><tr><th scope="col">Hora</th><th scope="col">Referencia</th><th scope="col">Evento</th><th scope="col">Actor</th></tr></thead><tbody>
    ${eventos.map((e) => `<tr><td class="nowrap">${fechaHora(e.ts)}</td><td class="mono nowrap">${esc(e.entidadId)}</td><td>${esc(e.tipo)}</td><td>${esc(e.actor)}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function vistaTrazabilidad() {
  const st = S.obtener();
  const v = ui.verificacion;
  return `
  <section class="wrap">
    <h1 class="h-page">Registro de trazabilidad</h1>
    <p class="muted">Cada evento guarda la huella (hash) del anterior. Si alguien modifica un evento pasado, la cadena se rompe y se detecta.</p>
    <div class="row-gap">
      <button class="btn" data-action="verificar">${icono('shield')} Verificar integridad</button>
      <button class="btn" data-action="exportar">${icono('download')} Exportar para autoridad sanitaria (CSV)</button>
    </div>
    ${v ? `<div class="alert ${v.ok ? 'ok' : 'danger'}">${icono(v.ok ? 'check' : 'alert')}<span>${v.ok ? `Cadena íntegra: ${v.total} eventos verificados.` : `La cadena se rompe en el evento ${v.evento}.`}</span></div>` : ''}
    <div class="card">
      <div class="table-wrap"><table><thead><tr><th scope="col">#</th><th scope="col">Hora</th><th scope="col">Referencia</th><th scope="col">Evento</th><th scope="col">Actor</th><th scope="col">Huella</th></tr></thead><tbody>
        ${st.eventos.slice().reverse().map((e) => `<tr><td>${e.id}</td><td class="nowrap">${fechaHora(e.ts)}</td><td class="mono nowrap">${esc(e.entidadId)}</td><td>${esc(e.tipo)}</td><td>${esc(e.actor)}</td><td class="mono small">${e.hash}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
  </section>`;
}

function vistaParametros() {
  const p = S.obtener().params;
  return `
  <section class="wrap narrow">
    <h1 class="h-page">Parámetros de equidad</h1>
    <p class="muted">Valores iniciales para una prueba piloto. Cada universidad podría ajustarlos sin cambiar el software (RF17).</p>
    <form class="card form" data-form="parametros">
      <div class="grid2">
        <div><label for="p1">Reservas por semana (RN07)</label><input id="p1" name="reservasSemana" type="number" min="1" max="14" value="${p.reservasSemana}"></div>
        <div><label for="p2">Reservas activas a la vez (RN06)</label><input id="p2" name="reservasActivas" type="number" min="1" max="3" value="${p.reservasActivas}"></div>
        <div><label for="p3">Minutos de acceso prioritario (RN04)</label><input id="p3" name="minutosPrioridad" type="number" min="0" max="60" value="${p.minutosPrioridad}"></div>
        <div><label for="p4">Inasistencias para pausa (RN08)</label><input id="p4" name="inasistenciasPausa" type="number" min="1" max="10" value="${p.inasistenciasPausa}"></div>
        <div><label for="p5">Días de pausa (RN08)</label><input id="p5" name="diasPausa" type="number" min="1" max="30" value="${p.diasPausa}"></div>
      </div>
      <button class="btn primary" type="submit">Guardar parámetros</button>
    </form>
    <div class="card">
      <h2 class="h-card">Reiniciar la demostración</h2>
      <p class="small muted">Borra lo que hiciste en este navegador y vuelve a los datos de ejemplo.</p>
      <button class="btn" data-action="reiniciar">Reiniciar datos</button>
    </div>
  </section>`;
}

/* ---------- Eventos ---------- */

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.tagName === 'SELECT') return;
  const { action, id, v } = el.dataset;
  switch (action) {
    case 'filtro': ui.filtro = v; render(false); break;
    case 'reservar': {
      const res = S.reservar(id, ui.fichaAceptada);
      if (res.error) aviso(res.error); else { aviso(`Reserva confirmada. Tu código es ${res.reserva.codigo}.`); location.hash = '#/estudiante/reservas'; }
      break;
    }
    case 'cancelar': {
      const res = S.cancelar(id);
      aviso(res.error || 'Reserva cancelada. La porción quedó disponible para otro compañero.');
      break;
    }
    case 'ir-restaurante': S.cambiarRestaurante(id); location.hash = '#/restaurante'; break;
    case 'simular-uni': S.simularRespuestaUniversidad(v); aviso('La universidad confirmó tu elegibilidad.'); break;
    case 'prioridad': S.actualizarEstudiante({ prioridad: v }); aviso(`Prioridad ${v} activada (demostración).`); break;
    case 'reiniciar-registro': S.actualizarEstudiante({ estado: 'sin_registro' }); break;
    case 'alergeno': {
      const e = S.obtener().estudiante;
      const lista = e.alergenos.includes(v) ? e.alergenos.filter((x) => x !== v) : [...e.alergenos, v];
      S.actualizarEstudiante({ alergenos: lista });
      break;
    }
    case 'simular-reserva': {
      const st = S.obtener();
      const d = st.donaciones.find((x) => x.restaurante === st.restauranteActual && x.estado === 'publicada' && x.porcionesDisponibles > 0);
      const r = d && S.simularReservaExterna(d.id);
      if (r) aviso(`Nueva reserva ${r.codigo} (otro estudiante).`);
      break;
    }
    case 'cerrar-jornada': {
      if (!window.confirm || window.confirm('¿Cerrar la jornada? Las reservas no recogidas quedarán registradas.')) {
        const n = S.cerrarJornada();
        aviso(`Jornada cerrada: ${n} publicación(es) archivada(s).`);
      }
      break;
    }
    case 'retirar': S.retirarDonacion(id, 'Encargado del establecimiento'); aviso('Publicación retirada. Las reservas activas se cancelaron.'); break;
    case 'autocompletar': {
      const ahora = Date.now();
      const ini = redondear5(ahora + 20 * MIN);
      ui.borrador = {
        tipo: 'preparada', nombre: 'Lentejas con arroz y maduro', porciones: 4, gramos: 380,
        horaPrep: aHHMM(new Date(ahora - 2 * 60 * MIN).toISOString()), conservacion: 'refrigerado',
        ingredientes: 'Lentejas, arroz, plátano maduro, cebolla, tomate, ajo, aceite, sal.', alergenos: [], ninguno: true,
        desde: aHHMM(new Date(ini).toISOString()), hasta: aHHMM(new Date(ini + 30 * MIN).toISOString()),
        excedente: true, noServido: true, conservacionOk: true,
      };
      ui.errores = {};
      render(false);
      break;
    }
    case 'verificar': ui.verificacion = S.verificarIntegridad(); render(false); break;
    case 'exportar': descargar(`sharefood-trazabilidad-${new Date().toISOString().slice(0, 10)}.csv`, S.exportarCSV()); break;
    case 'incidencia': S.resolverIncidencia(id, v); aviso('Incidencia resuelta y registrada.'); break;
    case 'reiniciar':
      if (!window.confirm || window.confirm('¿Reiniciar la demostración?')) { S.reiniciar(); ui.verificacion = null; aviso('Datos de ejemplo restaurados.'); }
      break;
    default: break;
  }
});

document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.action === 'aceptar') { ui.fichaAceptada = el.checked; render(false); return; }
  if (el.dataset.action === 'restaurante') { S.cambiarRestaurante(el.value); ui.mensajeEntrega = null; return; }
  const form = el.closest('form[data-form="publicar"]');
  if (form) { leerBorrador(form); if (['checkbox', 'radio'].includes(el.type) || el.tagName === 'SELECT') render(false); }
});

document.addEventListener('input', (ev) => {
  const form = ev.target.closest('form[data-form="publicar"]');
  if (form && ev.target.type !== 'checkbox' && ev.target.type !== 'radio') leerBorrador(form);
});

function leerBorrador(form) {
  const f = new FormData(form);
  const b = ui.borrador;
  const ninguno = f.get('ninguno') === 'on';
  const alerg = f.getAll('alergenos');
  Object.assign(b, {
    tipo: f.get('tipo'), nombre: f.get('nombre') || '', porciones: Number(f.get('porciones')) || 0,
    horaPrep: f.get('horaPrep') || '', conservacion: f.get('conservacion') || '', ingredientes: f.get('ingredientes') || '',
    desde: f.get('desde') || '', hasta: f.get('hasta') || '',
    excedente: f.get('excedente') === 'on', noServido: f.get('noServido') === 'on', conservacionOk: f.get('conservacionOk') === 'on',
  });
  // "Ninguno" y los alérgenos se excluyen entre sí.
  if (ninguno && !b.ninguno) { b.ninguno = true; b.alergenos = []; } else { b.alergenos = alerg; b.ninguno = alerg.length ? false : ninguno; }
}

document.addEventListener('submit', (ev) => {
  const form = ev.target;
  const tipo = form.dataset.form;
  if (!tipo) return;
  ev.preventDefault();
  const f = new FormData(form);
  if (tipo === 'publicar') {
    leerBorrador(form);
    const b = ui.borrador;
    const res = S.publicar({
      tipo: b.tipo, nombre: b.nombre, porciones: b.porciones, gramos: b.gramos,
      horaPreparacion: b.horaPrep ? horaDeHoy(b.horaPrep) : '', conservacion: b.conservacion, empaque: 'Recipiente cerrado',
      ingredientes: b.ingredientes, alergenos: b.alergenos, alergenosRevisados: b.ninguno || b.alergenos.length > 0,
      ventanaInicio: b.desde ? horaDeHoy(b.desde) : '', ventanaFin: b.hasta ? horaDeHoy(b.hasta) : '',
      declaracion: { excedente: b.excedente, noServido: b.noServido, conservacion: b.conservacionOk },
    });
    if (res.errores) {
      ui.errores = res.errores;
      render(false);
      const primero = document.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
    } else {
      ui.errores = {};
      ui.borrador = null;
      aviso(`Publicado ${res.donacion.id}. Ya se avisó a los estudiantes con prioridad.`);
      location.hash = '#/restaurante';
    }
  } else if (tipo === 'entrega') {
    const res = S.confirmarEntrega(f.get('codigo') || '');
    ui.mensajeEntrega = res.error ? { ok: false, texto: res.error } : { ok: true, texto: `Código válido · ${res.reserva.porciones} porción · ${res.donacion.nombre}. Entrega registrada.` };
    render(false);
    document.getElementById('codigo')?.focus();
  } else if (tipo === 'registro') {
    const errores = {};
    if (f.get('consentimiento') !== 'on') errores.consentimiento = 'Necesitamos tu autorización para consultar a tu universidad.';
    const res = errores.consentimiento ? {} : S.solicitarValidacion({ correo: (f.get('correo') || '').trim(), universidad: f.get('universidad') });
    if (res.error) errores.correo = res.error;
    ui.errores = errores;
    if (Object.keys(errores).length) render(false); else { ui.errores = {}; aviso('Solicitud enviada a tu universidad.'); }
  } else if (tipo === 'reporte') {
    const inc = S.reportar(form.dataset.id, f.get('tipo'), (f.get('descripcion') || '').trim());
    aviso(inc.tipo === 'sanitaria' ? 'Gracias. La publicación quedó suspendida hasta que la coordinación la revise.' : 'Gracias. Tu reporte quedó registrado.');
    if (inc.tipo === 'sanitaria') location.hash = '#/estudiante';
  } else if (tipo === 'parametros') {
    const num = (k) => Math.max(0, Number(f.get(k)) || 0);
    S.actualizarParametros({
      reservasSemana: num('reservasSemana') || 1, reservasActivas: num('reservasActivas') || 1,
      minutosPrioridad: num('minutosPrioridad'), inasistenciasPausa: num('inasistenciasPausa') || 1, diasPausa: num('diasPausa') || 1,
    });
    aviso('Parámetros guardados y registrados en la trazabilidad.');
  }
});

function descargar(nombre, texto) {
  const blob = new Blob(['﻿', texto], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Arranque ---------- */

S.cargar();
window.addEventListener('hashchange', () => render(true));
S.suscribir(() => render(false));
setInterval(() => { if (!S.procesarVencimientos()) render(false); }, 30 * 1000);
render(true);
