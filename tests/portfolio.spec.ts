import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
test("Adeticket project cards fit mobile widths and use canonical links", async ({ page }) => {
  const root = path.resolve(import.meta.dirname, "../sites/adeticket");
  await page.route("**/pagead/**", (route) => route.abort());
  await page.route("https://pagead2.googlesyndication.com/**", (route) => route.abort());
  await page.route("**/portfolio-review", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: fs.readFileSync(path.join(root, "index.html"), "utf8"),
    }),
  );
  await page.route("**/style.css", (route) =>
    route.fulfill({
      contentType: "text/css",
      body: fs.readFileSync(path.join(root, "style.css"), "utf8"),
    }),
  );
  await page.goto("http://127.0.0.1/portfolio-review");
  await expect(page.getByRole("link", { name: "Open the fitness tracker" })).toHaveAttribute(
    "href",
    "https://fit.adeticket.com/",
  );
  await expect(page.getByRole("link", { name: "Open the budget planner" })).toHaveAttribute(
    "href",
    "https://budget.adeticket.com/",
  );
  await expect(page.getByRole("heading", { name: "Play together" })).toBeVisible();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole("heading", { name: "Fitness tracker" })).toBeVisible();
  }
});
