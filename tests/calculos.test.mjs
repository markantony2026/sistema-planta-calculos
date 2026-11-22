import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,result} from '../modules/calculos-planta.js?v=6';
import {allocate,demoState,shortLot} from '../modules/rumas.js?v=6';

test('precintos por sacos usa un precinto por saco; referencia usa sus propios kg',()=>{
 const s={...initialState(),weight:5432,reference:7,unit:'TON',bag:23.7,bagCount:279,start:'017121',sealMode:'bags'};
 const c=result(s);
 assert.equal(c.count,279);assert.equal(c.referenceCount,296);assert.equal(c.end,'017399');assert.equal(c.saltKg,65.184);
 assert.equal(result({...s,sealMode:'weight'}).count,230);
 assert.equal(result({...s,sealMode:'reference'}).count,296);
 assert.equal(result({...s,bag:25}).referenceCount,280);
 assert.equal(result({...s,reference:7000,unit:'KG'}).referenceCount,296);
 assert.equal(result({...s,manualEnd:'017500'}).end,'017500');
 assert.equal(result({...s,bagCount:0}).automatic,'');
});
test('rumas de la imagen: 2100 cajas, 17 completas y 60 en la última',()=>{
 const a=allocate(demoState().rows);
 assert.equal(a.total,2100);assert.equal(a.full,17);assert.equal(a.partial,60);assert.equal(a.missing,60);assert.equal(a.stacks.length,18);
 assert.equal(shortLot('3032609210008'),'303-0008');
 assert.equal(a.stacks[0].parts[0].remainingLot,33);
 assert.deepEqual(a.stacks[1].parts.map(p=>p.quantity),[33,55,32]);
 assert.deepEqual(a.stacks[1].parts.map(p=>p.position),['Abajo','Medio','Arriba']);
 assert.equal(a.stacks[1].parts.at(-1).remainingLot,356);
 assert.equal(a.stacks.at(-1).parts.at(-1).position,'Último');
});
test('conserva cajas, orden y saldos por lote al dividir cualquier sucesión',()=>{
 const cases=[[],[0],[1],[119],[120],[121],[240],[10,20,30],[119,1],[120,120]];
 let seed=7;
 for(let k=0;k<100;k++){const counts=[];for(let j=0;j<10;j++){seed=(seed*1664525+1013904223)>>>0;counts.push(seed%500);}cases.push(counts);}
 for(const counts of cases){
  const rows=counts.map((boxes,i)=>({id:String(i),lot:'0010000'+String(i).padStart(4,'0'),boxes})),a=allocate(rows);
  assert.equal(a.total,counts.reduce((x,y)=>x+y,0));
  const parts=a.stacks.flatMap(stack=>{assert.ok(stack.total<=120);assert.equal(stack.total,stack.parts.reduce((x,p)=>x+p.quantity,0));return stack.parts;});
  assert.deepEqual(parts.map(p=>Number(p.rowId)),parts.map(p=>Number(p.rowId)).toSorted((a,b)=>a-b));
  for(const row of rows){const assigned=parts.filter(p=>p.rowId===row.id);assert.equal(assigned.reduce((x,p)=>x+p.quantity,0),row.boxes);let used=0;for(const p of assigned){assert.equal(p.lotFrom,used+1);used+=p.quantity;assert.equal(p.lotTo,used);assert.equal(p.remainingLot,row.boxes-used);}}
  assert.ok(a.stacks.slice(0,-1).every(stack=>stack.total===120));
 }
});
test('rechaza lotes inválidos y cajas fraccionarias o negativas',()=>{
 for(const row of [{lot:'123',boxes:1},{lot:'3032609210008',boxes:-1},{lot:'3032609210008',boxes:1.5}])assert.throws(()=>allocate([{id:'x',...row}]));
});
