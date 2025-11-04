console.log('放大镜脚本已加载');

// 全局状态
let isMagnifierActive = false;
let lens = null;
let contentClone = null;
let animationFrame = null;
let lastMouseX = 0;
let lastMouseY = 0;
let lastMousePageX = 0;  // 鼠标相对于文档的坐标（包含滚动）
let lastMousePageY = 0;

// 配置
const config = {
  zoom: 2.5,
  lensWidth: 150,
  lensHeight: 150,  // 正圆形 1:1 比例
  minZoom: 1,
  maxZoom: 5,
  minSize: 80,
  maxSize: 300
};

// 创建状态提示
function showStatus(message) {
  console.log(message);
  let statusEl = document.getElementById('magnifier-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'magnifier-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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

// 创建放大镜
function createMagnifier() {
  console.log('创建放大镜...');
  if (lens) return;

  lens = document.createElement('div');
  lens.id = 'magnifier-lens';
  lens.style.cssText = `
    position: fixed;
    width: ${config.lensWidth}px;
    height: ${config.lensHeight}px;
    border: 3px solid #667eea;
    border-radius: 50%;
    box-shadow:
      0 0 20px rgba(102, 126, 234, 0.6),
      0 8px 32px rgba(0,0,0,0.3);
    pointer-events: none;
    z-index: 2147483647;
    overflow: hidden;
    background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
    display: block;
    will-change: transform;
  `;

  // 添加中心十字线标记
  const crosshair = document.createElement('div');
  crosshair.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  `;

  // 水平线
  const hLine = document.createElement('div');
  hLine.style.cssText = `
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background: rgba(102, 126, 234, 0.5);
  `;

  // 垂直线
  const vLine = document.createElement('div');
  vLine.style.cssText = `
    position: absolute;
    left: 50%;
    top: 0;
    width: 1px;
    height: 100%;
    background: rgba(102, 126, 234, 0.5);
  `;

  crosshair.appendChild(hLine);
  crosshair.appendChild(vLine);
  lens.appendChild(crosshair);

  contentClone = document.createElement('div');
  contentClone.id = 'magnifier-content';
  contentClone.style.cssText = `
    position: absolute;
    width: ${window.innerWidth}px;
    height: ${document.documentElement.scrollHeight}px;
    left: 0;  // 初始位置从 (0,0) 开始
    top: 0;
    transform-origin: 0 0;
    will-change: transform;
  `;

  // 只克隆 body 和 body 的内容，避免 html/head 的干扰
  const bodyClone = document.body.cloneNode(true);
  bodyClone.querySelectorAll('script, iframe').forEach(el => el.remove());
  // 确保 bodyClone 精确定位
  bodyClone.style.margin = '0';
  bodyClone.style.padding = getComputedStyle(document.body).padding || '0';
  bodyClone.style.boxSizing = 'border-box';
  bodyClone.style.position = 'absolute';
  bodyClone.style.left = '0';
  bodyClone.style.top = '0';
  bodyClone.style.right = '0';
  bodyClone.style.bottom = '0';

  contentClone.appendChild(bodyClone);

  lens.appendChild(contentClone);
  document.body.appendChild(lens);
  console.log('放大镜创建完成');
}

// 移除放大镜
function removeMagnifier() {
  console.log('移除放大镜');
  if (lens) {
    lens.remove();
    lens = null;
    contentClone = null;
  }
}

// 优化后的更新函数 - 使用 requestAnimationFrame
function updateMagnifier(e) {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  lastMousePageX = e.pageX;  // 包含滚动的鼠标坐标
  lastMousePageY = e.pageY;

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(() => {
      if (!lens) return;

      const { zoom, lensWidth, lensHeight } = config;

      // 计算镜头位置（居中于鼠标，不限制边界）
      const x = lastMouseX - lensWidth / 2;
      const y = lastMouseY - lensHeight / 2;

      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;

      // 鼠标位置作为放大的中心点 - 简化版，直接让鼠标位置在镜头中心
      const mousePageX = lastMousePageX;  // 包含滚动的文档坐标
      const mousePageY = lastMousePageY;

      // 简化：让鼠标的页面位置恰好显示在镜头中心
      const lensCenterOffset = config.lensWidth / 2;
      const translateX = lensCenterOffset - mousePageX * zoom;
      const translateY = lensCenterOffset - mousePageY * zoom;

      // 应用变换 - 让鼠标位置显示在镜头中心
      contentClone.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${zoom})`;

      animationFrame = null;
    });
  }
}

// 调整放大倍数
function adjustZoom(delta) {
  const oldZoom = config.zoom;
  config.zoom = Math.max(config.minZoom, Math.min(config.maxZoom, config.zoom + delta));

  if (config.zoom !== oldZoom) {
    if (lens) {
      lens.style.width = `${config.lensWidth}px`;
      lens.style.height = `${config.lensHeight}px`;
    }
    showStatus(`🔍 放大倍数: ${config.zoom.toFixed(1)}x (快捷键: +/-)`);
  }
}

// 调整镜头大小
function adjustSize(delta) {
  const oldWidth = config.lensWidth;
  config.lensWidth = Math.max(config.minSize, Math.min(config.maxSize, config.lensWidth + delta));
  config.lensHeight = config.lensWidth;  // 保持正圆形 1:1 比例

  if (config.lensWidth !== oldWidth && lens) {
    lens.style.width = `${config.lensWidth}px`;
    lens.style.height = `${config.lensHeight}px`;
    showStatus(`📐 镜头大小: ${Math.round(config.lensWidth)}x${Math.round(config.lensHeight)}px (快捷键: [ ])`);
  }
}

// 重置设置
function resetConfig() {
  config.zoom = 2.5;
  config.lensWidth = 200;
  config.lensHeight = 120;
  if (lens) {
    lens.style.width = `${config.lensWidth}px`;
    lens.style.height = `${config.lensHeight}px`;
  }
  showStatus('🔄 已重置设置 (快捷键: R)');
}

// 切换放大镜模式
function toggleMagnifier() {
  console.log('切换放大镜, 当前状态:', isMagnifierActive);
  isMagnifierActive = !isMagnifierActive;

  if (isMagnifierActive) {
    console.log('开启放大镜');
    createMagnifier();
    document.addEventListener('mousemove', updateMagnifier);
    document.addEventListener('keydown', handleKeyDown);
    showStatus(`🔍 放大镜已开启 - ${config.zoom}x (ESC退出)`);
  } else {
    console.log('关闭放大镜');
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    removeMagnifier();
    document.removeEventListener('mousemove', updateMagnifier);
    document.removeEventListener('keydown', handleKeyDown);
    showStatus('❌ 放大镜已关闭');
  }
}

// 处理键盘事件
function handleKeyDown(e) {
  console.log('按键:', e.key);
  switch(e.key) {
    case 'Escape':
      toggleMagnifier();
      break;
    case '+':
    case '=':
      e.preventDefault();
      adjustZoom(0.5);
      break;
    case '-':
    case '_':
      e.preventDefault();
      adjustZoom(-0.5);
      break;
    case '[':
      e.preventDefault();
      adjustSize(-20);
      break;
    case ']':
      e.preventDefault();
      adjustSize(20);
      break;
    case 'r':
    case 'R':
      e.preventDefault();
      resetConfig();
      break;
  }
}

// 监听后台脚本发送的消息
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到消息:', message);
    if (message.action === 'toggleMagnifier') {
      toggleMagnifier();
      sendResponse({ success: true });
    }
  });
}

// 页面加载完成后自动提示
window.addEventListener('load', () => {
  console.log('页面加载完成');
  setTimeout(() => {
    showStatus('💡 点击浏览器工具栏图标启动放大镜');
  }, 1000);
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  removeMagnifier();
});

// 窗口大小改变时更新内容区域大小
window.addEventListener('resize', () => {
  if (contentClone) {
    contentClone.style.width = `${window.innerWidth}px`;
    contentClone.style.height = `${document.documentElement.scrollHeight}px`;
  }
});

// 页面滚动时更新内容区域大小
window.addEventListener('scroll', () => {
  if (contentClone) {
    contentClone.style.height = `${document.documentElement.scrollHeight}px`;
  }
});
