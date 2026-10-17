(() => {
 async function api(path,payload,options={}){
  try{
   const headers={...options.headers};let body=options.body;
   if(payload!==undefined){headers['Content-Type']='application/json';body=JSON.stringify(payload);}
   const response=await fetch(path,{method:options.method||'POST',headers,body});
   return await response.json();
  }catch{return {data:null,error:{message:'서버 연결을 확인해주세요.'}};}
 }
 async function ownerSession(){return api('/api/session',undefined,{method:'GET'});}
 class Query{
  constructor(table){this.q={table,action:'select',filters:[],orders:[]};}
  select(){return this;}
  eq(column,value){this.q.filters.push({op:'eq',column,value});return this;}
  in(column,value){this.q.filters.push({op:'in',column,value});return this;}
  order(column,options={}){this.q.orders.push({column,ascending:options.ascending!==false});return this;}
  single(){this.q.mode='single';return this;}
  maybeSingle(){this.q.mode='maybeSingle';return this;}
  insert(payload){this.q.action='insert';this.q.payload=payload;return this;}
  update(payload){this.q.action='update';this.q.payload=payload;return this;}
  upsert(payload){this.q.action='upsert';this.q.payload=payload;return this;}
  delete(){this.q.action='delete';return this;}
  then(resolve,reject){return api('/api/query',this.q).then(resolve,reject);}
 }
 window.elingneApi=api;
 window.db={from:table=>new Query(table),auth:{
  getSession:ownerSession,
  async signInWithPassword(){location.assign('/owner/login');return {error:null};},
  async signOut(){await api('/api/logout');location.assign('/cdn-cgi/access/logout');return {error:null};},
  onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};}
 },storage:{from(bucket){if(bucket!=='gallery')throw Error('잘못된 버킷입니다.');return {
  upload(path,file){return api('/api/files/'+path.split('/').map(encodeURIComponent).join('/'),undefined,{method:'PUT',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});},
  getPublicUrl(path){return {data:{publicUrl:'/files/'+path.split('/').map(encodeURIComponent).join('/')}};},
  remove(paths){return api('/api/files-retain',{paths});}
 };}}};
})();
