/* 大屏主题与图表公共工具 */
window.THEME = {
  colors: ["#f2c14e", "#e2513c", "#4cc9b0", "#e26ea6", "#7aa2f7",
           "#ffb86b", "#9ece6a", "#c792ea", "#ff9e64", "#73daca"],
  text: "#efe8dc",
  muted: "#9c8fb5",
  line: "rgba(242,193,78,.25)",
  axis: "rgba(156,143,181,.45)",
  tooltip: {
    backgroundColor: "rgba(24,17,36,.94)",
    borderColor: "#f2c14e",
    borderWidth: 1,
    textStyle: { color: "#efe8dc", fontSize: 12 },
  },
  legend: { textStyle: { color: "#efe8dc", fontSize: 12 } },
  /* 动画基线：联动更新过渡更柔，快速切换不闪（仅动画键，避免误带 legend/tooltip） */
  base: {
    animationDuration: 600,
    animationDurationUpdate: 400,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicInOut",
  },
};

/* ECharts 实例注册表：id -> instance */
window.Charts = window.Charts || {};

window.makeChart = function (domId) {
  const el = document.getElementById(domId);
  if (!el) throw new Error("chart dom not found: " + domId);
  const inst = echarts.getInstanceByDom(el) || echarts.init(el, window.THEME.base);
  window.Charts[domId] = inst;
  return inst;
};

window.onResizeCharts = function () {
  Object.values(window.Charts).forEach((c) => c && c.resize());
};

window.fmt = function (n) {
  return n == null ? "--" : Number(n).toLocaleString("zh-CN");
};
