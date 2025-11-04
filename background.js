// 后台脚本 - 处理插件图标点击
chrome.action.onClicked.addListener((tab) => {
  console.log('插件图标被点击，标签页:', tab);

  // 向当前标签页发送消息
  chrome.tabs.sendMessage(tab.id, { action: 'toggleMagnifier' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('错误:', chrome.runtime.lastError.message);
    } else {
      console.log('消息发送成功');
    }
  });
});

console.log('后台脚本已加载');
