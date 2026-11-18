import {initialState as base,format,escape} from './descarga-sacos.js?v=5';
import {calculations} from './descarga-fresco.js?v=5';
const exact=n=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:12}).format(n);
export function initialState(previous={}) {
  return {...base(),weight:previous.manualWeight??0,bag:previous.bag??23.7,saltBag:previous.saltBag??25,start:previous.start??'',manualEnd:previous.manualEnd??null,sourceLabel:'Peso ingresado manualmente',mode:'manual',sourceId:null,note:''};
}
export function result(s){return calculations({...s,manualWeight:s.weight});}
export function exportRows(s){
 const c=result(s);
 return [['Sistema de Control y Cálculos de Planta'],['Cálculos de planta'],['Modo de cálculo',s.mode==='linked'?'Vinculado a descarga':s.mode==='snapshot'?'Registro guardado':'Manual'],['Proveedor',s.supplier],['Fecha',s.date],['Origen del peso',s.sourceLabel],['Peso total producto kg',s.weight],['Saco de producto kg',s.bag],['Precintos necesarios',c.count],['Precinto inicio',s.start],['Precinto final',c.end],['Final automático',c.automatic],['Modo final',s.manualEnd===null?'Automático':'Manual'],['Sal necesaria kg (peso × 0.012)',c.saltKg],['Saco de sal kg',s.saltBag],['Sacos de sal equivalentes',c.saltBags],['Sacos completos de sal para disponer',Math.ceil(c.saltBags)],['Observaciones',s.note]];
}
// Añadir aquí nuevos paneles cuando se definan sus fórmulas.
export const calculationPanels=[{id:'precintos-sal',render:()=>` <section class="panel"><div class="section-title"><h2>Precintos y sal</h2><span class="tag">Cálculo disponible</span></div><div class="metrics calculation-results"><article class="metric"><span>PRECINTOS NECESARIOS</span><strong id="calc-seals"></strong><small id="calc-seal-formula"></small></article><article class="metric accent"><span>SAL NECESARIA</span><strong><span id="calc-salt"></span> <em>kg</em></strong><small>Peso total del producto × 0.012</small></article><article class="metric"><span>SACOS DE SAL EQUIVALENTES</span><strong id="calc-bags"></strong><small id="calc-bag-formula"></small><small id="calc-whole"></small></article></div>
 </section>`}];
export function mount({state:s,sources,onSave,onArchive,onDownload,onNew,message}){
 const $=q=>document.querySelector(q);
 $('#main').onclick=null;
 $('#main').innerHTML=`<div class="page-heading"><div><p class="eyebrow">SECCIÓN 03 · CÁLCULOS</p><h1>Cálculos de planta</h1><p>Usa una descarga de Fresco o Salado, o ingresa los datos manualmente. Los cálculos se actualizarán según el origen elegido.</p></div></div>
 <section class="panel"><div class="section-title"><h2>Datos del cálculo</h2></div><div class="fields">
 <label>Proveedor<input data-calc="supplier"></label><label>Fecha<input data-calc="date" type="date" required></label>
 <label>Modo de ingreso<select id="calc-mode"><option value="manual">Ingreso manual</option><option value="linked">Vinculado a una descarga</option>${s.mode==='snapshot'?'<option value="snapshot">Valores del cálculo guardado</option>':''}</select></label><label>Descarga vinculada<select id="calc-source"><option value="">Seleccionar descarga o registro…</option>${sources.map((r,i)=>`<option value="${escape(r.id)}">${escape(r.label)} · ${format(r.net)} kg</option>`).join('')}</select><small>En modo vinculado, el peso, proveedor, fecha y presentación se toman de la descarga. Cambia a manual para editarlos libremente.</small></label>
 <label>Peso total del producto (kg)<input data-calc="weight" type="number" min="0" step="any" inputmode="decimal" required><small id="calc-origin"></small></label>
 <label>Peso del saco de producto (kg)<input data-calc="bag" type="number" min="0.001" step="any" required><small>Según la presentación con la que trabaja el proveedor.</small></label>
 <label>Peso del saco de sal (kg)<input data-calc="saltBag" type="number" min="0.001" step="any" required><small>Puedes ingresar 25, 50 u otro peso de saco.</small></label>
 <label>Nro inicio de precinto<input data-calc="start" inputmode="numeric" pattern="[0-9]*" placeholder="017121"></label>
 <label>Nro final de precinto<input id="calc-end" inputmode="numeric" pattern="[0-9]*"><small id="calc-end-mode"></small><button id="calc-auto" class="text-button">Restablecer automático</button></label>
 <label>Observaciones<input data-calc="note"></label></div></section>
 ${calculationPanels.map(panel=>panel.render()).join('')}<p class="footnote">Esta sección está preparada para incorporar los siguientes cálculos que indiques.</p><p class="warning">Los sacos de sal son insumos calculados. La cantidad de sacos recibidos se anota en Descarga en sacos según lo enviado por el proveedor.</p>
 <div class="actions"><button id="calc-save" class="primary">Guardar cálculo del día</button><button id="calc-new" class="secondary">Guardar y empezar otro</button><button id="calc-csv" class="secondary">Exportar CSV (;)</button><button id="calc-excel" class="secondary">Exportar Excel</button><button id="calc-print" class="secondary">Imprimir / Guardar PDF</button></div>`;
 function update(){const linked=s.mode==='linked';$('#calc-mode').value=s.mode||'manual';$('#calc-source').value=s.sourceId||'';$('#calc-source').disabled=!linked;document.querySelectorAll('[data-calc]').forEach(el=>{el.readOnly=linked&&['weight','supplier','date','bag'].includes(el.dataset.calc);});const c=result(s);$('#calc-seals').textContent=format(c.count);$('#calc-seal-formula').textContent=`${format(s.weight)} kg ÷ ${s.bag} kg, redondeado hacia arriba`;$('#calc-salt').textContent=exact(c.saltKg);$('#calc-bags').textContent=exact(c.saltBags);$('#calc-bag-formula').textContent=`${exact(c.saltKg)} kg ÷ ${s.saltBag} kg`;$('#calc-whole').textContent=`Para disponer de sacos completos: ${format(Math.ceil(c.saltBags))}`;$('#calc-end').value=c.end;$('#calc-end-mode').textContent=s.manualEnd===null?'Automático · rango inclusivo':`Manual · Automático: ${c.automatic||'—'}`;$('#calc-origin').textContent=s.sourceLabel;}
 const persist=()=>{onSave(s);update();};
 function fill(){document.querySelectorAll('[data-calc]').forEach(el=>el.value=s[el.dataset.calc]??'');update();}
 document.querySelectorAll('[data-calc]').forEach(el=>el.oninput=()=>{const k=el.dataset.calc;el.setCustomValidity('');if(!el.validity.valid||(el.type==='number'&&(el.value===''||!Number.isFinite(Number(el.value)))))return;s[k]=['weight','bag','saltBag'].includes(k)?Number(el.value):el.value;if(['weight','supplier','date','bag'].includes(k)){s.mode='manual';s.sourceId=null;s.sourceLabel='Datos ingresados manualmente';}persist();});
 document.querySelectorAll('[data-calc]').forEach(el=>el.onblur=()=>{if(!el.validity.valid||el.value===''&&['weight','date'].includes(el.dataset.calc))el.value=s[el.dataset.calc];});
 function link(id){const r=sources.find(r=>r.id===id);if(!r){message('Selecciona una descarga para vincular el cálculo.');return false;}Object.assign(s,{mode:'linked',sourceId:r.id,weight:r.net,supplier:r.data.supplier,date:r.data.date,bag:r.data.bag,sourceLabel:r.label});return true;}
 $('#calc-source').onchange=e=>{if(link(e.target.value)){fill();persist();}};
 $('#calc-mode').onchange=e=>{if(e.target.value==='linked'){if(!link(s.sourceId||sources.find(r=>r.net>0)?.id||sources[0]?.id)){update();return;}}else{s.mode=e.target.value;if(s.mode==='manual')s.sourceLabel='Datos ingresados manualmente';}fill();persist();};
 $('#calc-end').oninput=e=>{if(!/^\d*$/.test(e.target.value)){e.target.value=result(s).end;return;}s.manualEnd=e.target.value||null;persist();};
 $('#calc-auto').onclick=()=>{s.manualEnd=null;persist();};
 $('#calc-save').onclick=()=>{if(!s.weight&&!s.supplier){message('Ingresa el peso o un proveedor para guardar el cálculo.');return;}onArchive(s,'calculo');};
 $('#calc-new').onclick=()=>{if((s.weight||s.supplier)&&!onArchive(s,'calculo',false))return;onNew();message('Cálculo anterior conservado. Nuevo cálculo listo.');};
 $('#calc-csv').onclick=()=>onDownload('csv',s,exportRows(s),'calculo');$('#calc-excel').onclick=()=>onDownload('xls',s,exportRows(s),'calculo');$('#calc-print').onclick=()=>window.print();fill();
}
