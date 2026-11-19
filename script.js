(function () {
  const book = document.getElementById('book');
  const pages = Array.from(book.querySelectorAll('.page'));
  const photos = pages.filter(function (p) { return p.classList.contains('photo'); });
  const last = pages.length - 1;
  const counter = document.getElementById('counter');
  const bar = document.getElementById('bar');
  const prevBtn = document.querySelector('[data-action="prev"]');
  const nextBtn = document.querySelector('.controls [data-action="next"]');
  const overlay = document.getElementById('overlay');
  const thumbs = document.getElementById('thumbs');
  const fsBtn = document.getElementById('fsBtn');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = reduce ? 20 : 800;

  let cur = 0;
  let busy = false;

  function label(i) {
    const p = pages[i];
    return p.classList.contains('photo') ? (photos.indexOf(p) + 1) + ' / ' + photos.length : p.dataset.label;
  }

  // make sure the pages around the current one are loaded
  function warm(i) {
    for (let k = i - 1; k <= i + 2; k++) {
      const img = pages[k] && pages[k].querySelector('img');
      if (img) img.loading = 'eager';
    }
  }

  function render() {
    counter.textContent = label(cur);
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === last;
    bar.style.width = (cur / last * 100) + '%';
    try { history.replaceState(null, '', '#' + cur); } catch (e) {}
    warm(cur);
  }

  function go(to) {
    to = Math.max(0, Math.min(last, to));
    if (busy || to === cur) return;
    busy = true;
    const out = pages[cur];
    const inc = pages[to];

    if (to > cur) {
      // current page lifts and turns away, revealing the next one underneath
      inc.classList.add('under');
      out.classList.add('flip-out');
      setTimeout(function () {
        out.classList.remove('current', 'flip-out');
        inc.classList.remove('under');
        inc.classList.add('current');
        busy = false;
      }, SPEED);
    } else {
      // previous page swings back over the current one
      out.classList.remove('current');
      out.classList.add('under');
      inc.classList.add('flip-in');
      setTimeout(function () {
        inc.classList.remove('flip-in');
        inc.classList.add('current');
        out.classList.remove('under');
        busy = false;
      }, SPEED);
    }
    cur = to;
    render();
  }

  // ---- buttons (prev / next / first) ----
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    go(a === 'next' ? cur + 1 : a === 'prev' ? cur - 1 : 0);
  });

  // ---- click the left/right half of the page to turn ----
  book.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;
    const r = book.getBoundingClientRect();
    go(cur + (e.clientX - r.left < r.width / 2 ? -1 : 1));
  });

  // ---- keyboard ----
  document.addEventListener('keydown', function (e) {
    if (!overlay.hidden) {
      if (e.key === 'Escape') closeGrid();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(last);
  });

  // ---- swipe ----
  let sx = null, sy = null;
  book.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  book.addEventListener('touchend', function (e) {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    sx = sy = null;
  });

  // ---- all-pages overlay ----
  photos.forEach(function (p, k) {
    const n = String(k + 1).padStart(2, '0');
    const b = document.createElement('button');
    b.className = 'thumb';
    b.type = 'button';
    b.innerHTML = '<img src="images/thumbs/' + n + '.jpg" alt="" loading="lazy"><span>' + n + '</span>';
    b.addEventListener('click', function () { closeGrid(); go(pages.indexOf(p)); });
    thumbs.appendChild(b);
  });

  function openGrid() {
    Array.from(thumbs.children).forEach(function (b, k) {
      b.setAttribute('aria-current', pages.indexOf(photos[k]) === cur ? 'true' : 'false');
    });
    overlay.hidden = false;
    document.getElementById('closeBtn').focus();
  }
  function closeGrid() {
    overlay.hidden = true;
    document.getElementById('gridBtn').focus();
  }
  document.getElementById('gridBtn').addEventListener('click', openGrid);
  document.getElementById('closeBtn').addEventListener('click', closeGrid);

  // ---- full screen ----
  if (!document.documentElement.requestFullscreen) {
    fsBtn.hidden = true;
  } else {
    fsBtn.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
  }

  // ---- open at #page from the address bar ----
  const start = parseInt(location.hash.slice(1), 10);
  if (start > 0 && start <= last) {
    pages[0].classList.remove('current');
    pages[start].classList.add('current');
    cur = start;
  }
  render();

  // follow #page changes typed into the address bar
  window.addEventListener('hashchange', function () {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) go(n);
  });
})();
