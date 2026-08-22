(function () {
  const MIN_SOURCE_CROP = 200;
  const OUTPUT_SIZE = 800;
  let active = null;

  function ensureUI() {
    if (document.getElementById('square-crop-dialog')) return;

    const dialog = document.createElement('dialog');
    dialog.id = 'square-crop-dialog';
    dialog.className = 'crop-dialog';
    dialog.innerHTML = `
      <div class="crop-shell">
        <div class="editor-top">
          <h2>대표사진 자르기</h2>
          <button type="button" class="ghost" id="crop-cancel">취소</button>
        </div>
        <p class="muted">사진을 드래그해 위치를 맞추고 확대/축소해 주세요.</p>
        <div class="crop-stage" id="crop-stage">
          <img id="crop-image" alt="대표사진 미리보기" draggable="false">
        </div>
        <label class="crop-zoom-label">
          확대/축소
          <input id="crop-zoom" type="range" min="1" max="1" step="0.01" value="1">
        </label>
        <p class="crop-zoom-hint" id="crop-zoom-hint"></p>
        <div class="button-row">
          <button type="button" id="crop-apply">이대로 사용</button>
        </div>
      </div>`;

    document.body.appendChild(dialog);
    dialog.querySelector('#crop-cancel').addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(null);
    });
    dialog.querySelector('#crop-apply').addEventListener('click', apply);

    const stage = dialog.querySelector('#crop-stage');
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    dialog.querySelector('#crop-zoom').addEventListener('input', (event) => {
      if (!active) return;
      active.zoom = Number(event.target.value);
      clampOffsets();
      draw();
      updateHint();
    });
  }

  function getGeometry() {
    if (!active) return null;
    const stage = document.getElementById('crop-stage');
    const rect = stage.getBoundingClientRect();
    const stageSize = rect.width;
    const iw = active.el.naturalWidth;
    const ih = active.el.naturalHeight;
    const baseScale = Math.max(stageSize / iw, stageSize / ih);
    const scale = baseScale * active.zoom;
    const renderedWidth = iw * scale;
    const renderedHeight = ih * scale;
    return {
      stageSize,
      iw,
      ih,
      baseScale,
      scale,
      renderedWidth,
      renderedHeight,
      maxX: Math.max(0, (renderedWidth - stageSize) / 2),
      maxY: Math.max(0, (renderedHeight - stageSize) / 2),
    };
  }

  function onPointerDown(event) {
    if (!active) return;
    active.drag = true;
    active.pointerX = event.clientX;
    active.pointerY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!active?.drag) return;
    active.offsetX += event.clientX - active.pointerX;
    active.offsetY += event.clientY - active.pointerY;
    active.pointerX = event.clientX;
    active.pointerY = event.clientY;
    clampOffsets();
    draw();
  }

  function onPointerUp() {
    if (active) active.drag = false;
  }

  function clampOffsets() {
    const g = getGeometry();
    if (!active || !g) return;
    active.offsetX = Math.max(-g.maxX, Math.min(g.maxX, active.offsetX));
    active.offsetY = Math.max(-g.maxY, Math.min(g.maxY, active.offsetY));
  }

  function draw() {
    if (!active) return;
    const g = getGeometry();
    if (!g) return;
    const img = document.getElementById('crop-image');
    img.style.width = `${g.iw * g.baseScale}px`;
    img.style.height = `${g.ih * g.baseScale}px`;
    img.style.transform = `translate(-50%, -50%) translate(${active.offsetX}px, ${active.offsetY}px) scale(${active.zoom})`;
  }

  function updateHint() {
    if (!active) return;
    const hint = document.getElementById('crop-zoom-hint');
    const shortest = Math.min(active.el.naturalWidth, active.el.naturalHeight);
    const sourceCrop = Math.max(MIN_SOURCE_CROP, Math.round(shortest / active.zoom));
    hint.textContent = `현재 약 ${sourceCrop}×${sourceCrop}px 영역을 사용해요. 최대 확대 시 ${MIN_SOURCE_CROP}×${MIN_SOURCE_CROP}px까지 가능합니다.`;
  }

  function finish(file) {
    if (!active) return;
    const { resolve, url } = active;
    URL.revokeObjectURL(url);
    active = null;
    const dialog = document.getElementById('square-crop-dialog');
    if (dialog?.open) dialog.close();
    resolve(file);
  }

  function apply() {
    if (!active) return;
    const g = getGeometry();
    if (!g) return;

    // 화면의 정사각형 영역을 원본 이미지 좌표로 정확히 환산합니다.
    const sourceCropSize = g.stageSize / g.scale;
    const centerX = g.iw / 2 - active.offsetX / g.scale;
    const centerY = g.ih / 2 - active.offsetY / g.scale;
    let sx = centerX - sourceCropSize / 2;
    let sy = centerY - sourceCropSize / 2;

    sx = Math.max(0, Math.min(g.iw - sourceCropSize, sx));
    sy = Math.max(0, Math.min(g.ih - sourceCropSize, sy));

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      active.el,
      sx,
      sy,
      sourceCropSize,
      sourceCropSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      finish(new File([blob], `profile-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  }

  window.cropSquareImage = function cropSquareImage(file) {
    ensureUI();
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = document.getElementById('crop-image');
      const zoomInput = document.getElementById('crop-zoom');

      active = {
        resolve,
        url,
        el: img,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        drag: false,
        pointerX: 0,
        pointerY: 0,
      };

      img.onload = () => {
        const shortest = Math.min(img.naturalWidth, img.naturalHeight);
        // 원본의 최소 200x200 영역까지 확대 가능. 작은 이미지는 1배까지만 허용.
        const maxZoom = Math.max(1, shortest / MIN_SOURCE_CROP);
        zoomInput.min = '1';
        zoomInput.max = String(maxZoom);
        zoomInput.step = maxZoom > 20 ? '0.05' : '0.01';
        zoomInput.value = '1';
        active.zoom = 1;
        active.offsetX = 0;
        active.offsetY = 0;

        const dialog = document.getElementById('square-crop-dialog');
        dialog.showModal();
        requestAnimationFrame(() => {
          clampOffsets();
          draw();
          updateHint();
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        active = null;
        reject(new Error('이미지를 불러오지 못했습니다.'));
      };

      img.src = url;
    });
  };
})();
