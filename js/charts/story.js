/* 数据叙事：随筛选实时生成结论文字（谁在传承·谁已离去·结构如何） */
(function () {
  function pct(a, b) {
    return b ? ((a / b) * 100).toFixed(1) : "0.0";
  }

  window.Story = {
    update(summary, filter) {
      const el = document.getElementById("story");
      if (!el) return;
      const o = summary.overview || {};
      const total = o.inheritors_total || 0;
      const topProv = (summary.by_province || []).filter((r) => r.name !== "中直单位及其他")[0];
      const topType = (summary.by_type || [])[0];
      const topNation = (summary.by_nation || []).filter((r) => r.name !== "汉族" && r.name !== "未知")[0];
      const minorityPct = pct(o.minority || 0, total);

      const scope = filter.province || filter.type ||
        (filter.batch ? `第${filter.batch}批` : "") || "全国";
      const lines = [];

      lines.push(
        `<p><b class="s-gold">① 谁在传承：</b>当前视图「${scope}」共 <b>${window.fmt(total)}</b> 位国家级传承人，` +
        `其中 ${topProv ? `${topProv.name} 最多（${topProv.value} 人）` : "—"}，` +
        `${topType ? `${topType.name} 为主（${topType.value} 人）` : "—"}。</p>`
      );

      lines.push(
        `<p><b class="s-red">② 谁已离去：</b>文本可识别已故 <b>${window.fmt(o.deceased || 0)}</b> 人` +
        `${o.avg_age_at_death ? `，平均享年 ${o.avg_age_at_death} 岁` : ""}；` +
        `已知出生年份者 ${window.fmt(o.born_year_known || 0)} 人——老一辈大师正在远去，名录易增，“活”的传承难续。</p>`
      );

      lines.push(
        `<p><b class="s-teal">③ 结构如何：</b>女性占 ${pct(o.female || 0, total)}%，` +
        `少数民族传承人占 ${minorityPct}%（七人普少数民族人口占比 8.89%，` +
        `${Number(minorityPct) > 8.89 ? "非遗是民族文化多样性的富集切面" : "低于人口占比，提示资源分布不均"}）` +
        `${topNation ? `；${topNation.name} 为其人数最多的少数民族（${topNation.value} 人）` : ""}。</p>`
      );

      if (filter.province || filter.type || filter.batch || filter.sex) {
        lines.push(`<p class="s-hint">▲ 以上结论随筛选实时重算；点击标签 × 或“重置筛选”返回全国视图。</p>`);
      }

      el.innerHTML = lines.join("");
    },
  };
})();
