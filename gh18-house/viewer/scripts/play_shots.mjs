import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4188', '--strictPort'], { stdio: 'inherit' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await wait(1500);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4188/play/?headless');
  await page.waitForFunction(() => window.play?.ready, null, { timeout: 120000 });
  await page.screenshot({ path: 'screenshots/play-arrival.png' });
  await page.evaluate(() => { play.teleport(4700, 14500, 'GF'); play.settle(2); });
  await page.screenshot({ path: 'screenshots/play-foyer.png' });
  await page.evaluate(() => { play.teleport(4700, 16500, 'SF'); play.setTime(17, 35); play.settle(2); });
  await page.screenshot({ path: 'screenshots/play-sunset.png' });
  await browser.close();
} finally {
  server.kill('SIGTERM');
}
