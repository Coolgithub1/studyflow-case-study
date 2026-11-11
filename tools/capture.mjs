// Captures retina phone screenshots of every studyflow screen for the case study.
// Usage: node capture.mjs [appUrl]   (default: local dev server)
import { chromium } from "playwright-core"
import { PNG } from "pngjs"
import fs from "node:fs"
import path from "node:path"

const APP = (process.argv[2] || "http://localhost:5173/") + "?embed=1"
const OUT = path.resolve(import.meta.dirname, "../shots")
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const context = await browser.newContext({
  viewport: { width: 393, height: 776 }, // iPhone 15 Pro screen minus status bar + home indicator
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: false,
})
const page = await context.newPage()
await page.clock.setFixedTime(new Date("2026-11-11T09:41:00"))

const manifest = {}
const sleep = (ms) => page.waitForTimeout(ms)
const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
const sample = (png, x, y) => {
  const i = (png.width * y + x) << 2
  return [png.data[i], png.data[i + 1], png.data[i + 2]]
}
const clearToasts = () =>
  page.evaluate(() => document.querySelectorAll(".toast-close").forEach((b) => b.click()))

async function shot(name, { keepToasts = false } = {}) {
  if (!keepToasts) await clearToasts()
  await sleep(450)
  const buf = await page.screenshot({ type: "png" })
  fs.writeFileSync(path.join(OUT, `${name}.png`), buf)
  const png = PNG.sync.read(buf)
  const top = sample(png, 6, 4)
  const bottom = sample(png, 6, png.height - 4)
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  manifest[name] = { top: hex(...top), bottom: hex(...bottom), darkTop: lum(top) < 110 }
  console.log("✓", name)
}

const tap = async (selector) => {
  await page.locator(selector).first().click()
  await sleep(300)
}
const type = async (selector, text) => {
  await page.locator(selector).first().fill(text)
  await sleep(100)
}

// ---------- Onboarding ----------
await page.goto(APP)
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.evaluate(() => document.fonts.ready)
await shot("01-welcome")

await tap(".welcome-nav .button-dark")
await type('input[placeholder="Maya Singh"]', "Jordan Rivera")
await type('input[type="email"]', "jordan@school.edu")
await shot("02-signup")

await tap('.auth-form button[type="submit"]')
await shot("03-setup-classes")

await tap(".add-class")
await type('input[placeholder="e.g. Organic Chemistry"]', "Organic Chemistry")
await page.locator(".day-chips button").nth(4).click()
await page.evaluate(() => document.querySelector(".setup-content")?.scrollTo({ top: 9999 }))
await shot("04-setup-add-class")
await tap('.add-class-form button[type="submit"]')

await tap(".setup-footer .button-primary")
await page.locator(".preference").nth(1).click()
await shot("05-setup-study")

await tap(".setup-footer .button-primary")
await tap(".add-class")
await type('.activity-item:last-of-type input', "Gym")
await page.evaluate(() => document.querySelector(".setup-content")?.scrollTo({ top: 0 }))
await shot("06-setup-activities")

await tap(".setup-footer .button-primary")
await sleep(300)
await shot("07-week-ready", { keepToasts: true })

// Restore the richer sample week (keeps Jordan's profile)
await tap('.mobile-bottom-nav button:has-text("Profile")')
await tap(".danger-zone .button")
await tap(".danger-zone .button")
await sleep(300)

// ---------- Core app ----------
await tap('.mobile-bottom-nav button:has-text("Overview")')
await shot("08-overview")
await page.evaluate(() => document.querySelector(".overview-content")?.scrollTo({ top: 520 }))
await shot("09-overview-focus")

await tap('.mobile-bottom-nav button:has-text("Schedule")')
await shot("10-schedule")

await tap('.mobile-agenda-item:has-text("History essay outline")')
await shot("11-edit-block")
await page.keyboard.press("Escape")
await sleep(300)

await tap(".mobile-add-button")
await type(".drawer-form input", "Chemistry review")
await page.locator(".drawer-form").evaluate((el) => el.scrollTo({ top: 9999 }))
await shot("12-new-block-conflict")
await page.keyboard.press("Escape")
await sleep(300)

await tap('.mobile-bottom-nav button:has-text("Goals")')
await shot("13-goals")
await page.evaluate(() => document.querySelector(".goals-content")?.scrollTo({ top: 9999 }))
await sleep(200)
await page.locator(".deadline-item .check-box").first().click()
await sleep(350)
await shot("14-goals-deadlines", { keepToasts: true })
await clearToasts()

await tap('.mobile-bottom-nav button:has-text("Overview")')
await tap(".mobile-search")
await page.keyboard.type("calc")
await shot("15-search")
await page.keyboard.press("Escape")
await sleep(250)

await tap('[aria-label="Notifications"]')
await shot("16-notifications")
await page.mouse.click(200, 600)
await sleep(250)

await tap(".mobile-menu")
await shot("17-menu")
await tap('.sidebar-drawer [aria-label="Close menu"]')

await tap('.mobile-bottom-nav button:has-text("Profile")')
await shot("18-settings")
await page.keyboard.press("Escape")

// ---------- Desktop (responsive slide) ----------
const desk = await context.newPage()
await desk.setViewportSize({ width: 1440, height: 900 })
await desk.clock.setFixedTime(new Date("2026-11-11T09:41:00"))
await desk.goto(APP)
await desk.evaluate(() => document.fonts.ready)
await desk.locator('.sidebar nav button:has-text("Schedule")').first().click()
await desk.waitForTimeout(500)
await desk.evaluate(() => document.querySelectorAll(".toast-close").forEach((b) => b.click()))
await desk.waitForTimeout(300)
fs.writeFileSync(path.join(OUT, "19-desktop-schedule.png"), await desk.screenshot({ type: "png" }))
console.log("✓ 19-desktop-schedule")

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2))
await browser.close()
console.log("Done →", OUT)
