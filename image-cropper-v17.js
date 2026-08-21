(function(){
  let active = null;
  function ensureUI(){
    if(document.getElementById('square-crop-dialog')) return;
    const d=document.createElement('dialog'); d.id='square-crop-dialog'; d.className='crop-dialog';
    d.innerHTML=`<div class="crop-shell"><div class="editor-top"><h2>대표사진 자르기</h2><button type="button" class="ghost" id="crop-cancel">취소</button></div><p class="muted">사진을 드래그해 위치를 맞추고 확대/축소해 주세요.</p><div class="crop-stage" id="crop-stage"><img id="crop-image" alt="대표사진 미리보기"></div><label class="crop-zoom-label">확대/축소 <input id="crop-zoom" type="range" min="1" max="3" step="0.01" value="1"></label><div class="button-row"><button type="button" id="crop-apply">이대로 사용</button></div></div>`;
    document.body.appendChild(d);
    d.querySelector('#crop-cancel').addEventListener('click',()=>finish(null));
    d.addEventListener('cancel',e=>{e.preventDefault();finish(null)});
    d.querySelector('#crop-apply').addEventListener('click',apply);
    const stage=d.querySelector('#crop-stage');
    stage.addEventListener('pointerdown',down); stage.addEventListener('pointermove',move); stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
    d.querySelector('#crop-zoom').addEventListener('input',e=>{if(active){active.zoom=+e.target.value; clamp(); draw();}});
  }
  function down(e){if(!active)return; active.drag=true;active.px=e.clientX;active.py=e.clientY;e.currentTarget.setPointerCapture(e.pointerId)}
  function move(e){if(!active?.drag)return; const r=document.getElementById('crop-stage').getBoundingClientRect();active.x+=(e.clientX-active.px)/r.width;active.y+=(e.clientY-active.py)/r.height;active.px=e.clientX;active.py=e.clientY;clamp();draw()}
  function up(){if(active)active.drag=false}
  function clamp(){ if(!active)return; const lim=(active.zoom-1)/(2*active.zoom); active.x=Math.max(-lim,Math.min(lim,active.x));active.y=Math.max(-lim,Math.min(lim,active.y)); }
  function draw(){const img=document.getElementById('crop-image'); if(!active)return; img.style.transform=`translate(calc(-50% + ${active.x*100}%), calc(-50% + ${active.y*100}%)) scale(${active.zoom})`;}
  function finish(file){if(!active)return; const {resolve,url}=active;URL.revokeObjectURL(url);active=null;document.getElementById('square-crop-dialog').close();resolve(file)}
  async function apply(){if(!active)return; const img=active.el, size=800, c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');
    const iw=img.naturalWidth, ih=img.naturalHeight, base=Math.max(size/iw,size/ih), scale=base*active.zoom, dw=iw*scale, dh=ih*scale;
    const limX=Math.max(0,(dw-size)/2), limY=Math.max(0,(dh-size)/2); const ox=active.x*2*limX, oy=active.y*2*limY;
    ctx.drawImage(img,(size-dw)/2+ox,(size-dh)/2+oy,dw,dh);
    c.toBlob(blob=>finish(new File([blob],`profile-${Date.now()}.jpg`,{type:'image/jpeg'})),'image/jpeg',0.92);
  }
  window.cropSquareImage=function(file){ensureUI();return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file), img=document.getElementById('crop-image');active={resolve,url,el:img,zoom:1,x:0,y:0,drag:false};document.getElementById('crop-zoom').value='1';img.onload=()=>{draw();document.getElementById('square-crop-dialog').showModal()};img.onerror=()=>{URL.revokeObjectURL(url);active=null;reject(new Error('이미지를 불러오지 못했습니다.'))};img.src=url;});};
})();
