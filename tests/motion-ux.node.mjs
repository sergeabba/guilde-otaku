import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const pages = [
  'app/components/HomePageClient.tsx', 'app/wanted/page.tsx',
  'app/birthdays/page.tsx', 'app/film-semaine/page.tsx',
  'app/bibliotheque/page.tsx', 'app/components/BonsPlansClient.tsx',
  'app/atelier/page.tsx',
];

test('every scrollable chapter has a progressive motion section', () => {
  for (const page of pages) {
    assert.match(read(page), /data-gk-motion="reveal"/, page);
  }
});

test('the enhanced reveals preserve reduced-motion and no-JS content', () => {
  const motion = read('app/components/MotionDirector.tsx');
  const css = read('app/styles/motion.css');
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /IntersectionObserver/);
  assert.match(css, /gk-motion-pending/);
  assert.doesNotMatch(css, /\[data-gk-motion\]\s*\{\s*opacity:\s*0/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('chapter images are real local assets and routes exist', () => {
  for (const img of [
    'public/atelier/teamotaku.png',
    'public/arena_xillia.jpg',
    'public/covers/bash/drops-of-god.jpg',
  ]) assert.ok(existsSync(join(root, img)), img);
  for (const route of ['app/fighters/page.tsx','app/bibliotheque/page.tsx']) {
    assert.ok(existsSync(join(root, route)), route);
  }
});

test('the mobile dock is keyboard accessible and the arene is not obstructed', () => {
  const header = read('app/components/GuildeHeader.tsx');
  assert.match(header, /aria-label="Navigation rapide"/);
  assert.match(header, /activePage !== "fighters"/);
  assert.match(header, /aria-current=\{activePage === id/);
  assert.match(header, /aria-expanded=\{menuOpen\}/);
});

test('artwork opens via button, dialog supports close and touch swipes', () => {
  const atelier = read('app/atelier/page.tsx');
  assert.match(atelier, /<motion\.button\s+type="button"/);
  assert.match(atelier, /aria-modal="true"/);
  assert.match(atelier, /onTouchEnd=/);
  assert.match(atelier, /aria-label="Fermer la visionneuse"/);
});

test('the cinematic intro does not block returning/mobile users and can be skipped', () => {
  const wrapper = read('app/components/SplashWrapper.tsx');
  const splash = read('app/components/FairyTailSplash.tsx');
  const home = read('app/components/HomePageClient.tsx');
  assert.match(wrapper, /reducedMotion === true/);
  assert.match(wrapper, /const hidden = !bypassSplash/);
  assert.match(splash, /PASSER L'INTRO/);
  assert.match(home, /gk-motion-ticker/);
});
