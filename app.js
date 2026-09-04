/* ── Configuración Supabase ── */
// CAMBIA ESTAS DOS LÍNEAS:
var URL_SB = 'https://oozauduzzwvxtxehxixc.supabase.co';
var KEY_SB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vemF1ZHV6end2eHR4ZWh4aXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTU3MDgsImV4cCI6MjEwMzE3MTcwOH0.AeWtHC5bMFooI4EPdL7VF6QUZXRp5tTMNpFuAqMkqvY';
var sb = window.supabase.createClient(URL_SB, KEY_SB);

/* ── Estado global ── */
var D = { temporadas: [], partidos: [], jugadores: [], historial: [], copas: [], sinergias: [], sinergias_temp: [], rivalidades: [] };
var tAct = null, EG = {}, G = {};
var pagActual = 'inicio', rankingDatos = [], ultimosOrdenados = [];
var sortEstado = { col: 'pf', dir: 'desc' }, filtroActual = 'todos';
var COLS = [
  { key: 'nombre', label: 'Jugador' },
  { key: 'copas', label: 'Copas' },
  { key: 'cal', label: 'Cal.' },
  { key: 'mvp', label: 'MVP' },
  { key: 'v', label: 'V' },
  { key: 'e', label: 'E' },
  { key: 'd', label: 'D' },
  { key: 'pj', label: 'PJ' },
  { key: 'ewr', label: 'EWinrate' },
  { key: 'pf', label: 'P. Fayro' }
];
var colVisible = {};
COLS.forEach(function (c) { colVisible[c.key] = true; });
var nLimpioCache = {};
var pagRank = { actual: 1, porPag: 20 };
var copasMap = {};

var TAM_FOTOS = {
  hero: 7,
  sinergias: 1.4,
  sinergias_hist: 1.4,
  rivalidades: 1.4,
  ranking: 1.5,
  alineaciones: 2.8,
  modal_cab: 15,
  modal_lista: 2.0,
  dream_team:7
};

var tipoPartidoFiltro = 'oficial'; 
var pagActual = 'inicio', rankingDatos = [], ultimosOrdenados = [];

/* ── Utilidades ── */
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nLimpio(n) {
  if (!n) return '';
  if (nLimpioCache[n]) return nLimpioCache[n];
  var cl = n.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
  nLimpioCache[n] = cl;
  return cl;
}

function debounce(fn, ms) {
  var t;
  return function () {
    var a = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, a); }, ms);
  };
}

function fN(n, d) {
  if (n == null || isNaN(n)) return d != null ? (0).toFixed(d) : '0.0';
  return Number(n).toFixed(d != null ? d : 1);
}

function toast(msg) {
  var el = document.getElementById('toast');
  document.getElementById('toast-m').textContent = msg;
  el.style.transform = 'translateY(0)';
  el.style.opacity = '1';
  setTimeout(function () {
    el.style.transform = 'translateY(14px)';
    el.style.opacity = '0';
  }, 2500);
}

/* ── Copas ── */
function buildCopasMap() {
  copasMap = {};
  D.copas.forEach(function (c) {
    copasMap[c.jugador_nombre] = { jugadas: c.copas_jugadas || 0, ganadas: c.copas_ganadas || 0 };
  });
}

function getCopas(nombre) {
  return copasMap[nombre] || { jugadas: 0, ganadas: 0 };
}

/* ── Partículas de fondo ── */
(function () {
  var c = document.getElementById('parts');
  for (var i = 0; i < 8; i++) {
    var p = document.createElement('div');
    p.className = 'particula';
    var s = Math.random() *25 + 0.4;
    var cols = ['rgb(29, 185, 84)', 'rgb(232, 183, 48)', 'rgba(232,93,48,.06)'];
    p.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + Math.random() * 100 + '%;background:' + cols[i % 3] + ';animation-duration:' + (Math.random() * 16 + 14) + 's;animation-delay:' + Math.random() * 10 + 's';
    c.appendChild(p);
  }
})();

function getFotoURL(nombre) {
  if (!nombre) return '';
  return nLimpio(nombre).replace(/ /g, '_') + '.png';
}

function getFotoHTML(nombre, tam) {
  var sz = typeof tam === 'string' ? (TAM_FOTOS[tam] || 2) : (tam || 2);
  
  var src = getFotoURL(nombre);
  var ini = nLimpio(nombre).charAt(0).toUpperCase();
  return '<img src="' + src + '" alt="" loading="lazy" class="object-cover flex-shrink-0" style="width:' + sz + 'rem;height:' + sz + 'rem" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="rounded-full bg-accent/10 border border-accent/20 items-center justify-center flex-shrink-0 text-accent font-display font-bold" style="width:' + sz + 'rem;height:' + sz + 'rem;font-size:' + (sz * 0.4) + 'rem;display:none">' + ini + '</span>';
}
/* ── Toggle columnas ── */
function renderColToggles() {
  var c = document.getElementById('col-toggles');
  c.innerHTML = '';
  COLS.forEach(function (col) {
    var lbl = document.createElement('label');
    lbl.className = 'col-chk ' + (colVisible[col.key] ? 'col-chk-on' : '');
    lbl.setAttribute('data-ck', col.key);
    lbl.innerHTML = '<span class="col-chk-box"><i class="fa-solid fa-check"></i></span><span class="col-chk-label">' + col.label + '</span>';
    lbl.addEventListener('click', function () { toggleCol(col.key); });
    c.appendChild(lbl);
  });
}

function toggleCol(key) {
  colVisible[key] = !colVisible[key];
  var lbl = document.querySelector('.col-chk[data-ck="' + key + '"]');
  if (lbl) lbl.classList.toggle('col-chk-on', colVisible[key]);
  aplicarVisCols();
}

function aplicarVisCols() {
  var tabla = document.getElementById('tabla-rank');
  if (!tabla) return;
  COLS.forEach(function (col) {
    var vis = colVisible[col.key];
    tabla.querySelectorAll('[data-col="' + col.key + '"]').forEach(function (el) {
      el.style.display = vis ? '' : 'none';
    });
  });
}

/* ── CSV ── */
function copiarCSV() {
  if (!ultimosOrdenados.length) { toast('Sin datos'); return; }
  var ts = filtroActual === 'todos' ? 'Historial completo' : (function () {
    var u = getUltimas2Temps();
    return [].slice.call(u).sort(function (a, b) { return a - b; }).map(function (t) { return 'T' + t; }).join(' y ');
  })();
  var hdr = ['Jugador', 'Copas Jugadas', 'Copas Ganadas', 'Calificacion', 'MVP', 'V', 'E', 'D', 'PJ', 'EWinrate', 'Puntaje Fayro'];
  var rows = ultimosOrdenados.map(function (d) {
    var cp = d.copas;
    return ['"' + d.nLimpio + '"', cp.jugadas, cp.ganadas, fN(d.cal, 1), d.st.mvp, d.st.v, d.st.e, d.st.d, d.st.pj, fN(d.ewr, 1), fN(d.pf, 2)].join(',');
  });
  var csv = hdr.join(',') + '\n' + rows.join('\n');
  navigator.clipboard.writeText(csv).then(function () {
    var btn = document.getElementById('btn-csv');
    btn.classList.add('copied');
    btn.querySelector('span').textContent = 'Copiado!';
    btn.querySelector('i').className = 'fa-solid fa-check';
    toast(ultimosOrdenados.length + ' jugadores copiados (' + ts + ')');
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.querySelector('span').textContent = 'Copiar como CSV';
      btn.querySelector('i').className = 'fa-solid fa-file-csv';
    }, 2000);
  }).catch(function () {
    var ta = document.createElement('textarea');
    ta.value = csv;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(ultimosOrdenados.length + ' jugadores copiados'); }
    catch (e) { toast('Error al copiar'); }
    document.body.removeChild(ta);
  });
}

/* ── Navegación ── */
function irA(pag) {
  pagActual = pag;
  document.querySelectorAll('.pagina').forEach(function (el) { el.classList.remove('activa'); });
  document.getElementById('pag-' + pag).classList.add('activa');
  document.querySelectorAll('#nav-paginas .nav-link').forEach(function (el) {
    el.classList.toggle('activo', el.getAttribute('data-pag') === pag);
  });
  document.querySelectorAll('#btm-bar .btm-item').forEach(function (el) {
    el.classList.toggle('btm-act', el.getAttribute('data-pag') === pag);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(function () {
    if (pag === 'jugadores') aplicarVisCols();
    initReveal();
  }, 50);
}

/* ── Cálculos de fútbol ── */
function calJ(nombre) {
  if (!nombre) return 1;
  var j = D.jugadores.find(function (x) { return x.nombre === nombre; });
  if (j) return j.calificacion || 1;
  var lim = nLimpio(nombre);
  j = D.jugadores.find(function (x) { return nLimpio(x.nombre) === lim; });
  return j ? (j.calificacion || 1) : 1;
}

/* Obtiene la calificación de un jugador en un año específico */
function calJHistorica(nombre, anioPartido) {
  if (!nombre) return 1;
  
  // 1. Buscar todo el historial de este jugador ordenado del más antiguo al más nuevo
  var hist = D.historial.filter(function(h) { return h.jugador_nombre === nombre; });
  hist.sort(function(a, b) { return new Date(a.fecha_cambio) - new Date(b.fecha_cambio); });
  
  // Si no tiene historial, devolvemos la calificación actual como respaldo
  if (hist.length === 0) return calJ(nombre);
  
  // Si por alguna razón el partido no tiene año, devolvemos la actual
  if (!anioPartido) return calJ(nombre);
  
  var anioNum = parseInt(anioPartido);
  if (isNaN(anioNum)) return calJ(nombre);

  // 2. Buscar la última calificación registrada ANTES o DURANTE el año de ese partido
  var calEnEseMomento = null;
  for (var i = 0; i < hist.length; i++) {
    var fechaHist = new Date(hist[i].fecha_cambio);
    var anioHist = fechaHist.getFullYear();
    
    if (anioHist <= anioNum) {
      // Esta calificación pertenece a un año anterior o del mismo año del partido
      calEnEseMomento = parseFloat(hist[i].calificacion_nueva);
    } else {
      // Llegamos a una calificación de un año posterior al partido, paramos el bucle
      break; 
    }
  }

  // 3. Devolver la histórica, o si no hay registros para ese año, la más antigua que tengamos, o la actual
  return calEnEseMomento || parseFloat(hist[0].calificacion_nueva) || calJ(nombre);
}

function resJug(partido, nJug, nCap1) {
  var alis = partido.partido_alineaciones || [];
  if (!alis.find(function (a) { return a.jugador_nombre === nJug; })) return null;
var eq1 = alis.find(function (a) { return a.jugador_nombre === nJug && a.numero_equipo === 1; });
 var r = partido.resultado;
 if (!eq1) {
    return r === 'ganador_equipo2' ? 'V' : r === 'ganador_equipo1' ? 'D' : 'E';
} else {
    return r === 'ganador_equipo1' ? 'V' : r === 'ganador_equipo2' ? 'D' : 'E';
}
}

function ptsRes(r) {
  return r === 'V' ? 1 : r === 'E' ? 0.33 : r === 'D' ? -1 : 0;
}

function calcEWR(v, e, d) {
  var t = v + e + d;
  return t === 0 ? 0 : ((v + e / 3) / t) * 100;
}

function calcPF(mvp, v, e, pj) {
  if (pj === 0) return 0;
  
  return ((v + (e * 0.333) + (mvp * 0.333)) + (pj / 100));
}

function anioP(m) {
  return m['año'] != null ? m['año'] : m['anio'] != null ? m['anio'] : '';
}

/* ── Carga de datos ── */
function cargarDatos() {
  return Promise.all([
    sb.from('temporadas').select('*,capitan1:capitan1_nombre(nombre,calificacion),capitan2:capitan2_nombre(nombre,calificacion),ganador:ganador_nombre(nombre)').order('numero_temporada', { ascending: false }),
    sb.from('partidos').select('*,partido_alineaciones(*)').order('numero_partido', { ascending: true }),
    sb.from('jugadores').select('*').order('calificacion', { ascending: false }),
    sb.from('historial_calificaciones').select('*').order('fecha_cambio', { ascending: true }),
    sb.from('vista_copas_capitan').select('*'),
    sb.from('vista_sinergias_historicas').select('*'),
    sb.from('vista_sinergias_temporadas').select('*'),
    sb.from('vista_rivalidades_historicas').select('*'),
    sb.from('vista_ranking_jugadores').select('*'), 
    sb.from('vista_ranking_por_temporada').select('*'),
    sb.from('vista_dream_team_temporada').select('*'),
    sb.from('vista_pierde_contra').select('*'),
    sb.from('vista_ewinrate_ultimas_2_temp').select('*') ,
    sb.from('vista_linea_temporal_jugadores').select('*')
  ]).then(function (res) {
    if (res[0].error) throw res[0].error;
    if (res[1].error) throw res[1].error;
    if (res[2].error) throw res[2].error;
    if (res[3].error) throw res[3].error;
    if (res[4].error) throw res[4].error;
    if (res[5].error) throw res[5].error;
    if (res[6].error) throw res[6].error;
    if (res[7].error) throw res[7].error;
    if (res[8].error) throw res[8].error;
    if (res[9].error) throw res[9].error;
    if (res[10].error) throw res[10].error;
    if (res[11].error) throw res[11].error;
    if (res[12].error) throw res[12].error; 
    if (res[13].error) throw res[13].error;

    D.temporadas = res[0].data;
    D.partidos = res[1].data;
    D.jugadores = res[2].data;
    D.historial = res[3].data;
    D.copas = res[4].data;
    D.sinergias = res[5].data;
    D.sinergias_temp = res[6].data;
    D.rivalidades = res[7].data;
    D.rankingVista = res[8].data;
    D.rankingPorTemp = res[9].data;
    D.dreamTeam = res[10].data;
    D.pierdeContra = res[11].data;
    D.ewrUltimas2 = res[12].data; 
    D.lineaTemporal = res[13].data; 

    buildCopasMap();
    tAct = D.temporadas.find(function (t) { return !t.finalizada; }) || D.temporadas[0] || null;
    return true;
  });
}

/* ── Estadísticas globales (EG) ── */
function calcEG() {
  Object.keys(EG).forEach(function (k) { delete EG[k]; });
  var temps = D.temporadas.slice().sort(function (a, b) { return a.numero_temporada - b.numero_temporada; });
  temps.forEach(function (temp) {
    var ms = D.partidos.filter(function (p) { return p.numero_temporada === temp.numero_temporada; });
    var c1n = temp.capitan1_nombre;
    ms.forEach(function (m) {
      var alis = m.partido_alineaciones || [];
      var anio = anioP(m);
      alis.forEach(function (a) {
        var nJ = a.jugador_nombre;
        if (!EG[nJ]) EG[nJ] = { v: 0, e: 0, d: 0, mvp: 0, pj: 0, tl: [], temps: new Set() };
        var res = resJug(m, nJ, c1n);
        if (res) {
          EG[nJ].pj++;
          if (res === 'V') EG[nJ].v++;
          else if (res === 'E') EG[nJ].e++;
          else EG[nJ].d++;
          EG[nJ].tl.push({ anio: anio, temp: temp.numero_temporada, mp: m.numero_partido, res: res, pts: ptsRes(res), tipo: m.tipo_partido });
        }
        if (a.mvp) EG[nJ].mvp++;
        EG[nJ].temps.add(temp.numero_temporada);
      });
    });
  });
  Object.keys(EG).forEach(function (nJ) {
    EG[nJ].tl.sort(function (a, b) { return a.temp !== b.temp ? a.temp - b.temp : a.mp - b.mp; });
    var cum = 0;
    EG[nJ].tl.forEach(function (p) { cum += p.pts; p.cum = cum; });
  });
}

/* ── Stats parciales (filtro últimas 2 temps) ── */
function calcStatsParciales(tempsSet) {
  var stats = {};
  D.partidos.filter(function (p) { return tempsSet.has(p.numero_temporada); }).forEach(function (m) {
    var temp = D.temporadas.find(function (t) { return t.numero_temporada === m.numero_temporada; });
    if (!temp) return;
    var c1n = temp.capitan1_nombre;
    var alis = m.partido_alineaciones || [];
    alis.forEach(function (a) {
      var nJ = a.jugador_nombre;
      if (!stats[nJ]) stats[nJ] = { v: 0, e: 0, d: 0, mvp: 0, pj: 0 };
      var res = resJug(m, nJ, c1n);
      if (res) {
        stats[nJ].pj++;
        if (res === 'V') stats[nJ].v++;
        else if (res === 'E') stats[nJ].e++;
        else stats[nJ].d++;
      }
      if (a.mvp) stats[nJ].mvp++;
    });
  });
  return stats;
}

function getUltimas2Temps() {
  var nums = D.temporadas.map(function (t) { return t.numero_temporada; }).sort(function (a, b) { return b - a; });
  return new Set(nums.slice(0, 2));
}

function cambiarFiltro(filtro) {
  filtroActual = filtro;
  pagRank.actual = 1;
  document.querySelectorAll('.filtro-btn').forEach(function (btn) {
    btn.classList.toggle('activo', btn.getAttribute('data-filtro') === filtro);
  });
  var info = document.getElementById('filtro-info');
  if (filtro === 'todos') {
    info.innerHTML = '<i class="fa-solid fa-circle-info mr-0.5"></i>Todos los partidos (Historial completo)';
  } else {
    var u = getUltimas2Temps();
    var nums = [].slice.call(u).sort(function (a, b) { return a - b; });
    var ts = nums.map(function (t) { return 'T' + t; }).join(' y ');
    if (nums.length < 2) {
      info.innerHTML = '<i class="fa-solid fa-filter mr-0.5"></i>' + ts + ' <span style="color:rgba(248,113,113,.7)"></span>';
    } else {
      info.innerHTML = '<i class="fa-solid fa-filter mr-0.5"></i>Solo ' + ts;
    }
  }
  prepararRanking();
  renderRankingBody();
}

function filtrarTLOficial(tl) {
  var f = tl.filter(function (p) { return p.tipo === 'oficial'; });
  f.sort(function (a, b) { return a.temp !== b.temp ? a.temp - b.temp : a.mp - b.mp; });
  var cum = 0;
  f.forEach(function (p) { cum += p.pts; p._cum = cum; });
  return f;
}

function pTemp(sn) {
  return D.partidos.filter(function (p) { return p.numero_temporada === sn; });
}

/* ── Render: selector de temporada ── */
function renderSel() {
  var sel = document.getElementById('sel-temp');
  sel.innerHTML = '';
  D.temporadas.forEach(function (t) {
    var o = document.createElement('option');
    o.value = t.numero_temporada;
    if (t === tAct) o.selected = true;
    o.textContent = 'T' + t.numero_temporada + (t.finalizada ? ' (Fin)' : ' (Activa)');
    sel.appendChild(o);
  });
  sel.onchange = function () {
    tAct = D.temporadas.find(function (t) { return t.numero_temporada === +sel.value; });
    renderTodo();
  };
}

/* ── Render: Hero ── */
function renderHero() {
  if (!tAct) return;
  var s = tAct;
  var c1 = s.capitan1 || null;
  var c2 = s.capitan2 || null;
  var c1n = c1 ? c1.nombre : 'Por definir';
  var c2n = c2 ? c2.nombre : 'Por definir';

  document.getElementById('h-tit').textContent = 'Temporada ' + s.numero_temporada;
  var estEl = document.getElementById('h-est');
  if (s.finalizada) {
    estEl.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-accent mr-1"></span>Finalizada' + (s.ganador_nombre ? ' — Ganador: <span class="text-accent font-bold">' + s.ganador_nombre + '</span>' : '');
  } else {
    estEl.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-pitch mr-1 animate-pulse"></span>En curso';
  }

  document.getElementById('nav-ins').textContent = 'T' + s.numero_temporada;
  
  // Generamos el HTML de la imagen base
  var img1HTML = c1 ? getFotoHTML(c1.nombre, 'hero') : '<img src="nadie.gif" alt="Sin capitan" class="object-cover flex-shrink-0 rounded-full" style="width: 7rem; height: 7rem;">';
  var img2HTML = c2 ? getFotoHTML(c2.nombre, 'hero') : '<img src="nadie.gif" alt="Sin capitan" class="object-cover flex-shrink-0 rounded-full" style="width: 7rem; height: 7rem;">';

  // ====================================================================
  // LÓGICA DE DERROTA: Si la temporada finalizó y NO es el ganador, le aplicamos la clase CSS
  // ====================================================================
  if (s.finalizada && s.ganador_nombre) {
    if (c1 && c1.nombre !== s.ganador_nombre) {
      // Reemplazamos la clase para añadir la animación de derrota
      img1HTML = img1HTML.replace('class="object-cover', 'class="img-derrota object-cover');
    }
    if (c2 && c2.nombre !== s.ganador_nombre) {
      img2HTML = img2HTML.replace('class="object-cover', 'class="img-derrota object-cover');
    }
  }
  // ====================================================================

  document.getElementById('c1-n').innerHTML = '<div class="flex flex-col items-center gap-1"><div class="flex-shrink-0">' + img1HTML + '</div><span class="truncate uppercase text-lg sm:text-xl md:text-2xl tracking-wider font-bold">' + c1n + '</span></div>';
  document.getElementById('c1-c').textContent = c1 ? fN(c1.calificacion) : '--';
  
  document.getElementById('c2-n').innerHTML = '<div class="flex flex-col items-center gap-1"><div class="flex-shrink-0">' + img2HTML + '</div><span class="truncate uppercase text-lg sm:text-xl md:text-2xl tracking-wider font-bold">' + c2n + '</span></div>';
  document.getElementById('c2-c').textContent = c2 ? fN(c2.calificacion) : '--';
  
  document.getElementById('th-c1').textContent = (c1 && c1.nombre) ? c1n.substring(0, 8) : 'Equipo 1';
  document.getElementById('th-c2').textContent = (c2 && c2.nombre) ? c2n.substring(0, 8) : 'Equipo 2';

  // ====================================================================
  // Obtener EWinrate de la vista SQL para las últimas 2 temporadas
  // ====================================================================
  var ewrData = D.ewrUltimas2 || [];
  
  var dataC1 = ewrData.find(function(e) { 
    return e.numero_temporada === s.numero_temporada && e.jugador_nombre === c1n; 
  });
  
  var dataC2 = ewrData.find(function(e) { 
    return e.numero_temporada === s.numero_temporada && e.jugador_nombre === c2n; 
  });

  var ew1 = dataC1 ? Number(dataC1.ewinrate) : 0;
  var ew2 = dataC2 ? Number(dataC2.ewinrate) : 0;

  document.getElementById('c1-ew').textContent = fN(ew1, 1) + '%';
  document.getElementById('c1-eb').style.width = fN(ew1, 0) + '%';
  document.getElementById('c2-ew').textContent = fN(ew2, 1) + '%';
  document.getElementById('c2-eb').style.width = fN(ew2, 0) + '%';

  var ms = pTemp(s.numero_temporada).filter(function (m) { return m.tipo_partido === 'oficial'; });
  var v1 = 0, e1 = 0, d1 = 0, v2 = 0, e2 = 0, d2 = 0, g1 = 0, g2 = 0;
  ms.forEach(function (m) {
    g1 += (m.goles_equipo1 || 0);
    g2 += (m.goles_equipo2 || 0);
    if (m.resultado === 'ganador_equipo1') { v1++; d2++; }
    else if (m.resultado === 'ganador_equipo2') { v2++; d1++; }
    else { e1++; e2++; }
  });

  var centroV1 = document.getElementById('centro-v1');
  var centroE = document.getElementById('centro-e');
  var centroV2 = document.getElementById('centro-v2');
  
  if (centroV1) centroV1.textContent = v1;
  if (centroE) centroE.textContent = e1;
  if (centroV2) centroV2.textContent = v2;

  var marcadorEl = document.getElementById('marcador-h2h');
  var c1nHist = nLimpio(c1n);
  var c2nHist = nLimpio(c2n);
  
  var victC1 = 0;
  var victC2 = 0;
  
  D.temporadas.forEach(function(t) {
    var t1 = nLimpio(t.capitan1_nombre);
    var t2 = nLimpio(t.capitan2_nombre);
    
    var seEnfrentaron = (t1 === c1nHist && t2 === c2nHist) || (t1 === c2nHist && t2 === c1nHist);
    
    if (seEnfrentaron && t.ganador_nombre) {
      var ganador = nLimpio(t.ganador_nombre);
      if (ganador === c1nHist) victC1++;
      else if (ganador === c2nHist) victC2++;
    }
  });

  if (victC1 > 0 || victC2 > 0) {
    marcadorEl.innerHTML = 
      '<div class="marcador-h2h">' +
        '<span class="h2h-g1 num">' + victC1 + '</span>' +
        '<span class="h2h-sep">/</span>' +
        '<span class="h2h-g2 num">' + victC2 + '</span>' +
      '</div>' +
      '<div class="h2h-pj text-center" >Temporadas<br>Ganadas</div>';
  } else {
    marcadorEl.innerHTML = '<div class="h2h-pj text-center" style="margin-top:0.5rem">Primer <br> enfrentamiento</div>';
  }

  renderBarraGoles(g1, g2, c1n, c2n);
}
 
function renderBarraGoles(g1, g2, n1, n2) {
  var total = g1 + g2;
  var p1 = total > 0 ? (g1 / total * 100) : 50;
  var p2 = total > 0 ? (g2 / total * 100) : 50;
  document.getElementById('bg-c1-nom').textContent = nLimpio(n1);
  document.getElementById('bg-c2-nom').textContent = nLimpio(n2);
  document.getElementById('bg-c1-bar').style.width = p1 + '%';
  document.getElementById('bg-c2-bar').style.width = p2 + '%';
  document.getElementById('bg-c1-bar').textContent = p1 > 15 ? g1 : '';
  document.getElementById('bg-c2-bar').textContent = p2 > 15 ? g2 : '';
  document.getElementById('bg-c1-pct').textContent = fN(p1, 1) + '%';
  document.getElementById('bg-c2-pct').textContent = fN(p2, 1) + '%';
  document.getElementById('bg-total').textContent = total + ' goles totales';
}

/* ── Render: Partidos y alineaciones ── */
function togDet(id) {
  var el = document.getElementById(id);
  if (el) {
    el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'table-row' : 'none';
  }
}

/* Coordenadas del pentágono (Equipo 1 apunta a la derecha, Equipo 2 a la izquierda) */
/* Coordenadas del pentágono (Punta apuntando hacia el CENTRO de la cancha) */
var COORDS_EQ1 = [
  { left: '0%', top: '25%' },   // 0. Ala izquierda superior (Fondo del equipo)
  { left: '0%', top: '75%' },   // 1. Ala izquierda inferior (Fondo del equipo)
  { left: '55%', top: '5%' },   // 2. Lateral superior
  { left: '50%', top: '100%' }, // 3. Lateral inferior
  { left: '90%', top: '50%' }   // 4. CAPITÁN (Punta apuntando al centro)
];

var COORDS_EQ2 = [
  { left: '100%', top: '25%' }, // 0. Ala derecha superior (Fondo del equipo)
  { left: '100%', top: '75%' }, // 1. Ala derecha inferior (Fondo del equipo)
  { left: '55%', top: '5%' },   // 2. Lateral superior
  { left: '55%', top: '100%' }, // 3. Lateral inferior
  { left: '10%', top: '50%' }   // 4. CAPITÁN (Punta apuntando al centro)
];

/* Ordena la lista: 4 jugadores normales primero, el Capitán al final */
function ordenarParaPentagono(eq, nombreCap) {
  var cap = eq.find(function(j) { return nLimpio(j.jugador_nombre) === nLimpio(nombreCap); });
  var resto = eq.filter(function(j) { return j !== cap; });
  if (!cap && resto.length > 0) cap = resto.shift(); // Fallback
  return [...resto, cap];
}

/* Genera el HTML de todo el pentágono de un equipo */
function htmlPentagono(eq, coords, nombreCap,anioPartido) {
  var jugadores = ordenarParaPentagono(eq, nombreCap);
  var h = '<div class="pentagono-equipo">';
  
  for (var i = 0; i < 5; i++) {
    var j = jugadores[i];
    var c = coords[i];
    if (!j) continue; // Si hay menos de 5 jugadores, deja el espacio vacío
    
    var esCapitan = nLimpio(j.jugador_nombre) === nLimpio(nombreCap);
    var clases = 'pentagono-nodo' + (esCapitan ? ' es-capitan' : '') + (j.mvp ? ' es-mvp' : '');
     var cal = calJHistorica(j.jugador_nombre, anioPartido);
    
    h += '<div class="' + clases + '" style="left:' + c.left + ';top:' + c.top + '">' +
      '<div class="relative">' +
        getFotoHTML(j.jugador_nombre, 'alineaciones') +
        (j.mvp ? '<div class="cancha-mvp-tag"><i class="fa-solid fa-star" style="font-size: .8rem; color: #e8b830;"></i></div>' : '') +
      '</div>' +
      '<span class="pentagono-nombre">' + nLimpio(j.jugador_nombre) + '</span>' +
      '<span class="pentagono-cal num">' + fN(cal, 1) + '</span>' +
    '</div>';
  }
  
  h += '</div>';
  return h;
}


function renderPartidos() {
  var numTemp = tAct ? tAct.numero_temporada : -1;
  var ms = pTemp(numTemp).filter(function (m) { return m.tipo_partido === tipoPartidoFiltro; });
  var tb = document.getElementById('tb-part');
  document.getElementById('c-part').textContent = ms.length + ' partidos';

  // ====================================================================
  // SOLUCIÓN: Ocultar capitanes en Amistosos y Capitanía
  // ====================================================================
  var ocultarCapitanes = (tipoPartidoFiltro === 'amistoso' || tipoPartidoFiltro === 'capitania');
  var thC1 = document.getElementById('th-c1');
  var thC2 = document.getElementById('th-c2');
  
  if (ocultarCapitanes) {
    if (thC1) thC1.textContent = 'Equipo 1';
    if (thC2) thC2.textContent = 'Equipo 2';
  } else {
    var c1nTemp = (tAct && tAct.capitan1_nombre) ? tAct.capitan1_nombre : 'Equipo 1';
    var c2nTemp = (tAct && tAct.capitan2_nombre) ? tAct.capitan2_nombre : 'Equipo 2';
    if (thC1) thC1.textContent = c1nTemp.substring(0, 8);
    if (thC2) thC2.textContent = c2nTemp.substring(0, 8);
  } 
  // ====================================================================

  var tipoTexto = tipoPartidoFiltro === 'oficial' ? 'oficiales' : (tipoPartidoFiltro === 'capitania' ? 'por capitanía' : 'amistosos');
  if (!ms.length) {
    tb.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-muted text-sm">Sin partidos ' + tipoTexto + ' registrados</td></tr>';
    return;
  }

  var c1n = tAct ? tAct.capitan1_nombre : '';
  var html = '';

  ms.forEach(function (m, idx) {
    var alis = m.partido_alineaciones || [];
    var did = 'det-t' + numTemp + '-p' + m.numero_partido;
    var esUlt = idx === ms.length - 1;
    var c1nPartido = m.capitan1_nombre || c1n;

    var mvp1 = alis.find(function (a) { return a.mvp && a.numero_equipo === 1; });
    var mvp2 = alis.find(function (a) { return a.mvp && a.numero_equipo === 2; });
    var rc = m.resultado === 'ganador_equipo1' ? 'bg1' : m.resultado === 'ganador_equipo2' ? 'bg2' : 'bge';
    var rt = m.resultado === 'ganador_equipo1' ? 'VICTORIA EQ1' : m.resultado === 'ganador_equipo2' ? 'VICTORIA EQ2' : 'EMPATE';
    var anio = anioP(m);
    var tA = alis.length > 0;

    var mvpH = '';
    if (mvp1) mvpH += '<span class="text-cap1 text-[.6rem]">' + nLimpio(mvp1.jugador_nombre) + '</span>';
    if (mvp1 && mvp2) mvpH += '<br>';
    if (mvp2) mvpH += '<span class="text-cap2 text-[.6rem]">' + nLimpio(mvp2.jugador_nombre) + '</span>';
    if (!mvp1 && !mvp2) mvpH = '<span class="text-muted/30 text-[.6rem]">--</span>';

    html += '<tr class="cabecera-partido' + (esUlt ? ' ultimo-partido' : '') + ' border-b border-brd/30 transition-colors" onclick="togDet(\'' + did + '\')">' +
      '<td class="px-2.5 py-2 font-display text-muted text-sm">' + m.numero_partido + (esUlt ? ' <i class="fa-solid fa-clock text-accent/40 text-[.45rem] ml-0.5"></i>' : '') + '</td>' +
      '<td class="px-2.5 py-2"><span class="text-pitch/60 text-[.6rem]"><i class="fa-solid fa-shield-halved mr-0.5"></i>' + m.tipo_partido + '</span></td>' +
      '<td class="px-2.5 py-2 text-center font-display font-bold text-cap1 text-lg">' + (m.goles_equipo1 || 0) + '</td>' +
      '<td class="px-2.5 py-2 text-center"><span class="' + rc + ' text-[.55rem] font-display px-2 py-0.5 rounded-full">' + rt + '</span></td>' +
      '<td class="px-2.5 py-2 text-center font-display font-bold text-cap2 text-lg">' + (m.goles_equipo2 || 0) + '</td>' +
      '<td class="px-2.5 py-2 text-center">' + mvpH + '</td>' +
      '<td class="px-2.5 py-2 text-center text-muted text-[.65rem] font-display">' + (anio || '--') + '</td>' +
      '<td class="px-2 text-center text-muted/30 text-[.6rem]"><i class="fa-solid fa-chevron-' + (tA ? 'down' : 'right') + '"></i></td></tr>';

    html += '<tr id="' + did + '" style="display:none" class="fila-det"><td colspan="8" class="px-4 py-0">';

    if (!tA) {
      html += '<div class="py-4 text-center text-muted/40 text-xs">Sin alineaciones</div>';
    } else {
      var eq1 = alis.filter(function (a) { return a.numero_equipo === 1; });
      var eq2 = alis.filter(function (a) { return a.numero_equipo === 2; });
      var anioDeEstePartido = anioP(m); 
      
      var cE1 = 0; eq1.forEach(function (a) { cE1 += calJHistorica(a.jugador_nombre, anioDeEstePartido); });
      var cE2 = 0; eq2.forEach(function (a) { cE2 += calJHistorica(a.jugador_nombre, anioDeEstePartido); });

      html += '<div class="cancha-wrap">';
      html += '<div class="cancha-header">';
      html += '<span class="cancha-rat text-cap1 num">' + fN(cE1, 1) + ' <span class="text-[1rem] text-muted font-display ml-1">EQ1</span></span>';
      html += '<span class="text-muted/50 text-[.45rem] font-display tracking-widest uppercase">Formación</span>';
      html += '<span class="cancha-rat text-cap2 num text-right"><span class="text-[1rem] text-muted font-display mr-1">EQ2</span> ' + fN(cE2, 1) + '</span>';
      html += '</div>';

      html += '<div class="cancha"><div class="cancha-circulo" ></div>';
      html += '<div class="cancha-pentagonos">';
      
      var cap1Mostrar = ocultarCapitanes ? '' : tAct.capitan1_nombre;
      var cap2Mostrar = ocultarCapitanes ? '' : tAct.capitan2_nombre;

      html += htmlPentagono(eq1, COORDS_EQ1, cap1Mostrar, anioDeEstePartido);
      html += '<div style="width: 20px; flex-shrink: 0;"></div>'; 
      html += htmlPentagono(eq2, COORDS_EQ2, cap2Mostrar, anioDeEstePartido);
      
      html += '</div>'; // fin .cancha-pentagonos
      html += '</div>'; // fin .cancha
      html += '</div>'; // fin .cancha-wrap
    }

    html += '</td></tr>';
  });

  tb.innerHTML = html;
}
/* ═══════════════════════════════════════════════
   SINERGIAS TEMPORADA — Desde Supabase
   ═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   SINERGIAS TEMPORADA — Desde Supabase
   ═══════════════════════════════════════════════ */
function renderSinergias() {
  var tempActual = tAct ? tAct.numero_temporada : -1;
  var datos = (D.sinergias_temp || []).filter(function(s) {
    return s.numero_temporada === tempActual;
  });

  var g = document.getElementById('gr-sin');
  document.getElementById('c-sin').textContent = datos.length + ' duplas';
  
  // --- ORDENAR DE MAYOR A MENOR EWINRATE ---
  datos.sort(function(a, b) {
    return (Number(b.ewinrate) || 0) - (Number(a.ewinrate) || 0);
  });

  var top = datos.slice(0, 4);
  
  if (!top.length) {
    g.innerHTML = '<div class="col-span-full text-center text-muted/40 text-sm py-6"><i class="fa-solid fa-handshake mr-1"></i>Sin duplas esta temporada</div>';
    return;
  }

  var h = '';
  for (var i = 0; i < top.length; i++) {
    var p = top[i];
    var ewr = (Number(p.ewinrate) * 100) || 0; 
    var pj = p.total_partidos || 0;
    var rk = getRkIcon(i);
    var ewrC = 'text-pitch'; // --- SIEMPRE VERDE ---
    
    h += '<div class="sin-card bg-card border ' + (i < 3 ? 'bgrad border-accent/20' : 'border-brd') + ' rounded-xl p-3 flex items-center justify-between">' +
      '<div class="flex items-center gap-2 min-w-0">' + rk + 
      getFotoHTML(p.jugador_1, 'sinergias') + 
      '<span class="text-white text-[.8rem] font-semibold truncate">' + nLimpio(p.jugador_1) + '</span>' +
      '<span class="text-accent/40 text-[.65rem]">con</span>' + 
      getFotoHTML(p.jugador_2, 'sinergias') + 
      '<span class="text-white text-[.8rem] font-semibold truncate">' + nLimpio(p.jugador_2) + '</span>' +
      '<span class="text-muted text-[.6rem] font-display ml-1">' + pj + ' PJ</span>' +
      '</div>' +      
      '<span class="' + ewrC + ' font-display font-bold text-lg num flex-shrink-0 ml-2">' + fN(ewr, 1) + '%</span>' +
      '</div>';
  }
  g.innerHTML = h;
}

/* ═══════════════════════════════════════════════
   SINERGIAS HISTÓRICAS — Desde Supabase
   ═══════════════════════════════════════════════ */
function renderSinergiasHistoricas() {
  var datos = D.sinergias || [];
  var g = document.getElementById('gr-sin-hist');
  document.getElementById('c-sin-hist').textContent = datos.length + ' duplas';
  
  // --- ORDENAR USANDO EL SCORE JUSTO DE LA BASE DE DATOS ---
  datos.sort(function(a, b) {
    return Number(b.score_justo) - Number(a.score_justo);
  });

  var top = datos.slice(0, 8);
  
  if (!top.length) {
    g.innerHTML = '<div class="col-span-full text-center text-muted/40 text-sm py-6"><i class="fa-solid fa-handshake-angle mr-1"></i>Sin duplas</div>';
    return;
  }
  
  var h = '';
  for (var i = 0; i < top.length; i++) {
    var p = top[i];
    var v = Number(p.victorias) || 0;
    var e = Number(p.empates) || 0;
    var d = Number(p.derrotas) || 0;
    var pj = Number(p.partidos_juntos) || 0;
    
    var ewr = calcEWR(v, e, d); 
    var rk = getRkIcon(i);
    var ewrC = 'text-pitch'; // Mantenemos el verde
    
    h += '<div class="sin-card bg-card border ' + (i < 3 ? 'bgrad border-accent/20' : 'border-brd') + ' rounded-xl p-3 flex items-center justify-between">' +
      '<div class="flex items-center gap-2 min-w-0">' + rk + 
      getFotoHTML(p.jugador1, 'sinergias_hist') + 
      '<span class="text-white text-[.8rem] font-semibold truncate">' + nLimpio(p.jugador1) + '</span>' +
      '<span class="text-accent/40 text-[.65rem]">con</span>' + 
      getFotoHTML(p.jugador2, 'sinergias_hist') + 
      '<span class="text-white text-[.8rem] font-semibold truncate">' + nLimpio(p.jugador2) + '</span>' +
      '<span class="text-muted text-[.6rem] font-display ml-1">' + pj + ' PJ</span>' +
      '</div>' +      
      '<span class="' + ewrC + ' font-display font-bold text-lg num flex-shrink-0 ml-2">' + fN(ewr, 1) + '%</span>' +
      '</div>';
  }
  g.innerHTML = h;
}

function renderRivalidadesHistoricas() {
  var datos = (D.rivalidades || []).filter(function (r) {
    return nLimpio(r.jugador1).toLowerCase().indexOf('magaly') === -1 &&
           nLimpio(r.jugador2).toLowerCase().indexOf('magaly') === -1 &&
           nLimpio(r.jugador1).toLowerCase().indexOf('bernald') === -1 &&
           nLimpio(r.jugador2).toLowerCase().indexOf('bernald') === -1 &&
           (r.totalenfrentamientos || 0) > 15;
  });

  var g = document.getElementById('gr-riv-hist');
  var NEUTRO = 1 / 3;

  var ganan = [];
  for (var i = 0; i < datos.length; i++) {
    var r = datos[i];
    var ewr = Number(r.ewinrate) || 0;
    if (Math.abs(ewr - NEUTRO) < 0.01) continue;

    var v1 = r.victorias || 0;
    var e = r.empates || 0;
    var pj = r.totalenfrentamientos || 0;
    var d1 = pj - v1 - e;

    if (ewr > NEUTRO) {
      ganan.push({ ganador: nLimpio(r.jugador1), perdedor: nLimpio(r.jugador2), ewr: ewr, desbalance: Math.abs(ewr - NEUTRO), pj: pj });
    } else {
      var ewr2 = calcEWR(d1, e, v1) / 100;
      ganan.push({ ganador: nLimpio(r.jugador2), perdedor: nLimpio(r.jugador1), ewr: ewr2, desbalance: Math.abs(ewr - NEUTRO), pj: pj });
    }
  }

  // --- ORDENAR DE MAYOR A MENOR DESBALANCE ---
  ganan.sort(function (a, b) { return b.desbalance - a.desbalance; });
  var top4 = ganan.slice(0, 6);

  document.getElementById('c-riv-hist').textContent = top4.length + ' rivalidades';

  var h = '';
  if (!top4.length) {
    h = '<div class="col-span-full text-center text-muted/40 text-sm py-6"><i class="fa-solid fa-fire mr-1"></i>Sin rivalidades</div>';
  } else {
    for (var j = 0; j < top4.length; j++) {
      var p = top4[j];
      var rk = getRkIcon(j);
      var ewrPct = p.ewr * 100;
      var ewrC = 'text-pitch'; // --- SIEMPRE VERDE ---
      
      h += '<div class="sin-card bg-card border ' + (j < 3 ? 'bgrad border-accent/20' : 'border-brd') + ' rounded-xl p-3 flex items-center justify-between">' +
        '<div class="flex items-center gap-2 min-w-0">' + rk + 
        getFotoHTML(p.ganador, 'rivalidades') + 
        '<span class="text-white text-[.8rem] font-semibold truncate">' + p.ganador + '</span>' +
        '<span class="text-pitch/60 text-[.65rem]">gana contra</span>' + 
        getFotoHTML(p.perdedor, 'rivalidades') + 
        '<span class="text-white text-[.8rem] font-semibold truncate">' + p.perdedor + '</span>' +
        '<span class="text-muted text-[.6rem] font-display ml-1">' + p.pj + ' PJ</span>' +
        '</div>' +        
        '<span class="' + ewrC + ' font-display font-bold text-lg num flex-shrink-0 ml-2">' + fN(ewrPct, 1) + '%</span>' +
        '</div>';
    }
  }
  g.innerHTML = h;
}

function getTopCompaneros(nombre) {
  var res = [];
  var datos = D.sinergias || [];
  for (var i = 0; i < datos.length; i++) {
    var s = datos[i];
    if (s.jugador1 === nombre || s.jugador2 === nombre) {
      res.push({ nombre: s.jugador1 === nombre ? s.jugador2 : s.jugador1 });
    }
  }
  res.sort(function (a, b) { return (Number(b.ewinrate) || 0) - (Number(a.ewinrate) || 0); });
  return res.slice(0, 4);
}

function getTopRivales(nombre) {
  var res = [];
  // Filtramos la nueva vista por el jugador seleccionado
  var datos = (D.pierdeContra || []).filter(function (r) {
    return r.jugador_nombre === nombre;
  });

  for (var i = 0; i < datos.length; i++) {
    var r = datos[i];
    var ewr = Number(r.ewinrate) || 0;
    
    // Ampliamos a menor al 50% (0.50) para considerar a los que más le ganan
    if (ewr < 0.50) {
      res.push({ nombre: r.rival_nombre, ewr: ewr * 100, pj: r.total_enfrentamientos });
    }
  }
  
  // Ordenamos de MENOR a MAYOR EWinrate (los que más pierde arriba)
  res.sort(function (a, b) { return a.ewr - b.ewr; });
  
  // Devolvemos el Top 5
  return res.slice(0, 5);
}
function getRkIcon(i) {
  if (i === 0) return '<i class="fa-solid fa-crown text-accent text-[.6rem]"></i>';
  if (i === 1) return '<i class="fa-solid fa-medal text-gray-300 text-[.55rem]"></i>';
  if (i === 2) return '<i class="fa-solid fa-medal text-amber-700 text-[.55rem]"></i>';
  return '<span class="text-muted/50 text-[.6rem] font-display">' + (i + 1) + '</span>';
}

function renderModalCompaneros(nombre) {
  var wrap = document.getElementById('modal-comp-wrap');
  var lista = document.getElementById('modal-comp-list');
  var top = getTopCompaneros(nombre);
  if (!top.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  var h = '';
  for (var i = 0; i < top.length; i++) {
       h += '<div class="nom-item"><div class="nom-rk">' + getRkIcon(i) + '</div>' + getFotoHTML(top[i].nombre, 'modal_lista') + '<span class="nom-txt">' + nLimpio(top[i].nombre) + '</span></div>';
  }
  lista.innerHTML = h;
}

function renderModalRivales(nombre) {
  var wrap = document.getElementById('modal-riv-wrap');
  var lista = document.getElementById('modal-riv-list');
  var top = getTopRivales(nombre);
  if (!top.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  var h = '';
  for (var i = 0; i < top.length; i++) {
        h += '<div class="nom-item"><div class="nom-rk">' + getRkIcon(i) + '</div>' + getFotoHTML(top[i].nombre, 'modal_lista') + '<span class="nom-txt">' + nLimpio(top[i].nombre) + '</span></div>';
  }
  lista.innerHTML = h;
}

/* ── Ranking ── */
function prepararRanking() {
  if (filtroActual === 'todos') {
    // Usamos la vista general (Ultra rápido)
    rankingDatos = (D.rankingVista || []).map(function (r) {
      return {
        nombre: r.nombre, nLimpio: nLimpio(r.nombre), cal: r.calificacion || 1, 
        st: { v: r.victorias, e: r.empates, d: r.derrotas, mvp: r.mvp, pj: r.pj },
        pf: r.puntaje_fayro, ewr: r.ewinrate,
        v: r.victorias, e: r.empates, d: r.derrotas, mvp: r.mvp, pj: r.pj, 
        copas: { jugadas: r.copas_jugadas, ganadas: r.copas_ganadas }
      };
    });
  } else {
    // Filtro "Últimas 2 Temporadas" usando la vista por temporada (Solo sumas ligeras en JS)
    var ultimasTemps = getUltimas2Temps(); // Obtiene un Set ej. {4, 5}
    
    // Filtramos las filas de la vista que pertenezcan a esas 2 temporadas
    var datosFiltrados = (D.rankingPorTemp || []).filter(function(r) {
      return ultimasTemps.has(r.numero_temporada);
    });

    // Agrupamos por jugador sumando sus V, E, D, MVP, PJ
    var mapaTemporadas = {};
    datosFiltrados.forEach(function(r) {
      if (!mapaTemporadas[r.jugador_nombre]) {
        mapaTemporadas[r.jugador_nombre] = { v: 0, e: 0, d: 0, mvp: 0, pj: 0, cal: r.calificacion || 1 };
      }
      var st = mapaTemporadas[r.jugador_nombre];
      st.pj += r.pj;
      st.mvp += r.mvp;
      st.v += r.victorias;
      st.e += r.empates;
      st.d += r.derrotas;
    });

    // Convertimos el mapa al formato que espera la tabla
    rankingDatos = [];
    var nombres = Object.keys(mapaTemporadas);
    for (var i = 0; i < nombres.length; i++) {
      var nJ = nombres[i];
      var st = mapaTemporadas[nJ];
      rankingDatos.push({
        nombre: nJ, nLimpio: nLimpio(nJ), cal: st.cal, st: st,
        pf: calcPF(st.mvp, st.v, st.e, st.pj), ewr: calcEWR(st.v, st.e, st.d),
        v: st.v, e: st.e, d: st.d, mvp: st.mvp, pj: st.pj, copas: getCopas(nJ)
      });
    }
  }
}

function ordenarRanking(col) {
  if (sortEstado.col === col) {
    sortEstado.dir = sortEstado.dir === 'desc' ? 'asc' : 'desc';
  } else {
    sortEstado.col = col;
    sortEstado.dir = 'desc';
  }
  actualizarHeadersSort();
  renderRankingBody();
}

function actualizarHeadersSort() {
  document.querySelectorAll('.th-sort').forEach(function (th) {
    var c = th.getAttribute('data-col');
    var ico = th.querySelector('.sort-ico');
    if (c === sortEstado.col) {
      th.classList.add('activo');
      ico.className = 'fa-solid sort-ico ' + (sortEstado.dir === 'desc' ? 'fa-sort-down' : 'fa-sort-up');
    } else {
      th.classList.remove('activo');
      ico.className = 'fa-solid fa-sort sort-ico';
    }
  });
}

function renderRankingBody() {
  var tb = document.getElementById('tb-rank');
  var vacioEl = document.getElementById('rank-vacio');
  var query = (document.getElementById('busq-rank') ? document.getElementById('busq-rank').value : '').toLowerCase().trim();

  if (!rankingDatos.length) {
    tb.innerHTML = '<tr><td colspan="10" class="px-3 py-8 text-center text-muted text-sm">Sin datos</td></tr>';
    vacioEl.classList.add('hidden');
    document.getElementById('rank-pag').innerHTML = '';
    aplicarVisCols();
    return;
  }

  var col = sortEstado.col;
  var dir = sortEstado.dir === 'desc' ? -1 : 1;
  var ordenados = rankingDatos.slice().sort(function (a, b) {
    var va, vb;
    if (col === 'nombre') {
      va = a.nLimpio.toLowerCase();
      vb = b.nLimpio.toLowerCase();
      return dir * va.localeCompare(vb);
    }
    if (col === 'copas') {
      va = (a.copas.ganadas * 100) + a.copas.jugadas;
      vb = (b.copas.ganadas * 100) + b.copas.jugadas;
      return dir * (va - vb);
    }
    va = a[col];
    vb = b[col];
    if (typeof va === 'string') return dir * va.localeCompare(vb);
    return dir * (va - vb);
  });

  if (filtroActual === 'recientes') ordenados = ordenados.filter(function (d) { return d.pj > 0; });
  if (query) ordenados = ordenados.filter(function (d) { return d.nLimpio.toLowerCase().indexOf(query) !== -1; });

  var totalFiltrados = ordenados.length;
  document.getElementById('busq-count').textContent = query ? totalFiltrados + '/' + (filtroActual === 'recientes' ? rankingDatos.filter(function (d) { return d.pj > 0; }).length : rankingDatos.length) : '';

  if (!totalFiltrados) {
    tb.innerHTML = '';
    vacioEl.classList.remove('hidden');
    document.getElementById('rank-pag').innerHTML = '';
    return;
  }

  vacioEl.classList.add('hidden');
  ultimosOrdenados = ordenados;

  var totalPag = Math.ceil(totalFiltrados / pagRank.porPag);
  if (pagRank.actual > totalPag) pagRank.actual = totalPag;
  if (pagRank.actual < 1) pagRank.actual = 1;

  var inicio = (pagRank.actual - 1) * pagRank.porPag;
  var visibles = ordenados.slice(inicio, inicio + pagRank.porPag);

  var html = '';
  for (var i = 0; i < visibles.length; i++) {
    var d = visibles[i];
    var st = d.st;
    var pf = d.pf;
    var ewr = d.ewr;
    var cp = d.copas;
    var idxGlobal = inicio + i;
    var rk = idxGlobal === 0 ? '<i class="fa-solid fa-crown text-accent text-[.6rem]"></i>' : idxGlobal === 1 ? '<i class="fa-solid fa-medal text-gray-300 text-[.6rem]"></i>' : idxGlobal === 2 ? '<i class="fa-solid fa-medal text-amber-700 text-[.6rem]"></i>' : '<span class="text-muted text-[.65rem]">' + (idxGlobal + 1) + '</span>';
    var cjC = cp.jugadas > 0 ? 'copa-jug' : 'copa-zero';
    var cgC = cp.ganadas > 0 ? 'copa-gan' : 'copa-zero';
    var copaH = '<span class="copa-badge"><i class="fa-solid fa-trophy text-[.5rem] ' + cgC + '"></i><span class="' + cjC + ' num">' + cp.jugadas + '</span><span class="copa-zero">/</span><span class="' + cgC + ' num">' + cp.ganadas + '</span></span>';
    var pfC = 'pf-mid'; 

    html += '<tr class="border-b border-brd/30 transition-colors fila-anim" style="animation-delay:' + (i * 0.025) + 's">' +
      '<td class="px-2 py-2" data-col="nombre"><div class="flex items-center gap-1.5">' + rk + getFotoHTML(d.nombre, 'ranking') + '<span class="jug-clickable text-white text-[.8rem] font-semibold" data-jugador="' + escAttr(d.nombre) + '">' + d.nLimpio + '</span></div></td>' +      '<td class="px-2 py-2 text-center" data-col="copas">' + copaH + '</td>' +
      '<td class="px-2 py-2 text-center font-display font-bold text-white text-sm num" data-col="cal">' + fN(d.cal, 1) + '</td>' +
      '<td class="px-2 py-2 text-center text-yellow-400 font-display font-bold text-sm num" data-col="mvp">' + st.mvp + '</td>' +
      '<td class="px-2 py-2 text-center text-cap1 font-display font-bold text-sm num" data-col="v">' + st.v + '</td>' +
      '<td class="px-2 py-2 text-center text-accent font-display font-bold text-sm num" data-col="e">' + st.e + '</td>' +
      '<td class="px-2 py-2 text-center text-red-400 font-display font-bold text-sm num" data-col="d">' + st.d + '</td>' +
      '<td class="px-2 py-2 text-center text-muted font-display text-sm num" data-col="pj">' + st.pj + '</td>' +
      '<td class="px-2 py-2" data-col="ewr"><div class="bwr w-full"><div class="bwr-f bg-accent" style="width:' + fN(ewr, 0) + '%"></div></div><p class="text-center text-accent text-[.55rem] font-display mt-0.5 num">' + fN(ewr, 1) + '%</p></td>' +
      '<td class="px-2 py-2 text-center" data-col="pf"><span class="pf-badge ' + pfC + ' num">' + fN(pf, 2) + '</span></td></tr>';
  }

  tb.innerHTML = html;
  aplicarVisCols();
  renderPaginacion(totalPag, totalFiltrados);
}

function renderPaginacion(totalPag) {
  var wrap = document.getElementById('rank-pag');
  if (totalPag <= 1) { wrap.innerHTML = ''; return; }
  var h = '';
  h += '<button class="pag-btn" ' + (pagRank.actual <= 1 ? 'disabled' : '') + ' data-pag-n="' + (pagRank.actual - 1) + '"><i class="fa-solid fa-chevron-left text-[.5rem]"></i></button>';
  var rango = getRangoPag(pagRank.actual, totalPag);
  for (var i = 0; i < rango.length; i++) {
    var p = rango[i];
    if (p === '...') {
      h += '<span style="color:#3a5a3a;font-size:.6rem;padding:0 .15rem">...</span>';
    } else {
      h += '<button class="pag-btn ' + (p === pagRank.actual ? 'pag-act' : '') + '" data-pag-n="' + p + '">' + p + '</button>';
    }
  }
  h += '<button class="pag-btn" ' + (pagRank.actual >= totalPag ? 'disabled' : '') + ' data-pag-n="' + (pagRank.actual + 1) + '"><i class="fa-solid fa-chevron-right text-[.5rem]"></i></button>';
  wrap.innerHTML = h;
}

function getRangoPag(act, total) {
  if (total <= 7) {
    var a = [];
    for (var i = 1; i <= total; i++) a.push(i);
    return a;
  }
  var r = [1];
  if (act > 3) r.push('...');
  var s = Math.max(2, act - 1);
  var e = Math.min(total - 1, act + 1);
  for (var j = s; j <= e; j++) r.push(j);
  if (act < total - 2) r.push('...');
  r.push(total);
  return r;
}

/* ── Event delegation ── */
document.getElementById('tb-rank').addEventListener('click', function (e) {
  var cell = e.target.closest('[data-jugador]');
  if (cell) { abrirModal(cell.getAttribute('data-jugador')); return; }
  var pagBtn = e.target.closest('[data-pag-n]');
  if (pagBtn && !pagBtn.disabled) {
    pagRank.actual = parseInt(pagBtn.getAttribute('data-pag-n'));
    renderRankingBody();
    document.getElementById('tabla-rank').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

document.getElementById('rank-pag').addEventListener('click', function (e) {
  var pagBtn = e.target.closest('[data-pag-n]');
  if (pagBtn && !pagBtn.disabled) {
    pagRank.actual = parseInt(pagBtn.getAttribute('data-pag-n'));
    renderRankingBody();
    document.getElementById('tabla-rank').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

/* ── Modal jugador ── */
function abrirModal(nombre) {
  var st = EG[nombre] || { v: 0, e: 0, d: 0, mvp: 0, pj: 0 };
  var j = D.jugadores.find(function (x) { return x.nombre === nombre; });
  var cal = j ? (j.calificacion || 1) : 1;
  var pf = calcPF(st.mvp, st.v, st.e, st.pj);
  var ewr = calcEWR(st.v, st.e, st.d);
  var cp = getCopas(nombre);

  document.getElementById('modal-foto').innerHTML = getFotoHTML(nombre, 'modal_cab');
  document.getElementById('modal-nom').textContent = nLimpio(nombre);
  document.getElementById('modal-sub').textContent = st.pj + ' partidos jugados (historial completo)';
  document.getElementById('modal-v').textContent = st.v;
  document.getElementById('modal-e').textContent = st.e;
  document.getElementById('modal-d').textContent = st.d;
  document.getElementById('modal-mvp').textContent = st.mvp;
  document.getElementById('modal-ewr').textContent = fN(ewr, 1) + '%';
  document.getElementById('modal-ewr-bar').style.width = fN(ewr, 0) + '%';

  var copaNums = document.getElementById('modal-copa-nums');
  var copaIco = document.getElementById('modal-copa-ico');
  copaNums.innerHTML = '<span class="copa-jug num">' + cp.jugadas + '</span><span class="copa-zero">/</span><span class="copa-gan num">' + cp.ganadas + '</span>';
  copaIco.className = 'fa-solid fa-trophy copa-ico ' + (cp.ganadas > 0 ? 'copa-gan' : 'copa-zero');

  var pfEl = document.getElementById('modal-pf');
  pfEl.textContent = fN(pf, 2);
  pfEl.className = 'font-display font-bold text-lg num ' + (pf >= 1.8 ? 'text-accent' : pf >= 1.2 ? 'text-pitch' : 'text-white');

  renderModalChart(nombre);
  renderModalCalChart(nombre);
  renderModalCompaneros(nombre);
  renderModalRivales(nombre);

  var overlay = document.getElementById('modal-jug');
  var box = document.getElementById('modal-box');
  overlay.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { box.focus(); }, 50);

  overlay._trapHandler = function (e) {
    if (e.key !== 'Tab') return;
    var focusable = box.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  overlay.addEventListener('keydown', overlay._trapHandler);
}

function cerrarModal() {
  var overlay = document.getElementById('modal-jug');
  overlay.classList.remove('abierto');
  document.body.style.overflow = '';
  if (overlay._trapHandler) {
    overlay.removeEventListener('keydown', overlay._trapHandler);
    overlay._trapHandler = null;
  }
  if (G.modalChart) { G.modalChart.destroy(); G.modalChart = null; }
  if (G.modalCalChart) { G.modalCalChart.destroy(); G.modalCalChart = null; }
}

function renderModalChart(nombre) {
  var canvas = document.getElementById('g-modal');
  var ctx = canvas.getContext('2d');
  var emptyEl = document.getElementById('modal-tl-empty');

  // Filtramos la vista SQL por el jugador seleccionado
  var datos = (D.lineaTemporal || []).filter(function(d) { 
    return d.jugador_nombre === nombre; 
  });

  // Nos aseguramos de que estén ordenados cronológicamente por si acaso
  datos.sort(function(a, b) { 
    return a.numero_temporada !== b.numero_temporada ? 
      a.numero_temporada - b.numero_temporada : 
      a.numero_partido - b.numero_partido; 
  });

  if (!datos.length) {
    if (G.modalChart) {
      G.modalChart.data.labels = [];
      G.modalChart.data.datasets[0].data = [];
      G.modalChart.update('none');
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';
  
  var labels = [];
  var vals = [];
  for (var i = 0; i < datos.length; i++) {
    labels.push(datos[i].label);
    vals.push(datos[i].puntos_acumulados);
  }
  
  // Guardamos los datos para usarlos en el Tooltip de la gráfica
  G._modalTl = datos;

  if (!G.modalChart) {
    G.modalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Puntos',
          data: vals,
          borderColor: '#5a7a5a',
          borderWidth: 2.5,
          tension: 0.3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#ffffff',
          segment: {
            borderColor: function(ctx) {
              if (ctx.p1.parsed.y > ctx.p0.parsed.y) return '#1db954'; // Verde (Sube)
              if (ctx.p1.parsed.y < ctx.p0.parsed.y) return '#ef4444'; // Rojo (Baja)
              return '#e8b830'; // Amarillo (Se mantiene)
            }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              afterLabel: function (ctx2) {
                var tlD = G._modalTl;
                var p = tlD ? tlD[ctx2.dataIndex] : null;
                if (!p) return '';
                var icono = p.res === 'V' ? '🟢' : p.res === 'E' ? '🟡' : '🔴';
                // Usamos los puntos directos desde la base de datos
                var signo = p.puntos > 0 ? ' +' : ' ';
                return icono + ' ' + p.res + signo + p.puntos;
              }
            }
          }
        },
        scales: {
          x: { 
            ticks: { color: '#5a7a5a', font: { family: 'Oswald', size: 8 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, 
            grid: { color: 'rgba(30,42,30,.3)' } 
          },
          y: { ticks: { color: '#5a7a5a', font: { family: 'Oswald', size: 9 } }, grid: { color: 'rgba(30,42,30,.3)' } }
        }
      }
    });
  } else {
    G.modalChart.data.labels = labels;
    G.modalChart.data.datasets[0].data = vals;
    G.modalChart.update('none');
  }
}
function renderModalCalChart(nombre) {
  var wrap = document.getElementById('modal-cal-wrap');
  var canvas = document.getElementById('g-modal-cal');
  var ctx = canvas.getContext('2d');
  var emptyEl = document.getElementById('modal-cal-empty');

  var registros = D.historial.filter(function (h) { return h.jugador_nombre === nombre; });

  if (registros.length < 2) {
    wrap.style.display = 'none';
    if (G.modalCalChart) { G.modalCalChart.destroy(); G.modalCalChart = null; }
    return;
  }

  wrap.style.display = 'block';
  emptyEl.style.display = 'none';

  registros.sort(function (a, b) { return new Date(a.fecha_cambio) - new Date(b.fecha_cambio); });

  var labels = [];
  var vals = [];
  for (var i = 0; i < registros.length; i++) {
    var fecha = new Date(registros[i].fecha_cambio);
    var dia = fecha.getDate();
    var mes = fecha.toLocaleString('es-ES', { month: 'short' });
    labels.push(dia + ' ' + mes);
    vals.push(Number(registros[i].calificacion_nueva) || 0);
  }

  // --- CALCULAR COLORES PARA LOS PUNTITOS ---
  var pointColors = [];
  for (var j = 0; j < vals.length; j++) {
    if (j === 0) {
      pointColors.push('#e8b830'); // El primer punto siempre amarillo
    } else {
      if (vals[j] > vals[j-1]) pointColors.push('#1db954'); // Sube -> Verde
      else if (vals[j] < vals[j-1]) pointColors.push('#ef4444'); // Baja -> Rojo
      else pointColors.push('#e8b830'); // Igual -> Amarillo
    }
  }

  if (!G.modalCalChart) {
    G.modalCalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Calificacion',
          data: vals,
          borderColor: '#5a7a5a', // Color base por defecto
          borderWidth: 2.5,
          tension: 0.35,
          fill: false, // Sin relleno
          pointRadius: 4,
          pointBackgroundColor: pointColors, // Pintamos los dots con el array que creamos
          pointBorderColor: '#0a0f0a',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          // --- MAGIA DEL SEMÁFORO AQUÍ ---
          segment: {
            borderColor: function(ctx) {
              if (ctx.p1.parsed.y > ctx.p0.parsed.y) return '#1db954'; // Verde
              if (ctx.p1.parsed.y < ctx.p0.parsed.y) return '#ef4444'; // Rojo
              return '#e8b830'; // Amarillo
            }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (ctx2) {
                return 'Cal: ' + Number(ctx2.raw).toFixed(2);
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#5a7a5a', font: { family: 'Oswald', size: 8 }, maxRotation: 0, maxTicksLimit: 8 },
            grid: { color: 'rgba(30,42,30,.3)' }
          },
          y: {
            min: Math.floor(Math.min(...vals)) - 0.5,
            max: Math.ceil(Math.max(...vals)) + 0.5,
            ticks: {
              color: '#5a7a5a',
              font: { family: 'Oswald', size: 9 },
              stepSize: 1
            },
            grid: { color: 'rgba(30,42,30,.3)' }
          }
        }
      }
    });
  } else {
    // Si el gráfico ya existe, actualizamos datos Y los colores de los puntos
    G.modalCalChart.data.labels = labels;
    G.modalCalChart.data.datasets[0].data = vals;
    G.modalCalChart.data.datasets[0].pointBackgroundColor = pointColors;
    G.modalCalChart.update('none');
  }
}

function renderTemps() {
  var g = document.getElementById('gr-temp');
  g.innerHTML = '';
  
  // Ordenar de la más antigua a la más nueva (T1, T2, T3...)
  var tempsOrdenadas = D.temporadas.slice().sort(function(a, b) { 
    return a.numero_temporada - b.numero_temporada; 
  });

  var html = '<div class="timeline-temporadas">';

  tempsOrdenadas.forEach(function (t) {
    var c1n = t.capitan1_nombre || 'Por Definir';
    var c2n = t.capitan2_nombre || 'Por Definir';
    var gann = t.ganador_nombre;
    
    // Determinar quién ganó y quién perdió
    var esC1Ganador = (c1n === gann);
    var esC2Ganador = (c2n === gann);
    var hayGanador = !!gann;

    html += '<div class="timeline-nodo">';
    html += '<div class="timeline-card" onclick="verTemporada(' + t.numero_temporada + ')">';
    
    // Encabezado de la temporada
    html += '<div class="timeline-header">';
    html += '<span class="timeline-num">Temporada ' + t.numero_temporada + '</span>';
    if (!t.finalizada) {
      html += '<span style="font-size:.6rem; color:var(--pitch); display:flex; align-items:center; gap:.3rem;"><span style="width:6px; height:6px; background:var(--pitch); border-radius:0%;" class="animate-pulse"></span>En curso</span>';
    }
    html += '</div>';

    // Fotos de Capitanes
    html += '<div class="timeline-vs">';
    
    // Capitán 1
    html += '<div class="timeline-cap ' + (hayGanador ? (esC1Ganador ? 'ganador' : 'perdedor') : '') + '">';
    html += '<div class="timeline-foto">';
    if (esC1Ganador) html += '<i class="fa-solid fa-crown timeline-crown"></i>';
    html += getFotoHTML(c1n, 'hero');
    html += '</div>';
    html += '<span class="timeline-nombre">' + nLimpio(c1n) + '</span>';
    html += '</div>';

    // VS Centro
    html += '<div class="timeline-vs-center">VS</div>';

    // Capitán 2
    html += '<div class="timeline-cap ' + (hayGanador ? (esC2Ganador ? 'ganador' : 'perdedor') : '') + '">';
    html += '<div class="timeline-foto">';
    if (esC2Ganador) html += '<i class="fa-solid fa-crown timeline-crown"></i>';
    html += getFotoHTML(c2n, 'hero');
    html += '</div>';
    html += '<span class="timeline-nombre">' + nLimpio(c2n) + '</span>';
    html += '</div>';

    html += '</div>'; // Fin timeline-vs
    html += '</div>'; // Fin timeline-card
    html += '</div>'; // Fin timeline-nodo
  });

  html += '</div>'; // Fin timeline-temporadas
  g.innerHTML = html;
}

function verTemporada(num) {
  var t = D.temporadas.find(function (x) { return x.numero_temporada === num; });
  if (!t) return;
  var ms = pTemp(num);
  var det = document.getElementById('det-temp');
  det.classList.remove('hidden');
  document.getElementById('det-tit').textContent = 'Temporada ' + num;
  document.getElementById('det-c1').textContent = t.capitan1_nombre || '--';
  document.getElementById('det-c2').textContent = t.capitan2_nombre || '--';
  document.getElementById('det-gan').textContent = t.ganador_nombre || '--';

  var tb = document.getElementById('det-tb');
  if (!ms.length) {
    tb.innerHTML = '<tr><td colspan="6" class="px-3 py-6 text-center text-muted text-sm">Sin partidos</td></tr>';
    return;
  }
  tb.innerHTML = '';
  ms.forEach(function (m) {
    var rc = m.resultado === 'ganador_equipo1' ? 'bg1' : m.resultado === 'ganador_equipo2' ? 'bg2' : 'bge';
var rt = m.resultado === 'ganador_equipo1' ? 'VICTORIA EQ1' : m.resultado === 'ganador_equipo2' ? 'VICTORIA EQ2' : 'EMPATE';
    var tr = document.createElement('tr');
    tr.className = 'border-b border-brd/30';
    tr.innerHTML = '<td class="px-3 py-2 font-display text-muted text-sm">' + m.numero_partido + '</td>' +
      '<td class="px-3 py-2 text-center font-display font-bold text-cap1 text-lg">' + (m.goles_equipo1 || 0) + '</td>' +
      '<td class="px-3 py-2 text-center"><span class="' + rc + ' text-[.55rem] font-display px-2 py-0.5 rounded-full">' + rt + '</span></td>' +
      '<td class="px-3 py-2 text-center font-display font-bold text-cap2 text-lg">' + (m.goles_equipo2 || 0) + '</td>' +
      '<td class="px-3 py-2 text-center text-muted text-[.65rem]">' + m.tipo_partido + '</td>' +
      '<td class="px-3 py-2 text-center text-muted text-[.65rem] font-display">' + (anioP(m) || '--') + '</td>';
    tb.appendChild(tr);
  });
  det.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Footer ── */
function renderFooter() {
  document.getElementById('pie-jug').textContent = D.jugadores.length;
  document.getElementById('pie-parts').textContent = D.partidos.length;
  document.getElementById('pie-temps').textContent = D.temporadas.length;
  document.getElementById('pie-h').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-ES');
}

/* ═══════════════════════════════════════════════
   MAPA DE COORDENADAS DEL DREAM TEAM (FÁCIL DE EDITAR)
   
   left: 0% = Extremo Izquierdo | 50% = Centro | 100% = Extremo Derecho
   top:  0% = Arriba del todo | 50% = Medio | 100% = Abajo del todo
   scale: 1 = Tamaño normal | 1.3 = 30% más grande | 0.8 = 20% más pequeño
   ═══════════════════════════════════════════════ */
var POSICIONES_DREAM = [
  { left: '50%', top: '70%',  scale: 1 },  // Posición 1 (El líder, más grande, arriba al centro)
  { left: '72%', top: '46%',  scale: 0.8 },  // Posición 2
  { left: '27%', top: '46%',  scale: 0.8 },  // Posición 3
  { left: '32%', top: '18%',  scale: 0.7 },  // Posición 4
  { left: '68%', top: '18%',  scale: 0.7 }   // Posición 5
];

function renderDreamTeam() {
  if (!tAct) return;
  
  var datos = (D.dreamTeam || []).filter(function(d) {
    return d.numero_temporada === tAct.numero_temporada;
  });

  var g = document.getElementById('gr-dream');
  document.getElementById('c-dt').textContent = 'Temporada ' + tAct.numero_temporada;

  if (!datos.length) {
    g.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" class="text-center text-muted/40 text-sm"><i class="fa-solid fa-star mr-1"></i>Sin datos suficientes esta temporada</div>';
    return;
  }

  var h = '';
  for (var i = 0; i < datos.length; i++) {
    var p = datos[i];
    var pos = POSICIONES_DREAM[i];
    
    // Calculamos el tamaño de la foto basándonos en la escala
    var tamBase = TAM_FOTOS.dream_team || 2.5;
    var tamFinal = tamBase * (pos.scale || 1);

    h += '<div class="dream-nodo" style="left:' + pos.left + ';top:' + pos.top + '">' +
      getFotoHTML(p.jugador_nombre, tamFinal) + 
      '<span class="dream-nombre">' + nLimpio(p.jugador_nombre) + '</span>' +
    '</div>';
  }
  g.innerHTML = h;
}

/* ── Render todo ── */
function renderTodo() {
  renderHero();
  renderPartidos();
  renderSinergias();
  renderDreamTeam();
  renderSinergiasHistoricas();
  renderRivalidadesHistoricas();
  renderTemps();
  renderFooter();
  prepararRanking();
  renderRankingBody();

  var info = document.getElementById('filtro-info');
  if (filtroActual === 'todos') {
    info.innerHTML = '<i class="fa-solid fa-circle-info mr-0.5"></i>Todos los partidos (Historial completo)';
  } else {
    var u = getUltimas2Temps();
    var nums = [].slice.call(u).sort(function (a, b) { return a - b; });
    var ts = nums.map(function (t) { return 'T' + t; }).join(' y ');
    if (nums.length < 2) {
      info.innerHTML = '<i class="fa-solid fa-filter mr-0.5"></i>' + ts + ' <span style="color:rgba(248,113,113,.7)"></span>';
    } else {
      info.innerHTML = '<i class="fa-solid fa-filter mr-0.5"></i>Solo ' + ts;
    }
  }
}

/* ── Animaciones ── */
function initReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: 0.06 });
  document.querySelectorAll('.revelar').forEach(function (el) { obs.observe(el); });
}

/* ── Búsqueda ── */
var busqDebounced = debounce(function () {
  pagRank.actual = 1;
  renderRankingBody();
}, 200);

/* ── Evento de cambio de Pestañas de Partidos ── */
document.getElementById('pestanas-partidos').addEventListener('click', function(e) {
  var btn = e.target.closest('.pestana');
  if (!btn) return;
  
  var nuevoTipo = btn.getAttribute('data-tipo');
  if (nuevoTipo === tipoPartidoFiltro) return; // Si hacen clic en la que ya está activa, no hace nada

  tipoPartidoFiltro = nuevoTipo;

  // Cambiar clases visualmente
  this.querySelectorAll('.pestana').forEach(function(p) { p.classList.remove('pestana-activa'); });
  btn.classList.add('pestana-activa');

  // Volver a renderizar solo la tabla (sin recargar toda la página)
  renderPartidos();
});

/* ── Sistema de Tema Claro/Oscuro ── */
function cambiarTema() {
  var html = document.documentElement;
  var icono = document.getElementById('icono-tema');
  
  // Alternar el atributo
  if (html.getAttribute('data-theme') === 'light') {


    html.removeAttribute('data-theme');
    icono.className = 'fa-solid fa-eye text-[.55rem]';
    localStorage.setItem('fayro-tema', 'oscuro');
  } else {
    html.setAttribute('data-theme', 'light');
    icono.className = 'fa-solid fa-eye-slash text-[.55rem]';
    localStorage.setItem('fayro-tema', 'claro');
  }
}

// Cargar tema guardado al entrar a la página
(function() {
  var temaGuardado = localStorage.getItem('fayro-tema');
  if (temaGuardado === 'claro') {
    document.documentElement.setAttribute('data-theme', 'light');
    // Esperamos a que el DOM cargue para cambiar el icono
    setTimeout(function() {
      var icono = document.getElementById('icono-tema');
      if (icono) icono.className = 'fa-solid fa-eye-slash text-[.55rem]';
    }, 100);
  }
})();

/* ── Init ── */
function init() {
  cargarDatos().then(function () {
    calcEG();
    renderSel();
    renderColToggles();
    renderTodo();
    initReveal();

    var ld = document.getElementById('cargador');
    ld.style.transition = 'opacity .4s ease';
    ld.style.opacity = '0';
    setTimeout(function () { ld.style.display = 'none'; }, 400);

    document.getElementById('busq-rank').addEventListener('input', busqDebounced);

    document.getElementById('btn-act').onclick = function () {
      var btn = this;
      btn.disabled = true;
      btn.querySelector('i').classList.add('animate-spin');
      cargarDatos().then(function () {
        calcEG();
        renderSel();
        renderTodo();
        toast('Datos actualizados');
      }).catch(function () {
        toast('Error al actualizar');
      }).finally(function () {
        btn.disabled = false;
        btn.querySelector('i').classList.remove('animate-spin');
      });
    };

    var hash = window.location.hash.replace('#', '');
    if (hash === 'jugadores' || hash === 'temporadas') irA(hash);
  }).catch(function (e) {
    console.error('Error:', e);
    document.getElementById('cargador').innerHTML = '<div class="text-center px-6"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3 block"></i><p class="text-red-400 font-display text-base mb-1">Error al cargar</p><p class="text-muted text-sm max-w-xs">' + (e.message || 'Sin conexion') + '</p><button onclick="location.reload()" class="mt-4 border border-brd rounded-lg px-4 py-1.5 text-sm text-white hover:border-accent/30 transition-colors" style="background:#141a14">Reintentar</button></div>';
  });
}

document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarModal(); });
window.addEventListener('hashchange', function () {
  var hash = window.location.hash.replace('#', '');
  if (hash === 'jugadores' || hash === 'temporadas') irA(hash);
  else if (hash === '' || hash === 'inicio') irA('inicio');
});

init();
