/* 六批次认定历程：柱状图 + 累计折线 */
(function () {
  window.ChartBatch = {
    init() {
      const inst = window.makeChart("chart-batch");
      inst.setOption({
        tooltip: {
          ...window.THEME.tooltip,
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        grid: { left: 37, right: 37, top: 30, bottom: 23 }, /* 减 12.5% 内边距 */
        xAxis: {
          type: "category",
          data: [],
          axisLine: { lineStyle: { color: window.THEME.axis } },
          axisLabel: { color: window.THEME.muted, fontSize: 10, interval: 0,
                       formatter: (v) => v.replace(/（.*/, "").replace("年", "\n") },
        },
        yAxis: [
          { type: "value", name: "人数", nameTextStyle: { color: window.THEME.muted, fontSize: 10 },
            axisLabel: { color: window.THEME.muted, fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(156,143,181,.15)" } } },
          { type: "value", name: "累计", nameTextStyle: { color: window.THEME.muted, fontSize: 10 },
            axisLabel: { color: window.THEME.muted, fontSize: 10 },
            splitLine: { show: false } },
        ],
        series: [
          { name: "批次人数", type: "bar", barWidth: "46%",
            itemStyle: { color: window.THEME.colors[1],
                         borderRadius: [3, 3, 0, 0] },
            data: [] },
          { name: "累计", type: "line", yAxisIndex: 1, smooth: true,
            lineStyle: { color: window.THEME.gold || "#f2c14e", width: 2 },
            itemStyle: { color: "#f2c14e" },
            areaStyle: { color: "rgba(242,193,78,.12)" },
            data: [] },
        ],
      });
    },
    update(rows) {
      const inst = window.Charts["chart-batch"];
      if (!inst) return;
      let sum = 0;
      const cum = rows.map((r) => (sum += r.value));
      inst.setOption({
        xAxis: { data: rows.map((r) => r.name) },
        series: [{ data: rows.map((r) => r.value) }, { data: cum }],
      });
    },
  };
})();
