# BreakGG — The Chromebook Unblock Lab

Marketing site for BreakGG's five membership tiers:

| Tier | Price | What it is |
| --- | --- | --- |
| **Tier 1 — The Wall** | $5/mo | 100 proxy nodes, re-tested every 6 hours |
| **Sub-tier 1.2 — “Sub One”** | $7/mo | Your own personal proxy/unblocker, custom name + badge |
| **Tier 2 — The Method Vault** | $10/mo | Partial / temporary unblock methods, rated honestly |
| **Tier 3 — Full Release** | $15/mo | Full unblock tracks — partial *or* permanent — plus rollback |
| **Tier 4 — Done For You** | $30/mo | You pick three outcomes, a tech performs them on a live session |

## Run it

Static site, no build step:

```bash
python3 -m http.server 8123     # or any static server / GitHub Pages / Netlify
```

Open `http://localhost:8123`.

## Structure

```
index.html                 all page content
assets/css/main.css        design system + sections
assets/js/main.js          page behaviour (wall board, builder, reveals, ticker…)
assets/js/scene.js         RIG-01: the drag-to-spin 3D chromebook (three.js)
assets/vendor/             three.js (r1xx, minified ESM bundle)
assets/fonts/              Archivo Variable, Instrument Sans Variable, JetBrains Mono Variable (self-hosted)
assets/img/chromebook.png  product render (review rig photos + WebGL fallback)
```

## Design notes

- **Type:** display face is **Archivo Variable at 118–122% width, weight 850–900, uppercase** — the geometric, wide, heavy character of Lemon Milk with boardroom manners. Body is Instrument Sans; data/labels are JetBrains Mono. All three are self-hosted variable woff2 files, so the site renders identically with no network.
- **Palette:** ink `#0a0c0f` / cool paper `#e9edef` / break-orange `#ff4a1c`, with mint `#2fe08c` reserved for “tested & online” semantics.
- **The rig:** a procedural chromebook built in three.js (aluminium body, canvas-textured keyboard + a live animated “Wall status” screen, orange/ice rim lights, contact shadow, grid floor). Drag to rotate with inertia; auto-spins when idle; falls back to `assets/img/chromebook.png` when WebGL is unavailable; respects `prefers-reduced-motion`.
- **Motion:** scramble-decode hero, line-mask section titles, sticky-stacked pricing deck, scattered-postcard reviews, dual marquees, grain overlay — all disabled under `prefers-reduced-motion`.

## Swapping in the real logo

The current mark (orange tile + bolt, `BREAK`**`GG`** wordmark) is a placeholder in two spots:

1. `index.html` — the `<a class="brand">` block in the header **and** the footer (inline SVG + `.brand-word` span).
2. `assets/css/main.css` — `.brand` / `.brand-word` styles.

To use the customer logo: drop the file at `assets/img/logo.svg` (or `.png`) and replace each
`<a class="brand">…</a>` inner content with `<img src="assets/img/logo.svg" alt="BreakGG" style="height:34px">`,
or hand the file to whoever maintains the site and they'll wire it into both spots.

## Responsible-use stance (keep this)

The site sells tools for devices people own or have permission to modify. Copy throughout — FAQ #1, the
footer notice, Tier 4 consent flow — states that school-issued hardware is bound by district policy and that
members decide their own risk. Keep that language in any fork.
