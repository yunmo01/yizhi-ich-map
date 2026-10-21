/* 性别结构：环形图 */
(function () {
  window.ChartSex = {
    init() {
      const inst = window.makeChart("chart-sex");
      inst.setOption({
        tooltip: { ...window.THEME.tooltip, trigger: "item",
                   formatter: "{b}：{c} 人（{d}%）" },
        legend: { ...window.THEME.legend, bottom: "0%", orient: "horizontal",
                  itemWidth: 10, itemHeight: 10 },
        series: [{
          type: "pie",
          radius: ["40%", "55%"], /* 缩小环图 */
          center: ["50%", "44%"],
          label: { show: true, position: "center",
                   formatter: () => "", color: "#efe8dc" },
          labelLine: { show: false },
          itemStyle: { borderColor: "#140f1d", borderWidth: 3 },
          color: ["#7aa2f7", "#e26ea6"],
          data: [],
        }],
      });
    },
    update(rows) {
      const inst = window.Charts["chart-sex"];
      if (!inst) return;
      inst.setOption({ series: [{ data: rows }] });
      const total = rows.reduce((s, r) => s + r.value, 0) || 1;
      const note = rows.map((r) => `${r.name} ${(r.value / total * 100).toFixed(1)}%`).join(" · ");
      const el = document.getElementById("sex-note");
      if (el) el.textContent = note;
    },
  };
})();
