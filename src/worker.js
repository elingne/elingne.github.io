import {columns,storageOrigin} from './manifest.js';
import {signGrant,readGrant,legacyPinMatches,consumePinAttempt,cookie} from './security.js';
import {verifyAccess} from './access.js';
const authConfig={ownerId:'site-owner'};
const H={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(body,status=200,extra={})=>Response.json(body,{status,headers:{...H,...extra}});
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const idOK=x=>typeof x==='string'&&/^[0-9a-f-]{36}$/i.test(x);
const quote=s=>'"'+s+'"';
const col=(t,c)=>{if(!columns[t]?.includes(c))throw fail('잘못된 항목입니다.');return quote(c);};
const ownerCookie='__Host-elingne_owner';
const grantName=(t,id)=>'__Host-elingne_'+t+'_'+id;
const cookies=req=>Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(x=>x.trim().split('=')));
function publicConfig(){return {authentication:'cloudflare-access'};}
export function keyOf(value){
 if(typeof value!=='string')return null;
 try{
  const u=new URL(value,'https://local.invalid');
  let key=null;
  if(u.origin==='https://local.invalid'&&u.pathname.startsWith('/files/'))key=decodeURIComponent(u.pathname.slice(7));
  else if(u.origin===storageOrigin&&u.pathname.startsWith('/storage/v1/object/public/gallery/'))key=decodeURIComponent(u.pathname.split('/storage/v1/object/public/gallery/')[1]);
  if(key&&key.length<=1024&&!key.includes('\\')&&!key.split('/').some(p=>p==='.'||p==='..'||p===''))return key;
 }catch{}
 return null;
}
function mapValue(v){
 if(Array.isArray(v))return v.map(mapValue);
 if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,mapValue(x)]));
 const key=keyOf(v);return key?'/files/'+key.split('/').map(encodeURIComponent).join('/'):v;
}
const refs=v=>{
 if(Array.isArray(v))return v.flatMap(refs);
 if(v&&typeof v==='object')return Object.values(v).flatMap(refs);
 const k=keyOf(v);return k?[k]:[];
};
function decodeRow(row){const r={...row};for(const k of ['hashtags','attachments'])if(typeof r[k]==='string')r[k]=JSON.parse(r[k]);return r;}
async function snapshot(env){
 const tables=Object.keys(columns);
 const results=await env.DB.batch(tables.map(t=>env.DB.prepare('SELECT * FROM '+quote(t)+' LIMIT 10000')));
 return Object.fromEntries(tables.map((t,i)=>[t,results[i].results.map(decodeRow)]));
}
async function accessContext(request,env,owner){
 const jar=cookies(request);const grants=new Set();
 for(const [name,value]of Object.entries(jar)){
  if(!name.startsWith('__Host-elingne_')||name===ownerCookie)continue;
  const g=await readGrant(env,value,'post');
  if(g&&['logs','gallery','pair_posts'].includes(g.table)&&idOK(g.id)&&name===grantName(g.table,g.id))grants.add(g.table+':'+g.id);
 }
 return {owner:!!owner,grants};
}
function canPost(ctx,t,r){return ctx.owner||!r.is_locked||ctx.grants.has(t+':'+r.id);}
function relatedPost(db,t,r){
 if(t==='post_images'){const pt={profile:'profile_blocks',log:'logs',gallery:'gallery'}[r.section];const post=db[pt]?.find(p=>p.id===r.post_id&&p.character_id===r.character_id);return post?{table:pt,row:post}:null;}
 if(t==='pair_post_images'){const post=db.pair_posts.find(p=>p.id===r.post_id&&p.pair_id===r.pair_id);return post?{table:'pair_posts',row:post}:null;}
 return null;
}
function fileAllowed(db,key,ctx){
 let linked=false;let blocked=false;
 for(const [t,rows]of Object.entries(db))for(const row of rows){
  if(!refs(row).includes(key))continue;
  linked=true;
  if(['logs','gallery','pair_posts'].includes(t)&&!canPost(ctx,t,row))blocked=true;
  if(['post_images','pair_post_images'].includes(t)){const p=relatedPost(db,t,row);if(!p||!canPost(ctx,p.table,p.row))blocked=true;}
 }
 return linked&&!blocked;
}
function visible(db,t,rows,ctx){
 return rows.filter(r=>{if(ctx.owner)return true;if(['post_images','pair_post_images'].includes(t)){const p=relatedPost(db,t,r);return p&&canPost(ctx,p.table,p.row);}return true;}).map(row=>{
  const r=decodeRow(row);
  if(!ctx.owner){delete r.lock_salt;delete r.lock_code_hash;}
  if(['logs','gallery','pair_posts'].includes(t)&&!canPost(ctx,t,r)){r.title=null;r.body=null;r.image_url=null;r.caption=null;r.attachments=[];}
  for(const k of ['image_url','profile_image_url'])if(r[k]&&(!keyOf(r[k])||!fileAllowed(db,keyOf(r[k]),ctx)))r[k]=null;
  return mapValue(r);
 });
}
function whereQuery(t,filters){
 if(!Array.isArray(filters)||filters.length>10)throw fail('잘못된 조건입니다.');
 const parts=[],args=[];
 for(const f of filters){
  const c=col(t,f.column);
  if(f.op==='eq'&&['string','number'].includes(typeof f.value)){parts.push(c+'=?');args.push(f.value);}
  else if(f.op==='in'&&Array.isArray(f.value)&&f.value.length<=90&&f.value.every(v=>typeof v==='string'||typeof v==='number')){parts.push(f.value.length?c+' IN ('+f.value.map(()=>'?').join(',')+')':'0');args.push(...f.value);}
  else throw fail('잘못된 조건입니다.');
 }
 return {sql:parts.length?' WHERE '+parts.join(' AND '):'',args};
}
function valuesFor(t,input,insert){
 if(!input||typeof input!=='object'||Array.isArray(input))throw fail('저장 형식이 올바르지 않습니다.');
 const r={...input};for(const c of Object.keys(r))col(t,c);
 if(!insert&&('id'in r||'created_at'in r))throw fail('식별자와 작성 시각은 변경할 수 없습니다.');
 if(insert&&!r.id&&t!=='site_settings')r.id=crypto.randomUUID();
 if(t==='site_settings')r.updated_at=new Date().toISOString();
 for(const c of Object.keys(r)){
  if(['hashtags','attachments'].includes(c)){if(!Array.isArray(r[c]))throw fail('배열 형식이 필요합니다.');r[c]=JSON.stringify(r[c]);}
  else if(c==='is_locked'){if(![0,1,true,false].includes(r[c]))throw fail('잘못된 잠금 설정입니다.');r[c]=r[c]?1:0;}
  else if(r[c]!==null&&!['string','number'].includes(typeof r[c]))throw fail('잘못된 항목 형식입니다.');
  if(typeof r[c]==='string'&&(r[c].length>200000||r[c].includes('\0')))throw fail('항목이 너무 크거나 잘못됐습니다.');
  if(['image_url','profile_image_url'].includes(c)&&r[c]&&!keyOf(r[c]))throw fail('이 사이트에 업로드한 파일만 사용할 수 있습니다.');
 }
 if(r.attachments){for(const a of JSON.parse(r.attachments))if(!a||!keyOf(a.url)||typeof a.name!=='string')throw fail('첨부파일 형식이 올바르지 않습니다.');}
 return r;
}
function insertStatement(env,t,r){const ks=Object.keys(r);return env.DB.prepare('INSERT INTO '+quote(t)+' ('+ks.map(quote).join(',')+') VALUES ('+ks.map(()=>'?').join(',')+') RETURNING *').bind(...ks.map(k=>r[k]));}
async function validateRelations(env,t,r){
 if(t==='post_images'){
  const pt={profile:'profile_blocks',log:'logs',gallery:'gallery'}[r.section];
  if(!pt||!await env.DB.prepare('SELECT id FROM '+quote(pt)+' WHERE id=? AND character_id=?').bind(r.post_id,r.character_id).first())throw fail('연결할 캐릭터 게시물을 찾을 수 없습니다.');
 }
 if(t==='pair_post_images'&&!await env.DB.prepare('SELECT id FROM pair_posts WHERE id=? AND pair_id=?').bind(r.post_id,r.pair_id).first())throw fail('연결할 페어 게시물을 찾을 수 없습니다.');
}
async function runQuery(q,env,ctx,db){
 const t=q.table;if(!Object.hasOwn(columns,t))throw fail('허용되지 않은 테이블입니다.');
 const w=whereQuery(t,q.filters);
 if(q.action==='select'){
  if(!Array.isArray(q.orders)||q.orders.length>5)throw fail('잘못된 정렬입니다.');
  const sort=q.orders.length?' ORDER BY '+q.orders.map(o=>col(t,o.column)+(o.ascending===false?' DESC':' ASC')).join(','):'';
  const result=await env.DB.prepare('SELECT * FROM '+quote(t)+w.sql+sort+' LIMIT 1000').bind(...w.args).all();
  const rows=visible(db,t,result.results,ctx);
  if(q.mode==='single'&&rows.length!==1)throw fail('기록을 찾을 수 없습니다.',404);
  return {data:q.mode?rows[0]||null:rows,error:null};
 }
 if(!ctx.owner)throw fail('소유자 로그인이 필요합니다.',403);
 if(['update','delete'].includes(q.action)&&!q.filters.some(f=>f.op==='eq'&&['id','pair_id','post_id','character_id'].includes(f.column)))throw fail('수정·삭제 대상을 지정해주세요.');
 if(q.action==='insert'||q.action==='upsert'){
  const inputs=Array.isArray(q.payload)?q.payload:[q.payload];if(!inputs.length||inputs.length>80)throw fail('저장할 기록 수를 확인해주세요.');
  const rows=inputs.map(r=>valuesFor(t,r,true));for(const r of rows)await validateRelations(env,t,r);
  const statements=rows.map(r=>{
   if(q.action==='upsert'){
    if(t!=='site_settings'||r.id!==1)throw fail('허용되지 않은 저장 방식입니다.');
    const keys=Object.keys(r);return env.DB.prepare('INSERT INTO site_settings ('+keys.map(quote).join(',')+') VALUES ('+keys.map(()=>'?').join(',')+') ON CONFLICT(id) DO UPDATE SET '+keys.filter(k=>k!=='id').map(k=>quote(k)+'=excluded.'+quote(k)).join(',')+' RETURNING *').bind(...keys.map(k=>r[k]));
   }
   return insertStatement(env,t,r);
  });
  const results=await env.DB.batch(statements);const output=results.flatMap(r=>r.results).map(decodeRow).map(mapValue);return {data:q.mode?output[0]:output,error:null};
 }
 if(q.action==='update'){
  const r=valuesFor(t,q.payload,false);const keys=Object.keys(r);if(!keys.length)throw fail('변경 항목이 없습니다.');
  if(['post_images','pair_post_images'].includes(t)&&['post_id','pair_id','character_id','section'].some(k=>k in r))throw fail('이미지의 게시물 연결은 바꿀 수 없습니다.');
  const result=await env.DB.prepare('UPDATE '+quote(t)+' SET '+keys.map(k=>quote(k)+'=?').join(',')+w.sql+' RETURNING *').bind(...keys.map(k=>r[k]),...w.args).all();
  return {data:result.results.map(decodeRow).map(mapValue),error:null};
 }
 if(q.action==='delete'){
  const targets=(await env.DB.prepare('SELECT * FROM '+quote(t)+w.sql).bind(...w.args).all()).results;
  const stmts=[];
  if(['profile_blocks','logs','gallery'].includes(t))for(const row of targets)stmts.push(env.DB.prepare('DELETE FROM post_images WHERE character_id=? AND section=? AND post_id=?').bind(row.character_id,{profile_blocks:'profile',logs:'log',gallery:'gallery'}[t],row.id));
  stmts.push(env.DB.prepare('DELETE FROM '+quote(t)+w.sql).bind(...w.args));await env.DB.batch(stmts);return {data:null,error:null};
 }
 throw fail('허용되지 않은 요청입니다.');
}
export default {
 async fetch(request,bindings,execution){
  const env={...bindings,...authConfig};const url=new URL(request.url);
  try{
   if(url.pathname==='/api/config'&&request.method==='GET')return respond(publicConfig());
   if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==url.origin)throw fail('요청 출처가 올바르지 않습니다.',403);
   let owner=null;
   const ownerGrant=await readGrant(env,cookies(request)[ownerCookie],'owner');
   if(ownerGrant?.sub==='site-owner')owner={id:'site-owner'};
   if(url.pathname==='/owner/login'){
    if(request.method!=='GET')throw fail('GET required',405);
    const diagnostic={};
    const verified=await verifyAccess(request,env,(input,init)=>globalThis.fetch(input,init),Date.now(),diagnostic);
    if(!verified)throw fail('관리자 인증 확인에 실패했어요. 확인 코드: '+diagnostic.reason,403);
    const token=await signGrant(env,{kind:'owner',sub:'site-owner',exp:verified.expiresAt});
    return new Response(null,{status:303,headers:{...H,Location:'/#/admin','Set-Cookie':cookie(ownerCookie,token,Math.floor((verified.expiresAt-Date.now())/1000))}});
   }
   if(url.pathname==='/api/session'&&request.method==='GET')return respond({data:{session:owner?{user:{id:'site-owner'}}:null},error:null});
   if(url.pathname==='/api/logout'&&request.method==='POST')return respond({ok:true},200,{'Set-Cookie':cookie(ownerCookie,'',0)});
   const ctx=await accessContext(request,env,owner);
   if(url.pathname==='/api/unlock'&&request.method==='POST'){
    const raw=await request.text();if(raw.length>2048)throw fail('요청이 너무 큽니다.');const q=JSON.parse(raw);
    if(!['logs','gallery','pair_posts'].includes(q.table)||!idOK(q.id)||typeof q.pin!=='string'||!/^\d{4}$/.test(q.pin))throw fail('비밀번호는 숫자 4자리입니다.');
    if(!await consumePinAttempt(env,request.headers.get('CF-Connecting-IP')||'unknown',q.table,q.id))throw fail('시도 횟수를 초과했어요. 15분 뒤 다시 시도해주세요.',429);
    const r=await env.DB.prepare('SELECT * FROM '+quote(q.table)+' WHERE id=?').bind(q.id).first();
    if(!r||!r.is_locked||!await legacyPinMatches(q.pin,r.lock_salt,r.lock_code_hash))throw fail('비밀번호를 확인해주세요.',403);
    const token=await signGrant(env,{kind:'post',table:q.table,id:q.id,exp:Date.now()+600000});
    execution?.waitUntil(env.DB.prepare('DELETE FROM unlock_attempts WHERE expires_at < ?').bind(Date.now()).run());
    return respond({ok:true},200,{'Set-Cookie':cookie(grantName(q.table,q.id),token,600)});
   }
   if(url.pathname==='/api/query'&&request.method==='POST'){
    const raw=await request.text();if(raw.length>2000000)throw fail('요청이 너무 큽니다.',413);
    return respond(await runQuery(JSON.parse(raw),env,ctx,await snapshot(env)));
   }
   if(url.pathname==='/api/pair-profile'&&request.method==='POST'){
    if(!owner)throw fail('소유자 로그인이 필요합니다.',403);
    const raw=await request.text();if(raw.length>1000000)throw fail('요청이 너무 큽니다.',413);const q=JSON.parse(raw);
    if(!idOK(q.id)||!Array.isArray(q.profiles)||q.profiles.length<2||q.profiles.length>8||!Array.isArray(q.intros)||q.intros.length>80||typeof q.text!=='string')throw fail('프로필 설정을 확인해주세요.');
    if(!await env.DB.prepare('SELECT id FROM pairs WHERE id=?').bind(q.id).first())throw fail('페어를 찾을 수 없습니다.',404);
    const profiles=q.profiles.map((r,i)=>valuesFor('pair_profiles',{...r,pair_id:q.id,sort_order:i},true));
    const intros=q.intros.map((r,i)=>valuesFor('pair_intro_images',{...r,pair_id:q.id,sort_order:i},true));
    const statements=[env.DB.prepare('UPDATE pairs SET relationship_text=? WHERE id=?').bind(q.text,q.id),env.DB.prepare('DELETE FROM pair_profiles WHERE pair_id=?').bind(q.id),env.DB.prepare('DELETE FROM pair_intro_images WHERE pair_id=?').bind(q.id),...profiles.map(r=>insertStatement(env,'pair_profiles',r)),...intros.map(r=>insertStatement(env,'pair_intro_images',r))];
    await env.DB.batch(statements);return respond({data:null,error:null});
   }
   if(url.pathname.startsWith('/api/files/')){
    if(!owner)throw fail('소유자 로그인이 필요합니다.',403);
    const key=decodeURIComponent(url.pathname.slice('/api/files/'.length));
    if(!keyOf('/files/'+key)||!key.includes('/'))throw fail('파일 경로를 확인해주세요.');
    if(request.method==='PUT'){
     const size=Number(request.headers.get('Content-Length'));if(!Number.isFinite(size)||size<0||size>50*1024*1024)throw fail('파일 크기는 최대 50MB입니다.',413);
     const data=await request.arrayBuffer();if(data.byteLength>50*1024*1024)throw fail('파일이 너무 큽니다.',413);
     const object=await env.FILES.put(key,data,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:request.headers.get('Content-Type')||'application/octet-stream'}});
     if(!object)throw fail('동일 경로의 파일이 이미 존재합니다.',409);
     return respond({data:{path:key},error:null});
    }
    throw fail('허용되지 않은 파일 요청입니다.',405);
   }
   if(url.pathname==='/api/files-retain'&&request.method==='POST'){
    if(!owner)throw fail('소유자 로그인이 필요합니다.',403);
    // Logical unlinking is done in D1. Retain bytes for recovery; no premature R2 deletes.
    return respond({data:[],error:null,retainedForRecovery:true});
   }
   if(url.pathname.startsWith('/files/')){
    if(!['GET','HEAD'].includes(request.method))throw fail('허용되지 않은 요청입니다.',405);
    const key=keyOf(url.pathname);if(!key)throw fail('파일을 찾을 수 없습니다.',404);
    if(!ctx.owner&&!fileAllowed(await snapshot(env),key,ctx))throw fail('파일을 찾을 수 없습니다.',404);
    const obj=await env.FILES.get(key);if(!obj)throw fail('파일을 찾을 수 없습니다.',404);
    const mime=obj.httpMetadata?.contentType||'application/octet-stream';
    const safe=/^image\/(png|jpeg|gif|webp|avif)$/.test(mime)||/^(audio|video)\/[a-zA-Z0-9.+-]+$/.test(mime);
    const fh={...H,'Content-Type':safe?mime:'application/octet-stream','Content-Length':String(obj.size),'Content-Security-Policy':"default-src 'none'; sandbox"};
    if(!safe)fh['Content-Disposition']='attachment';
    if(request.method==='HEAD'){await obj.body.cancel();return new Response(null,{headers:fh});}
    return new Response(obj.body,{headers:fh});
   }
   if(url.pathname.startsWith('/api/'))throw fail('요청을 찾을 수 없습니다.',404);
   return env.ASSETS.fetch(request);
  }catch(e){return respond({data:null,error:{message:e.status?e.message:'요청을 완료하지 못했습니다. 입력 내용과 연결 상태를 확인해주세요.'}},e.status||500);}
 }
};
