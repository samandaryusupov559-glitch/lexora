// Dependency-free static smoke checks for the Editorial public landing page.
// Run with: node --test tests/editorial-landing.test.mjs
// These checks never access Firebase, the network, or real student data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../editorial-landing.css', import.meta.url), 'utf8');
const i18n = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');

test('Editorial stylesheet is loaded once, after the original inline styles', () => {
  assert.equal(html.split('href="editorial-landing.css?v=1"').length - 1, 1);
  assert.match(html, /<\/style>\s*<link rel="stylesheet" href="editorial-landing\.css\?v=1">/);
});

test('Landing is scoped; authenticated dashboards are not restyled', () => {
  assert.match(html, /class="lx-stage ed-stage"/);
  assert.match(css, /body:has\(\.ed-stage\)/);
  assert.match(css, /#main:has\(\.ed-stage\)/);
  assert.match(css, /@media\s*\(max-width:620px\)/);
  assert.match(css, /@media\s*\(max-width:1120px\)/);
  assert.doesNotMatch(css, /(?:^|\n)\s*body\s*\{/m);
});

test('Live teacher and trial integrations remain in the homepage', () => {
  const start=html.indexOf('function vLanding(){');
  const end=html.indexOf('\nconst LX_ARROW',start);
  assert.ok(start >= 0 && end > start, 'vLanding() exists');
  const vLanding=html.slice(start,end);
  for (const hook of ['c-trial','c-tprof','c-lang','c-apply','c-signin','lx-fmt','lx-aud','c-gchat']) {
    // Sign-in is also present in the landing footer; the top navbar is rendered separately.
    if(hook==='c-signin') assert.match(vLanding, /data-act="c-signin"/);
    else assert.ok(vLanding.includes('data-act="'+hook+'"'),hook+' hook is missing');
  }
  for (const id of ['lx-out','lx-tab-s','lx-tab-t','teachers','lx-how','lx-faq']) {
    assert.ok(vLanding.includes(id),id+' target is missing');
  }
  assert.match(vLanding, /teamList\(false\)/);
  assert.match(vLanding, /list\.map\(card\)/);
  assert.match(vLanding, /fromPrice\(t\)/);
  assert.match(vLanding, /tr\('lx\.[^']+'\)/);
});

test('Student and teacher application still use existing backend functions', () => {
  for (const fn of ['function startStudent(){','function startTeacher(){','function openTrial(','function openTeacherProfile(','function renderTop(){']) {
    assert.ok(html.includes(fn),fn+' missing');
  }
  assert.match(html, /function tr\(k, v\)/);
  for (const locale of ['en','uz','ru']) assert.ok(i18n.includes(locale),locale+' missing in i18n');
});

test('Inline application module parses as JavaScript', () => {
  const matched=html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(matched,'main ES module missing');
  const dir=mkdtempSync(join(tmpdir(),'lexora-syntax-'));
  try {
    const file=join(dir,'application.mjs');
    writeFileSync(file,matched[1]);
    const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:20000});
    assert.equal(check.status,0,check.stderr || check.error?.message || 'Script syntax failure');
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('Editorial art is decorative and does not replace app controls', () => {
  for (const cls of ['ed-arch','ed-hello','ed-stamp']) assert.match(html,new RegExp('class="'+cls+'" aria-hidden="true"'));
  assert.match(html, /id="lx-out" data-act="c-trial"/);
  assert.match(html, /data-act="lx-fmt" data-f="ind"/);
  assert.match(html, /data-act="lx-fmt" data-f="group"/);
});
