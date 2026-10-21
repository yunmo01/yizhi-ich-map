/* 门类健康度气泡：x=项目子项数, y=传承人数, 气泡=每个项目平均传承人数 */
(function () {
  window.ChartBubble = {
    init() {
      const inst = window.makeChart("chart-bubble");
      inst.setOption({
        tooltip: {
          ...window.THEME.tooltip,
          formatter: (p) => {
            const [x, y, avg] = p.value;
            return `<b>${p.name}</b><br/>项目子项：${x} 个<br/>传承人：${y} 人<br/>平均每个子项 <b style="color:#f2c14e">${avg}</b> 位传承人`;
          },
        },
        grid: { left: 38, right: 17, top: 30, bottom: 26 }, /* 减 12.5% 内边距 */
        xAxis: { type: "value", name: "项目子项数", nameLocation: "middle", nameGap: 16,
                 nameTextStyle: { color: window.THEME.muted, fontSize: 10 },
                 axisLabel: { color: window.THEME.muted, fontSize: 10 },
                 axisLine: { show: false }, /* 隐藏轴线与刻度 */
                 axisTick: { show: false },
                 splitLine: { lineStyle: { color: "rgba(156,143,181,.1)" } } }, /* 浅色网格线 */
        yAxis: { type: "value", name: "传承人数", nameTextStyle: { color: window.THEME.muted, fontSize: 10 },
                 axisLabel: { color: window.THEME.muted, fontSize: 10 },
                 axisLine: { show: false },
                 axisTick: { show: false },
                 splitLine: { lineStyle: { color: "rgba(156,143,181,.1)" } } },
        series: [{
          type: "scatter",
          symbolSize: 18,
          label: { show: true, position: "top", color: window.THEME.text, fontSize: 10,
                   formatter: (p) => (p.value[2] < 0.6 ? p.name + " ⚠" : p.name) },
          labelLayout: { hideOverlap: true }, /* 标签重叠自动隐藏 */
          itemStyle: { opacity: .7, borderColor: "#140f1d", borderWidth: 1 }, /* 气泡半透明质感 */
          data: [],
        }],
      });
    },
    update(byType, byProjects) {
      const inst = window.Charts["chart-bubble"];
      if (!inst) return;
      const prjMap = {};
      (byProjects || []).forEach((r) => (prjMap[r.name] = r.value));
      const data = (byType || [])
        .filter((r) => r.name !== "未知")
        .map((r) => {
          const x = prjMap[r.name] || 0;
          const avg = x ? +(r.value / x).toFixed(2) : 0;
          return {
            name: r.name,
            value: [x, r.value, avg],
            symbolSize: Math.max(14, Math.min(56, 12 + avg * 14)),
            itemStyle: {
              color: avg < 0.6 ? "#e2513c" : avg > 1.6 ? "#f2c14e" : "#4cc9b0",
            },
          };
        });
      const maxAvg = Math.max(...data.map((d) => d.value[2]));
      inst.setOption({
        series: [{ data }],
        tooltip: { ...window.THEME.tooltip },
      });
      return maxAvg;
    },
  };
})();
