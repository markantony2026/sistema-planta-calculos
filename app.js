import {initialState,demoState,view,rowsView,totals,seals,sampleBags,referenceKg,format,escape,exportRows,round} from './modules/descarga-sacos.js';
const KEY='planta.sacos.v1';
let db={draft:initialState(),records:[],exports:[]};
try { const saved=JSON.parse(localStorage.getItem(KEY)); if(saved && Array.isArray(saved.draft?.rows) && Array.isArray(saved.records) && Array.isArray(saved.exports)) db=saved; } catch { message('No se pudo recuperar el guardado anterior.'); }
let s=db.draft;
const $=selector=>document.querySelector(selector);
function message(text){ $('#notice').textContent=text; }
function save(){ db.draft=s; try {localStorage.setItem(KEY,JSON.stringify(db));$('#save-status').textContent='✓ Guardado en este dispositivo';}catch{$('#save-status').textContent='No se pudo guardar: exporta un respaldo';} }
// Añadir futuros módulos aquí, con su función de montaje y ruta.
const modules=[{id:'descarga',label:'▤ Descarga en sacos',mount:mountDownload},{id:'historial',label:'◷ Historial',mount:mountHistory}];
$('#navigation').innerHTML=modules.map(m=>`<a href="#${m.id}" data-route="${m.id}">${m.label}</a>`).join('');
function navigate(){const route=location.hash.slice(1)||'descarga',m=modules.find(m=>m.id===route)||modules[0];document.querySelectorAll('[data-route]').forEach(a=>{a.classList.toggle('active',a.dataset.route===m.id);if(a.dataset.route===m.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});$('#breadcrumb').textContent=m.id==='descarga'?'Descarga en sacos':'Historial';m.mount();}
window.addEventListener('hashchange',navigate);
function validHeader(el){
 if(el.dataset.header==='start'||el.id==='end')return /^\d*$/.test(el.value);
 if(el.type==='number')return el.value!==''&&el.validity.valid&&Number.isFinite(Number(el.value));
 return el.validity.valid;
}
function mountDownload(){
 $('#main').onclick=null;
 $('#main').innerHTML=view(s);
 document.querySelectorAll('[data-header]').forEach(el=>{el.value=s[el.dataset.header];el.addEventListener('input',()=>{if(!validHeader(el)){el.setCustomValidity('Ingresa un valor válido, sin valores negativos.');el.reportValidity();el.setCustomValidity('');el.value=s[el.dataset.header];return;}const key=el.dataset.header;if(key==='unit'){s.reference=round(s.reference*(el.value==='KG'?1000:1/1000));$('[data-header="reference"]').value=s.reference;}s[key]=['reference','bag'].includes(key)?Number(el.value):el.value;s.demo=false;save();update();});});
 $('#end').addEventListener('input',e=>{if(!validHeader(e.target)){e.target.value=seals(s).end;return;}s.manualEnd=e.target.value===''?null:e.target.value;save();update();});
 $('#auto-end').onclick=()=>{s.manualEnd=null;save();update();};
 $('#sampling').onclick=()=>{$('#weigh-form').elements.note.value='Sacos para muestreo';};
 $('#weigh-form').onsubmit=e=>{e.preventDefault();const f=e.target, gross=Number(f.elements.gross.value),tare=Number(f.elements.tare.value),bags=Number(f.elements.bags.value);if(gross<tare){f.elements.gross.setCustomValidity('El peso bruto debe ser mayor o igual a la parihuela.');f.elements.gross.reportValidity();f.elements.gross.setCustomValidity('');return;}s.rows.push({id:crypto.randomUUID(),gross,tare,bags,note:f.elements.note.value.trim()});s.demo=false;f.elements.gross.value='';f.elements.note.value='';save();drawRows();update();f.elements.gross.focus();};
 $('#rows').addEventListener('input',e=>{const el=e.target,key=el.dataset.field;if(!key)return;const row=s.rows.find(r=>r.id===el.closest('tr').dataset.id);if(!row)return;const value=key==='note'?el.value:Number(el.value);if(key!=='note'&&(!el.validity.valid||el.value===''||!Number.isFinite(value)||(key==='gross'&&value<row.tare)||(key==='tare'&&value>row.gross))){el.setCustomValidity('Revisa el valor: el neto no puede ser negativo y los sacos deben ser enteros.');el.reportValidity();el.setCustomValidity('');el.value=row[key];return;}row[key]=value;s.demo=false;el.closest('tr').querySelector('.row-net').textContent=format(round(row.gross-row.tare));save();update();});
 $('#rows').addEventListener('click',e=>{const button=e.target.closest('[data-delete]');if(!button)return;s.rows=s.rows.filter(r=>r.id!==button.dataset.delete);s.demo=false;save();drawRows();update();});
 $('#demo').onclick=()=>{if(hasData()&&!confirm('Se archivará el borrador actual y se cargará la hoja ISMAEL. ¿Continuar?'))return;if(hasData())archive(false);s=demoState();save();mountDownload();message('Hoja ISMAEL cargada con sus ocho filas originales.');};
 $('#csv').onclick=()=>download('csv');$('#excel').onclick=()=>download('xls');$('#print').onclick=()=>window.print();$('#archive').onclick=()=>archive(true);
 $('#new').onclick=()=>{if(hasData()&&!confirm('Se archivará la descarga actual y se abrirá una nueva. ¿Continuar?'))return;if(hasData())archive(false);s=initialState();save();mountDownload();};
 drawRows();update();
}
function hasData(){return s.rows.length||s.supplier||s.reference||s.start;}
function drawRows(){$('#rows').innerHTML=rowsView(s);}
function update(){const t=totals(s),p=seals(s);$('#conversion').textContent=`${format(referenceKg(s))} KG · ${format(referenceKg(s)/1000)} TON`;$('#sample').textContent=sampleBags(s);$('#seal-count').textContent=format(p.count);$('#seal-basis').textContent=p.preliminary?'Estimado preliminar según referencia':'Según peso neto registrado';$('#end').value=p.end;$('#end-mode').textContent=s.manualEnd===null?'Cálculo automático (rango inclusivo)':`Edición manual · Automático: ${p.automatic||'—'}`;$('#net').textContent=format(t.net);$('#pallet-total').textContent=`${t.pallets} parihuelas`;$('#bag-total').textContent=format(t.bags);$('#net-total').textContent=`${format(t.net)} kg`;$('#row-count').textContent=`${t.pallets} registros`;$('#empty').hidden=!!t.pallets;$('#demo-note').hidden=!s.demo;const samples=s.rows.filter(r=>/muestreo/i.test(r.note));$('#sample-subtotal').textContent=`Muestreo registrado: ${format(samples.reduce((a,r)=>a+r.bags,0))} sacos · ${format(round(samples.reduce((a,r)=>a+r.gross-r.tare,0)))} kg netos (incluidos en los totales).`;}
function archive(notify){if(!hasData()){if(notify)message('Ingresa datos antes de guardar una descarga.');return;}db.records.unshift({id:crypto.randomUUID(),savedAt:new Date().toISOString(),data:structuredClone(s)});save();if(notify)message('Descarga guardada en el historial.');}
// Protege el texto de usuario contra fórmulas al abrirlo en hojas de cálculo.
function safeCell(value){return typeof value==='string'&&/^[\s]*[=+\-@]/.test(value)?"'"+value:value;}
export function csvText(rows){return '\uFEFF'+rows.map(row=>row.map(value=>'"'+String(safeCell(value)).replaceAll('"','""')+'"').join(';')).join('\r\n');}
function download(kind){const rows=exportRows(s),stamp=new Date().toISOString(),filename=`descarga-${s.date}-${(s.supplier||'sin-proveedor').replace(/[^\p{L}\p{N}_-]/gu,'_')}.${kind}`;let content,mime;if(kind==='csv'){content=csvText(rows);mime='text/csv;charset=utf-8';}else{content='\uFEFF<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>'+rows.map(r=>'<tr>'+r.map(v=>`<td style="mso-number-format:'\\@'">${escape(safeCell(v))}</td>`).join('')+'</tr>').join('')+'</table></body></html>';mime='application/vnd.ms-excel;charset=utf-8';}const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);db.exports.unshift({filename,at:stamp});save();message(kind==='xls'?'Archivo Excel compatible generado (tabla HTML .xls; Excel puede solicitar confirmar el formato).':'CSV generado con separador punto y coma (;).');}
function mountHistory(){
 $('#main').innerHTML=`<div class="page-heading"><div><p class="eyebrow">ARCHIVO LOCAL</p><h1>Historial</h1><p>Descargas guardadas y archivos exportados en este navegador.</p></div></div><section class="panel"><h2>Descargas guardadas</h2>${db.records.length?db.records.map(r=>{const t=totals(r.data);return `<article class="history-card"><div><strong>${escape(r.data.supplier||'Sin proveedor')}</strong><p>${escape(r.data.date)} · ${t.pallets} parihuelas · ${format(t.bags)} sacos · ${format(t.net)} kg</p></div><div><button class="secondary" data-open="${r.id}">Abrir copia</button><button class="delete" data-remove="${r.id}">Eliminar</button></div></article>`;}).join(''):'<p class="empty">No hay descargas guardadas.</p>'}</section><section class="panel"><h2>Historial de exportaciones</h2>${db.exports.length?db.exports.map(x=>`<p>${escape(x.filename)}<br><small>${escape(new Date(x.at).toLocaleString('es-CO'))}</small></p>`).join(''):'<p class="empty">Aún no hay exportaciones.</p>'}</section>`;
 $('#main').onclick=e=>{const id=e.target.dataset.open,remove=e.target.dataset.remove;if(id){if(hasData())archive(false);s=structuredClone(db.records.find(r=>r.id===id).data);save();location.hash='descarga';}if(remove&&confirm('¿Eliminar esta descarga del historial?')){db.records=db.records.filter(r=>r.id!==remove);save();mountHistory();}};
}
navigate();
