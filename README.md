# simplyauth.app

Static marketing + utility site for [SimplyAuth](https://simplyauth.app), served by GitHub Pages from `main` (custom domain via `CNAME`).

Everything is plain HTML/CSS/JS with no build step — except the Secure Send reveal page below.

## Rebuilding s/app.js

`s/` is the Secure Send recipient reveal page (`https://simplyauth.app/s/?i=<id>#<key>`). Its script is bundled (the decrypt code imports `@noble/ciphers`), so `s/app.js` is a build artifact that must be regenerated and committed whenever `s/app.src.js` changes:

```sh
npm install
npm run build   # bundles s/app.src.js -> s/app.js (esbuild, minified)
```

Never edit `s/app.js` by hand.
