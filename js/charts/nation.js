/* 民族构成：TOP民族横向条形（对照七人普参考线） */
(function () {
  window.ChartNation = {
    init() {
      const inst = window.makeChart("chart-nation");
      inst.setOption({
        tooltip: { ...window.THEME.tooltip, trigger: "axis",
                   axisPointer: { type: "shadow" },
                   formatter: (ps) => {
                     const p = ps[0];
                     const total = inst._total || 1;
                     return `${p.name}<br/>${p.value} 人（占当前 ${(p.value / total * 100).toFixed(1)}%）`;
                   } },
        grid: { left: 7, right: 41, top: 5, bottom: 5, containLabel: true }, /* 减 12.5% 内边距 */
        xAxis: { type: "value",
                 axisLabel: { color: window.THEME.muted, fontSize: 10 },
                 axisLine: { show: false }, /* 隐藏轴线与刻度 */
                 axisTick: { show: false },
                 splitLine: { lineStyle: { color: "rgba(156,143,181,.1)" } } }, /* 浅色网格线 */
        yAxis: { type: "category", inverse: true, data: [],
                 axisLine: { show: false },
                 axisTick: { show: false },
                 axisLabel: { color: window.THEME.text, fontSize: 11 } },
        series: [{
          type: "bar", barWidth: "60%",
          label: { show: true, position: "right", color: window.THEME.gold, fontSize: 11 },
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (p) => p.dataIndex === 0 ? "#f2c14e" : "#4cc9b0",
          },
          data: [],
        }],
      });
    },
    update(rows, overview) {
      const inst = window.Charts["chart-nation"];
      if (!inst) return;
      const all = (rows || []).filter((r) => r.name !== "未知");
      const han = all.find((r) => r.name === "汉族");
      const top = all.filter((r) => r.name !== "汉族").slice(0, 9);
      inst._total = top.reduce((s, r) => s + r.value, 0);
      inst.setOption({
        yAxis: { data: top.map((r) => r.name) },
        series: [{ data: top.map((r) => r.value) }],
      });
      const note = document.getElementById("nation-note");
      if (note) {
        note.textContent = han
          ? `汉族 ${window.fmt(han.value)} 人（条形图未显示）· 七人普少数民族占 8.89%`
          : "七人普少数民族占 8.89%";
      }
    },
  };
})();
