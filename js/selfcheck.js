/* 系统自检（selfcheck）：
   启动时逐项核查 8 项故障点；全绿仅显示时钟旁极小勾，任一异常自动展开红色面板
   + 大白话修复指引 + 重检/刷新按钮；运行中每 6s 复检失败项、每 5s 心跳探测后端，
   自动恢复后转绿收起。全程不改动 app.js 核心联动逻辑。 */
(function () {
  const $badge = document.getElementById("selfcheck");
  if (!$badge) return; // 仅大屏页启用
  if (location.protocol === "file:") {
    // 双击打开（file://）：浏览器禁止加载本地数据，自检无意义；由 guardfile.js 全屏指引接管
    $badge.className = "selfcheck sc-bad";
    $badge.textContent = "⚠";
    $badge.title = "双击打开（file://）无法加载数据 —— 请改用在线地址，或运行 python -m http.server 8000";
    return;
  }

  const $panel = document.getElementById("sc-panel");
  const WEEK_TIP = "系统自检";
  const state = { items: [], open: false, recoveredTimer: 0 };

  /* ---------- 工具 ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function fetchJson(url, ms) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms || 3000);
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  /* ---------- 8 项检核定义 ---------- */
  const MODULES = {
    ChartMap: "地图", ChartType: "门类", ChartBatch: "批次", ChartSex: "性别",
    ChartProv: "省份", ChartNation: "民族", ChartDecade: "年代", ChartBubble: "气泡",
  };
  const CHECKS = [
    {
      id: "backend", label: "后端连接",
      run: async () => {
        const d = await fetchJson("data/health.json", 3000);
        if (d.status !== "ok") throw new Error("status=" + d.status);
      },
      fix: "后端未启动 —— 在项目目录运行：cd backend → python app.py（该窗口别关）",
    },
    {
      id: "data", label: "数据文件",
      run: async () => {
        const d = await fetchJson("data/stats.json", 3000);
        if (!(d.overview && d.overview.inheritors_total > 0)) throw new Error("数据为空");
      },
      fix: "数据缺失/损坏 —— 运行 python backend/scraper/process.py 重新生成后重启后端",
    },
    {
      id: "echarts", label: "图表库",
      run: async () => { if (typeof window.echarts !== "object") throw new Error("echarts 未定义"); },
      fix: "echarts.min.js 加载失败 —— 检查 frontend/assets/vendor/echarts.min.js 是否存在",
    },
    {
      id: "modules", label: "图表模块",
      run: async () => {
        const miss = Object.keys(MODULES).filter((k) => !window[k]);
        if (miss.length) throw new Error("缺失：" + miss.map((k) => MODULES[k]).join("、"));
      },
      fix: "模块 JS 未加载 —— 检查 frontend/js/charts/ 下对应文件是否存在/报语法错误",
    },
    {
      id: "geo", label: "地图数据",
      run: async () => {
        const d = await fetchJson("assets/geo/china.json", 3000);
        if (!d || !d.features || !d.features.length) throw new Error("GeoJSON 为空");
      },
      fix: "地图 GeoJSON 缺失 —— 检查 frontend/assets/geo/china.json",
    },
    {
      id: "layout", label: "图表容器",
      run: async () => {
        await sleep(900); // 等待 boot() 完成初始化
        const boxes = document.querySelectorAll(".chart");
        const zero = [...boxes].filter((el) => el.clientWidth < 10 || el.clientHeight < 10);
        if (boxes.length && zero.length) throw new Error(`${zero.length} 个容器尺寸为 0`);
        if (Object.keys(window.Charts || {}).length < 8) throw new Error("图表实例未初始化");
      },
      fix: "容器尺寸异常/初始化未完成 —— 确认 CSS 已加载、窗口宽度足够，或刷新页面",
    },
    {
      id: "summary", label: "联动接口",
      run: async () => {
        const d = await fetchJson("data/summary_default.json", 3000);
        if (!Array.isArray(d.by_province)) throw new Error("返回结构异常");
      },
      fix: "聚合接口异常 —— 查看后端控制台报错，重启 python app.py",
    },
    {
      id: "init", label: "页面初始化",
      run: async () => {
        // boot() 是异步的：轮询等待筛选项与 KPI 就绪（最多 5 秒），避免加载期误报
        const sel = document.getElementById("f-type");
        const kpi = document.getElementById("kpi-total");
        for (let i = 0; i < 50; i++) {
          const optsOk = sel && sel.options.length > 1;
          const kpiOk = kpi && kpi.textContent.trim() && kpi.textContent.trim() !== "--";
          if (optsOk && kpiOk) return;
          await sleep(100);
        }
        if (!sel || sel.options.length <= 1) throw new Error("筛选选项未填充");
        throw new Error("KPI 未渲染");
      },
      fix: "启动时后端未就绪导致初始化中断 —— 后端恢复后点击「刷新页面」完成加载",
    },
  ];
  CHECKS.forEach((c) => (c.status = "run"));

  /* ---------- 渲染 ---------- */
  const bad = () => state.items.filter((i) => i.status === "bad");

  function render() {
    const fails = bad();
    // 徽章
    if (fails.length) {
      $badge.className = "selfcheck sc-bad";
      $badge.textContent = "⚠ " + fails.length;
      $badge.title = "自检发现异常，点击查看";
      openPanel(true);
    } else if (state.items.every((i) => i.status === "ok")) {
      $badge.className = "selfcheck sc-ok";
      $badge.textContent = "✓";
      $badge.title = WEEK_TIP + "：全部通过（点击查看详情）";
      if (state.open && state.items.length) {
        clearTimeout(state.recoveredTimer);
        state.recoveredTimer = setTimeout(() => openPanel(false), 1500);
      }
    } else {
      $badge.className = "selfcheck sc-run";
      $badge.textContent = "⟳";
      $badge.title = "自检进行中…";
    }
    // 面板
    const all = state.items.every((i) => i.status === "ok");
    $panel.className = "sc-panel" + (fails.length ? " sc-hasbad" : "");
    $panel.innerHTML =
      `<div class="sc-head"><b>${fails.length ? "⚠ 检核发现 " + fails.length + " 项异常" : "✓ 系统自检全部通过 " + state.items.filter((i) => i.status === "ok").length + "/" + state.items.length}</b>
       <span class="sc-time">${new Date().toLocaleTimeString("zh-CN", { hour12: false })}</span>
       <button class="sc-close" id="sc-close" title="收起">×</button></div>` +
      state.items.map((i) => `
        <div class="sc-item sc-i-${i.status === "ok" ? "ok" : i.status === "bad" ? "bad" : "run"}">
          <span class="sc-ico">${i.status === "ok" ? "✓" : i.status === "bad" ? "✕" : "…"}</span>
          <span class="sc-lb">${i.label}</span>
          <span class="sc-tx">${i.status === "ok" ? "正常" : i.status === "bad" ? esc(i.err || "异常") + `<span class="sc-fix">${esc(i.fix)}</span>` : "检测中…"}
          </span>
        </div>`).join("") +
      `<div class="sc-acts">
         <button class="sc-btn" id="sc-recheck">立即重检</button>
         <button class="sc-btn sc-btn-red" id="sc-reload">刷新页面</button>
       </div>`;
    document.getElementById("sc-close").onclick = () => openPanel(false);
    document.getElementById("sc-recheck").onclick = () => runAll(true);
    document.getElementById("sc-reload").onclick = () => location.reload();
    if (all) $panel.querySelector(".sc-acts").style.display = "none";
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function openPanel(v) {
    state.open = v;
    $panel.hidden = !v;
  }

  /* ---------- 执行 ---------- */
  async function runCheck(c) {
    c.status = "run";
    try {
      await c.run();
      c.status = "ok";
      c.err = "";
    } catch (e) {
      c.status = "bad";
      c.err = e && e.message ? e.message : String(e);
    }
    render(); // 逐项出结果：真故障即时亮红，不被慢检查拖住
    return c;
  }
  async function runAll(manual) {
    state.items = CHECKS;
    render();
    await Promise.all(CHECKS.map(runCheck));
    render();
    if (manual) openPanel(true);
  }
  async function recheckFailed() {
    const failed = CHECKS.filter((c) => c.status === "bad");
    if (!failed.length) return;
    await Promise.all(failed.map(runCheck));
    render();
  }

  /* ---------- 运行时守护 ---------- */
  // 1) summary 请求自动重试 1 次（瞬时故障自愈）
  if (window.API && window.API.summary) {
    const orig = window.API.summary;
    window.API.summary = async function (filter) {
      try {
        const r = await orig(filter);
        mark("summary", true);
        return r;
      } catch (e) {
        await sleep(500);
        try {
          const r = await orig(filter);
          mark("summary", true);
          return r;
        } catch (e2) {
          mark("summary", false, e2.message || "网络错误");
          throw e2;
        }
      }
    };
  }
  function mark(id, ok, err) {
    const c = CHECKS.find((x) => x.id === id);
    if (!c) return;
    if (ok && c.status === "bad") { c.status = "ok"; c.err = ""; render(); }
    else if (!ok && c.status !== "bad") { c.status = "bad"; c.err = err; render(); }
  }
  // 2) 后端心跳：连续 2 次失败才报警（防抖），恢复后自动转绿
  let hbMiss = 0;
  setInterval(async () => {
    try {
      const d = await fetchJson("data/health.json", 2500);
      if (d.status === "ok") { hbMiss = 0; mark("backend", true); }
    } catch (e) {
      hbMiss += 1;
      if (hbMiss >= 2) mark("backend", false, "后端无响应（心跳失败 ×2）");
    }
  }, 5000);
  // 3) 失败项每 6s 自动复检，无需人工
  setInterval(recheckFailed, 6000);
  // 4) 运行时 JS 报错兜底
  window.addEventListener("error", (e) => {
    let c = CHECKS.find((x) => x.id === "runtime");
    if (!c) {
      c = {
        id: "runtime", label: "运行时错误", status: "bad",
        err: e.message || "未知错误", status_: "",
        fix: "页面 JS 报错 —— 点「刷新页面」；持续出现请查看浏览器控制台",
      };
      CHECKS.push(c);
    }
    c.status = "bad";
    c.err = (e.message || "未知错误") + (e.filename ? " @" + e.filename.split("/").pop() : "");
    render();
  });

  /* ---------- 启动 ---------- */
  runAll(false);
})();
