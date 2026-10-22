document.documentElement.classList.add('js');

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 背景非遗影像轮播：每 7 秒 crossfade，切页时暂停 */
  const slides = Array.from(document.querySelectorAll('.home-bg-slide'));
  if (slides.length > 1 && !reduce) {
    let idx = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[idx].classList.remove('on');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('on');
    }, 7000);
  }

  /* 金色粒子漩涡：向心汇聚，透明拖影不遮底 */
  const cv = document.getElementById('vortex');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w = 0;
    let h = 0;
    const resize = () => {
      w = cv.width = cv.clientWidth || window.innerWidth;
      h = cv.height = cv.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 100;
    const ps = [];
    const seed = (p) => {
      p.a = Math.random() * Math.PI * 2;
      p.r = Math.max(w, h) * (0.5 + Math.random() * 0.55);
      p.sp = 0.004 + Math.random() * 0.009;
      p.vr = 0.35 + Math.random() * 1.25;
      p.sz = 0.5 + Math.random() * 1.9;
      p.gold = Math.random() < 0.7;
      p.al = 0.15 + Math.random() * 0.38;
    };
    for (let i = 0; i < N; i++) {
      const p = {};
      seed(p);
      ps.push(p);
    }

    let rafId = 0;
    const frame = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const cx = w / 2;
      const cy = h * 0.46;
      for (const p of ps) {
        p.a += p.sp;
        p.r -= p.vr;
        if (p.r < 8) seed(p);
        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r * 0.6;
        if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
        ctx.globalAlpha = p.al;
        ctx.fillStyle = p.gold ? '#f2c14e' : '#4cc9b0';
        ctx.beginPath();
        ctx.arc(x, y, p.sz, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* 顶部动态通栏：静态接口填充 + CSS 无缝滚动（失败整条收起，不留加载中） */
  const ticker = document.getElementById('news-ticker');
  const track = document.getElementById('nt-track');
  const modal = document.getElementById('news-modal');
  let newsItems = [];

  /* 站内直达兜底：根绝对路由(/search)与旧缓存一律转同目录 .html，任何托管下都直达 */
  function resolveSiteLink(link) {
    if (!link || /^(https?:)?\/\//.test(link)) return link;
    const qi = link.indexOf('?');
    const path = qi >= 0 ? link.slice(0, qi) : link;
    const qs = qi >= 0 ? link.slice(qi) : '';
    if (!path.startsWith('/')) return link;
    const name = path.slice(1).replace(/\.html$/, '');
    return (name || 'index') + '.html' + qs;
  }

  function openNews(i) {
    const n = newsItems[i];
    if (!n || !modal) return;
    document.getElementById('nm-tag').textContent = n.tag;
    document.getElementById('nm-title').textContent = n.title;
    document.getElementById('nm-body').innerHTML = (n.body || []).map((t) => `<p>${t}</p>`).join('');
    document.getElementById('nm-src-name').textContent = n.source_name || '';
    const srcBtn = document.getElementById('nm-src-btn');
    srcBtn.href = n.source_url || '#';
    const linkBtn = document.getElementById('nm-link-btn');
    if (n.link) {
      linkBtn.href = resolveSiteLink(n.link);
      linkBtn.textContent = n.link_name || '站内直达';
      linkBtn.hidden = false;
    } else {
      linkBtn.hidden = true;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeNews() {
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-nm-close]')) closeNews();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeNews();
    });
  }

  if (ticker && track) {
    fetch('data/news.json')
      .then((r) => r.json())
      .then((d) => {
        const items = (d && d.data) || [];
        if (!items.length) throw new Error('empty');
        newsItems = items;
        const html = items
          .map((n, i) => `<span class="nt-item" data-i="${i}" role="button" tabindex="0"><b>${n.tag}</b>${n.title}</span>`)
          .join('');
        track.innerHTML = html + html;
        track.addEventListener('click', (e) => {
          const el = e.target.closest('.nt-item');
          if (el) openNews(+el.dataset.i);
        });
      })
      .catch(() => ticker.classList.add('nt-off'));
  }

  /* 时间轴：1.5 秒起每 350ms 点亮一个节点，轴线同步展开 */
  const nodes = document.querySelectorAll('.t-node');
  const line = document.querySelector('.tl-line');
  if (nodes.length) {
    if (reduce) {
      nodes.forEach((n) => n.classList.add('on'));
      if (line) line.classList.add('on');
    } else {
      setTimeout(() => {
        if (line) line.classList.add('on');
        nodes.forEach((n, i) => setTimeout(() => n.classList.add('on'), i * 350));
      }, 1500);
    }
  }
})();
