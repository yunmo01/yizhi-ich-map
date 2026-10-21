/* 中国地图：省级传承人密度 + 点击联动筛选 */
(function () {
  let ready = false;
  let current = [];
  let selectedGeo = null; /* 当前高亮的省级地图名（与筛选状态同步） */

  const GEO_NAME = "china";

  // 省级归并名 -> 地图名
  function geoName(n) {
    if (n === "香港") return "香港特别行政区";
    if (n === "澳门") return "澳门特别行政区";
    return n;
  }

  async function register() {
    if (ready) return;
    const res = await fetch("assets/geo/china.json");
    const geo = await res.json();
    echarts.registerMap(GEO_NAME, geo);
    ready = true;
  }

  function option(data) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return {
      tooltip: {
        ...window.THEME.tooltip,
        trigger: "item",
        formatter: (p) =>
          p.value ? `${p.name}<br/>传承人 <b style="color:#f2c14e">${p.value}</b> 人`
                  : `${p.name}<br/>暂无数据`,
      },
      visualMap: {
        min: 0, max,
        left: 8, bottom: 8,
        itemWidth: 10, itemHeight: 60, /* 缩小视觉映射图例 */
        calculable: true,
        inRange: { color: ["#241b38", "#43316b", "#8a4d2f", "#e2513c", "#f2c14e"] },
        textStyle: { color: window.THEME.muted, fontSize: 10 },
        text: [`${max}人`, "0"],
      },
      series: [
        {
          type: "map",
          map: GEO_NAME,
          roam: false,
          zoom: 1.2, /* 放大撑满容器（围绕地图几何中心缩放） */
          selectedMode: "single",
          label: { show: false },
          itemStyle: {
            areaColor: "#241b38",
            borderColor: "rgba(242,193,78,.55)",
            borderWidth: 1,
          },
          emphasis: {
            label: { show: true, color: "#fff5e6", fontSize: 12 },
            itemStyle: { areaColor: "#8a4d2f" },
          },
          select: { label: { color: "#fff5e6" }, itemStyle: { areaColor: "#a3271b" } },
          data: data.map((d) => ({ name: geoName(d.name), value: d.value })),
        },
      ],
    };
  }

  window.ChartMap = {
    async init(onSelect) {
      await register();
      const inst = window.makeChart("chart-map");
      inst.setOption(option([]));
      /* 点击节流 100ms：快速连点不刷屏，leading+trailing 保证每一下都生效 */
      let lastAt = 0, timer = 0;
      inst.on("click", (p) => {
        // 地图名 -> 归并名（反向）
        let name = p.name;
        if (name === "香港特别行政区") name = "香港";
        if (name === "澳门特别行政区") name = "澳门";
        const fire = () => { onSelect && onSelect(name); };
        const now = Date.now();
        if (now - lastAt >= 100) {
          lastAt = now;
          fire();
        } else {
          clearTimeout(timer);
          timer = setTimeout(() => { lastAt = Date.now(); fire(); }, 100 - (now - lastAt));
        }
      });
    },
    update(rows, selected) {
      current = rows || [];
      const inst = window.Charts["chart-map"];
      if (!inst || !ready) return;
      inst.setOption({ visualMap: { max: Math.max(1, ...current.map((d) => d.value)) },
                       series: [{ data: current.map((d) => ({ name: geoName(d.name), value: d.value })) }] });
      /* 选中高亮跟随筛选状态：重置/标签移除/URL直达/地图点击四种入口统一由状态驱动 */
      const target = selected ? geoName(selected) : null;
      if (selectedGeo && selectedGeo !== target) {
        inst.dispatchAction({ type: "unselect", seriesIndex: 0, name: selectedGeo });
      }
      if (target && target !== selectedGeo) {
        inst.dispatchAction({ type: "select", seriesIndex: 0, name: target });
      }
      selectedGeo = target;
    },
  };
})();
