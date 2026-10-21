/* 前端数据层：静态版 —— 本地数据聚合，接口签名与 Flask 版一致 */
(function (global) {
  const cache = {};
  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(`data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`data/${name}.json -> ${r.status}`);
        return r.json();
      });
    }
    return cache[name];
  }

  const TYPE_ORDER = ["民间文学", "传统音乐", "传统舞蹈", "传统戏剧", "曲艺",
    "传统体育、游艺与杂技", "传统美术", "传统技艺", "传统医药", "民俗"];

  function filterInh(rows, f) {
    f = f || {};
    return rows.filter((r) =>
      (!f.province || r.province === f.province) &&
      (!f.type || r.type === f.type) &&
      (!f.batch || String(r.batch === undefined || r.batch === null ? "" : r.batch) === String(f.batch)) &&
      (!f.sex || r.sex === f.sex) &&
      (!f.nation || r.nation === f.nation));
  }

  function cnt(rows, key) {
    const m = new Map();
    rows.forEach((r) => {
      const v = r[key];
      const k = (v === undefined || v === null || v === "") ? "未知" : v;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }

  function summarize(records, f, prjRows) {
    const province = (f && f.province) || "";
    const itype = (f && f.type) || "";
    const prj = prjRows.filter((p) =>
      (!province || p.province === province) && (!itype || p.type === itype));
    const prjType = new Map();
    prj.forEach((p) => prjType.set(p.type, (prjType.get(p.type) || 0) + 1));
    const deceased = records.filter((r) => r.year_died);
    const ages = deceased.filter((r) => r.year_born).map((r) => r.year_died - r.year_born);
    const provinces = new Set(records.map((r) => r.province));
    provinces.delete("中直单位及其他");
    const decades = new Map();
    records.forEach((r) => {
      if (r.year_born) {
        const k = `${Math.floor(r.year_born / 10) * 10}年代`;
        decades.set(k, (decades.get(k) || 0) + 1);
      }
    });
    return {
      filtered_total: records.length,
      overview: {
        inheritors_total: records.length,
        male: records.filter((r) => r.sex === "男").length,
        female: records.filter((r) => r.sex === "女").length,
        deceased: deceased.length,
        minority: records.filter((r) => r.nation !== "汉族").length,
        avg_age_at_death: ages.length
          ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : null,
        born_year_known: records.filter((r) => r.year_born).length,
        provinces: provinces.size,
      },
      by_type: cnt(records, "type"),
      by_batch: cnt(records, "batch_label")
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)),
      by_province: cnt(records, "province"),
      by_sex: cnt(records, "sex"),
      by_nation: cnt(records, "nation"),
      projects_by_type: TYPE_ORDER.map((t) => ({ name: t, value: prjType.get(t) || 0 })),
      projects_total: prj.length,
      by_decade: [...decades.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([name, value]) => ({ name, value })),
    };
  }

  global.API = {
    health: async () => {
      const [inh, prj] = await Promise.all([load("inheritors"), load("projects")]);
      return { status: "ok", inheritors: inh.length, projects: prj.length };
    },
    stats: () => load("stats"),
    news: () => load("news"),
    summary: async (filter) => {
      const [inh, prj] = await Promise.all([load("inheritors"), load("projects")]);
      return summarize(filterInh(inh, filter || {}), filter || {}, prj);
    },
    inheritors: async (filter) => {
      const inh = await load("inheritors");
      const f = filter || {};
      const rows = filterInh(inh, f);
      return { total: rows.length, items: rows.slice(f.offset || 0, (f.offset || 0) + (f.limit || 200)) };
    },
    projects: async (filter) => {
      const prj = await load("projects");
      const f = filter || {};
      const rows = prj.filter((p) => (!f.type || p.type === f.type) && (!f.province || p.province === f.province));
      return { total: rows.length, items: rows.slice(0, f.limit || 200) };
    },
    search: async (params) => {
      const p = params || {};
      const q = (p.q || "").trim();
      if (!q) return { total: 0, items: [] };
      const know = await load("knowledge");
      const kind = (p.kind || "all").trim();
      const itype = (p.type || "").trim();
      const limit = Math.max(1, Math.min(p.limit || 20, 500));
      const ql = q.toLowerCase();
      const hits = [];
      for (const r of know) {
        if ((kind === "project" || kind === "inheritor") && r.kind !== kind) continue;
        if (itype && r.type !== itype) continue;
        const nameHit = r.name.toLowerCase().includes(ql);
        const textIdx = r.text.toLowerCase().indexOf(ql);
        if (!nameHit && textIdx < 0) continue;
        let snippet;
        if (textIdx >= 0) {
          const start = Math.max(0, textIdx - 60);
          const end = Math.min(r.text.length, textIdx + q.length + 60);
          snippet = (start > 0 ? "…" : "") + r.text.slice(start, end) + (end < r.text.length ? "…" : "");
        } else {
          snippet = r.text.slice(0, 120) + (r.text.length > 120 ? "…" : "");
        }
        hits.push({
          kind: r.kind, id: r.id, name: r.name, type: r.type, province: r.province,
          region: r.region, batch_label: r.batch_label, extra: r.extra, snippet,
          score: (nameHit ? 2 : 0) + (textIdx >= 0 ? 1 : 0),
        });
      }
      hits.sort((a, b) =>
        (b.score - a.score) ||
        (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0) ||
        (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      return { total: hits.length, items: hits.slice(0, limit) };
    },
    knowledge: async (id) => {
      const know = await load("knowledge");
      return know.find((r) => r.id === id) || {};
    },
  };
})(window);
