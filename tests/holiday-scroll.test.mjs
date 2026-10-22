import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('holiday snapshot includes lunar holidays, substitute days and overlapping names',()=>{
  const context=vm.createContext({});
  vm.runInContext(app.slice(0,app.indexOf('let currentDate')),context);
  assert.equal(vm.runInContext('KOREAN_HOLIDAYS["2026-10-05"][0]',context),'대체공휴일(개천절)');
  assert.equal(vm.runInContext('KOREAN_HOLIDAYS["2026-02-17"][0]',context),'설날');
  assert.equal(vm.runInContext('KOREAN_HOLIDAYS["2026-09-25"][0]',context),'추석');
  assert.equal(vm.runInContext('KOREAN_HOLIDAYS["2025-05-05"].length',context),2);
  assert.equal(vm.runInContext('KOREAN_HOLIDAYS["2026-10-22"]',context),undefined);
});
test('today always exists, entry scrolls to it, refresh keeps position, hidden page does not scroll',async()=>{
  const groups=[];let scrolls=0,hidden=false;
  const element=()=>({dataset:{},classList:{add(){}},append(){},appendChild(){},addEventListener(){},scrollIntoView(){scrolls++;}});
  const list={innerHTML:'',appendChild(g){groups.push(g);},querySelector(){return groups.find(g=>g.dataset.scheduleDate==='2026-10-22');}};
  const q={select(){return this;},order(){return this;},then(resolve){return Promise.resolve({data:[]}).then(resolve);}};
  const context=vm.createContext({document:{createElement:element},dbClient:{from(){return q;}},scheduleList:list,schedulePage:{classList:{contains(){return hidden;}}},isOwner:true,console,Date,Set,formatDateKey:()=> '2026-10-22',formatScheduleDateHeading:d=>d,renderScheduleGap:()=>element(),requestAnimationFrame:fn=>fn()});
  vm.runInContext(app.slice(app.indexOf('async function loadSchedulePage('),app.indexOf('/* SEARCH */')),context);
  await vm.runInContext('loadSchedulePage({scrollToToday:true})',context);
  assert.ok(groups.some(g=>g.dataset.scheduleDate==='2026-10-22'));assert.equal(scrolls,1);
  await vm.runInContext('loadSchedulePage()',context);assert.equal(scrolls,1);
  hidden=true;await vm.runInContext('loadSchedulePage({scrollToToday:true})',context);assert.equal(scrolls,1);
});
