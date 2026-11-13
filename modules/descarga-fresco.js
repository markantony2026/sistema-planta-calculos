import {initialState as baseState,number,round,format,escape,referenceKg} from './descarga-sacos.js';

export const states = {line:'Pasa a línea',pending:'No pasa a línea (Pendiente)'};
export function initialState() {
  return {...baseState(),status:'pending',destinationOther:'',manualWeight:null,saltBag:25};
}
export function totals(s) {
  return s.rows.reduce((t,r) => {
    const net=round(number(r.gross)-number(r.tare));
    t.net=round(t.net+net);
    t.trays+=number(r.trays);
    t[r.status==='line'?'line':'pending']=round(t[r.status==='line'?'line':'pending']+net);
    return t;
  },{net:0,trays:0,line:0,pending:0,dinos:s.rows.length});
}
// Cálculos decimales independientes del formato de presentación.
export function calculations(s) {
  const weight=s.manualWeight===null?totals(s).net:number(s.manualWeight);
  const count=Math.ceil(Number((weight/number(s.bag)).toFixed(10)));
  const automatic=/^\d+$/.test(s.start)&&count>0
    ? (BigInt(s.start)+BigInt(count)-1n).toString().padStart(s.start.length,'0'):'';
  const saltKg=Number((weight*0.012).toFixed(12));
  const saltBags=Number((saltKg/number(s.saltBag)).toFixed(12));
  return {weight,count,automatic,end:s.manualEnd??automatic,saltKg,saltBags};
}
const exact=value=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:12}).format(value);
const options=()=>Object.entries(states).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
const header=(key,label,type='text',extra='')=>`<label>${label}<input data-fresco="${key}" type="${type}" ${extra}></label>`;
export function view() {
  return `<div class="page-heading"><div><p class="eyebrow">SECCIÓN 02 · FRESCO</p><h1>Descarga Fresco (Dinos)</h1><p>Controla bandejas, taras variables y destino del lote.</p></div><span id="lot-badge" class="status-badge"></span></div>
  <section class="panel"><div class="section-title"><h2><span>01</span> Datos del lote</h2></div><div class="fields">
  ${header('supplier','Proveedor','text','placeholder="Nombre del proveedor"')}${header('date','Fecha','date','required')}
  <label>Cantidad referencial<div class="joined"><input data-fresco="reference" type="number" min="0" step="any"><select data-fresco="unit" aria-label="Unidad referencial"><option>TON</option><option>KG</option></select></div><small id="f-conversion"></small></label>
  <label>Tipo de saco / Destino<select data-fresco="bag"><option value="23.7">23.7 kg</option><option value="25">25 kg</option><option value="50">50 kg</option></select></label>
  ${header('destinationOther','Otros / Destino','text','placeholder="Detalle adicional del destino"')}
  <label>Estado general del lote<select data-fresco="status">${options()}</select><small>El estado general se propone para nuevas filas. Cada dino conserva su estado individual.</small></label>
  </div></section>
  <div class="metrics"><article class="metric accent"><span>PESO NETO TOTAL</span><strong><span id="f-net"></span> <em>kg</em></strong><small>Incluye todos los dinos pesados</small></article><article class="metric"><span>PASA A LÍNEA</span><strong><span id="f-line"></span> <em>kg</em></strong><small>Según estado individual de cada fila</small></article><article class="metric pending-metric"><span>PENDIENTE</span><strong><span id="f-pending"></span> <em>kg</em></strong><small>Según estado individual de cada fila</small></article></div>
  <section class="panel"><div class="section-title"><h2><span>02</span> Pesaje por dinos y bandejas</h2><span id="f-count" class="tag"></span></div>
  <form id="f-form" class="quick-form fresco-form"><label>N° Bandejas<input name="trays" type="number" min="0" step="1" required value="0"></label><label>Peso Bruto (kg)<input name="gross" type="number" min="0" step="any" required inputmode="decimal" placeholder="Producto + dino"></label><label>Peso del Dino / Tara (kg)<input name="tare" type="number" min="0" step="any" required inputmode="decimal" placeholder="Tara de este dino"></label><label>Estado<select name="status">${options()}</select></label><label>Otros / Observaciones<input name="note" placeholder="Observación opcional"></label><button class="primary" type="submit">＋ Agregar dino</button></form>
  <div class="table-wrap"><table class="fresco-table"><thead><tr><th>N° Dino</th><th>N° Bandejas</th><th>Peso Bruto (kg)</th><th>Tara Dino (kg)</th><th>Neto (kg)</th><th>Estado</th><th>Otros / Observaciones</th><th class="no-print">Acción</th></tr></thead><tbody id="f-rows"></tbody><tfoot><tr><th id="f-dinos-total"></th><td id="f-trays-total"></td><td colspan="2">Peso neto total</td><td id="f-net-total"></td><td colspan="3"></td></tr></tfoot></table></div><p id="f-empty" class="empty">Agrega un dino para registrar el primer pesaje.</p></section>
  <section class="panel calculation-panel"><div class="section-title"><h2><span>03</span> Cálculo de precintos y sal</h2><span id="f-weight-badge" class="tag"></span></div>
  <div class="fields"><label>Origen del peso de cálculo<select id="f-weight-mode"><option value="auto">Peso neto total pesado (automático)</option><option value="manual">Probar con peso manual</option></select><small>Incluye el producto en línea y pendiente.</small></label><label id="f-manual-label">Peso manual de prueba (kg)<input data-fresco="manualWeight" type="number" min="0" step="any"><small>La prueba manual no modifica los pesos registrados.</small></label><label>Saco de sal (kg)<select data-fresco="saltBag"><option value="25">25 kg</option><option value="50">50 kg</option></select></label>
  ${header('start','Nro inicio de precinto','text','inputmode="numeric" pattern="[0-9]*" placeholder="017121"')}<label>Nro final de precinto<input id="f-end" type="text" inputmode="numeric" pattern="[0-9]*"><small id="f-end-mode"></small><button id="f-auto-end" class="text-button">Restablecer automático</button></label></div>
  <div class="metrics calculation-results"><article class="metric"><span>PRECINTOS NECESARIOS</span><strong id="f-seals"></strong><small id="f-seal-formula"></small></article><article class="metric accent"><span>SAL NECESARIA</span><strong><span id="f-salt"></span> <em>kg</em></strong><small>Peso de cálculo × 0.012</small></article><article class="metric"><span>EQUIVALENTE EN SACOS DE SAL</span><strong id="f-salt-bags"></strong><small id="f-salt-formula"></small></article></div>
  </section><div class="actions"><button id="f-csv" class="primary">↓ Exportar CSV (;)</button><button id="f-excel" class="secondary">↓ Exportar Excel (.xls)</button><button id="f-print" class="secondary">Imprimir / Guardar PDF</button><button id="f-archive" class="secondary">Guardar en historial</button><button id="f-new" class="text-button">Nuevo lote fresco</button></div><p class="footnote">Guardado automático en este navegador. Exporta una copia para conservar un respaldo.</p>`;
}
export function rowsView(s) {
  return s.rows.map((r,i)=>`<tr data-id="${r.id}"><td data-label="N° Dino">${i+1}</td>${['trays','gross','tare'].map((key,j)=>`<td data-label="${['N° Bandejas','Peso Bruto (kg)','Tara Dino (kg)'][j]}"><input data-field="${key}" aria-label="${['Bandejas','Peso bruto','Tara dino'][j]} fila ${i+1}" type="number" min="0" step="${key==='trays'?'1':'any'}" required value="${r[key]}"></td>`).join('')}<td class="row-net" data-label="Neto (kg)">${format(round(r.gross-r.tare))}</td><td data-label="Estado"><select data-field="status" aria-label="Estado fila ${i+1}" class="status-${r.status}">${options().replace(`value="${r.status}"`,`value="${r.status}" selected`)}</select><span class="print-status">${states[r.status]}</span></td><td data-label="Otros / Observaciones"><input data-field="note" aria-label="Observación fila ${i+1}" value="${escape(r.note)}"></td><td class="no-print"><button class="delete" data-delete="${r.id}" aria-label="Eliminar dino ${i+1}">Eliminar</button></td></tr>`).join('');
}
export function exportRows(s) {
  const t=totals(s),c=calculations(s);
  return [['Sistema de Control y Cálculos de Planta'],['Descarga Fresco (Dinos)'],['Proveedor',s.supplier],['Fecha',s.date],['Cantidad referencial',s.reference,s.unit],['Referencia kg',referenceKg(s)],['Tipo de saco / Destino kg',s.bag],['Otros / Destino',s.destinationOther],['Estado general del lote',states[s.status]],[],['N° Dino','N° Bandejas','Peso Bruto kg','Tara Dino kg','Neto kg','Estado','Otros / Observaciones'],...s.rows.map((r,i)=>[i+1,r.trays,r.gross,r.tare,round(r.gross-r.tare),states[r.status],r.note]),['TOTALES',t.trays,'',`${t.dinos} dinos`,t.net],['Pasa a línea kg',t.line],['Pendiente kg',t.pending],[],['Origen peso de cálculo',s.manualWeight===null?'Automático: neto total pesado':'Prueba manual'],['Peso de cálculo kg',c.weight],['Precintos necesarios',c.count],['Precinto inicio',s.start],['Precinto final',c.end],['Final automático',c.automatic],['Modo final',s.manualEnd===null?'Automático':'Manual'],['Sal kg (peso × 0.012)',c.saltKg],['Saco de sal kg',s.saltBag],['Equivalente sacos de sal',c.saltBags]];
}
export function mount({state,onSave,onArchive,onDownload,onNew,message}) {
  const s=state,$=selector=>document.querySelector(selector);
  $('#main').onclick=null;
  $('#main').innerHTML=view();
  const persist=()=>{onSave(s);update();};
  const reject=(el,previous,text)=>{el.setCustomValidity(text);el.reportValidity();el.setCustomValidity('');el.value=previous;};
  const draw=()=>{$('#f-rows').innerHTML=rowsView(s);};
  function update() {
    const t=totals(s),c=calculations(s);
    $('#f-net').textContent=format(t.net);$('#f-line').textContent=format(t.line);$('#f-pending').textContent=format(t.pending);
    $('#lot-badge').textContent=states[s.status];$('#lot-badge').className=`status-badge status-${s.status}`;
    $('[data-fresco="status"]').className=`status-${s.status}`;
    $('#f-conversion').textContent=`${format(referenceKg(s))} KG · ${format(referenceKg(s)/1000)} TON`;
    $('#f-count').textContent=`${t.dinos} dinos`;
    $('#f-dinos-total').textContent=`${t.dinos} dinos`;
    $('#f-trays-total').textContent=`${t.trays} bandejas`;
    $('#f-net-total').textContent=`${format(t.net)} kg`;
    $('#f-empty').hidden=!!t.dinos;
    $('#f-weight-mode').value=s.manualWeight===null?'auto':'manual';
    $('#f-manual-label').hidden=s.manualWeight===null;
    $('#f-weight-badge').textContent=`${s.manualWeight===null?'Peso automático':'Prueba manual'}: ${format(c.weight)} kg`;
    $('#f-weight-badge').className=s.manualWeight===null?'tag':'tag status-pending';
    $('#f-seals').textContent=format(c.count);$('#f-seal-formula').textContent=`${format(c.weight)} kg ÷ ${s.bag} kg, redondeado hacia arriba`;
    $('#f-end').value=c.end;$('#f-end-mode').textContent=s.manualEnd===null?'Automático · rango inclusivo':`Manual · Automático: ${c.automatic||'—'}`;
    $('#f-salt').textContent=exact(c.saltKg);$('#f-salt-bags').textContent=exact(c.saltBags);
    $('#f-salt-formula').textContent=`${exact(c.saltKg)} kg ÷ ${s.saltBag} kg (sin redondear a sacos enteros)`;
  }
  document.querySelectorAll('[data-fresco]').forEach(el=>{
    const key=el.dataset.fresco;el.value=s[key]??'';
    el.addEventListener('input',()=>{
      if((key==='start'&&!/^\d*$/.test(el.value))||!el.validity.valid||(el.type==='number'&&(el.value===''||!Number.isFinite(Number(el.value))))) {reject(el,s[key]??'','Ingresa un valor válido y no negativo.');return;}
      if(key==='unit') {s.reference=round(s.reference*(el.value==='KG'?1000:0.001));$('[data-fresco="reference"]').value=s.reference;}
      s[key]=['reference','bag','saltBag','manualWeight'].includes(key)?Number(el.value):el.value;
      if(key==='status') $('#f-form').elements.status.value=s.status;
      persist();
    });
  });
  $('#f-form').elements.status.value=s.status;
  $('#f-weight-mode').onchange=e=>{s.manualWeight=e.target.value==='manual'?totals(s).net:null;$('[data-fresco="manualWeight"]').value=s.manualWeight??'';persist();};
  $('#f-end').oninput=e=>{if(!/^\d*$/.test(e.target.value)){reject(e.target,calculations(s).end,'Usa solo dígitos.');return;}s.manualEnd=e.target.value||null;persist();};
  $('#f-auto-end').onclick=()=>{s.manualEnd=null;persist();};
  $('#f-form').onsubmit=e=>{
    e.preventDefault();const f=e.target,read=key=>f.elements[key].value;
    const gross=Number(read('gross')),tare=Number(read('tare'));
    if(gross<tare){reject(f.elements.gross,read('gross'),'El peso bruto debe ser mayor o igual a la tara.');return;}
    s.rows.push({id:crypto.randomUUID(),trays:Number(read('trays')),gross,tare,status:read('status'),note:read('note').trim()});
    f.elements.gross.value='';f.elements.tare.value='';f.elements.note.value='';
    draw();persist();f.elements.gross.focus();
  };
  $('#f-rows').oninput=e=>{
    const el=e.target,key=el.dataset.field;if(!key)return;
    const row=s.rows.find(r=>r.id===el.closest('tr').dataset.id);
    el.setCustomValidity('');
    const value=['note','status'].includes(key)?el.value:Number(el.value);
    if(!['note','status'].includes(key)&&(!el.validity.valid||el.value===''||!Number.isFinite(value)||(key==='gross'&&value<row.tare)||(key==='tare'&&value>row.gross))){el.setCustomValidity('Revisa el valor: neto no negativo y bandejas enteras.');return;}
    row[key]=value;
    const tr=el.closest('tr');tr.querySelector('.row-net').textContent=format(round(row.gross-row.tare));
    if(key==='status'){el.className=`status-${value}`;tr.querySelector('.print-status').textContent=states[value];}
    persist();
  };
  $('#f-rows').addEventListener('focusout',e=>{const el=e.target;if(!el.dataset.field||el.validity.valid)return;const row=s.rows.find(r=>r.id===el.closest('tr').dataset.id);el.setCustomValidity('');el.value=row[el.dataset.field];message('Valor no válido: se conserva el último dato válido de la fila.');});
  $('#f-rows').onclick=e=>{const button=e.target.closest('[data-delete]');if(!button)return;s.rows=s.rows.filter(r=>r.id!==button.dataset.delete);draw();persist();};
  $('#f-csv').onclick=()=>onDownload('csv',s,exportRows(s),'fresco');
  $('#f-excel').onclick=()=>onDownload('xls',s,exportRows(s),'fresco');
  $('#f-print').onclick=()=>window.print();
  $('#f-archive').onclick=()=>s.rows.length||s.supplier||s.reference?onArchive(s,'fresco'):message('Ingresa datos antes de guardar el lote.');
  $('#f-new').onclick=()=>{if((s.rows.length||s.supplier||s.reference)&&!confirm('Se archivará el lote fresco actual y se abrirá uno nuevo. ¿Continuar?'))return;if(s.rows.length||s.supplier||s.reference)onArchive(s,'fresco',false);onNew();};
  draw();update();
}
