/* ============================================================
   BreakGG — page behaviour
   ============================================================ */
import { initStage } from "./scene.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- deterministic node data ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1337);
const CITIES = [
  ["Ashburn", "US-E"], ["Dallas", "US-C"], ["Los Angeles", "US-W"], ["Seattle", "US-W"], ["Chicago", "US-C"],
  ["Miami", "US-E"], ["Denver", "US-W"], ["Phoenix", "US-W"], ["Atlanta", "US-E"], ["Boston", "US-E"],
  ["New York", "US-E"], ["Houston", "US-C"], ["Toronto", "CA"], ["London", "UK"], ["Manchester", "UK"],
  ["Frankfurt", "DE"], ["Berlin", "DE"], ["Munich", "DE"], ["Amsterdam", "NL"], ["Paris", "FR"],
  ["Madrid", "ES"], ["Milan", "IT"], ["Stockholm", "SE"], ["Oslo", "NO"], ["Warsaw", "PL"],
  ["Prague", "CZ"], ["Vienna", "AT"], ["Zurich", "CH"], ["Lisbon", "PT"], ["Dublin", "IE"],
  ["Singapore", "SG"], ["Tokyo", "JP"], ["Osaka", "JP"], ["Seoul", "KR"], ["Sydney", "AU"],
  ["Melbourne", "AU"], ["Auckland", "NZ"], ["Mumbai", "IN"], ["Delhi", "IN"], ["Bangalore", "IN"],
  ["São Paulo", "BR"], ["Mexico City", "MX"], ["Cape Town", "ZA"], ["Lagos", "NG"], ["Nairobi", "KE"],
  ["Dubai", "AE"], ["Tel Aviv", "IL"], ["Istanbul", "TR"], ["Helsinki", "FI"], ["Reykjavík", "IS"],
];
const PROTOS = ["GGX-TUN", "GGX-TUN", "GGX-TUN", "HTTPS", "WSS", "SOCKS5"];
const NODES = Array.from({ length: 100 }, (_, i) => {
  const [city, reg] = CITIES[i % CITIES.length];
  const num = String(1 + Math.floor(i / CITIES.length) * 7 + Math.floor(rnd() * 6)).padStart(2, "0");
  const r = rnd();
  return {
    id: i + 1,
    code: city.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X") + "-" + num,
    node: city + " · " + reg,
    proto: PROTOS[Math.floor(rnd() * PROTOS.length)],
    lat: 16 + Math.round(rnd() * 110),
    up: (97 + rnd() * 3).toFixed(1),
    tested: 1 + Math.floor(rnd() * 340),
    status: r < 0.9 ? "online" : r < 0.96 ? "busy" : "rot",
  };
});

/* ---------- header ---------- */
const head = $(".site-head");
addEventListener("scroll", () => head.classList.toggle("scrolled", scrollY > 30), { passive: true });

const burger = $("#burger"), mnav = $("#mobileNav");
burger.addEventListener("click", () => {
  const open = mnav.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
});
mnav.addEventListener("click", (e) => {
  if (e.target.closest("a")) { mnav.classList.remove("open"); burger.classList.remove("open"); }
});

/* ---------- nav active state ---------- */
const navLinks = $$(".nav a");
const secs = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
const secObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
secs.forEach((s) => secObs.observe(s));

/* ---------- reveals ---------- */
const revObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
$$("[data-reveal], .stagger").forEach((el) => revObs.observe(el));

/* ---------- scramble decode ---------- */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";
function scramble(el, delay = 0) {
  const final = el.textContent;
  if (reduced) return;
  const queue = [...final].map((ch, i) => ({ ch, start: Math.floor(i * 1.6 + Math.random() * 8), end: Math.floor(i * 1.6 + 12 + Math.random() * 14) }));
  let frame = 0;
  el.textContent = "";
  setTimeout(() => {
    const id = setInterval(() => {
      let out = "";
      let done = 0;
      queue.forEach((q) => {
        if (frame >= q.end) { out += q.ch; done++; }
        else if (frame >= q.start) { out += q.ch === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }
        else out += q.ch === " " ? " " : "\u00a0";
      });
      el.textContent = out;
      if (done === queue.length) clearInterval(id);
      frame++;
    }, 28);
  }, delay);
}
const scrObs = new IntersectionObserver((es) => {
  es.forEach((e, i) => {
    if (e.isIntersecting) { scramble(e.target, i * 260); scrObs.unobserve(e.target); }
  });
}, { threshold: 0.4 });
$$("[data-scramble]").forEach((el) => scrObs.observe(el));

/* ---------- counters ---------- */
const cntObs = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count;
    cntObs.unobserve(el);
    if (reduced) { el.textContent = target.toLocaleString(); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach((el) => cntObs.observe(el));

/* ---------- 3D stage ---------- */
const stageApi = initStage($("#stage"));
$("#spinBtn")?.addEventListener("click", (e) => { e.preventDefault(); stageApi.spin(); $("#stage").scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); });

/* ---------- ticker + marquee ---------- */
const tickItems = NODES.slice(0, 26).map((n) => {
  const cls = n.status === "online" ? "ok" : n.status === "busy" ? "warn" : "";
  const label = n.status === "online" ? "ONLINE" : n.status === "busy" ? "BUSY" : "ROTATING";
  return `<span class="ticker-item"><i></i><b>${n.code}</b> ${n.lat}ms <span class="${cls}">${label}</span></span>`;
}).join("");
$("#ticker").innerHTML = tickItems + tickItems;

const MQ = ["Tested every 6 hours", "No dead nodes. Ever.", "Name your own proxy", "Partial or permanent — your call", "Done-for-you sessions", "Rollback guides included", "Humans answer at 11pm"];
const star = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 0l1.9 5.6L15 7.5l-5.6 1.9L7.5 15l-1.9-5.6L0 7.5l5.6-1.9z"/></svg>`;
const mqItems = MQ.map((m) => `<span class="mq">${m} ${star}</span>`).join("");
$("#marquee").innerHTML = mqItems + mqItems;

/* ---------- proxy wall table ---------- */
const body = $("#wallBody");
let sortKey = "id", sortDir = 1, filter = "all", query = "";

const stLabel = { online: "Online", busy: "Busy", rot: "Rotating" };
function latBar(n) {
  const pct = Math.max(8, 100 - n.lat * 0.72);
  return `<span class="bar${n.lat > 70 ? " mid" : ""}"><i style="width:${pct}%"></i></span>${n.lat}ms`;
}
function testedLabel(m) { return m < 1 ? "just now" : m < 60 ? m + "m ago" : Math.floor(m / 60) + "h " + (m % 60) + "m ago"; }

function renderWall() {
  let rows = NODES.filter((n) => (filter === "all" || n.status === filter));
  if (query) rows = rows.filter((n) => (n.node + n.code + n.proto).toLowerCase().includes(query));
  rows.sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * sortDir;
  });
  body.innerHTML = rows.map((n) => `
    <tr data-id="${n.id}">
      <td><em style="color:#55616c">${String(n.id).padStart(3, "0")}</em></td>
      <td class="node">${n.code} <em>· ${n.node}</em></td>
      <td>${n.proto}</td>
      <td>${latBar(n)}</td>
      <td>${n.up}%</td>
      <td>${testedLabel(n.tested)}</td>
      <td><span class="st ${n.status}"><i></i>${stLabel[n.status]}</span></td>
    </tr>`).join("");
  $("#wallCount").textContent = rows.length;
}
renderWall();

$("#wallSearch").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderWall(); });
$("#wallSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#wallSeg button").forEach((x) => x.classList.toggle("on", x === b));
  filter = b.dataset.f; renderWall();
});
$$("table.wall thead th").forEach((th) => th.addEventListener("click", () => {
  const k = th.dataset.sort;
  if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
  renderWall();
}));

/* sweep animation */
const retestBtn = $("#retest");
retestBtn.addEventListener("click", () => {
  if (retestBtn.classList.contains("busy")) return;
  retestBtn.classList.add("busy");
  retestBtn.querySelector("svg").style.display = "";
  retestBtn.querySelector("span").textContent = "Sweeping…";
  const ids = $$("#wallBody tr").map((tr) => tr.dataset.id);
  ids.forEach((id, i) => {
    setTimeout(() => {
      const tr = $('#wallBody tr[data-id="' + id + '"]');
      if (tr) tr.classList.add("testing");
      setTimeout(() => {
        const n = NODES.find((x) => x.id == id);
        if (n) {
          n.lat = Math.max(14, n.lat + Math.round((Math.random() - 0.52) * 18));
          n.tested = 0;
          if (n.status === "busy" && Math.random() < 0.4) n.status = "online";
        }
        renderWall();
      }, 260);
    }, i * 14);
  });
  setTimeout(() => {
    retestBtn.classList.remove("busy");
    retestBtn.querySelector("svg").style.display = "none";
    retestBtn.querySelector("span").textContent = "Run sweep";
    setCycle(new Date());
    sinceMin = 0; paintSince();
  }, ids.length * 14 + 400);
});

/* test-cycle panel + countdown */
function setCycle(now) {
  const last = new Date(now.getTime() - 2 * 60000);
  const next = new Date(last.getTime() + 6 * 3600000);
  const fmt = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const el = (s) => $(s);
  if (el("[data-cycle-last]")) el("[data-cycle-last]").textContent = fmt(last);
  if (el("[data-cycle-next]")) el("[data-cycle-next]").textContent = fmt(next);
  const swap = 5 + Math.floor(Math.random() * 5);
  if (el("[data-cycle-swap]")) el("[data-cycle-swap]").textContent = swap;
  if (el("[data-cycle-lat]")) el("[data-cycle-lat]").textContent = 38 + Math.floor(Math.random() * 7) + "ms";
  $("#wallSwap").textContent = swap;
  window.__nextSweep = next;
  paintCountdown();
}
function paintCountdown() {
  const next = window.__nextSweep; if (!next) return;
  let m = Math.max(0, Math.round((next - Date.now()) / 60000));
  const h = Math.floor(m / 60); m %= 60;
  const el = $("#wallNext"); if (el) el.textContent = h + "h " + String(m).padStart(2, "0") + "m";
}
setCycle(new Date());
setInterval(paintCountdown, 30000);

let sinceMin = 4;
function paintSince() { $$("[data-since]").forEach((e) => (e.textContent = sinceMin < 1 ? "just now" : sinceMin + " min")); }
paintSince();
setInterval(() => { sinceMin++; paintSince(); }, 60000);

/* ---------- name builder ---------- */
const RESERVED = ["admin", "breakgg", "proxy", "support", "wall", "null", "test", "root", "gg", "staff"];
const nameInput = $("#nameInput");
const pvBadge = $("#pvBadge"), pvName = $("#pvName"), pvUrl = $("#pvUrl"), pvAvail = $("#pvAvail");
let badgeColor = "#ff4a1c";

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 18); }
function paintName() {
  const raw = slug(nameInput.value);
  const name = raw || "your-proxy";
  pvName.textContent = name;
  pvUrl.textContent = "https://" + name + ".breakgg.link";
  pvBadge.textContent = (raw[0] || "?").toUpperCase();
  pvBadge.style.background = badgeColor;
  const taken = RESERVED.includes(raw);
  pvAvail.textContent = !raw ? "✓ name available" : taken ? "✗ “" + raw + "” is taken — try another" : "✓ “" + raw + "” is available";
  pvAvail.classList.toggle("no", taken);
}
nameInput.addEventListener("input", paintName);
paintName();
$("#swatches").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#swatches button").forEach((x) => x.classList.toggle("on", x === b));
  badgeColor = b.dataset.c; paintName();
});
$("#copyUrl").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(pvUrl.textContent); } catch { /* noop */ }
  const old = btn.textContent;
  btn.textContent = "Copied ✓";
  setTimeout(() => (btn.textContent = old), 1400);
});

/* ---------- FAQ ---------- */
$$(".faq-item").forEach((item) => {
  item.querySelector(".faq-q").addEventListener("click", () => {
    const open = item.classList.contains("open");
    $$(".faq-item.open").forEach((o) => o.classList.remove("open"));
    if (!open) item.classList.add("open");
  });
});

/* ---------- CTA form ---------- */
$("#ctaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#ctaEmail").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
    $("#ctaEmail").focus();
    $("#ctaEmail").style.borderColor = "#180702";
    $("#ctaEmail").placeholder = "that email looks off — try again?";
    $("#ctaEmail").value = "";
    return;
  }
  $("#ctaForm").style.display = "none";
  $("#ctaOk").classList.add("show");
});

/* ---------- sticky deck: subtle depth while stacked ---------- */
const plans = $$("#deck .plan");
if (plans.length && !reduced) {
  const onScroll = () => {
    plans.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      const stuck = r.top <= 90 + i * 14 + 4;
      p.style.boxShadow = stuck ? "0 -18px 44px -20px rgba(10,12,15,.5)" : "";
      p.style.filter = stuck ? "saturate(.96)" : "";
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
