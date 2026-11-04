/**
 * NEXXA EXPO by Impulso · Registro en Google Sheets
 * --------------------------------------------------
 * 1. Pega este código en la hoja: Extensiones → Apps Script (reemplaza todo).
 * 2. Ejecuta una vez la función "configurar" y acepta los permisos.
 * 3. Implementar → Nueva implementación → Tipo: Aplicación web
 *      Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 * 4. Copia la URL que termina en /exec y envíasela a Claude.
 *
 * Al actualizar el código: guarda, ejecuta "configurar" y luego
 * Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar
 * (así la URL no cambia). El PIN del personal de ingreso queda en la pestaña "Config".
 */

const CUPO = 200; // cupos del auditorio

const HOJAS = {
  Ponencias: [
    ['creado', 'Fecha de registro'], ['codigo', 'Código'], ['estado', 'Estado'],
    ['tipo_label', 'Tipo'], ['segmento', 'Segmento'],
    ['nombres', 'Nombres'], ['apellidos', 'Apellidos'], ['tipo_doc', 'Tipo de documento'], ['documento', 'Documento'],
    ['correo', 'Correo'], ['celular', 'Celular'], ['ciudad', 'Ciudad'], ['edad', 'Edad'],
    ['rol', 'Rol'], ['programa', 'Programa'], ['semestre', 'Semestre'],
    ['ocupacion', 'Ocupación'], ['organizacion', 'Organización'],
    ['etapa', 'Etapa del negocio'], ['negocio', 'Negocio o marca'], ['sector', 'Sector'], ['que_vende', 'Qué vende'],
    ['canales', 'Canales de venta'], ['sector_idea', 'Sector de la idea'], ['idea', 'Idea'],
    ['ponencias_interes', 'Ponencias de interés'], ['canal_entero', 'Cómo se enteró'], ['expectativa', 'Expectativa'],
    ['habeas', 'Autoriza datos'], ['contacto_marcas', 'Acepta contacto de marcas'], ['origen', 'Origen'], ['ingreso', 'Ingreso']
  ],
  Laboratorio: [
    ['creado', 'Fecha de inscripción'], ['codigo', 'Código'], ['etapa', 'Etapa'],
    ['nombres', 'Nombres'], ['apellidos', 'Apellidos'], ['correo', 'Correo'], ['celular', 'Celular'], ['ciudad', 'Ciudad'],
    ['tipo_label', 'Participa como'], ['asiste_ponencia', 'Asiste a la ponencia'],
    ['nivel', 'Nivel en Meta Ads'], ['negocio_estado', 'Tiene negocio'], ['negocio', 'Negocio o marca'], ['sector', 'Sector'],
    ['presupuesto', 'Presupuesto mensual'], ['computador', 'Computador'],
    ['objetivos', 'Objetivos'], ['horario', 'Horario preferido'], ['pregunta', 'Qué quiere resolver'],
    ['habeas', 'Autoriza datos'], ['contacto_tag', 'Acepta contacto de TAG'], ['origen', 'Origen'], ['ingreso', 'Confirmado']
  ]
};

function configurar() {
  Object.keys(HOJAS).forEach(hoja_);
  pin_();
  const def = SpreadsheetApp.getActive().getSheetByName('Hoja 1') || SpreadsheetApp.getActive().getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && SpreadsheetApp.getActive().getSheets().length > 1) SpreadsheetApp.getActive().deleteSheet(def);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.op === 'verify') return json_(verificar_(p.codigo));
  return json_({ ok: true, confirmados: confirmados_(), cupo: CUPO });
}

/* Verificación del QR: devuelve los datos básicos del registro */
function verificar_(codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!/^(NXE|LAB)-[A-Z0-9]{5}$/.test(c)) return { ok: true, found: false };
  const nombre = c.indexOf('LAB-') === 0 ? 'Laboratorio' : 'Ponencias';
  const sh = hoja_(nombre);
  const r = fila_(sh, HOJAS[nombre], c);
  if (!r) return { ok: true, found: false };
  const v = k => r.values[HOJAS[nombre].findIndex(x => x[0] === k)];
  return { ok: true, found: true, codigo: c, evento: nombre,
    nombre: [v('nombres'), v('apellidos')].filter(Boolean).join(' '),
    tipo: v('tipo_label') || '', estado: nombre === 'Ponencias' ? v('estado') : 'Inscrito · ' + (v('etapa') || ''),
    ingreso: v('ingreso') ? Utilities.formatDate(new Date(v('ingreso')), 'America/Bogota', 'dd/MM/yyyy h:mm a') : '' };
}

/* Confirmación de ingreso (solo personal con PIN) */
function checkin_(d) {
  if (String(d.pin || '') !== pin_()) return { ok: false, error: 'pin' };
  const c = String(d.codigo || '').trim().toUpperCase();
  const nombre = c.indexOf('LAB-') === 0 ? 'Laboratorio' : 'Ponencias';
  const sh = hoja_(nombre);
  const cols = HOJAS[nombre];
  const r = fila_(sh, cols, c);
  if (!r) return { ok: false, error: 'no_encontrado' };
  const col = cols.findIndex(x => x[0] === 'ingreso') + 1;
  const prev = sh.getRange(r.row, col).getValue();
  if (prev) return Object.assign(verificar_(c), { ya: true });
  sh.getRange(r.row, col).setValue(new Date());
  return Object.assign(verificar_(c), { confirmado: true });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return json_({ ok: false, error: 'spam' }); // campo trampa para bots
    if (d.kind === 'checkin') return json_(checkin_(d));
    const nombre = d.kind === 'lab' ? 'Laboratorio' : 'Ponencias';
    const sh = hoja_(nombre);
    const cols = HOJAS[nombre];
    d.creado = new Date();
    d.origen = d.origen || 'nexxaexpo2026.online';

    if (nombre === 'Ponencias') {
      const prev = buscar_(sh, cols, 'documento', d.documento) || buscar_(sh, cols, 'correo', d.correo);
      if (prev) return json_({ ok: true, repetido: true, codigo: prev.codigo, estado: prev.estado, confirmados: confirmados_() });
      const conf = confirmados_();
      d.estado = conf < CUPO ? 'Cupo confirmado' : 'Lista de espera';
      d.codigo = codigo_('NXE', sh, cols);
    } else {
      const prev = buscar_(sh, cols, 'correo', d.correo);
      if (prev) return json_({ ok: true, repetido: true, codigo: prev.codigo, estado: 'Inscrito', confirmados: 0 });
      d.codigo = codigo_('LAB', sh, cols);
      d.etapa = 'Etapa 1 (sin costo)';
    }

    sh.appendRow(cols.map(([k]) => celda_(d[k])));
    return json_({ ok: true, codigo: d.codigo, estado: d.estado || 'Inscrito', confirmados: confirmados_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- utilidades ---------- */
function hoja_(nombre) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  const h = HOJAS[nombre].map(c => c[1]);
  if (sh.getLastRow() === 0 || sh.getLastColumn() < h.length) {
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#0B5CFF').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function confirmados_() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Ponencias');
  if (!sh || sh.getLastRow() < 2) return 0;
  const col = HOJAS.Ponencias.findIndex(c => c[0] === 'estado') + 1;
  return sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues().filter(r => r[0] === 'Cupo confirmado').length;
}
function buscar_(sh, cols, campo, valor) {
  if (!valor || sh.getLastRow() < 2) return null;
  const v = String(valor).trim().toLowerCase();
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues();
  const i = cols.findIndex(c => c[0] === campo), ic = cols.findIndex(c => c[0] === 'codigo'), ie = cols.findIndex(c => c[0] === 'estado');
  const row = data.find(r => String(r[i]).replace(/^'/, '').trim().toLowerCase() === v);
  return row ? { codigo: row[ic], estado: ie >= 0 ? row[ie] : '' } : null;
}
function fila_(sh, cols, codigo) {
  if (!sh || sh.getLastRow() < 2) return null;
  const ic = cols.findIndex(c => c[0] === 'codigo');
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues();
  const i = data.findIndex(r => String(r[ic]).trim().toUpperCase() === codigo);
  return i < 0 ? null : { row: i + 2, values: data[i] };
}
function pin_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Config');
  if (!sh) { sh = ss.insertSheet('Config'); sh.getRange('A1:B1').setValues([['PIN del personal de ingreso', '']]).setFontWeight('bold'); }
  let pin = String(sh.getRange('B1').getValue() || '').trim();
  if (!pin) { pin = String(Math.floor(100000 + Math.random() * 900000)); sh.getRange('B1').setValue("'" + pin); }
  return pin;
}
function codigo_(pref, sh, cols) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = pref + '-' + Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join(''); }
  while (buscar_(sh, cols, 'codigo', c));
  return c;
}
function celda_(v) {
  if (v instanceof Date) return v;
  if (Array.isArray(v)) v = v.join('; ');
  if (v === true) return 'Sí';
  if (v === false || v == null) return v === false ? 'No' : '';
  v = String(v).slice(0, 2000);
  if (/^\+?\d[\d\s-]{5,}$/.test(v)) return "'" + v; // documentos y celulares como texto
  return /^[=+\-@]/.test(v) ? "'" + v : v; // evita fórmulas inyectadas
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
