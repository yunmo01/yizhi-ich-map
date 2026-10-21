/* 出生年代分布：面积折线（传承人年龄结构） */
(function () {
  window.ChartDecade = {
    init() {
      const inst = window.makeChart("chart-decade");
      inst.setOption({
        tooltip: { ...window.THEME.tooltip, trigger: "axis",
                   formatter: (ps) => `${ps[0].name}生<br/>${ps[0].value} 人` },
        grid: { left: 35, right: 14, top: 26, bottom: 21 }, /* 减 12.5% 内边距 */
        xAxis: { type: "category", data: [],
                 axisLine: { show: false }, /* 隐藏轴线与刻度 */
                 axisTick: { show: false },
                 axisLabel: { color: window.THEME.muted, fontSize: 10 } },
        yAxis: { type: "value", name: "人数",
                 nameTextStyle: { color: window.THEME.muted, fontSize: 10 },
                 axisLabel: { color: window.THEME.muted, fontSize: 10 },
                 axisLine: { show: false },
                 axisTick: { show: false },
                 splitLine: { lineStyle: { color: "rgba(156,143,181,.1)" } } }, /* 浅色网格线 */
        series: [{
          type: "line", smooth: true, symbol: "circle", symbolSize: 6,
          lineStyle: { color: "#e26ea6", width: 2.5 },
          itemStyle: { color: "#e26ea6" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(226,110,166,.42)" },
              { offset: 1, color: "rgba(226,110,166,.02)" },
            ]),
          },
          data: [],
        }],
      });
    },
    update(rows) {
      const inst = window.Charts["chart-decade"];
      if (!inst) return;
      inst.setOption({
        xAxis: { data: (rows || []).map((r) => r.name) },
        series: [{ data: (rows || []).map((r) => r.value) }],
      });
    },
  };
})();
