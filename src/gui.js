// Live control panel (lil-gui). Structural controls rebuild geometry on
// release (onFinishChange) to keep dragging smooth; look/motion/effect controls
// update shader uniforms live (onChange). Labels are in Russian.

import GUI from 'lil-gui';
import { PALETTES, PALETTE_NAMES } from './palettes.js';
import { QUALITY_PRESETS } from './config.js';

export function buildGUI(app) {
  const c = app.config;
  const rebuild = () => app.rebuild();
  const live = () => app.applyLive();

  const gui = new GUI({ title: '✦ Галактика' });

  // --- identity ---
  const paletteOptions = {};
  for (const name of PALETTE_NAMES) paletteOptions[PALETTES[name].label] = name;
  gui.add(c, 'palette', paletteOptions).name('Палитра').onChange(() => {
    rebuild();
    live();
  });

  const qualityOptions = {};
  for (const q of Object.keys(QUALITY_PRESETS)) qualityOptions[QUALITY_PRESETS[q].label] = q;
  gui.add(c, 'quality', qualityOptions).name('Качество').onChange((q) => app.setQuality(q));

  const seedCtrl = gui.add(c, 'seed').name('Сид').onFinishChange(rebuild);
  const seedActions = {
    random() {
      c.seed = Math.random().toString(36).slice(2, 10);
      seedCtrl.updateDisplay();
      rebuild();
    },
  };
  gui.add(seedActions, 'random').name('🎲 Новый сид');

  // chart every system at once — turns off the fog-of-war discovery (#13)
  const chartActions = {
    revealAll() {
      app.revealAllSystems();
    },
  };
  gui.add(chartActions, 'revealAll').name('✦ Открыть все системы');

  // --- shape (structural) ---
  const fShape = gui.addFolder('Форма');
  fShape.add(c, 'starCount', 5000, 200000, 1000).name('Звёзды').onFinishChange(rebuild);
  fShape.add(c, 'arms', 1, 8, 1).name('Рукава').onFinishChange(rebuild);
  fShape.add(c, 'spin', 0, 8, 0.05).name('Закрутка').onFinishChange(rebuild);
  fShape.add(c, 'armWidth', 0.05, 0.7, 0.01).name('Толщина рукавов').onFinishChange(rebuild);
  fShape.add(c, 'randomness', 0, 0.6, 0.01).name('Разброс').onFinishChange(rebuild);
  fShape.add(c, 'randomnessPower', 1, 5, 0.1).name('Сжатие рукавов').onFinishChange(rebuild);
  fShape.add(c, 'coreSize', 0.05, 0.4, 0.01).name('Размер ядра').onFinishChange(rebuild);
  fShape.add(c, 'coreDensity', 0, 0.6, 0.01).name('Плотность ядра').onFinishChange(rebuild);
  fShape.add(c, 'thickness', 0.0, 0.2, 0.005).name('Толщина диска').onFinishChange(rebuild);
  fShape.close();

  // --- suns ---
  const fSuns = gui.addFolder('Солнца');
  fSuns.add(c, 'sunCount', 0, 400, 5).name('Количество').onFinishChange(rebuild);
  fSuns.add(c, 'sunSize', 0.3, 3, 0.05).name('Размер').onChange(live);
  fSuns.close();

  // --- explorable systems ---
  const fSys = gui.addFolder('Системы');
  fSys
    .add(c, 'realSystemFraction', 0, 1, 0.01)
    .name('Доля реальных')
    .onFinishChange(() => app.rebuildSystems());
  fSys.add(c, 'showMarkers').name('Метки').onChange(live);
  fSys
    .add(
      {
        random() {
          const s = app.systems.randomSystem();
          if (s) app.enterSystem(s);
        },
      },
      'random',
    )
    .name('🛰 Случайная система');
  fSys.close();

  // --- motion (live, GPU) ---
  const fMotion = gui.addFolder('Движение');
  fMotion.add(c, 'rotationSpeed', 0, 0.2, 0.001).name('Скорость вращения').onChange(live);
  fMotion.add(c, 'differential', 0, 1, 0.01).name('Дифф. вращение').onChange(live);
  fMotion.add(c, 'twinkle', 0, 1, 0.01).name('Мерцание').onChange(live);
  fMotion.add(c, 'cameraAutoRotate').name('Вращение камеры').onChange(live);

  // --- light & nebula (live) ---
  const fLight = gui.addFolder('Свет и туманность');
  fLight.add(c, 'exposure', 0.3, 2, 0.01).name('Яркость').onChange(live);
  fLight.add(c, 'starSize', 0.3, 2.5, 0.01).name('Размер звёзд').onChange(live);
  fLight.add(c, 'nebula').name('Туманность').onChange(live);
  fLight.add(c, 'nebulaIntensity', 0, 1.5, 0.01).name('Плотность газа').onChange(live);
  fLight.close();

  // --- sound (stage 5): the two volumes, persisted per device. No mute here —
  // the ♪ button (bottom-right) is the single master on/off for ALL audio. ---
  const fSound = gui.addFolder('Звук');
  fSound.add(app.sfx, 'volume', 0, 1, 0.05).name('Интерфейс').onChange((v) => app.sfx.setVolume(v));
  fSound.add(app.music, 'volume', 0, 1, 0.05).name('Музыка').onChange((v) => app.music.setVolume(v));
  fSound.close();

  // --- readout ---
  const fpsCtrl = gui.add(app.stats, 'fps').name('FPS').disable();

  // --- perf budget (stage-0 surface; see config.js PERF_BUDGETS) ---
  const fBudget = gui.addFolder('Бюджет');
  const dcCtrl = fBudget.add(app.stats, 'drawCalls').name('Вызовы отрисовки').disable();
  const triCtrl = fBudget.add(app.stats, 'triangles').name('Треугольники').disable();
  fBudget.close();

  // .listen() self-schedules a RAF per controller even while the panel is
  // hidden — main.js flips these with the ⚙ toggle so a closed panel costs
  // nothing (lil-gui's listen(false) cancels the pending frame).
  gui.setReadoutsLive = (on) => {
    for (const ctrl of [fpsCtrl, dcCtrl, triCtrl]) ctrl.listen(on);
  };

  return gui;
}
