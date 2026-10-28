const encoder=new TextEncoder();
const toBase64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const fromBase64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function signingKey(env){
 if(typeof env.SESSION_SECRET!=='string'||env.SESSION_SECRET.length<32)throw Error('Session secret not configured');
 return crypto.subtle.importKey('raw',encoder.encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
export async function signGrant(env,payload){
 const body=toBase64(encoder.encode(JSON.stringify(payload)));
 const sig=await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(body));
 return body+'.'+toBase64(sig);
}
export async function readGrant(env,token,kind,now=Date.now()){
 try{
  if(typeof token!=='string'||token.length>3000)return null;
  const parts=token.split('.');if(parts.length!==2)return null;
  if(!await crypto.subtle.verify('HMAC',await signingKey(env),fromBase64(parts[1]),encoder.encode(parts[0])))return null;
  const grant=JSON.parse(new TextDecoder().decode(fromBase64(parts[0])));
  if(grant.kind!==kind||!Number.isSafeInteger(grant.exp)||grant.exp<=now)return null;
  return grant;
 }catch{return null;}
}
export async function legacyPinMatches(pin,salt,hash){
 if(!/^\d{4}$/.test(pin)||typeof salt!=='string'||!/^[a-f0-9]{64}$/.test(hash||''))return false;
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(salt+':'+pin)));
 const actual=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=actual.charCodeAt(i)^hash.charCodeAt(i);
 return mismatch===0;
}
export async function consumePinAttempt(env,ip,table,id,now=Date.now()){
 if(!['logs','gallery','pair_posts'].includes(table)||!/^[0-9a-f-]{36}$/i.test(id))throw Error('Invalid target');
 // Hash identifiers before persisting. Both global-per-IP and per-post budgets apply.
 const window=Math.floor(now/900000);
 const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
 const keys=[await hash(ip+':all:'+window),await hash(ip+':'+table+':'+id+':'+window)];
 const results=await env.DB.batch(keys.map(key=>env.DB.prepare('INSERT INTO unlock_attempts (attempt_key, attempts, expires_at) VALUES (?,1,?) ON CONFLICT(attempt_key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(key,(window+2)*900000)));
 return results[0].results[0].attempts<=50&&results[1].results[0].attempts<=5;
}
export const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
