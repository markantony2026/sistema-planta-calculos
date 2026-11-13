export const number = value => Number(value) || 0;
export const round = value => Math.round((value + Number.EPSILON) * 1000) / 1000;
export const format = value => new Intl.NumberFormat('es-CO', {maximumFractionDigits:3}).format(value);
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initialState() {
 const d = new Date();
 return {supplier:'',date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,reference:0,unit:'TON',bag:23.7,start:'',manualEnd:null,rows:[],demo:false};
}
export const referenceKg = s => round(number(s.reference) * (s.unit === 'TON' ? 1000 : 1));
export function sampleBags(s) {
 const ton = referenceKg(s)/1000;
 const limits = number(s.bag) === 23.7 ? [[2,2],[5,4],[10,8],[15,12],[Infinity,16]] : [[3,2],[5,4],[10,6],[20,8],[Infinity,10]];
 return limits.find(([limit]) => ton <= limit)[1];
}
export function totals(s) {
 return {pallets:s.rows.length,bags:s.rows.reduce((n,r)=>n+number(r.bags),0),net:round(s.rows.reduce((n,r)=>n+number(r.gross)-number(r.tare),0))};
}
export function seals(s) {
 const t = totals(s), preliminary = !s.rows.length;
 const count = Math.ceil(round((preliminary ? referenceKg(s) : t.net) / number(s.bag) * 1e9)/1e9);
 const automatic = /^\d+$/.test(s.start) && count > 0 ? (BigInt(s.start)+BigInt(count)-1n).toString().padStart(s.start.length,'0') : '';
 return {count,preliminary,automatic,end:s.manualEnd ?? automatic};
}
export function demoState() {
 return {...initialState(),supplier:'ISMAEL',date:'2026-11-09',reference:7,unit:'TON',bag:23.7,start:'017121',manualEnd:'017402',demo:true,
 rows:[785.5,764,780,771,776,785.5,615.5,154.5].map((net,i)=>({id:crypto.randomUUID(),gross:net+20,tare:20,bags:[40,40,40,40,40,40,31,8][i],note:i===7?'Sacos para muestreo':''}))};
}
const input = (key,label,type='text',extra='') => `<label>${label}<input data-header="${key}" type="${type}" ${extra}></label>`;
export function view(s) {
 return `<div class="page-heading"><div><p class="eyebrow">SECCIÓN 01 · SALADO</p><h1>Descarga en sacos</h1><p>Registra el pesaje y controla cada precinto.</p></div><span class="tag">● Operación local</span></div>
 <section class="panel"><div class="section-title"><h2><span>01</span> Datos de la descarga</h2><button id="demo" class="secondary">Cargar datos de prueba</button></div>
 <p id="demo-note" class="warning" ${s.demo?'':'hidden'}>Hoja ISMAEL: 8 parihuelas, 279 sacos y 5432 kg. Incluye la fila de 8 sacos para muestreo.</p>
 <div class="fields">${input('supplier','Proveedor','text','placeholder="Ej. ISMAEL"')}${input('date','Fecha','date','required')}
 <label>Cantidad referencial<div class="joined"><input data-header="reference" type="number" min="0" step="any"><select data-header="unit" aria-label="Unidad referencial"><option>TON</option><option>KG</option></select></div><small id="conversion"></small></label>
 <label>Tipo de saco<select data-header="bag"><option value="23.7">23.7 kg</option><option value="50">50 kg</option></select></label>
 ${input('start','Nro inicio de precinto','text','inputmode="numeric" pattern="[0-9]*" placeholder="017121"')}
 <label>Nro final de precinto<input id="end" type="text" inputmode="numeric" pattern="[0-9]*"><small id="end-mode"></small><button id="auto-end" class="text-button">Restablecer automático</button></label></div></section>
 <div class="metrics"><article class="metric accent"><span>SACOS A MUESTREAR</span><strong id="sample"></strong><small>Según tonelaje referencial y tipo de saco</small></article><article class="metric"><span>PRECINTOS NECESARIOS</span><strong id="seal-count"></strong><small id="seal-basis"></small></article><article class="metric"><span>PESO NETO TOTAL</span><strong><span id="net"></span> <em>kg</em></strong><small>Producto sin peso de parihuelas</small></article></div>
 <section class="panel"><div class="section-title"><h2><span>02</span> Pesaje por parihuela</h2><span id="row-count" class="tag"></span></div>
 <form id="weigh-form" class="quick-form"><label>Peso producto + parihuela (kg)<input name="gross" type="number" min="0" step="any" required placeholder="805.5" inputmode="decimal"></label><label>Parihuela (kg)<input name="tare" type="number" min="0" step="any" value="20" required></label><label>Sacos<input name="bags" type="number" min="0" step="1" value="40" required></label><label>Otros / Observación<input name="note" placeholder="Observación opcional"><button type="button" id="sampling" class="text-button">+ Sacos para muestreo</button></label><button class="primary" type="submit">＋ Agregar pesada</button></form>
 <div class="table-wrap"><table><thead><tr><th>N°</th><th>Producto + parihuela (kg)</th><th>Parihuela (kg)</th><th>Sacos</th><th>Diferencia / Neto (kg)</th><th>Otros / Observación</th><th class="no-print">Acción</th></tr></thead><tbody id="rows"></tbody><tfoot><tr><th colspan="2">TOTALES</th><td id="pallet-total"></td><td id="bag-total"></td><td id="net-total"></td><td colspan="2"></td></tr></tfoot></table></div><p id="empty" class="empty">Aún no hay pesadas. Agrega la primera parihuela para comenzar.</p></section>
 <p id="sample-subtotal" class="footnote"></p><div class="actions"><button id="csv" class="primary">↓ Exportar CSV (;)</button><button id="excel" class="secondary">↓ Exportar Excel (.xls)</button><button id="print" class="secondary">Imprimir / Guardar PDF</button><button id="archive" class="secondary">Guardar en historial</button><button id="new" class="text-button">Nueva descarga</button></div><p class="footnote">Guardado automático en este navegador. Exporta una copia para conservar un respaldo.</p>`;
}
export function rowsView(s) {
 return s.rows.map((r,i)=>`<tr data-id="${r.id}"><td data-label="N°">${i+1}</td>${['gross','tare','bags'].map((key,j)=>`<td data-label="${['Producto + parihuela (kg)','Parihuela (kg)','Sacos'][j]}"><input aria-label="${['Peso bruto','Parihuela','Sacos'][j]} fila ${i+1}" data-field="${key}" type="number" min="0" step="${key==='bags'?'1':'any'}" value="${r[key]}" required></td>`).join('')}<td data-label="Neto (kg)" class="row-net">${format(round(r.gross-r.tare))}</td><td data-label="Observación"><input aria-label="Observación fila ${i+1}" data-field="note" value="${escape(r.note)}"></td><td class="no-print"><button data-delete="${r.id}" class="delete" aria-label="Eliminar fila ${i+1}">Eliminar</button></td></tr>`).join('');
}
export function exportRows(s) {
 const t=totals(s),p=seals(s);
 return [['Sistema de Control y Cálculos de Planta'],['Descarga en Sacos (Salado)'],['Proveedor',s.supplier],['Fecha',s.date],['Cantidad referencial',s.reference,s.unit],['Referencia kg',referenceKg(s)],['Tipo de saco kg',s.bag],['Precinto inicio',s.start],['Precinto final',p.end],['Final automático',p.automatic],['Modo final',s.manualEnd===null?'Automático':'Manual'],['Precintos necesarios',p.count,p.preliminary?'Preliminar':'Real'],['Sacos a muestrear',sampleBags(s)],...(s.demo?[['AVISO','Datos de prueba reproducidos de la hoja ISMAEL']]:[]),[],['N°','Producto + parihuela kg','Parihuela kg','Sacos','Neto kg','Otros / Observación'],...s.rows.map((r,i)=>[i+1,r.gross,r.tare,r.bags,round(r.gross-r.tare),r.note]),['TOTALES',`${t.pallets} parihuelas`,'',t.bags,t.net,'']];
}
