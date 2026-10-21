/* 实时时间戳：大屏右上角每秒刷新（独立模块，不依赖核心联动逻辑） */
(function () {
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
  const $clock = document.getElementById("clock");
  if (!$clock) return;

  function tick() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    $clock.innerHTML =
      `<b>${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}</b>` +
      ` <i>${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}</i>` +
      `<em>周${WEEK[d.getDay()]}</em>`;
  }
  tick();
  setInterval(tick, 1000);
})();
