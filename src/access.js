const cache=new Map();
const bytes=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export async function verifyAccess(request,env,fetcher=(input,init)=>globalThis.fetch(input,init),now=Date.now(),diagnostic={}){
 let stage='configuration';
 const deny=reason=>{diagnostic.reason=reason;return null;};
 try{
  if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN||'')||!env.ACCESS_AUD)return deny('configuration-missing');
  // Depending on the Workers/Access route, the signed assertion can arrive as a cookie.
  // Both sources undergo the same complete cryptographic validation below.
  const cookieToken=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const token=request.headers.get('Cf-Access-Jwt-Assertion')||cookieToken;
  if(!token||token.length>16000)return deny('assertion-missing');
  stage='token-format';
  const parts=token.split('.');if(parts.length!==3)return deny('token-format');
  const decode=s=>JSON.parse(new TextDecoder().decode(bytes(s)));
  const header=decode(parts[0]),claims=decode(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string')return deny('algorithm-rejected');
  const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
  const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(claims.iss!==issuer)return deny('issuer-mismatch');
  if(!aud.includes(env.ACCESS_AUD))return deny('audience-mismatch');
  if(claims.type!=='app')return deny('token-type-rejected');
  if(!Number.isFinite(claims.exp)||claims.exp*1000<=now||!Number.isFinite(claims.iat)||claims.iat*1000>now+60000)return deny('token-time-rejected');
  if(claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf*1000>now))return deny('token-not-yet-valid');
  if(typeof claims.email!=='string'||claims.email.toLowerCase()!==env.OWNER_EMAIL.toLowerCase()||!claims.sub)return deny('owner-mismatch');
  const cacheId=issuer+':'+header.kid;
  let cached=cache.get(cacheId);
  if(!cached||cached.expires<=now){
   stage='public-key-fetch';
   const response=await fetcher(issuer+'/cdn-cgi/access/certs',{redirect:'manual',headers:{Accept:'application/json'}});
   if(!response.ok)return deny('public-key-http-error');
   stage='public-key-json';
   const jwks=await response.json();const jwk=jwks.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA');
   if(!jwk)return deny('signing-key-not-found');
   stage='public-key-import';
   const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   if(cache.size>20)cache.clear();
   cached={key,expires:now+300000};cache.set(cacheId,cached);
  }
  stage='signature-check';
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',cached.key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))return deny('signature-rejected');
  diagnostic.reason='verified';
  return {id:'site-owner',email:claims.email,expiresAt:Math.min(claims.exp*1000,now+3600000)};
 }catch{return deny(stage+'-error');}
}
