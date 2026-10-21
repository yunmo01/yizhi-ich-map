/* 资料查询：全文检索 / 结果展开 */
(function () {
  const state = { kind: "all", type: "" };
  const $q = document.getElementById("q");
  const $list = document.getElementById("result-list");
  const $count = document.getElementById("result-count");
  const $meta = document.getElementById("search-meta");
  const $type = document.getElementById("f-type");

  const TYPES = ["民间文学", "传统音乐", "传统舞蹈", "传统戏剧", "曲艺",
    "传统体育、游艺与杂技", "传统美术", "传统技艺", "传统医药", "民俗"];
  TYPES.forEach((t) => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    $type.appendChild(o);
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function mark(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) +
      "</mark>" + esc(text.slice(i + q.length));
  }

  function officialUrl(it) {
    return it.kind === "project"
      ? `https://www.ihchina.cn/project_details/${it.id}.html`
      : `https://www.ihchina.cn/ccr_detail/${it.id}.html`;
  }

  function badges(it) {
    const kind = it.kind === "project" ? "项目" : "传承人";
    const kcls = it.kind === "project" ? "b-proj" : "b-inh";
    const bits = [`<em class="rb ${kcls}">${kind}</em>`,
      `<em class="rb">${esc(it.type)}</em>`,
      `<em class="rb">${esc(it.province)}</em>`];
    if (it.batch_label) bits.push(`<em class="rb rb-batch">${esc(it.batch_label)}</em>`);
    if (it.extra) bits.push(`<em class="rb rb-extra">${esc(it.extra)}</em>`);
    return bits.join("");
  }

  async function search() {
    const q = $q.value.trim();
    if (!q) {
      $list.innerHTML = '<div class="result-empty">输入关键词开始检索，试试「苗族古歌」「昆曲」「侗族大歌」</div>';
      $count.textContent = "";
      $meta.textContent = "支持按名称、地区、简介正文检索 · 语料来自中国非物质文化遗产网公开数据";
      return;
    }
    $list.innerHTML = '<div class="result-empty">检索中…</div>';
    const data = await API.search({ q, kind: state.kind, type: state.type, limit: 500 });
    $count.textContent = data.total ? `命中 ${data.total} 条` : "";
    $meta.textContent = data.total
      ? `「${q}」命中 ${data.total} 条 · 点击卡片可展开官方简介全文`
      : `「${q}」无命中 · 可尝试更短的关键词，或访问底部官方链接`;
    if (!data.items.length) {
      $list.innerHTML = '<div class="result-empty">无结果，换个关键词试试</div>';
      return;
    }
    $list.innerHTML = data.items.map((it, i) => `
      <article class="result-card" data-i="${i}">
        <div class="rc-head" data-id="${esc(it.id)}" data-kind="${esc(it.kind)}">
          <h3>${mark(it.name, q)}</h3>
          <div class="rc-badges">${badges(it)}</div>
          <a class="rc-link" href="${officialUrl(it)}" target="_blank" rel="noopener" title="在中国非物质文化遗产网查看详情">官网详情 ↗</a>
          <span class="rc-toggle">展开全文 ▾</span>
        </div>
        <p class="rc-snippet">${mark(it.snippet, q)}</p>
        <div class="rc-full" hidden></div>
      </article>`).join("");

    $list.querySelectorAll(".rc-link").forEach((a) =>
      a.addEventListener("click", (e) => e.stopPropagation()));

    $list.querySelectorAll(".rc-head").forEach((head) => {
      head.addEventListener("click", async () => {
        const card = head.closest(".result-card");
        const full = card.querySelector(".rc-full");
        const tog = card.querySelector(".rc-toggle");
        if (!full.hidden) {
          full.hidden = true; tog.textContent = "展开全文 ▾"; return;
        }
        if (!full.dataset.loaded) {
          full.innerHTML = "<em>加载中…</em>";
          full.hidden = false;
          const rec = await API.knowledge(head.dataset.id);
          const url = officialUrl({ id: head.dataset.id, kind: head.dataset.kind });
          full.innerHTML = esc(rec.text || "（无简介）").replace(/\n/g, "<br>") +
            `<div class="rc-src">站内为公开简介摘录 · 深度内容（保护单位、相关资讯/学术等）请访问 <a href="${url}" target="_blank" rel="noopener">中国非物质文化遗产网官网详情页 ↗</a></div>`;
          full.dataset.loaded = "1";
        }
        full.hidden = false; tog.textContent = "收起 ▴";
      });
    });
  }

  document.getElementById("btn-search").addEventListener("click", search);
  $q.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
  document.querySelectorAll(".kind-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".kind-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.kind = btn.dataset.kind;
      if ($q.value.trim()) search();
    });
  });
  $type.addEventListener("change", () => {
    state.type = $type.value;
    if ($q.value.trim()) search();
  });
  const qs = new URLSearchParams(location.search);
  if (qs.get("q")) {
    $q.value = qs.get("q");
    if (qs.get("kind") && ["all", "project", "inheritor"].includes(qs.get("kind"))) {
      state.kind = qs.get("kind");
      document.querySelectorAll(".kind-tab").forEach((b) =>
        b.classList.toggle("active", b.dataset.kind === state.kind));
    }
    search();
  } else {
    $q.focus();
  }
})();
