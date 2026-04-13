# STILO MONT - Web Project

This project uses a compiled version of **Tailwind CSS** for maximum performance and a perfect PageSpeed score. 

We removed the heavy browser-based Tailwind CDN script to serve only the CSS classes that are actually used on the page. Here is how the project works now with the optimized **CSS**:

## How the new CSS workflow works

1. The raw Tailwind imports are in `src/input.css`.
2. The `css/output.css` file is the compiled, minified stylesheet that gets linked in `index.html`.
3. Whenever you add **new Tailwind classes** to your HTML elements, you must re-compile the `output.css` file so those new styles get included.

## What to do when you make changes to `index.html`

If you change the layout or add *new* Tailwind utility classes to your HTML, you need to run the CSS build command. 

First time setup on a new computer:
```bash
npm install
```

### Option 1: Run the build once
Run this command in the terminal to generate an updated, minified `output.css`:
```bash
npm run build:css
```

### Option 2: Watch mode (Recommended for development)
If you are doing active development, run this command in the background. It will automatically update the `output.css` every time you save `index.html` or `src/input.css`:
```bash
npm run watch:css
```

### Summary of Steps before committing to GitHub:
If you changed `index.html` and added/removed Tailwind classes:
1. Make sure you've ran `npm run build:css` (or had the watcher running).
2. Commit both `index.html` and the updated `css/output.css` file.
3. Push to GitHub!
