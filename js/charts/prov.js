/* 省份 TOP6：横向条形图 */
(function () {
  window.ChartProv = {
    init() {
      const inst = window.makeChart("chart-prov");
      inst.setOption({
        tooltip: { ...window.THEME.tooltip, trigger: "axis",
                   axisPointer: { type: "shadow" },
                   formatter: (ps) => {
                     const p = ps[0];
                     return `${p.name}<br/>传承人 <b style="color:#f2c14e">${p.value}</b> 人`;
                   } },
        grid: { left: 7, right: 38, top: 7, bottom: 7, containLabel: true }, /* 减 12.5% 内边距 */
        xAxis: { type: "value",
                 axisLabel: { color: window.THEME.muted, fontSize: 10 },
                 axisLine: { show: false }, /* 隐藏轴线与刻度 */
                 axisTick: { show: false },
                 splitLine: { show: false } }, /* 隐藏网格线 */
        yAxis: { type: "category", inverse: true, data: [],
                 axisLine: { show: false },
                 axisTick: { show: false },
                 splitLine: { show: false },
                 axisLabel: { color: window.THEME.text, fontSize: 11 } },
        series: [{
          type: "bar", barWidth: "58%",
          label: { show: true, position: "right", color: window.THEME.gold, fontSize: 11 },
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: "#c9a24e", /* 低饱和哑光金，去渐变 */
          },
          data: [],
        }],
      });
    },
    update(rows) {
      const inst = window.Charts["chart-prov"];
      if (!inst) return;
      const top = (rows || [])
        .filter((r) => r.name !== "中直单位及其他")
        .slice(0, 6) /* 只取 Top 6，减少视觉碎片 */
        .reverse();
      inst.setOption({
        yAxis: { data: top.map((r) => r.name
          .replace(/(维吾尔|壮族|回族|蒙古族)?自治区$/, "区")
          .replace(/[省市]$/, "")) },
        series: [{ data: top.map((r) => r.value) }],
      });
    },
  };
})();
