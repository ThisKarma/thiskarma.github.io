(() => {
  const root = document.body.dataset.root || "";

  /* ---------- просмотр картинок */
  const lb = document.querySelector(".lightbox");
  const lbImg = lb.querySelector("img");
  const lbCount = lb.querySelector(".lb-count");
  let list = [], pos = 0;
  const show = () => {
    lbImg.src = list[pos];
    lbCount.textContent = list.length > 1 ? `${pos + 1} / ${list.length}` : "";
  };
  document.addEventListener("click", (ev) => {
    const z = ev.target.closest(".zoom");
    if (!z) return;
    ev.preventDefault();
    const group = z.dataset.group || "";
    const all = [...document.querySelectorAll(".zoom")].filter((x) => (x.dataset.group || "") === group);
    list = all.map((x) => x.dataset.full);
    pos = all.indexOf(z);
    show();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  });
  const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
  const step = (d) => { pos = (pos + d + list.length) % list.length; show(); };
  lb.querySelector(".lb-close").onclick = close;
  lb.querySelector(".lb-prev").onclick = (e) => { e.stopPropagation(); step(-1); };
  lb.querySelector(".lb-next").onclick = (e) => { e.stopPropagation(); step(1); };
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------- фильтры на странице карты */
  const filters = document.querySelectorAll(".filter");
  if (filters.length) {
    const state = {};
    const apply = () => {
      let visible = 0;
      document.querySelectorAll(".card").forEach((c) => {
        const ok = Object.entries(state).every(([k, v]) => !v || c.dataset[k] === v);
        c.hidden = !ok;
        if (ok) visible++;
      });
      document.querySelectorAll(".team-group").forEach((g) => {
        g.hidden = ![...g.querySelectorAll(".card")].some((c) => !c.hidden);
      });
      const empty = document.querySelector(".empty");
      if (empty) empty.hidden = visible > 0;
    };
    filters.forEach((f) => {
      f.addEventListener("click", (e) => {
        const b = e.target.closest(".fchip");
        if (!b) return;
        f.querySelectorAll(".fchip").forEach((x) => x.classList.toggle("active", x === b));
        state[f.dataset.attr] = b.dataset.value;
        apply();
      });
    });
  }

  /* ---------- поиск на главной */
  const input = document.querySelector(".search input");
  if (input && window.TACTICS) {
    const out = document.querySelector(".search-results");
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const norm = (s) => s.toLowerCase().replace(/ё/g, "е");
    const docs = window.TACTICS.map((t) => ({ t, hay: norm([t.t, t.s, t.m, t.team, t.type, t.tags.join(" "), t.x].join(" ")) }));
    const run = () => {
      const words = norm(input.value).split(/\s+/).filter(Boolean);
      if (!words.length) { out.hidden = true; out.innerHTML = ""; return; }
      const hits = docs.filter((d) => words.every((w) => d.hay.includes(w))).slice(0, 24);
      out.hidden = false;
      out.innerHTML = hits.length ? hits.map(({ t }) => `
        <a class="card" href="${root}${t.u}">
          <div class="card-img"><img src="${root}${esc(t.img)}" alt=""></div>
          <div class="card-body"><p class="eyebrow">${esc(t.m)} · ${esc(t.team)}</p><h3>${esc(t.t)}</h3>
          ${t.s ? `<p class="card-sub">${esc(t.s)}</p>` : ""}</div></a>`).join("")
        : `<p class="muted center" style="grid-column:1/-1">Ничего не найдено</p>`;
    };
    input.addEventListener("input", run);
    if (location.hash === "#search") input.focus();
  }

  /* ---------- автообновление, когда сайт открыт через локальный сервер */
  if (location.protocol.startsWith("http")) {
    let v = null;
    const check = () => fetch(root + "version.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (v !== null && d.v !== v) location.reload(); v = d.v; })
      .catch(() => {});
    check();
    setInterval(check, 3000);
  }
})();
