# STILO MONT - Web Project

This project uses a compiled version of **Tailwind CSS** and a lightweight static generator for localized pages.

We removed the heavy browser-based Tailwind CDN script to serve only the CSS classes that are actually used on the page. Here is how the project works now with the optimized **CSS**:

## How the workflow works

1. The raw Tailwind imports are in `src/input.css`.
2. The `css/output.css` file is the compiled, minified stylesheet linked by localized pages.
3. The shared HTML template is in `src/template.html`.
4. Locale dictionaries are in `src/locales/cs.json`, `src/locales/en.json`, and `src/locales/de.json`.
5. `scripts/build-site.mjs` generates static pages into:
   - `cs/index.html`
   - `en/index.html`
   - `de/index.html`
6. `index.html` at repository root redirects to Czech (`/cs/`) as the default language.

## What to do when you make changes to `index.html`

If you change the layout or add *new* Tailwind utility classes to your HTML, you need to run the CSS build command. 

First time setup on a new computer:
```bash
npm install
```

### Build localized site (recommended)
Run this command in the terminal to build CSS and all localized pages:
```bash
npm run build
```

### Run locally
After building, serve the repository root with any static server, for example:
```bash
python3 -m http.server 8080
```
Then open:
- `http://localhost:8080/cs/`
- `http://localhost:8080/en/`
- `http://localhost:8080/de/`

### CSS watch mode (development)
If you are actively changing styles, run this in the background to auto-build CSS:
```bash
npm run watch:css
```

Then regenerate localized pages after content/template updates:
```bash
npm run build:site
```

### Summary before committing
1. If you changed Tailwind classes, run `npm run build:css`.
2. If you changed locale/template/build logic, run `npm run build:site` (or `npm run build`).
3. Commit updated source files and generated localized HTML files (`cs/`, `en/`, `de/`, and root `index.html` redirect if changed).
