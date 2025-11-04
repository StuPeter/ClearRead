// 网页放大镜扩展

// 全局状态
let isMagnifierActive = false;
let lens = null;
let contentClone = null;
let animationFrame = null;
let lastMouseX = 0;
let lastMouseY = 0;

// 配置
const config = {
  zoom: 2.5,
  lensWidth: 150,
  lensHeight: 150,
  minZoom: 1,
  maxZoom: 5,
  minSize: 80,
  maxSize: 300
};

// 创建状态提示
function showStatus(message) {
  let statusEl = document.getElementById('magnifier-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'magnifier-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(51, 51, 51, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 2147483646;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(statusEl);
  }
  statusEl.innerHTML = message;
  statusEl.style.opacity = '1';
  statusEl.style.transform = 'translateY(0)';

  setTimeout(() => {
    statusEl.style.opacity = '0';
    statusEl.style.transform = 'translateY(-20px)';
  }, 2000);
}

// 获取完整文档尺寸（关键！）
function getDocumentSize() {
  return {
    width: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth
    ),
    height: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    )
  };
}

// 创建放大镜 - DOM克隆方案（滚动安全）
function createMagnifier() {
  if (lens) return;

  const { width: docWidth, height: docHeight } = getDocumentSize();

  lens = document.createElement('div');
  lens.id = 'magnifier-lens';
  lens.style.cssText = `
    position: fixed;
    width: ${config.lensWidth}px;
    height: ${config.lensHeight}px;
    border: 3px solid #333333;
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0,0,0,0.3);
    pointer-events: none;
    z-index: 2147483647;
    overflow: hidden;
    will-change: transform;
  `;

  // 十字线
  const crosshair = document.createElement('div');
  crosshair.style.cssText = `position: absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;`;
  const hLine = document.createElement('div');
  hLine.style.cssText = `position: absolute; left:0; top:50%; width:100%; height:1px; background: rgba(0,0,0,0.5);`;
  const vLine = document.createElement('div');
  vLine.style.cssText = `position: absolute; left:50%; top:0; width:1px; height:100%; background: rgba(0,0,0,0.5);`;
  crosshair.appendChild(hLine);
  crosshair.appendChild(vLine);
  lens.appendChild(crosshair);

  // 克隆容器
  contentClone = document.createElement('div');
  contentClone.id = 'magnified-content';
  contentClone.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    transform: scale(${config.zoom});
    pointer-events: none;
    width: ${docWidth}px;
    height: ${docHeight}px;
  `;

  // 克隆 body（保留 picture/source）
  const bodyContent = document.body.cloneNode(true);
  // 移除干扰元素，但保留 picture/img
  bodyContent.querySelectorAll('script, iframe, video, #magnifier-lens, #magnified-content, #magnifier-status').forEach(el => el.remove());
  bodyContent.style.cssText = `
    margin: 0;
    padding: 0;
    position: absolute;
    left: 0;
    top: 0;
    width: ${docWidth}px;
    height: ${docHeight}px;
    box-sizing: border-box;
    overflow: visible;
  `;
  // 保留 body class（如 dark mode）
  bodyContent.className = document.body.className;

  contentClone.appendChild(bodyContent);
  lens.appendChild(contentClone);
  document.body.appendChild(lens);
}

// 移除放大镜
function removeMagnifier() {
  if (lens) {
    lens.remove();
    lens = null;
    contentClone = null;
  }
}

// 更新放大镜位置和内容
function updateMagnifier(e) {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(() => {
      if (!lens || !contentClone) return;

      const { zoom, lensWidth, lensHeight } = config;
      const halfSize = lensWidth / 2;

      // 镜头位置
      lens.style.left = `${lastMouseX - halfSize}px`;
      lens.style.top = `${lastMouseY - halfSize}px`;

      // 关键：计算绝对页面坐标（含滚动）
      const scrollX = window.pageXOffset || 0;
      const scrollY = window.pageYOffset || 0;
      const pageX = lastMouseX + scrollX;
      const pageY = lastMouseY + scrollY;

      // 计算克隆体应显示的左上角
      const offsetX = pageX - (halfSize / zoom);
      const offsetY = pageY - (halfSize / zoom);

      contentClone.style.transform = `scale(${zoom}) translate(${-offsetX}px, ${-offsetY}px)`;
      animationFrame = null;
    });
  }
}

// 调整放大倍数
function adjustZoom(delta) {
  const oldZoom = config.zoom;
  config.zoom = Math.max(config.minZoom, Math.min(config.maxZoom, config.zoom + delta));
  if (config.zoom !== oldZoom) {
    showStatus(`🔍 放大倍数: ${config.zoom.toFixed(1)}x`);
  }
}

// 调整镜头大小
function adjustSize(delta) {
  const oldWidth = config.lensWidth;
  config.lensWidth = Math.max(config.minSize, Math.min(config.maxSize, config.lensWidth + delta));
  config.lensHeight = config.lensWidth;
  if (config.lensWidth !== oldWidth && lens) {
    lens.style.width = `${config.lensWidth}px`;
    lens.style.height = `${config.lensHeight}px`;
    showStatus(`📐 镜头大小: ${Math.round(config.lensWidth)}px`);
  }
}

// 重置设置
function resetConfig() {
  config.zoom = 2.5;
  config.lensWidth = 150;
  config.lensHeight = 150;
  showStatus('🔄 已重置设置');
}

// 切换放大镜模式
function toggleMagnifier() {
  isMagnifierActive = !isMagnifierActive;
  if (isMagnifierActive) {
    createMagnifier();
    document.addEventListener('mousemove', updateMagnifier);
    document.addEventListener('keydown', handleKeyDown);
    showStatus('🔍 放大镜已开启 (ESC退出)');
  } else {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    removeMagnifier();
    document.removeEventListener('mousemove', updateMagnifier);
    document.removeEventListener('keydown', handleKeyDown);
    showStatus('❌ 放大镜已关闭');
  }
}

// 键盘事件
function handleKeyDown(e) {
  switch(e.key) {
    case 'Escape': toggleMagnifier(); break;
    case '+':
    case '=': e.preventDefault(); adjustZoom(0.5); break;
    case '-': e.preventDefault(); adjustZoom(-0.5); break;
    case '[': e.preventDefault(); adjustSize(-20); break;
    case ']': e.preventDefault(); adjustSize(20); break;
    case 'r':
    case 'R': e.preventDefault(); resetConfig(); break;
  }
}

// 监听插件消息
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleMagnifier') {
      toggleMagnifier();
      sendResponse({ success: true });
    }
  });
}

// 页面加载完成提示
window.addEventListener('load', () => {
  setTimeout(() => {
    showStatus(`
      <div style="line-height:1.6">
        <div style="font-weight:bold; margin-bottom:8px; font-size:15px">🔍 网页放大镜</div>
        <div style="font-size:13px; opacity:0.9">
          点击工具栏图标启动/关闭<br>
          <span style="color:#aaa">快捷键: ESC 关闭 | +/- 缩放 | [] 大小 | R 重置</span>
        </div>
      </div>
    `);
  }, 1500);
});

// 页面卸载清理
window.addEventListener('beforeunload', removeMagnifier);

// 窗口大小变化时更新克隆体尺寸
window.addEventListener('resize', () => {
  if (contentClone) {
    const { width, height } = getDocumentSize();
    contentClone.style.width = `${width}px`;
    contentClone.style.height = `${height}px`;
  }
});

// 滚动时触发更新（用户不动鼠标但滚动页面）
window.addEventListener('scroll', () => {
  if (isMagnifierActive && lastMouseX > 0 && lastMouseY > 0) {
    const fakeEvent = { clientX: lastMouseX, clientY: lastMouseY };
    updateMagnifier(fakeEvent);
  }
}, { passive: true });