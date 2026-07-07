import { build } from 'esbuild';

await build({
  entryPoints: ['s/app.src.js'],
  bundle: true,
  minify: true,
  target: 'es2019',
  format: 'iife',
  platform: 'browser',
  outfile: 's/app.js',
});
