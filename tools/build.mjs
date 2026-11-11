// Builds slides.html (Behance-style case study) from the captured screenshots,
// then renders it to a vector PDF with Chrome via Playwright.
// Usage: node build.mjs
import { chromium } from "playwright-core"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "shots/manifest.json"), "utf8"))
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
const LIVE = "coolgithub1.github.io/School-Schedule-Builder-App"
const REPO = "github.com/Coolgithub1/School-Schedule-Builder-App"

const ICONS = `<span class="icons"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4C5.2.4 2.5 1.5.5 3.4l1.2 1.3A8.8 8.8 0 0 1 8 2.2Z"/><path d="M8 5.6c1.5 0 2.9.6 4 1.6l1.2-1.3A7.4 7.4 0 0 0 8 3.8c-1.9 0-3.8.7-5.2 2.1L4 7.2a5.6 5.6 0 0 1 4-1.6Z"/><path d="M8 9c.6 0 1.1.2 1.6.6L8 11.4 6.4 9.6C6.9 9.2 7.4 9 8 9Z"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="20" height="9" rx="2.5"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" opacity="0.45"/></svg></span>`

// Phone mockups are pre-rendered (frame + screen + shadow) into one flat PNG each,
// so the PDF only contains plain images — layered/transformed HTML phones render
// blank in some PDF viewers.
const PAD = { top: 60, x: 120, bottom: 190 } // room for the baked-in drop shadow
const FLAT_SCALE = 2.5 // pixel density of the flattened phone PNGs
const usedPhones = new Set()

/** Full-size (421×880) iPhone frame around a captured screen — used only for flattening. */
const deviceMarkup = (name) => {
  const m = manifest[name]
  if (!m) throw new Error(`No screenshot named ${name}`)
  return `<div class="phone" style="--s:1"><div class="device">
    <i class="hw a"></i><i class="hw v1"></i><i class="hw v2"></i><i class="hw p"></i>
    <div class="screen">
      <div class="status" style="background:${m.top};color:${m.darkTop ? "#fff" : "#111"}"><span class="time">9:41</span><span class="island"></span>${ICONS}</div>
      <img src="shots/${name}.png" alt="">
      <div class="home" style="background:${m.bottom}"><span></span></div>
    </div></div></div>`
}

/** A flattened phone mockup on a slide. s = scale (1 = 421×880 px frame). */
const phone = (name, s = 0.7, { cls = "", markers = [] } = {}) => {
  if (!manifest[name]) throw new Error(`No screenshot named ${name}`)
  usedPhones.add(name)
  const marks = markers
    .map(([n, top, left]) => `<b class="marker" style="top:${((14 + top * 8.52) / 8.8).toFixed(2)}%;left:${left}%">${n}</b>`)
    .join("")
  return `<div class="phone ${cls}" style="--s:${s}"><img class="phone-img" src="phones/${name}.png" alt="">${marks}</div>`
}

const label = (n, text, dark = false) =>
  `<div class="label ${dark ? "on-dark" : ""}"><span>${n}</span>${text}</div>`
const footer = (page, dark = false) =>
  `<div class="foot ${dark ? "on-dark" : ""}"><span><i class="mark"></i>studyflow — UI/UX case study</span><span>${String(page).padStart(2, "0")}</span></div>`
const caption = (title, text) => `<figcaption><strong>${title}</strong>${text}</figcaption>`
const fig = (name, s, title, text, opts) => `<figure>${phone(name, s, opts)}${caption(title, text)}</figure>`
const points = (items) =>
  `<ol class="points">${items.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join("")}</ol>`

const slides = []
const add = (cls, html) => slides.push(`<section class="slide ${cls}">${html}${footer(slides.length + 1, cls.includes("dark"))}</section>`)

// 1 — Cover
add("dark cover", `
  <div class="cover-copy">
    <div class="brand"><i class="mark big"></i>studyflow</div>
    <h1>A calmer way<br>to plan your<br><em>semester.</em></h1>
    <p>Mobile-first schedule builder that turns classes, study goals and campus life into one balanced week.</p>
    <dl class="meta">
      <div><dt>Project</dt><dd>UI/UX case study</dd></div>
      <div><dt>Platform</dt><dd>Responsive web · mobile first</dd></div>
      <div><dt>Year</dt><dd>2026</dd></div>
    </dl>
  </div>
  <div class="cover-phones">
    ${phone("01-welcome", 0.66, { cls: "tilt-l" })}
    ${phone("08-overview", 0.8, { cls: "front" })}
    ${phone("10-schedule", 0.66, { cls: "tilt-r" })}
  </div>`)

// 2 — Overview
add("paper split", `
  <div class="col text">
    ${label("01", "Overview")}
    <h2>Planning a semester shouldn’t feel like a second job.</h2>
    <p class="lead">studyflow asks three quick questions — what you’re taking, how you like to study, and what else fills your week — then builds a balanced weekly plan that protects focus time around everything else.</p>
    <dl class="facts">
      <div><dt>My role</dt><dd>Product design, UX, UI and front-end build</dd></div>
      <div><dt>Deliverables</dt><dd>User flows, wireframes, UI kit, working app</dd></div>
      <div><dt>Built with</dt><dd>React · TypeScript · Vite · Tailwind · Figma</dd></div>
      <div><dt>Live</dt><dd>${LIVE}</dd></div>
    </dl>
  </div>
  <div class="col stage lime-blob">${phone("07-week-ready", 0.92)}</div>`)

// 3 — Problem & principles
add("paper", `
  ${label("02", "The problem")}
  <h2 class="wide">Students don’t lack ambition. They lack a plan that survives the week.</h2>
  <div class="cards three">
    <article><b class="num">01</b><h3>Scattered</h3><p>Classes live in the student portal, deadlines in five syllabi, everything else in notes and group chats.</p></article>
    <article><b class="num">02</b><h3>Rigid</h3><p>Hand-made plans break the moment a week changes — so they get abandoned by week three.</p></article>
    <article><b class="num">03</b><h3>Heavy</h3><p>Most planners take longer to set up and maintain than the time they actually save.</p></article>
  </div>
  <div class="principles">
    <span class="pl">Design principles</span>
    <div><strong>Calm</strong>Warm palette, generous space, one clear primary action per screen.</div>
    <div><strong>Balanced</strong>Study time spread across the lightest days, tracked against a weekly goal.</div>
    <div><strong>Forgiving</strong>Undo everywhere. Conflicts warn instead of block. Nothing is ever lost.</div>
  </div>`)

// 4 — Persona
add("lime split", `
  <div class="col text">
    ${label("03", "Who it’s for")}
    <h2>Meet Jordan.</h2>
    <p class="lead">Proto-persona · second-year student juggling four classes, a design club, the gym and a part-time life.</p>
    <div class="quote">“I know what I need to do. I just never know <em>when</em> I’m going to do it.”</div>
  </div>
  <div class="col persona">
    <article><h3>Goals</h3><ul><li>Protect real study time every week</li><li>See today at a glance, between classes</li><li>Never get surprised by a deadline</li></ul></article>
    <article><h3>Frustrations</h3><ul><li>Generic calendars don’t understand classes vs. study</li><li>Re-planning after one busy day feels like starting over</li><li>Apps that need an account before showing any value</li></ul></article>
    <article><h3>Context</h3><ul><li>Plans on a phone, between lectures</li><li>Checks the week on a laptop on Sunday night</li></ul></article>
  </div>`)

// 5 — User flow
const node = (t, s = "", cls = "") => `<div class="node ${cls}"><strong>${t}</strong>${s ? `<span>${s}</span>` : ""}</div>`
add("paper", `
  ${label("04", "User flow")}
  <h2 class="wide">From first tap to a full week in three steps.</h2>
  <div class="flow">
    <div class="lane"><span class="lane-name">Onboarding</span>
      ${node("Landing", "Value first")}<i class="arrow"></i>${node("Sign up", "Name + email")}<i class="arrow"></i>${node("Classes", "Step 1 of 3")}<i class="arrow"></i>${node("Study style", "Step 2 of 3")}<i class="arrow"></i>${node("Activities", "Step 3 of 3")}<i class="arrow"></i>${node("Week generated", "Conflict-free", "accent")}
    </div>
    <div class="drop"></div>
    <div class="lane hub"><span class="lane-name">Core app</span>
      <div class="hubcard">${node("Overview", "Today · focus · deadlines", "big")}<div class="chips"><span>Open focus window → add</span><span>Complete a deadline</span></div></div>
      <i class="arrow both"></i>
      <div class="hubcard">${node("Schedule", "Week + day agenda", "big dark")}<div class="chips"><span>Add block</span><span>Edit block</span><span>Drag to move</span><span>Switch week</span></div></div>
      <i class="arrow both"></i>
      <div class="hubcard">${node("Study goals", "Hours · subjects · deadlines", "big")}<div class="chips"><span>Mark session done</span><span>Adjust goal</span><span>Add deadline</span></div></div>
    </div>
    <div class="global"><span class="lane-name">Everywhere</span><span>Search  ⌘K</span><span>Notifications</span><span>Menu</span><span>Settings</span><span>Undo toasts</span></div>
  </div>`)

// 6 — Onboarding
add("dark", `
  ${label("05", "Onboarding", true)}
  <h2 class="wide light">Three questions. Zero blank pages.</h2>
  <div class="row four">
    ${fig("03-setup-classes", 0.6, "Pick your classes", "Common classes are pre-filled — tap to keep or drop.")}
    ${fig("04-setup-add-class", 0.6, "Add your own", "Inline form: name, days, time, length, room.")}
    ${fig("05-setup-study", 0.6, "Set a study goal", "Hours per week + morning or evening focus.")}
    ${fig("06-setup-activities", 0.6, "Make room for life", "Clubs, work and gym become fixed blocks.")}
  </div>`)

// 7 — Generated week
add("paper split", `
  <div class="col stage duo">
    ${phone("02-signup", 0.66, { cls: "back" })}
    ${phone("07-week-ready", 0.8, { markers: [[1, 28, 104], [2, 41, 104], [3, 55, 104], [4, 84, 104]] })}
  </div>
  <div class="col text">
    ${label("06", "The payoff")}
    <h2>Your week is ready — and it already makes sense.</h2>
    ${points([
      ["One-tap add", "The lime primary action is always within thumb reach."],
      ["Day picker", "Dots show which days have plans; today is pre-selected."],
      ["Color-coded agenda", "Purple classes, green study, orange activities — scannable in a glance."],
      ["Instant feedback", "A toast confirms what was built: classes and focus blocks."],
    ])}
  </div>`)

// 8 — Smart scheduling
add("lime split", `
  <div class="col text">
    ${label("07", "Smart scheduling")}
    <h2>Editing that guides instead of scolds.</h2>
    ${points([
      ["Conflicts warn, never block", "Overlaps are explained in plain language — the student decides."],
      ["Weekly or one-off", "A single toggle separates routines from this-week-only plans."],
      ["Done means done", "Study blocks can be checked off right from the editor."],
      ["Undo everywhere", "Every delete and move can be reversed from the toast."],
    ])}
  </div>
  <div class="col stage duo">
    ${phone("11-edit-block", 0.7, { cls: "back" })}
    ${phone("12-new-block-conflict", 0.8, { markers: [[1, 83, 104], [2, 63, 104]] })}
  </div>`)

// 9 — Overview screen
add("paper", `
  ${label("08", "Overview")}
  <div class="split-head"><h2>Today, at a glance.</h2><p class="lead">Opened between classes, the overview answers one question fast: <em>what’s next, and where can I fit focus time?</em></p></div>
  <div class="row three-wide">
    ${fig("08-overview", 0.6, "Next few hours", "A live timeline with an open focus window you can fill in one tap.")}
    ${fig("09-overview-focus", 0.6, "Weekly focus", "Progress ring and daily bars compare completed vs planned hours.")}
    ${fig("16-notifications", 0.6, "Gentle reminders", "Upcoming blocks and deadlines due soon, with one switch to pause.")}
  </div>`)

// 10 — Study goals
add("dark split", `
  <div class="col text">
    ${label("09", "Study goals", true)}
    <h2 class="light">Progress you can feel.</h2>
    <p class="lead light">Focus hours, per-subject balance and deadlines live together, so planning and doing happen in the same place.</p>
    ${points([
      ["Weekly target", "A stepper adjusts the goal; the ring updates everywhere."],
      ["By subject", "See which class is getting your attention — and which isn’t."],
      ["Deadlines", "Add, complete and undo in seconds, sorted by what’s due."],
    ])}
  </div>
  <div class="col stage duo">
    ${phone("13-goals", 0.7, { cls: "back" })}
    ${phone("14-goals-deadlines", 0.8)}
  </div>`)

// 11 — Utilities
add("paper", `
  ${label("10", "Always within reach")}
  <h2 class="wide">The small screens that make it feel complete.</h2>
  <div class="row four">
    ${fig("15-search", 0.6, "Search", "Find any class, block or deadline — ⌘K on desktop.")}
    ${fig("17-menu", 0.6, "Menu", "Navigation plus weekly progress, one tap away.")}
    ${fig("18-settings", 0.6, "Settings", "Profile, goal, focus time and reminders in a sheet.")}
    ${fig("10-schedule", 0.6, "Day agenda", "Each day as a list — big targets, clear times.")}
  </div>`)

// 12 — Design system
const sw = (name, hex, dark) => `<div class="swatch" style="background:${hex};color:${dark ? "#fff" : "#20201e"}"><strong>${name}</strong><span>${hex}</span></div>`
add("paper", `
  ${label("11", "Design system")}
  <h2 class="wide">Warm, soft and quietly confident.</h2>
  <div class="ds">
    <div class="ds-block"><h3>Color</h3><div class="swatches">
      ${sw("Ink", "#20201E", true)}${sw("Paper", "#F8F7F2")}${sw("Lime", "#D9F99D")}${sw("Class", "#7C5CFF", true)}${sw("Study", "#91AD4D", true)}${sw("Activity", "#FF9B62")}
    </div></div>
    <div class="ds-block"><h3>Type</h3>
      <div class="type"><span class="t-display">Aa</span><div><strong>Manrope ExtraBold</strong><span>Headlines · tight tracking · −4%</span></div></div>
      <div class="type"><span class="t-body">Aa</span><div><strong>DM Sans</strong><span>Body &amp; UI · 400 / 700</span></div></div>
    </div>
    <div class="ds-block"><h3>Components</h3>
      <div class="comps">
        <span class="c-btn primary">+ Add block</span><span class="c-btn dark">Create account →</span><span class="c-btn ghost">Edit week</span>
        <span class="c-chip">Tomorrow</span><span class="c-chip warn">Overdue</span>
        <span class="c-toggle on"><i></i></span><span class="c-toggle"><i></i></span>
      </div>
      <div class="blocks">
        <div class="c-ev class"><strong>Calculus II</strong><span>9:00 AM · Room B-204</span></div>
        <div class="c-ev study"><strong>Calculus review</strong><span>3:00 PM · Practice set 4</span></div>
        <div class="c-ev activity"><strong>Design Club</strong><span>4:00 PM · Studio 3</span></div>
      </div>
    </div>
  </div>`)

// 13 — Responsive
add("lime", `
  ${label("12", "Responsive")}
  <h2 class="wide">Mobile first. Sunday-night-planning ready.</h2>
  <div class="responsive">
    <div class="browser"><div class="bar"><i></i><i></i><i></i><span>${LIVE}</span></div><img src="shots/19-desktop-schedule.png" alt=""></div>
    ${phone("10-schedule", 0.72, { cls: "over" })}
  </div>
  <p class="aside">On desktop the week becomes a drag-and-drop calendar with a live “now” line; on phones it collapses into a day picker and agenda.</p>`)

// 14 — Details
add("paper", `
  ${label("13", "UX details")}
  <h2 class="wide">Small details, big calm.</h2>
  <div class="cards six">
    <article><h3>Value before sign-up</h3><p>The landing page shows a real week preview; any email opens a sample week.</p></article>
    <article><h3>Forgiving by default</h3><p>Deletes, moves and completions all come with an Undo toast.</p></article>
    <article><h3>Plain-language errors</h3><p>“Pick at least one class to continue” beats a red outline every time.</p></article>
    <article><h3>Thumb-zone actions</h3><p>A raised add button and bottom navigation keep key actions reachable.</p></article>
    <article><h3>Keyboard friendly</h3><p>⌘K search, Esc to close, Enter to open — with visible focus states.</p></article>
    <article><h3>Private by design</h3><p>No backend: schedules stay on the student’s own device.</p></article>
  </div>`)

// 15 — Closing
add("dark closing", `
  <div class="closing-copy">
    <div class="brand"><i class="mark big"></i>studyflow</div>
    <h1>Thanks for<br><em>scrolling by.</em></h1>
    <p>Try the live prototype — it runs right in the browser.</p>
    <div class="links"><span><b>Live</b>${LIVE}</span><span><b>Code</b>${REPO}</span></div>
  </div>
  <div class="cover-phones">
    ${phone("13-goals", 0.7, { cls: "tilt-l" })}
    ${phone("07-week-ready", 0.82, { cls: "front" })}
  </div>`)

const css = fs.readFileSync(path.join(import.meta.dirname, "slides.css"), "utf8")
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>studyflow — UI/UX case study</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Manrope:wght@600;700;800&display=block" rel="stylesheet">
<style>${css}</style></head><body>${slides.join("\n")}</body></html>`
const htmlPath = path.join(ROOT, "slides.html")
fs.writeFileSync(htmlPath, html)
console.log(`✓ slides.html (${slides.length} slides)`)

// ---------- Flatten phone mockups ----------
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const phoneDir = path.join(ROOT, "phones")
fs.mkdirSync(phoneDir, { recursive: true })
const flat = await browser.newPage({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: FLAT_SCALE })
for (const name of usedPhones) {
  const doc = `<!doctype html><html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=block" rel="stylesheet">
    <style>${css} html, body { background: transparent !important; }</style></head>
    <body><div id="wrap" style="display:inline-block;padding:${PAD.top}px ${PAD.x}px ${PAD.bottom}px">${deviceMarkup(name)}</div></body></html>`
  const tmp = path.join(ROOT, `_flat.html`)
  fs.writeFileSync(tmp, doc)
  await flat.goto("file:///" + tmp.replace(/\\/g, "/"), { waitUntil: "networkidle" })
  await flat.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  })
  await flat.locator("#wrap").screenshot({ path: path.join(phoneDir, `${name}.png`), omitBackground: true })
  fs.rmSync(tmp)
}
await flat.close()
console.log(`✓ ${usedPhones.size} flattened phones`)

// ---------- Render ----------
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle" })
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})
const pdfPath = path.join(ROOT, "studyflow-case-study.pdf")
await page.pdf({ path: pdfPath, width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true })
console.log("✓", pdfPath)

// Low-res previews for review
const previewDir = path.join(ROOT, "previews")
fs.mkdirSync(previewDir, { recursive: true })
const sections = await page.$$("section.slide")
for (let i = 0; i < sections.length; i++)
  await sections[i].screenshot({ path: path.join(previewDir, `slide-${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 70 })
console.log(`✓ ${sections.length} previews`)
await browser.close()
