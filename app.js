import {loadDatabase,writeDatabase,recoveryCandidates,hasData as containsData} from './modules/almacenamiento.js?v=4';
import * as calc from './modules/precintos-sal.js?v=4';
import * as fresco from './modules/descarga-fresco.js?v=4';
import {initialState,demoState,view,rowsView,totals,seals,sampleBags,referenceKg,format,escape,exportRows,round} from './modules/descarga-sacos.js?v=4';
const $=selector=>document.querySelector(selector);
const loaded=loadDatabase();
let db=loaded.db;
if(loaded.recovered)message('Se recuperó la última copia local válida.');
db.frescoDraft={...fresco.initialState(),...db.frescoDraft};
db.calcDraft ??= {...calc.initialState(db.frescoDraft),weight:db.frescoDraft.manualWeight??fresco.totals(db.frescoDraft).net};
// Las filas guardadas antes de esta versión conservan todos sus datos.
for(const data of [db.draft,...db.records.filter(r=>!r.type||r.type==='sacos').map(r=>r.data)]) {
 for(const row of data.rows) row.others ??= 0;
}
let s=db.draft;
function message(text){ $('#notice').textContent=text; }
function save(){ db.draft=s; try {writeDatabase(db);$('#save-status').textContent='✓ Guardado en este dispositivo';return true;}catch{$('#save-status').textContent='No se pudo guardar: exporta un respaldo';message('No hay espacio disponible para guardar. Descarga un respaldo antes de continuar.');return false;} }
// Añadir futuros módulos aquí, con su función de montaje y ruta.
const modules=[{id:'descarga',label:'01 · Descarga en sacos',mount:mountDownload},{id:'fresco',label:'02 · Descarga Fresco (Dinos)',mount:mountFresco},{id:'calculos',label:'03 · Precintos y sal',mount:mountCalculations},{id:'historial',label:'◷ Registros diarios',mount:mountHistory}];
$('#navigation').innerHTML=modules.map(m=>`<a href="#${m.id}" data-route="${m.id}">${m.label}</a>`).join('');
function navigate(){const route=location.hash.slice(1)||'descarga',m=modules.find(m=>m.id===route)||modules[0];document.querySelectorAll('[data-route]').forEach(a=>{a.classList.toggle('active',a.dataset.route===m.id);if(a.dataset.route===m.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});$('#breadcrumb').textContent=m.id==='descarga'?'Descarga en sacos':m.id==='fresco'?'Descarga Fresco (Dinos)':m.id==='calculos'?'Precintos y sal':'Registros diarios';m.mount();}
window.addEventListener('hashchange',navigate);
// Texto imprimible permite envolver observaciones largas sin recortarlas como inputs.
window.addEventListener('beforeprint',()=>{
 document.querySelectorAll('td input[data-field]').forEach(input=>{
  let text=input.parentElement.querySelector('.print-value');
  if(!text){text=document.createElement('span');text.className='print-value';input.after(text);}
  text.textContent=input.value;
 });
});
function validHeader(el){
 if(el.dataset.header==='start'||el.id==='end')return /^\d*$/.test(el.value);
 if(el.type==='number')return el.value!==''&&el.validity.valid&&Number.isFinite(Number(el.value));
 return el.validity.valid;
}
function mountDownload(){
 $('#main').onclick=null;
 $('#main').innerHTML=view(s);
 document.querySelectorAll('[data-header]').forEach(el=>{el.value=el.dataset.header==='samplePlan'?(s.samplePlan??(Number(s.bag)===50?'50':'23.7')):s[el.dataset.header];el.addEventListener('input',()=>{if(!validHeader(el)){return;}const key=el.dataset.header;if(key==='unit'){s.reference=Number((s.reference*(el.value==='KG'?1000:1/1000)).toPrecision(15));$('[data-header="reference"]').value=s.reference;}s[key]=['reference','bag'].includes(key)?Number(el.value):el.value;if(key==='bag'&&[23.7,25,50].includes(s.bag)){s.samplePlan=s.bag===50?'50':'23.7';$('[data-header="samplePlan"]').value=s.samplePlan;}s.demo=false;save();update();});});
 document.querySelectorAll('[data-header]').forEach(el=>el.addEventListener('blur',()=>{if(!validHeader(el))el.value=s[el.dataset.header]??'';}));
 $('#end').addEventListener('input',e=>{if(!validHeader(e.target)){e.target.value=seals(s).end;return;}s.manualEnd=e.target.value===''?null:e.target.value;save();update();});
 $('#auto-end').onclick=()=>{s.manualEnd=null;save();update();};
 $('#sampling').onclick=()=>{$('#weigh-form').elements.note.value='Sacos para muestreo';};
 $('#weigh-form').onsubmit=e=>{e.preventDefault();const f=e.target, gross=Number(f.elements.gross.value),tare=Number(f.elements.tare.value),bags=Number(f.elements.bags.value);if(gross<tare){f.elements.gross.setCustomValidity('El peso bruto debe ser mayor o igual a la parihuela.');f.elements.gross.reportValidity();f.elements.gross.setCustomValidity('');return;}s.rows.push({id:crypto.randomUUID(),gross,tare,bags,others:Number(f.elements.others.value),note:f.elements.note.value.trim()});s.demo=false;f.elements.gross.value='';f.elements.note.value='';f.elements.others.value='0';save();drawRows();update();f.elements.gross.focus();};
 $('#rows').addEventListener('input',e=>{const el=e.target,key=el.dataset.field;if(!key)return;const row=s.rows.find(r=>r.id===el.closest('tr').dataset.id);if(!row)return;el.setCustomValidity('');const value=key==='note'?el.value:Number(el.value);if(key!=='note'&&(!el.validity.valid||el.value===''||!Number.isFinite(value)||(key==='gross'&&value<row.tare)||(key==='tare'&&value>row.gross))){el.setCustomValidity('Revisa el valor: el neto no puede ser negativo y los sacos deben ser enteros.');return;}row[key]=value;s.demo=false;el.closest('tr').querySelector('.row-net').textContent=format(round(row.gross-row.tare));save();update();});
 $('#rows').addEventListener('focusout',e=>{const el=e.target;if(!el.dataset.field||el.validity.valid)return;const row=s.rows.find(r=>r.id===el.closest('tr').dataset.id);el.setCustomValidity('');el.value=row[el.dataset.field];message('Valor no válido: se conserva el último dato válido de la fila.');});
 $('#rows').addEventListener('click',e=>{const button=e.target.closest('[data-delete]');if(!button)return;s.rows=s.rows.filter(r=>r.id!==button.dataset.delete);s.demo=false;save();drawRows();update();});
 $('#demo').onclick=()=>{if(hasData()&&!confirm('Se archivará el borrador actual y se cargará la hoja ISMAEL. ¿Continuar?'))return;if(hasData()&&!archive(false))return;s=demoState();save();mountDownload();message('Hoja ISMAEL cargada con sus ocho filas originales.');};
 $('#csv').onclick=()=>download('csv');$('#excel').onclick=()=>download('xls');$('#print').onclick=()=>window.print();$('#archive').onclick=()=>archive(true);
 $('#new').onclick=()=>{if(hasData()&&!archive(false))return;s=initialState();save();mountDownload();message('Registro anterior conservado. Nueva descarga lista con la fecha de hoy.');};
 drawRows();update();
}
function hasData(){return s.rows.length||s.supplier||s.reference||s.start;}
function drawRows(){$('#rows').innerHTML=rowsView(s);}
function update(){const t=totals(s),p=seals(s);$('#conversion').textContent=`${format(referenceKg(s))} KG · ${format(referenceKg(s)/1000)} TON`;$('#sample').textContent=sampleBags(s);$('#seal-count').textContent=format(p.count);$('#seal-basis').textContent=p.preliminary?'Estimado preliminar según referencia':'Según peso neto registrado';$('#end').value=p.end;$('#end-mode').textContent=s.manualEnd===null?'Cálculo automático (rango inclusivo)':`Edición manual · Automático: ${p.automatic||'—'}`;$('#net').textContent=format(t.net);$('#pallet-total').textContent=`${t.pallets} parihuelas`;$('#bag-total').textContent=format(t.bags);$('#others-total').textContent=format(round(s.rows.reduce((n,r)=>n+Number(r.others||0),0)));$('#net-total').textContent=`${format(t.net)} kg`;$('#row-count').textContent=`${t.pallets} registros`;$('#empty').hidden=!!t.pallets;$('#demo-note').hidden=!s.demo;const samples=s.rows.filter(r=>/muestreo/i.test(r.note));$('#sample-subtotal').textContent=`Muestreo registrado: ${format(samples.reduce((a,r)=>a+r.bags,0))} sacos · ${format(round(samples.reduce((a,r)=>a+r.gross-r.tare,0)))} kg netos (incluidos en los totales).`;}
function archive(notify){if(!hasData()){if(notify)message('Ingresa datos antes de guardar una descarga.');return false;}return archiveData(s,'sacos',notify);}
// Protege el texto de usuario contra fórmulas al abrirlo en hojas de cálculo.
function safeCell(value){return typeof value==='string'&&/^[\s]*[=+\-@]/.test(value)?"'"+value:value;}
export function csvText(rows){return '\uFEFF'+rows.map(row=>row.map(value=>'"'+String(safeCell(value)).replaceAll('"','""')+'"').join(';')).join('\r\n');}
function download(kind,data=s,rows=exportRows(data),type='sacos'){const stamp=new Date().toISOString(),filename=`descarga-${type}-${data.date}-${(data.supplier||'sin-proveedor').replace(/[^\p{L}\p{N}_-]/gu,'_')}.${kind}`;let content,mime;if(kind==='csv'){content=csvText(rows);mime='text/csv;charset=utf-8';}else{content='\uFEFF<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>'+rows.map(r=>'<tr>'+r.map(v=>`<td style="mso-number-format:'\\@'">${escape(safeCell(v))}</td>`).join('')+'</tr>').join('')+'</table></body></html>';mime='application/vnd.ms-excel;charset=utf-8';}const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);db.exports.unshift({filename,at:stamp,type});save();message(kind==='xls'?'Archivo Excel compatible generado (tabla HTML .xls; Excel puede solicitar confirmar el formato).':'CSV generado con separador punto y coma (;).');}
const typeLabels={sacos:'Descarga en sacos',fresco:'Descarga Fresco',calculo:'Precintos y sal'};
function recordType(r){return r.type||'sacos';}
function recordSummary(r){
 if(r.type==='calculo'){const c=calc.result(r.data);return `${format(r.data.weight)} kg · ${c.count} precintos · ${format(c.saltKg)} kg de sal`;}
 const t=r.type==='fresco'?fresco.totals(r.data):totals(r.data);
 return r.type==='fresco'?`${t.dinos} dinos · ${t.trays} bandejas · ${format(t.net)} kg`:`${t.pallets} parihuelas · ${t.bags} sacos recibidos · ${format(t.net)} kg`;
}
function mountHistory(){
 $('#main').onclick=null;
 $('#main').innerHTML=`<div class="page-heading"><div><p class="eyebrow">ARCHIVO POR FECHA Y PROVEEDOR</p><h1>Registros diarios</h1><p>Guardar y empezar otro conserva una copia del registro anterior. Abrir una copia no modifica el original.</p></div></div>
 <section class="panel no-print"><div class="fields"><label>Fecha del registro<input id="record-date" type="date"></label><label>Buscar proveedor<input id="record-supplier" type="search" placeholder="Todos los proveedores"></label><label>Sección<select id="record-type"><option value="">Todas las secciones</option>${Object.entries(typeLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><div class="actions history-actions"><button id="recover-local" class="secondary">Buscar registros anteriores en este navegador</button><button id="clear-filters" class="secondary">Ver todos</button><button id="backup" class="primary">Descargar respaldo de registros</button><label class="button-link secondary">Restaurar registros de respaldo<input id="restore" type="file" accept=".json,application/json" hidden></label></div><p class="footnote">Los registros permanecen en este navegador al cerrar y volver otro día. Descarga un respaldo para conservarlos también fuera del dispositivo.</p></section>
 <section class="panel"><h2>Registros en curso (guardado automático)</h2><div id="draft-list"></div></section><section class="panel"><div class="section-title"><h2>Registros guardados</h2><span id="record-count" class="tag"></span></div><div id="record-list"></div></section>
 <section class="panel"><h2>Historial de exportaciones</h2>${db.exports.length?db.exports.map(x=>`<p>${escape(x.filename)}<br><small>${escape(new Date(x.at).toLocaleString('es-PE'))}</small></p>`).join(''):'<p class="empty">Aún no hay exportaciones.</p>'}</section>`;
 function draw(){
  const date=$('#record-date').value,supplier=$('#record-supplier').value.toLocaleLowerCase(),type=$('#record-type').value,typeFilter=type;
  const drafts=[['sacos',s,'descarga'],['fresco',db.frescoDraft,'fresco'],['calculo',db.calcDraft,'calculos']].filter(([type,data])=>containsData(data,type)&&(!date||data.date===date)&&(!supplier||(data.supplier||'').toLocaleLowerCase().includes(supplier))&&(!typeFilter||type===typeFilter));
  $('#draft-list').innerHTML=drafts.length?drafts.map(([type,data,route])=>`<article class="history-card"><div><strong>${escape(data.supplier||'Sin proveedor')}</strong><p>${escape(data.date)} · ${typeLabels[type]} · En curso<br>${recordSummary({type,data})}</p></div><a class="button-link secondary" href="#${route}">Continuar y editar</a></article>`).join(''):'<p class="empty">No hay registros en curso con estos filtros.</p>';
  const records=db.records.filter(r=>(!date||r.data.date===date)&&(!supplier||(r.data.supplier||'').toLocaleLowerCase().includes(supplier))&&(!type||recordType(r)===type)).sort((a,b)=>b.data.date.localeCompare(a.data.date)||b.savedAt.localeCompare(a.savedAt));
  $('#record-count').textContent=`${records.length} registros`;
  $('#record-list').innerHTML=records.length?records.map(r=>`<article class="history-card"><div><strong>${escape(r.data.supplier||'Sin proveedor')}</strong><p>${escape(r.data.date)} · ${typeLabels[recordType(r)]}<br>${recordSummary(r)}</p><small>Guardado: ${escape(new Date(r.savedAt).toLocaleString('es-PE'))}</small></div><div><button class="secondary" data-open="${escape(r.id)}">Abrir copia</button><button class="secondary" data-export="${escape(r.id)}">CSV</button><button class="delete" data-remove="${escape(r.id)}">Eliminar</button></div></article>`).join(''):'<p class="empty">No hay registros con estos filtros. Guarda un registro desde su sección para verlo aquí.</p>';
 }
 for(const id of ['record-date','record-supplier','record-type'])$('#'+id).oninput=draw;
 $('#clear-filters').onclick=()=>{for(const id of ['record-date','record-supplier','record-type'])$('#'+id).value='';draw();};
 $('#recover-local').onclick=()=>{const previous=db.records.slice();let count=0;for(const r of recoveryCandidates()){if(db.records.some(x=>recordType(x)===recordType(r)&&JSON.stringify(x.data)===JSON.stringify(r.data)))continue;db.records.push({...r,id:crypto.randomUUID()});count++;}if(!save()){db.records=previous;return;}draw();message(count?`${count} registros locales recuperados. Se conservaron los existentes.`:'No se encontraron más registros en este navegador. Revisa el navegador o dispositivo donde los ingresaste, o restaura un respaldo.');};
 $('#backup').onclick=()=>fileDownload(JSON.stringify({format:'planta-registros',version:1,createdAt:new Date().toISOString(),records:db.records,draft:s,frescoDraft:db.frescoDraft,calcDraft:db.calcDraft},null,2),'application/json',`registros-planta-${initialState().date}.json`);
 $('#restore').onchange=async e=>{
  try{
   const file=e.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error('El respaldo supera 20 MB.');
   const data=JSON.parse(await file.text());if(data.format!=='planta-registros'||!Array.isArray(data.records)||!data.records.every(validRecord))throw Error('El archivo no es un respaldo válido de registros.');
   const previous=db.records.slice();let count=0;
   const candidates=data.records.slice();for(const [type,draft] of [['sacos',data.draft],['fresco',data.frescoDraft],['calculo',data.calcDraft]]){if(containsData(draft,type)){const r={id:crypto.randomUUID(),type,savedAt:new Date().toISOString(),data:draft};if(!validRecord(r))throw Error('El respaldo contiene un borrador no válido.');candidates.push(r);}}
   for(const r of candidates){if(db.records.some(x=>recordType(x)===recordType(r)&&JSON.stringify(x.data)===JSON.stringify(r.data)))continue;db.records.push({...r,id:crypto.randomUUID()});count++;}
   if(!save()){db.records=previous;return;}draw();message(`${count} registros restaurados. Los registros existentes se conservaron.`);
  }catch(error){message(error instanceof SyntaxError?'No se puede leer el archivo JSON.':error.message);}finally{e.target.value='';}
 };
 $('#record-list').onclick=e=>{
  const button=e.target.closest('button');if(!button)return;
  const id=button.dataset.open||button.dataset.remove||button.dataset.export,r=db.records.find(x=>x.id===id);if(!r)return;
  if(button.dataset.open){
   if(r.type==='calculo'){if((db.calcDraft.weight||db.calcDraft.supplier)&&!archiveData(db.calcDraft,'calculo',false))return;db.calcDraft=structuredClone(r.data);save();location.hash='calculos';}
   else if(r.type==='fresco'){if((db.frescoDraft.rows.length||db.frescoDraft.supplier||db.frescoDraft.reference)&&!archiveData(db.frescoDraft,'fresco',false))return;db.frescoDraft=structuredClone(r.data);save();location.hash='fresco';}
   else{if(hasData()&&!archive(false))return;s=structuredClone(r.data);s.rows.forEach(row=>row.others??=0);save();location.hash='descarga';}
  }
  if(button.dataset.export){const rows=r.type==='calculo'?calc.exportRows(r.data):r.type==='fresco'?fresco.exportRows(r.data):exportRows(r.data);download('csv',r.data,rows,recordType(r));}
  if(button.dataset.remove&&confirm('¿Eliminar este registro guardado? Los demás registros se conservarán.')){const previous=db.records;db.records=db.records.filter(x=>x.id!==id);if(!save())db.records=previous;draw();}
 };
 draw();
}
function validRecord(r){
 const d=r?.data,positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 if(!d||typeof r.id!=='string'||typeof r.savedAt!=='string'||!Number.isFinite(Date.parse(r.savedAt))||typeof d.supplier!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!(Number.isFinite(Number(d.bag))&&Number(d.bag)>0)||!['sacos','fresco','calculo'].includes(recordType(r)))return false;
 if(r.type==='calculo')return positive(d.weight)&&positive(d.saltBag)&&d.saltBag>0&&typeof d.start==='string'&&/^\d*$/.test(d.start)&&(d.manualEnd===null||typeof d.manualEnd==='string'&&/^\d*$/.test(d.manualEnd));
 return Array.isArray(d.rows)&&d.rows.every(row=>typeof row.id==='string'&&/^[A-Za-z0-9_-]+$/.test(row.id)&&positive(row.gross)&&positive(row.tare)&&row.gross>=row.tare&&typeof row.note==='string'&&(r.type==='fresco'?positive(row.trays)&&Number.isInteger(row.trays)&&['line','pending'].includes(row.status):positive(row.bags)&&Number.isInteger(row.bags)));
}
function fileDownload(content,mime,filename){const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function archiveData(data,type,notify=true){
 const identical=db.records.some(r=>recordType(r)===type&&JSON.stringify(r.data)===JSON.stringify(data));
 if(identical){if(notify)message('Este registro ya está guardado. Puedes empezar otro sin perderlo.');return save();}
 const record={id:crypto.randomUUID(),type,savedAt:new Date().toISOString(),data:structuredClone(data)};
 db.records.unshift(record);
 if(!save()){db.records=db.records.filter(r=>r.id!==record.id);return false;}
 if(notify)message(`Registro del ${data.date} guardado. Puedes consultarlo en Registros diarios.`);
 return true;
}
function mountFresco(){
 fresco.mount({state:db.frescoDraft,onSave:data=>{db.frescoDraft=data;save();},onArchive:archiveData,onDownload:download,onNew:()=>{db.frescoDraft=fresco.initialState();save();mountFresco();},message});
}
function mountCalculations(){
 const sources=[{label:'Descarga en sacos actual',data:s,net:totals(s).net},{label:'Descarga Fresco actual',data:db.frescoDraft,net:fresco.totals(db.frescoDraft).net},...db.records.filter(r=>r.type!=='calculo').map(r=>({label:`${r.data.date} · ${r.data.supplier||'Sin proveedor'} · ${typeLabels[recordType(r)]}`,data:r.data,net:r.type==='fresco'?fresco.totals(r.data).net:totals(r.data).net}))];
 calc.mount({state:db.calcDraft,sources,onSave:data=>{db.calcDraft=data;save();},onArchive:archiveData,onDownload:download,onNew:()=>{db.calcDraft=calc.initialState();save();mountCalculations();},message});
}
navigate();
