// Colour palettes for the galaxy.
//
// Each palette drives three things:
//   core   -> the hot bright centre / bulge
//   inner  -> arm colour near the core
//   outer  -> arm colour at the disk edge
//   nebula -> the soft gas disk (centre / mid / edge)
//   background -> renderer clear colour (deep space)
//
// Star colour is interpolated inner->outer by radius, with the bulge tinted
// toward `core`. Suns (the little colourful solar-system stars) are generated
// separately with vivid full-spectrum hues, so they pop against any palette.

export const PALETTES = {
  spore: {
    label: 'Spore (R/B/Y/V)',
    background: '#04020c',
    core: '#ffe6ad', // warm golden bulge
    inner: '#d9c6ff', // lavender near the core
    outer: '#4f5cff', // blue-violet outer arms
    hot: '#7fb4ff', // sprinkled hot blue stars
    nebula: { core: '#ffcf8a', mid: '#9a52ff', edge: '#3a1a7a' }, // gold → purple → violet
  },
  ember: {
    label: 'Ember (тёплая)',
    background: '#0b0503',
    core: '#fff1cf',
    inner: '#ffd089',
    outer: '#ff5a3c',
    hot: '#ffd0a0',
    nebula: { core: '#ffe7b0', mid: '#e0632a', edge: '#5a1c0e' },
  },
  emerald: {
    label: 'Emerald (изумруд)',
    background: '#02080a',
    core: '#eafff4',
    inner: '#9af7d0',
    outer: '#1fae8c',
    hot: '#bfffe6',
    nebula: { core: '#d6fff0', mid: '#1f9e86', edge: '#0a3b32' },
  },
  ice: {
    label: 'Ice (ледяная)',
    background: '#030810',
    core: '#ffffff',
    inner: '#bfe6ff',
    outer: '#3f7bff',
    hot: '#dff0ff',
    nebula: { core: '#e6f4ff', mid: '#3f7bd6', edge: '#13284f' },
  },
  rose: {
    label: 'Rose (розово-пурпурная)',
    background: '#0a030a',
    core: '#fff0fb',
    inner: '#ffb3e6',
    outer: '#b03cff',
    hot: '#ffd0f0',
    nebula: { core: '#ffd6f2', mid: '#c03cd0', edge: '#451460' },
  },
};

export const PALETTE_NAMES = Object.keys(PALETTES);

export function getPalette(name) {
  return PALETTES[name] || PALETTES.spore;
}
