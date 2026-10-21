/* 十大门类：南丁格尔玫瑰图 */
(function () {
  window.ChartType = {
    init() {
      const inst = window.makeChart("chart-type");
      inst.setOption({
        tooltip: {
          ...window.THEME.tooltip,
          trigger: "item",
          formatter: "{b}<br/>传承人 {c} 人（{d}%）",
        },
        legend: { show: false }, /* 隐藏长图例：详情全靠悬浮 tooltip */
        series: [{
          type: "pie",
          radius: ["45%", "70%"], /* 放大环图 */
          center: ["50%", "50%"],
          roseType: "radius",
          itemStyle: { borderColor: "#140f1d", borderWidth: 2 },
          label: {
            show: true, position: "center", /* 中心显示当前筛选总人数 */
            formatter: () => (inst._total
              ? `{a|${window.fmt(inst._total)}}\n{b|代表性传承人}` : ""),
            rich: {
              a: { fontSize: 26, color: "#f2c14e", fontFamily: "STZhongsong, SimSun, serif", lineHeight: 30 },
              b: { fontSize: 11, color: "#9c8fb5" },
            },
          },
          labelLine: { show: false },
          color: window.THEME.colors,
          data: [],
        }],
      });
    },
    update(rows) {
      const inst = window.Charts["chart-type"];
      if (!inst) return;
      inst._total = (rows || []).reduce((s, r) => s + r.value, 0);
      inst.setOption({ series: [{ data: rows }] });
    },
  };
})();
