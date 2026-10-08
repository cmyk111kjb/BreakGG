/* ============================================================
   BreakGG — RIG-01: interactive 3D chromebook
   Drag to rotate · inertia · idle auto-spin · live screen UI
   ============================================================ */
import * as THREE from "../vendor/three.module.min.js";

const SCREEN_W = 1024;
const SCREEN_H = 640;

function makeEnvTexture(renderer) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "#2a3542");
  g.addColorStop(0.5, "#11161c");
  g.addColorStop(1, "#05070a");
  x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  // studio softboxes
  const blob = (bx, by, r, col) => {
    const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = rg; x.fillRect(bx - r, by - r, r * 2, r * 2);
  };
  blob(60, 26, 46, "rgba(255,255,255,0.95)");
  blob(190, 34, 40, "rgba(255,120,70,0.8)");
  blob(128, 108, 60, "rgba(70,110,150,0.45)");
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

/* ---------- keyboard / trackpad texture ---------- */
function makeDeckTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 640;
  const x = c.getContext("2d");
  x.fillStyle = "#171b20"; x.fillRect(0, 0, 1024, 640);
  // keys
  const cols = 15, rows = 5;
  const kw = 58, kh = 52, gap = 8;
  const startX = (1024 - (cols * (kw + gap) - gap)) / 2;
  const startY = 26;
  x.fillStyle = "#22272d";
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const w = r === 4 && i > 4 && i < 10 ? kw * 2 + gap : kw;
      const px = startX + i * (kw + gap) + (r === 4 && i >= 10 ? (kw + gap) * 5 : 0);
      const py = startY + r * (kh + gap);
      if (px + w > 1024 - startX) continue;
      roundRect(x, px, py, w, kh, 7); x.fill();
    }
  }
  // subtle key tops
  x.fillStyle = "rgba(255,255,255,0.045)";
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const px = startX + i * (kw + gap);
      const py = startY + r * (kh + gap);
      roundRect(x, px + 3, py + 3, kw - 6, kh - 12, 5); x.fill();
    }
  }
  // trackpad
  x.fillStyle = "#1d2228";
  roundRect(x, 512 - 130, 356, 260, 170, 12); x.fill();
  x.strokeStyle = "rgba(255,255,255,0.07)"; x.lineWidth = 2;
  roundRect(x, 512 - 130, 356, 260, 170, 12); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function roundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

/* ---------- animated screen UI ---------- */
function makeScreen() {
  const c = document.createElement("canvas");
  c.width = SCREEN_W; c.height = SCREEN_H;
  const x = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const nodes = [
    ["ASH-04", 21], ["FRA-11", 34], ["SIN-02", 48], ["LAX-07", 26],
    ["LHR-03", 39], ["TYO-09", 55], ["SYD-01", 61], ["AMS-05", 31],
  ];
  let scan = 0;
  let tick = 0;

  function draw() {
    // bg
    x.fillStyle = "#0b0f14"; x.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // sidebar
    x.fillStyle = "#10161d"; x.fillRect(0, 0, 250, SCREEN_H);
    x.fillStyle = "#ff4a1c"; roundRect(x, 28, 34, 40, 40, 10); x.fill();
    x.fillStyle = "#fff";
    x.beginPath(); x.moveTo(52, 42); x.lineTo(43, 58); x.lineTo(49, 58); x.lineTo(46, 68); x.lineTo(56, 52); x.lineTo(50, 52); x.lineTo(53, 42); x.closePath(); x.fill();
    x.font = "700 26px sans-serif"; x.fillStyle = "#eef2f4";
    x.fillText("BREAK", 80, 63);
    x.fillStyle = "#ff4a1c"; x.fillText("GG", 158, 63);
    const menu = ["WALL", "MY PROXY", "VAULT", "SESSIONS", "SETTINGS"];
    menu.forEach((m, i) => {
      const y = 140 + i * 52;
      if (i === 0) { x.fillStyle = "rgba(255,74,28,0.16)"; roundRect(x, 20, y - 26, 210, 40, 8); x.fill(); }
      x.font = "600 17px monospace";
      x.fillStyle = i === 0 ? "#ff6a3d" : "#66727d";
      x.fillText(m, 36, y);
    });
    x.font = "600 13px monospace"; x.fillStyle = "#2fe08c";
    x.fillText("● MEMBER: SUB ONE", 30, SCREEN_H - 34);

    // main header
    x.font = "800 40px sans-serif"; x.fillStyle = "#eef2f4";
    x.fillText("WALL STATUS", 292, 84);
    x.font = "600 15px monospace"; x.fillStyle = "#66727d";
    x.fillText("100 NODES · SWEPT 2 MIN AGO", 292, 112);
    // status pill
    x.fillStyle = "rgba(47,224,140,0.14)"; roundRect(x, 800, 48, 180, 46, 23); x.fill();
    x.fillStyle = "#2fe08c"; x.font = "700 18px monospace";
    x.fillText("UNBLOCKED", 826, 78);

    // node rows
    nodes.forEach((n, i) => {
      const y = 168 + i * 56;
      x.fillStyle = i % 2 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.0)";
      x.fillRect(292, y - 30, 688, 48);
      x.fillStyle = "#2fe08c";
      x.beginPath(); x.arc(310, y - 6, 6, 0, 7); x.fill();
      x.font = "700 19px monospace"; x.fillStyle = "#dfe6ea";
      x.fillText(n[0], 332, y);
      x.font = "500 16px monospace"; x.fillStyle = "#66727d";
      x.fillText("GGX-TUN", 470, y);
      // latency bar
      const w = Math.max(14, 190 - n[1] * 2);
      x.fillStyle = "rgba(255,255,255,0.08)"; roundRect(x, 620, y - 13, 190, 9, 4); x.fill();
      x.fillStyle = n[1] < 45 ? "#2fe08c" : "#ffc53d"; roundRect(x, 620, y - 13, w, 9, 4); x.fill();
      x.fillStyle = "#93a1ad"; x.fillText(n[1] + "ms", 830, y);
      x.fillStyle = "#39434d"; x.fillText("ONLINE", 906, y);
    });

    // scanline
    const sg = x.createLinearGradient(0, scan - 60, 0, scan + 60);
    sg.addColorStop(0, "rgba(255,74,28,0)");
    sg.addColorStop(0.5, "rgba(255,74,28,0.10)");
    sg.addColorStop(1, "rgba(255,74,28,0)");
    x.fillStyle = sg; x.fillRect(250, scan - 60, SCREEN_W - 250, 120);

    tex.needsUpdate = true;
  }

  function update(t) {
    scan = (t * 90) % (SCREEN_H + 240) - 120;
    if (Math.floor(t * 2) !== tick) {
      tick = Math.floor(t * 2);
      nodes.forEach((n) => { n[1] = Math.max(14, Math.min(88, n[1] + Math.round((Math.random() - 0.5) * 7))); });
    }
    draw();
  }
  draw();
  return { texture: tex, update };
}

/* ---------- main ---------- */
export function initStage(el) {
  if (!el) return { spin() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    el.classList.add("no-webgl");
    return { spin() {} };
  }
  if (!renderer.getContext()) { el.classList.add("no-webgl"); return { spin() {} }; }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  el.insertBefore(renderer.domElement, el.firstChild);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 1.5, 7.4);
  camera.lookAt(0, 1.02, 0);

  scene.environment = makeEnvTexture(renderer);

  // lights
  scene.add(new THREE.HemisphereLight(0xbdd0e0, 0x07090c, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 7, 5); scene.add(key);
  const rimO = new THREE.DirectionalLight(0xff4a1c, 3.2); rimO.position.set(-7, 3, -5); scene.add(rimO);
  const rimC = new THREE.DirectionalLight(0x7fd4ff, 1.7); rimC.position.set(7, 2, -4); scene.add(rimC);
  const under = new THREE.PointLight(0x2fe08c, 5, 9, 2); under.position.set(0, 0.55, 2.8); scene.add(under);

  // floor + grid + glow
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({ color: 0x0a0d11, roughness: 0.62, metalness: 0.35 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  scene.add(floor);

  const grid = new THREE.GridHelper(20, 40, 0x27313b, 0x151b22);
  grid.material.transparent = true; grid.material.opacity = 0.5;
  grid.position.y = 0.0;
  scene.add(grid);

  const glowC = document.createElement("canvas"); glowC.width = glowC.height = 256;
  const gx = glowC.getContext("2d");
  const gg = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gg.addColorStop(0, "rgba(255,74,28,0.55)");
  gg.addColorStop(0.5, "rgba(255,74,28,0.14)");
  gg.addColorStop(1, "rgba(255,74,28,0)");
  gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.5, 8.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.03;
  scene.add(glow);

  const shadowC = document.createElement("canvas"); shadowC.width = shadowC.height = 256;
  const sx = shadowC.getContext("2d");
  const sg2 = sx.createRadialGradient(128, 128, 10, 128, 128, 120);
  sg2.addColorStop(0, "rgba(0,0,0,0.72)");
  sg2.addColorStop(1, "rgba(0,0,0,0)");
  sx.fillStyle = sg2; sx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 3.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowC), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
  scene.add(shadow);

  // ---------- the laptop ----------
  const rig = new THREE.Group();
  scene.add(rig);

  const alu = new THREE.MeshStandardMaterial({ color: 0xaeb6bd, metalness: 0.92, roughness: 0.34 });
  const aluDark = new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.7, roughness: 0.5 });
  const deckTex = makeDeckTexture();
  const screen = makeScreen();

  const BW = 3.5, BD = 2.35, BH = 0.13;
  const base = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), alu);
  base.position.y = BH / 2;
  rig.add(base);

  const deck = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.24, BD - 0.3), new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.72, metalness: 0.25 }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, BH + 0.002, -0.06);
  rig.add(deck);

  // hinge
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, BW - 0.3, 24), aluDark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, BH + 0.02, -BD / 2 + 0.06);
  rig.add(hinge);

  // lid
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, BH + 0.02, -BD / 2 + 0.06);
  lidPivot.rotation.x = -0.34;
  rig.add(lidPivot);

  const LW = BW, LH = 2.32, LT = 0.09;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(LW, LH, LT), alu);
  lid.position.y = LH / 2;
  lidPivot.add(lid);

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LW - 0.22, LH - 0.24),
    new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false })
  );
  screenMesh.position.set(0, LH / 2, LT / 2 + 0.002);
  lidPivot.add(screenMesh);

  // glowing logo on lid back
  const logoC = document.createElement("canvas"); logoC.width = logoC.height = 128;
  const lx = logoC.getContext("2d");
  lx.fillStyle = "#ff4a1c";
  lx.beginPath(); lx.moveTo(74, 16); lx.lineTo(45, 70); lx.lineTo(62, 70); lx.lineTo(52, 112); lx.lineTo(86, 54); lx.lineTo(68, 54); lx.lineTo(77, 16); lx.closePath(); lx.fill();
  const logoTex = new THREE.CanvasTexture(logoC);
  const lidLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false })
  );
  lidLogo.position.set(0, LH / 2, -LT / 2 - 0.002);
  lidLogo.rotation.y = Math.PI;
  lidPivot.add(lidLogo);

  rig.position.y = 0.16;

  // ---------- interaction ----------
  let rotY = 0.62, rotX = 0.16;
  let velY = 0, velX = 0;
  let dragging = false, lastX = 0, lastY = 0;
  let idle = 0;
  const hint = document.getElementById("dragHint");

  el.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    idle = 0;
    el.setPointerCapture(e.pointerId);
    if (hint) hint.classList.add("gone");
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    rotY += dx * 0.0075;
    rotX = Math.max(-0.12, Math.min(0.62, rotX + dy * 0.004));
    velY = dx * 0.0022;
    idle = 0;
  });
  const end = () => { dragging = false; };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", end);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let frames = 0, fpsAt = 0;
  const hudFps = el.querySelector("[data-hud-fps]");
  const hudRot = el.querySelector("[data-hud-rot]");
  let hudAt = 0;

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(el);

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta() + 0.016, 0.05);

    if (!dragging) {
      rotY += velY; velY *= 0.94;
      rotX += velX; velX *= 0.9;
      idle += dt;
      if (!reduced && idle > 2.6) rotY += 0.22 * dt * Math.min(1, (idle - 2.6) / 1.6);
    }
    rig.rotation.y = rotY;
    rig.rotation.x = rotX * 0.35;
    rig.position.y = 0.16 + Math.sin(t * 0.9) * 0.035;

    screen.update(t);

    renderer.render(scene, camera);

    frames++;
    if (t - fpsAt > 1) {
      if (hudFps) hudFps.textContent = Math.round(frames / (t - fpsAt)) + " fps";
      frames = 0; fpsAt = t;
    }
    if (t - hudAt > 0.12) {
      hudAt = t;
      if (hudRot) {
        const deg = ((rotY * 180 / Math.PI) % 360 + 360) % 360;
        hudRot.textContent = "YAW " + String(Math.round(deg)).padStart(3, "0") + "°";
      }
    }
  });

  return {
    spin() {
      velY += 0.16;
      idle = 0;
      if (hint) hint.classList.add("gone");
    },
  };
}
