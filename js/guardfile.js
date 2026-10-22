/* 双击误开防呆：file:// 协议下浏览器安全策略禁止页面加载本地数据（CORS），
   会导致图表空白、检索失效——这不是作品故障。检测到 file:// 即全屏显示操作指引。 */
(function () {
  if (location.protocol !== "file:") return;
  function mount() {
    var d = document.createElement("div");
    d.id = "file-guard";
    d.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(10,16,30,.93);" +
      "display:flex;align-items:center;justify-content:center;font-family:'Microsoft YaHei','PingFang SC',sans-serif;color:#e8eef8;";
    d.innerHTML = '<div style="max-width:760px;margin:20px;padding:34px 40px;border:1px solid rgba(212,165,116,.55);' +
      'border-radius:12px;background:#101a30;box-shadow:0 12px 48px rgba(0,0,0,.55);line-height:1.9;font-size:15px">' +
      '<h2 style="margin:0 0 12px;color:#d4a574;font-size:22px;font-weight:600">请勿直接双击打开本页面</h2>' +
      '<p style="margin:6px 0">浏览器安全限制（file:// 协议）会阻止页面加载本地数据，导致图表空白、检索失效——这不是作品故障。</p>' +
      '<p style="margin:16px 0 6px;color:#d4a574">正确打开方式（任选其一）：</p>' +
      '<ol style="margin:4px 0 14px;padding-left:24px">' +
      '<li>推荐：在线体验 <b style="color:#7fd1c4">https://yunmo01.github.io/yizhi-ich-map/</b>（零安装，全部功能可用）</li>' +
      '<li>本地静态版：在本目录（static-site）打开命令行运行 <code style="background:#1a2742;padding:2px 8px;border-radius:4px">python -m http.server 8000</code>，浏览器访问 <b>http://127.0.0.1:8000</b></li>' +
      '<li>完整版（含后端）：在解压根目录运行 <code style="background:#1a2742;padding:2px 8px;border-radius:4px">python guard.py</code>，浏览器访问 <b>http://127.0.0.1:5000</b></li>' +
      '</ol>' +
      '<p style="margin:12px 0 0;color:#8fa3c0;font-size:13px">详细步骤见压缩包内「04_运行或使用说明」PDF。</p>' +
      '</div>';
    document.body.appendChild(d);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
