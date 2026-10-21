/* 大屏主控：状态管理 / 首屏渲染 / 筛选联动 */
(function () {
  const state = {
    filter: { province: "", type: "", batch: "", sex: "" },
    charts: ["ChartMap", "ChartType", "ChartBatch", "ChartSex", "ChartProv"],
  };

  /* ---------- KPI ---------- */
  function renderKPI(o, batchCount) {
    document.getElementById("kpi-total").textContent = window.fmt(o.inheritors_total);
    document.getElementById("kpi-prov").textContent = o.provinces ?? "--";
    document.getElementById("kpi-batch").textContent = batchCount ?? o.batches ?? 6;
    document.getElementById("kpi-dead").textContent = window.fmt(o.deceased);
    document.getElementById("kpi-minor").textContent = window.fmt(o.minority);
  }

  /* ---------- 筛选标签 ---------- */
  const LABELS = { province: "地区", type: "门类", batch: "批次", sex: "性别" };
  function renderTags() {
    const box = document.getElementById("filter-tags");
    const active = Object.entries(state.filter).filter(([, v]) => v);
    if (!active.length) {
      box.innerHTML = '<em class="tag tag-all">全国 · 全部门类 · 全批次</em>';
      return;
    }
    box.innerHTML = active
      .map(([k, v]) => {
        const text = k === "batch" ? `第${v}批` : v;
        return `<em class="tag tag-x" data-k="${k}" title="点击移除">${LABELS[k]}：${text} ×</em>`;
      })
      .join("");
    box.querySelectorAll(".tag-x").forEach((el) =>
      el.addEventListener("click", () => {
        state.filter[el.dataset.k] = "";
        syncControls();
        refresh();
      })
    );
  }

  /* ---------- 控件同步 ---------- */
  function syncControls() {
    document.getElementById("f-type").value = state.filter.type;
    document.getElementById("f-batch").value = state.filter.batch;
    document.getElementById("f-sex").value = state.filter.sex;
  }

  function updateAll(summary) {
    window.ChartMap.update(summary.by_province, state.filter.province);
    window.ChartType.update(summary.by_type);
    window.ChartBatch.update(summary.by_batch);
    window.ChartSex.update(summary.by_sex);
    window.ChartProv.update(summary.by_province);
    window.ChartNation.update(summary.by_nation, summary.overview);
    window.ChartDecade.update(summary.by_decade);
    window.ChartBubble.update(summary.by_type, summary.projects_by_type);
    window.Story.update(summary, state.filter);
    renderKPI(summary.overview, (summary.by_batch || []).length);
  }

  /* ---------- 刷新（联动核心） ---------- */
  let seq = 0;
  async function refresh() {
    renderTags();
    const my = ++seq;
    const summary = await API.summary(state.filter);
    if (my !== seq) return; // 竞态保护：丢弃过期响应
    updateAll(summary);
  }

  /* ---------- 控件绑定 ---------- */
  function bindControls() {
    const map = { "f-type": "type", "f-batch": "batch", "f-sex": "sex" };
    Object.entries(map).forEach(([id, key]) => {
      document.getElementById(id).addEventListener("change", (e) => {
        state.filter[key] = e.target.value;
        refresh();
      });
    });
    document.getElementById("f-reset").addEventListener("click", () => {
      state.filter = { province: "", type: "", batch: "", sex: "" };
      syncControls();
      refresh();
    });
    window.addEventListener("resize", window.onResizeCharts);
  }

  /* ---------- 下拉选项 ---------- */
  async function fillOptions(stats) {
    const typeSel = document.getElementById("f-type");
    (stats.by_type || []).forEach((r) => {
      const o = document.createElement("option");
      o.value = r.name; o.textContent = `${r.name}（${r.value}）`;
      typeSel.appendChild(o);
    });
    const batchSel = document.getElementById("f-batch");
    (stats.by_batch || []).forEach((r, i) => {
      const o = document.createElement("option");
      o.value = String(i + 1); o.textContent = `${r.name}（${r.value}）`;
      batchSel.appendChild(o);
    });
  }

  /* ---------- 启动 ---------- */
  async function boot() {
    bindControls();
    // 1. 先起图（空数据），保证布局稳定
    await window.ChartMap.init((province) => {
      // 地图点击 = 切换式筛选（再点同省取消）
      state.filter.province =
        state.filter.province === province ? "" : province;
      refresh();
    });
    window.ChartType.init();
    window.ChartBatch.init();
    window.ChartSex.init();
    window.ChartProv.init();
    window.ChartNation.init();
    window.ChartDecade.init();
    window.ChartBubble.init();

    // 2. 支持 URL 直达筛选状态（演示/分享用）：?province=贵州省&type=传统技艺&batch=3&sex=男
    const qs = new URLSearchParams(location.search);
    ["province", "type", "batch", "sex"].forEach((k) => {
      if (qs.get(k)) state.filter[k] = qs.get(k);
    });
    syncControls();

    // 3. 拉统计并渲染首屏
    const stats = await API.stats();
    await fillOptions(stats);
    if (Object.values(state.filter).some(Boolean)) {
      await refresh(); // 带筛选启动：全部图表按 URL 状态渲染
    } else {
      updateAll(stats);
      renderTags();
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
