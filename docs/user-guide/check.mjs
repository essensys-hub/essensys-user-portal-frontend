#!/usr/bin/env node
// Cohérence du guide utilisateur (portal-user-guide-2026-10-006) :
// sommaire ↔ pages, images citées, numéros du texte ↔ repères des captures.
// Usage : node docs/user-guide/check.mjs [--allow-missing-site-images]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
// Captures produites par le site www.essensys.fr (e2e/guide-screenshots.spec.js), copiées ici.
const SITE_IMAGES = new Set(['connexion-desktop.png', 'changement-mot-de-passe-desktop.png', 'profil-desktop.png', 'signaler-desktop.png']);
const allowMissingSite = process.argv.includes('--allow-missing-site-images');
const errors = [];

const index = fs.readFileSync(path.join(DIR, 'index.yml'), 'utf8');
const slugs = [...index.matchAll(/^\s*- slug:\s*(\S+)/gm)].map((m) => m[1]);
if (slugs.length !== 13) errors.push(`le sommaire doit compter 13 pages, il en compte ${slugs.length}`);

const screensSrc = fs.readFileSync(path.join(DIR, 'screens.ts'), 'utf8');
const markerCount = {};
for (const block of screensSrc.split(/\n  \{\n/).slice(1)) {
  const slug = block.match(/slug: '([^']+)'/)?.[1];
  if (slug) markerCount[slug] = (block.match(/\{ n: \d+,/g) || []).length;
}

for (const slug of slugs) {
  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) { errors.push(`${slug}.md manquant`); continue; }
  const md = fs.readFileSync(file, 'utf8');
  for (const section of ['## Un problème ?']) {
    if (slug !== 'profil-signalements' && !md.includes(section)) errors.push(`${slug}.md : section « ${section} » manquante`);
  }
  for (const [, img] of md.matchAll(/!\[[^\]]*\]\(images\/([^)]+)\)/g)) {
    const exists = fs.existsSync(path.join(DIR, 'images', img));
    if (!exists && !(allowMissingSite && SITE_IMAGES.has(img))) errors.push(`${slug}.md : image ${img} introuvable`);
  }
  if (markerCount[slug] !== undefined) {
    const detail = md.split("## L'écran en détail")[1]?.split('\n## ')[0] ?? '';
    const items = (detail.match(/^\d+\. \*\*/gm) || []).length;
    if (items !== markerCount[slug]) errors.push(`${slug}.md : ${items} éléments numérotés pour ${markerCount[slug]} repères sur la capture`);
  }
}

if (errors.length) {
  console.error('Guide utilisateur incohérent :\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`Guide utilisateur cohérent : ${slugs.length} pages, ${Object.keys(markerCount).length} captures repérées.`);
