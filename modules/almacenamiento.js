import {initialState as sacks} from './descarga-sacos.js?v=5';
import {initialState as fresh} from './descarga-fresco.js?v=5';
import {initialState as calculation} from './calculos-planta.js?v=5';
export const KEY='planta.sacos.v1';
const LAST='planta.last-good.v1';
const known=key=>/^(planta[.\-_]|descarga[.\-_]|sistema[.\-_]planta)/i.test(key);
export function hasData(data,type){
 return !!data&&(type==='calculo'?!!(data.weight||data.supplier||data.start):!!(data.rows?.length||data.supplier||data.reference||data.receivedBags||data.start));
}
function normalizeDraft(data,type){
 const result={...(type==='fresco'?fresh():type==='calculo'?calculation():sacks()),...data};
 result.rows=(Array.isArray(data?.rows)?data.rows:[]).map(row=>({...row,id:row.id||crypto.randomUUID(),others:row.others??0,note:row.note??''}));
 return result;
}
export function normalizeDatabase(data){
 if(!data||typeof data!=='object'||!(Array.isArray(data.records)||Array.isArray(data.draft?.rows)||Array.isArray(data.frescoDraft?.rows)||data.calcDraft))return null;
 return {...data,draft:normalizeDraft(data.draft,'sacos'),frescoDraft:normalizeDraft(data.frescoDraft,'fresco'),calcDraft:data.calcDraft?normalizeDraft(data.calcDraft,'calculo'):undefined,records:(Array.isArray(data.records)?data.records:[]).filter(r=>r?.data).map(r=>({...r,type:r.type||'sacos',id:r.id||crypto.randomUUID(),savedAt:r.savedAt||new Date().toISOString(),data:normalizeDraft(r.data,r.type||'sacos')})),exports:Array.isArray(data.exports)?data.exports:[]};
}
export function loadDatabase(){
 for(const key of [KEY,LAST]){try{const db=normalizeDatabase(JSON.parse(localStorage.getItem(key)));if(db)return {db,recovered:key!==KEY};}catch{}}
 return {db:normalizeDatabase({draft:sacks(),records:[],exports:[]}),recovered:false};
}
export function writeDatabase(db){
 const serialized=JSON.stringify(db),previous=localStorage.getItem(KEY);
 // Conservar el estado anterior antes del primer cambio del día, sin reemplazarlo.
 if(previous&&previous!==serialized){try{const key=`planta.recovery.${sacks().date}`;if(!localStorage.getItem(key))localStorage.setItem(key,previous);}catch{}}
 localStorage.setItem(KEY,serialized);
 try{localStorage.setItem(LAST,serialized);}catch{}
}
export function recoveryCandidates(){
 const candidates=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!known(key))continue;
  try{
   const raw=JSON.parse(localStorage.getItem(key)),db=normalizeDatabase(raw);if(!db)continue;
   candidates.push(...db.records);
   for(const [type,data] of [['sacos',db.draft],['fresco',db.frescoDraft],['calculo',db.calcDraft]])if(hasData(data,type))candidates.push({id:crypto.randomUUID(),type,savedAt:new Date().toISOString(),data});
  }catch{}
 }
 return candidates;
}
