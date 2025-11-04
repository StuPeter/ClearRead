console.log('放大镜脚本已加载');

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

// 创建放大镜 - 简单高效的DOM克隆方案
function createMagnifier() {
    console.log('创建放大镜（DOM克隆方案）...');
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

    const hLine = document.createElement('div');
    hLine.style.cssText = `
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background: rgba(102, 126, 234, 0.5);
  `;

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

    // 💡 创建放大的内容副本
    contentClone = document.createElement('div');
    contentClone.id = 'magnified-content';
    // 替换原来的 contentClone 样式设置
    contentClone.style.cssText = `
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  transform: scale(${config.zoom});
  pointer-events: none;
  width: ${document.documentElement.scrollWidth}px;   // ✅ 整个文档宽度
  height: ${document.documentElement.scrollHeight}px; // ✅ 整个文档高度
`;

    // 克隆 body 内容
    const bodyContent = document.body.cloneNode(true);
    bodyContent.querySelectorAll('script, iframe, #magnifier-lens, #magnified-content, #magnifier-status').forEach(el => el.remove());
    bodyContent.style.cssText = `
  margin: 0;
  padding: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: ${document.documentElement.scrollWidth}px;
  height: ${document.documentElement.scrollHeight}px;
  overflow: visible;
  box-sizing: border-box;
`;

    contentClone.appendChild(bodyContent);
    lens.appendChild(contentClone);

    document.body.appendChild(lens);
    console.log('放大镜创建完成（DOM克隆方案）');
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

// 更新函数 - 使用滚动偏移补偿
function updateMagnifier(e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (!animationFrame) {
        animationFrame = requestAnimationFrame(() => {
            if (!lens || !contentClone) return;

            const { zoom, lensWidth, lensHeight } = config;
            const halfSize = lensWidth / 2;

            // 镜头位置（固定在鼠标）
            lens.style.left = `${lastMouseX - halfSize}px`;
            lens.style.top = `${lastMouseY - halfSize}px`;

            // 💡 关键：计算放大中心点在**完整页面**中的绝对坐标
            const scrollX = window.pageXOffset || 0;
            const scrollY = window.pageYOffset || 0;
            const pageX = lastMouseX + scrollX; // 鼠标在完整页面中的 X
            const pageY = lastMouseY + scrollY; // 鼠标在完整页面中的 Y

            // 计算克隆体应显示的左上角（使 pageX,pageY 居中于镜头）
            const offsetX = pageX - (halfSize / zoom);
            const offsetY = pageY - (halfSize / zoom);

            // 应用变换（注意：transform 是 scale 后的坐标系）
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

        // 💡 更新 clip-path 以匹配新的镜头大小
        lens.style.clipPath = `circle(${config.lensWidth / 2}px at center)`;
        lens.style.webkitClipPath = `circle(${config.lensWidth / 2}px at center)`;

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
    switch (e.key) {
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
    console.log('🔍 页面信息:');
    console.log('- document height:', document.documentElement.scrollHeight);
    console.log('- window height:', window.innerHeight);
    console.log('- body height:', document.body.scrollHeight);
    console.log('- 是否可滚动:', document.documentElement.scrollHeight > window.innerHeight);

    // 检查是否有内容会导致滚动
    if (document.documentElement.scrollHeight <= window.innerHeight) {
        console.warn('⚠️ 警告：页面内容不足以产生滚动！');
    }

    setTimeout(() => {
        showStatus('💡 点击浏览器工具栏图标启动放大镜\n(或按 F12 查看调试信息)');
    }, 1000);
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    removeMagnifier();
});

// 窗口大小改变时更新内容区域大小
window.addEventListener('resize', () => {
  if (contentClone) {
    const w = document.documentElement.scrollWidth;
    const h = document.documentElement.scrollHeight;
    contentClone.style.width = `${w}px`;
    contentClone.style.height = `${h}px`;
  }
});

// 可删除你原有的 scroll 监听（因为 updateMagnifier 已通过 mousemove 实时更新）
// 除非用户不动鼠标只滚动，才需要它
window.addEventListener('scroll', () => {
  if (isMagnifierActive && lastMouseX > 0 && lastMouseY > 0) {
    // 触发一次更新（使用最新 scroll 位置）
    const fakeEvent = { clientX: lastMouseX, clientY: lastMouseY };
    updateMagnifier(fakeEvent);
  }
}, { passive: true });

