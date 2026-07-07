// The 9 ship ROLES (#11). Each builder takes a faction `style` and returns a
// detailed THREE.Group (nose = +Z, engine glow at the tail), sized for its role
// via ROLES[].scale. The same 9 roles render in any faction's palette, giving
// the 9 × 6 = 54 matrix. ROLES also carries the in-fiction stats/description
// shown in the system ship card and the codex.

import * as THREE from 'three';
import { C, ACC, g, box, cyl, sph, cone, part, addRot, engineGlow, navLight, runningLights, antenna, wedge, barrel, nozzle, panelZ, panelX, greeble } from './style.js';

// 1. Scout/courier — XS, fastest: a slim pod, canopy, stub wings, antenna.
function makeScout(s) {
  const grp = new THREE.Group();
  addRot(grp, cyl(0.02, 0.03, 0.12, 8), C(s, 'hull'), 0, 0, 0, Math.PI / 2);
  addRot(grp, cone(0.02, 0.08, 8), C(s, 'accent'), 0, 0, 0.1, Math.PI / 2);
  grp.add(part(sph(0.022, 8), C(s, 'glass'), 0, 0.014, 0.03));
  for (const x of [-0.05, 0.05]) grp.add(part(box(0.05, 0.005, 0.03), C(s, 'hull2'), x, 0, -0.02));
  engineGlow(grp, s, 0, 0, -0.08, 0.02);
  antenna(grp, s, 0, 0.03, 0, 0.05);
  runningLights(grp, s, 0.06, 0, -0.01);
  return grp;
}

// 2. Fighter — S, fast: the v2 "detail language" exemplar. A three-segment
// fuselage with intakes and a chin sensor, a framed canopy, a signature tail
// fin, swept dihedral wings carrying cannons + underwing missiles, engraved
// panel lines and twin nozzle bells. ~2.5k tris — still 2 draw calls baked.
function makeFighter(s) {
  const grp = new THREE.Group();

  // fuselage — three tapered segments give a real profile, not one tube
  addRot(grp, cyl(0.03, 0.032, 0.14, 12), C(s, 'hull'), 0, 0, 0.03, Math.PI / 2); // forward body
  addRot(grp, cyl(0.032, 0.026, 0.12, 12), C(s, 'hull2'), 0, 0, -0.09, Math.PI / 2); // aft body
  addRot(grp, cone(0.03, 0.16, 14), C(s, 'accent'), 0, 0, 0.19, Math.PI / 2); // nose cone
  grp.add(part(box(0.004, 0.004, 0.06), C(s, 'dark'), 0, 0, 0.3)); // pitot sensor spike

  // chin sensor pod + twin belly intakes with accent lips
  greeble(grp, s, 'dark', 0, -0.022, 0.09, 0.03, 0.02, 0.045);
  for (const x of [-1, 1]) {
    greeble(grp, s, 'dark', x * 0.032, -0.006, -0.02, 0.018, 0.03, 0.06); // intake duct
    grp.add(part(box(0.02, 0.006, 0.05), ACC(s), x * 0.032, 0.011, -0.01)); // intake lip accent
  }

  // canopy — glass bubble, centre frame, front bow
  grp.add(part(sph(0.026, 12), C(s, 'glass'), 0, 0.02, 0.07));
  greeble(grp, s, 'dark', 0, 0.03, 0.07, 0.008, 0.01, 0.06); // canopy spine frame
  greeble(grp, s, 'dark', 0, 0.03, 0.098, 0.03, 0.006, 0.006); // canopy front bow

  // dorsal spine + signature tail fin
  greeble(grp, s, 'dark', 0, 0.028, -0.04, 0.01, 0.028, 0.16); // spine
  grp.add(part(box(0.008, 0.06, 0.07), ACC(s), 0, 0.05, -0.12)); // signature fin
  greeble(grp, s, 'dark', 0, 0.03, -0.14, 0.008, 0.04, 0.05); // fin base

  // wings — swept + dihedral, leading-edge accent, tip pods, cannons, missiles
  for (const x of [-1, 1]) {
    const wing = part(box(0.13, 0.008, 0.11), C(s, 'hull'), x * 0.08, -0.006, -0.04);
    wing.rotation.y = x * 0.55;
    wing.rotation.z = x * -0.1;
    grp.add(wing);
    const le = part(box(0.13, 0.007, 0.016), ACC(s), x * 0.08, -0.004, 0.006);
    le.rotation.y = x * 0.55;
    le.rotation.z = x * -0.1;
    grp.add(le); // leading-edge accent
    greeble(grp, s, 'dark', x * 0.142, -0.006, -0.03, 0.016, 0.012, 0.06); // wingtip pod
    navLight(grp, s, x > 0 ? 'star' : 'port', x * 0.15, -0.006, -0.005, 0.01);
    barrel(grp, s, x * 0.06, -0.014, 0.06, 0.005, 0.12); // wing cannon
    greeble(grp, s, 'dark', x * 0.1, -0.016, -0.02, 0.006, 0.012, 0.008); // hardpoint pylon
    addRot(grp, cyl(0.007, 0.007, 0.07, 6), C(s, 'hull2'), x * 0.1, -0.024, -0.005, Math.PI / 2); // missile body
    addRot(grp, cone(0.007, 0.02, 6), C(s, 'accent'), x * 0.1, -0.024, 0.035, Math.PI / 2); // missile nose
  }

  // engraved panel lines on the top fuselage
  panelZ(grp, s, 0, 0.031, -0.02, 0.14);
  panelX(grp, s, 0, 0.031, 0.02, 0.05);
  panelX(grp, s, 0, 0.031, -0.06, 0.05);

  // twin engine nozzles + top verniers
  for (const x of [-0.02, 0.02]) nozzle(grp, s, x, 0, -0.16, 0.02, 0.04);
  for (const x of [-1, 1]) greeble(grp, s, 'dark', x * 0.03, 0.02, -0.14, 0.008, 0.008, 0.008);

  runningLights(grp, s, 0.14, -0.006, -0.06);
  return grp;
}

// 3. Interceptor — S, fastest combat: needle nose, twin outboard engine booms.
function makeInterceptor(s) {
  const grp = new THREE.Group();
  addRot(grp, cyl(0.012, 0.022, 0.3, 8), C(s, 'accent'), 0, 0, 0, Math.PI / 2);
  addRot(grp, cone(0.012, 0.14, 8), ACC(s), 0, 0, 0.22, Math.PI / 2);
  grp.add(part(sph(0.014, 8), C(s, 'glass'), 0, 0.01, 0.04));
  for (const x of [-0.05, 0.05]) {
    addRot(grp, cyl(0.012, 0.012, 0.16, 6), C(s, 'dark'), x, 0, -0.06, Math.PI / 2);
    engineGlow(grp, s, x, 0, -0.16, 0.016);
  }
  grp.add(part(box(0.12, 0.006, 0.04), C(s, 'accent'), 0, 0, -0.02));
  return grp;
}

// 4. Gunship — M, slow attacker: chunky armoured hull, twin heavy cannons, turret.
function makeGunship(s) {
  const grp = new THREE.Group();
  grp.add(part(box(0.1, 0.08, 0.26), C(s, 'accent'), 0, 0, 0));
  grp.add(part(box(0.12, 0.05, 0.1), C(s, 'dark'), 0, 0, 0.02)); // armour band
  grp.add(part(box(0.06, 0.05, 0.06), C(s, 'hull2'), 0, 0.05, -0.06)); // turret base
  grp.add(part(box(0.04, 0.018, 0.02), C(s, 'glass'), 0, 0.03, 0.13)); // cockpit
  for (const x of [-0.045, 0.045]) addRot(grp, cyl(0.012, 0.012, 0.18, 8), C(s, 'dark'), x, 0, 0.12, Math.PI / 2);
  grp.add(part(box(0.008, 0.05, 0.05), ACC(s), 0, 0.06, -0.1)); // fin
  engineGlow(grp, s, 0.05, 0, -0.16, 0.026);
  engineGlow(grp, s, -0.05, 0, -0.16, 0.026);
  runningLights(grp, s, 0.06, 0, 0.05);
  antenna(grp, s, 0, 0.07, -0.08, 0.06);
  return grp;
}

// 5. Corvette — M, escort warship: wedge hull, bridge tower, turrets, triple engines.
function makeCorvette(s) {
  const grp = new THREE.Group();
  grp.add(part(wedge(0.12, 0.07, 0.5), C(s, 'accent'), 0, 0, 0));
  grp.add(part(box(0.06, 0.06, 0.1), C(s, 'dark'), 0, 0.06, -0.12));
  grp.add(part(box(0.05, 0.016, 0.012), C(s, 'glass'), 0, 0.09, -0.08));
  grp.add(part(box(0.02, 0.04, 0.18), C(s, 'dark'), 0, 0.045, 0));
  for (const z of [0.1, -0.04, -0.16]) {
    grp.add(part(cyl(0.018, 0.022, 0.02, 8), C(s, 'hull2'), 0, 0.05, z));
    grp.add(part(box(0.006, 0.006, 0.04), C(s, 'dark'), 0, 0.06, z + 0.02));
  }
  for (const x of [-0.06, 0, 0.06]) engineGlow(grp, s, x, 0, -0.27, 0.022);
  grp.add(part(box(0.006, 0.04, 0.05), ACC(s), 0, 0.07, -0.18));
  runningLights(grp, s, 0.06, 0, 0.05);
  return grp;
}

// 6. Freighter — L, slow hauler: spine, stacked containers, bridge, engine cluster.
function makeFreighter(s) {
  const grp = new THREE.Group();
  grp.add(part(box(0.05, 0.05, 0.34), C(s, 'dark'), 0, 0, 0));
  const cc = [C(s, 'hull'), C(s, 'hull2'), C(s, 'gold'), C(s, 'accent')];
  let ci = 0;
  for (let z = 0.1; z > -0.14; z -= 0.06) for (const x of [-0.05, 0.05]) grp.add(part(box(0.05, 0.07, 0.055), cc[ci++ % cc.length], x, 0, z));
  grp.add(part(box(0.05, 0.05, 0.06), C(s, 'accent'), 0, 0.05, 0.13));
  grp.add(part(box(0.04, 0.016, 0.012), C(s, 'glass'), 0, 0.06, 0.16));
  engineGlow(grp, s, 0, 0, -0.2, 0.03);
  engineGlow(grp, s, 0.05, 0, -0.16, 0.02);
  engineGlow(grp, s, -0.05, 0, -0.16, 0.02);
  runningLights(grp, s, 0.085, 0, 0.02);
  antenna(grp, s, 0, 0.075, 0.12, 0.06);
  return grp;
}

// 7. Tanker — L, slow: fat capsule tanks, radiator fins, piping, cockpit.
function makeTanker(s) {
  const grp = new THREE.Group();
  grp.add(part(box(0.025, 0.025, 0.4), C(s, 'dark'), 0, 0, 0));
  const tg = g('tkTank', () => new THREE.CapsuleGeometry(0.06, 0.07, 4, 12));
  for (let i = 0; i < 3; i++) {
    addRot(grp, tg, i % 2 ? C(s, 'hull2') : C(s, 'hull'), 0, 0, 0.1 - i * 0.12, Math.PI / 2);
    grp.add(part(box(0.14, 0.002, 0.05), C(s, 'accent'), 0, -0.07, 0.1 - i * 0.12));
  }
  addRot(grp, cone(0.04, 0.1, 12), C(s, 'accent'), 0, 0, 0.27, Math.PI / 2);
  grp.add(part(box(0.03, 0.012, 0.01), C(s, 'glass'), 0, 0.02, 0.3));
  engineGlow(grp, s, 0, 0, -0.23, 0.034);
  runningLights(grp, s, 0.07, -0.07, 0);
  antenna(grp, s, 0, 0.06, -0.02, 0.05);
  return grp;
}

// 8. Liner — L, medium: long hull with window rows, observation domes, big engines.
function makeLiner(s) {
  const grp = new THREE.Group();
  addRot(grp, cyl(0.05, 0.05, 0.46, 14), C(s, 'hull'), 0, 0, 0, Math.PI / 2);
  addRot(grp, g('liNose', () => new THREE.SphereGeometry(0.05, 14, 10, 0, 6.28, 0, 1.2)), C(s, 'hull2'), 0, 0, 0.23, -Math.PI / 2);
  for (let z = 0.16; z > -0.2; z -= 0.045) {
    grp.add(part(box(0.012, 0.012, 0.02), C(s, 'glass'), 0.05, 0.012, z));
    grp.add(part(box(0.012, 0.012, 0.02), C(s, 'glass'), -0.05, 0.012, z));
  }
  grp.add(part(sph(0.035, 12), C(s, 'glass'), 0, 0.05, 0.08));
  grp.add(part(sph(0.03, 12), C(s, 'glass'), 0, 0.05, -0.05));
  for (const x of [-0.07, 0.07]) {
    grp.add(part(box(0.02, 0.02, 0.04), C(s, 'accent'), x, 0, -0.2));
    addRot(grp, cyl(0.03, 0.03, 0.06, 10), C(s, 'dark'), x, 0, -0.24, Math.PI / 2);
    engineGlow(grp, s, x, 0, -0.28, 0.026);
  }
  runningLights(grp, s, 0.052, 0, 0.22);
  antenna(grp, s, 0, 0.05, 0.18, 0.06);
  return grp;
}

// 9. Flagship — XL, slowest: long wedge, command tower, batteries, hangar, 4 engines.
function makeFlagship(s) {
  const grp = new THREE.Group();
  grp.add(part(wedge(0.34, 0.12, 1.0), C(s, 'accent'), 0, 0, 0));
  grp.add(part(box(0.12, 0.12, 0.18), C(s, 'dark'), 0, 0.11, -0.28)); // tower
  grp.add(part(box(0.1, 0.04, 0.06), C(s, 'glass'), 0, 0.17, -0.24)); // bridge
  grp.add(part(box(0.04, 0.05, 0.7), C(s, 'dark'), 0, 0.07, -0.05)); // dorsal spine
  for (const x of [-0.16, 0.16]) {
    for (const z of [0.1, -0.05, -0.2]) grp.add(part(box(0.03, 0.03, 0.12), C(s, 'dark'), x, 0, z));
    for (let z = 0.2; z > -0.3; z -= 0.07) grp.add(part(box(0.006, 0.006, 0.02), C(s, 'glass'), x * 0.92, 0.02, z));
  }
  grp.add(part(box(0.1, 0.04, 0.06), C(s, 'glass'), 0, -0.05, 0.42)); // hangar mouth
  for (const x of [-0.1, -0.034, 0.034, 0.1]) engineGlow(grp, s, x, 0, -0.52, 0.03);
  grp.add(part(box(0.02, 0.04, 0.3), ACC(s), 0, 0.1, -0.05)); // signature spine stripe
  runningLights(grp, s, 0.17, 0, 0.3);
  antenna(grp, s, 0, 0.17, -0.34, 0.1);
  return grp;
}

// Roles registry — silhouette builder + size + in-fiction stats/description.
// `scale` makes the role's display/world size match its purpose (scout tiny,
// flagship huge). `cat` drives in-system traffic mix; `speed` the flight speed.
export const ROLES = [
  { id: 'scout', name: 'Скаут', cat: 'scout', size: 'XS', lengthM: 16, speed: 14, crew: 1, scale: 0.7, arm: 'без вооружения', purpose: 'разведка и связь', desc: 'Лёгкий быстрый разведчик — глаза и уши флота.', make: makeScout },
  { id: 'fighter', name: 'Истребитель', cat: 'fighter', size: 'S', lengthM: 12, speed: 12, crew: 1, scale: 0.95, arm: 'спаренные пушки', purpose: 'лёгкий бой', desc: 'Основной боевой корабль: маневренный, с пушками.', make: makeFighter },
  { id: 'interceptor', name: 'Перехватчик', cat: 'fighter', size: 'S', lengthM: 14, speed: 14, crew: 1, scale: 0.95, arm: 'скоростные орудия', purpose: 'против истребителей', desc: 'Самый быстрый — догоняет и сбивает чужаков.', make: makeInterceptor },
  { id: 'gunship', name: 'Канонерка', cat: 'fighter', size: 'M', lengthM: 28, speed: 8, crew: 4, scale: 1.3, arm: 'тяжёлые орудия + турель', purpose: 'штурм', desc: 'Летающая батарея: медленнее, но бьёт больно.', make: makeGunship },
  { id: 'corvette', name: 'Корвет', cat: 'fighter', size: 'M', lengthM: 60, speed: 9, crew: 20, scale: 1.5, arm: 'турели', purpose: 'эскорт и патруль', desc: 'Малый военный корабль: мостик, турели, эскорт.', make: makeCorvette },
  { id: 'freighter', name: 'Грузовик', cat: 'transport', size: 'L', lengthM: 90, speed: 5, crew: 8, scale: 1.25, arm: 'карго 8 000 т', purpose: 'перевозка грузов', desc: 'Рабочая лошадка: контейнеры, медленно, надёжно.', make: makeFreighter },
  { id: 'tanker', name: 'Танкер', cat: 'transport', size: 'L', lengthM: 85, speed: 4.5, crew: 6, scale: 1.2, arm: 'танки топлива/газа', purpose: 'топливо и газ', desc: 'Возит топливо и сжатый газ в больших баках.', make: makeTanker },
  { id: 'liner', name: 'Лайнер', cat: 'transport', size: 'L', lengthM: 120, speed: 5.5, crew: 40, scale: 1.35, arm: 'до 4 000 колонистов', purpose: 'пассажиры и колонисты', desc: 'Перевозит людей: ряды окон, обзорные купола.', make: makeLiner },
  { id: 'flagship', name: 'Флагман', cat: 'flagship', size: 'XL', lengthM: 400, speed: 2.6, crew: 2000, scale: 1.9, arm: 'батареи + ангар', purpose: 'командный дредноут', desc: 'Сердце флота: огромный, медленный, ощетинился орудиями.', make: makeFlagship },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));
