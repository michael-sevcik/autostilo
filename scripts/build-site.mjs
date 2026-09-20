import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'src', 'template.html');
const localesDir = path.join(rootDir, 'src', 'locales');
const outputRoot = rootDir;

const languages = [
  { code: 'cs', url: 'https://stilomont.cz/cs/', ogLocale: 'cs_CZ' },
  { code: 'en', url: 'https://stilomont.cz/en/', ogLocale: 'en_US' },
  { code: 'de', url: 'https://stilomont.cz/de/', ogLocale: 'de_DE' }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPath(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function renderTemplate(template, data) {
  return template
    .replace(/\{\{\{\s*([^{}]+?)\s*\}\}\}/g, (_, keyPath) => {
      const value = getPath(data, keyPath.trim());
      if (value === undefined || value === null) {
        throw new Error(`Missing template key: ${keyPath}`);
      }
      return String(value);
    })
    .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, keyPath) => {
      const value = getPath(data, keyPath.trim());
      if (value === undefined || value === null) {
        throw new Error(`Missing template key: ${keyPath}`);
      }
      return escapeHtml(value);
    });
}

function buildLanguageOptions(currentLang, localeData) {
  return languages
    .map(({ code }) => {
      const selected = code === currentLang ? ' selected' : '';
      const langName = localeData.ui.languageNames[code];
      return `<option value="/${code}/" lang="${code}"${selected}>${escapeHtml(langName)}</option>`;
    })
    .join('');
}

function buildLanguageMenu(currentLang, localeData) {
  const currentName = localeData.ui.languageNames[currentLang];
  const links = languages
    .map(({ code }) => {
      const current = code === currentLang ? ' aria-current="page"' : '';
      const langName = localeData.ui.languageNames[code];
      return `<a href="/${code}/" lang="${code}" role="option"${current}>${escapeHtml(langName)}</a>`;
    })
    .join('');

  return `<button type="button" class="language-picker-button" aria-haspopup="listbox" aria-expanded="false" aria-label="${escapeHtml(localeData.ui.languageSwitcherAriaLabel)}">
    <i class="language-picker-icon fa-solid fa-globe" aria-hidden="true"></i>
    <span>${escapeHtml(currentName)}</span>
  </button>
  <div class="language-picker-menu" role="listbox" hidden>${links}</div>`;
}

function buildHreflangs() {
  const links = languages
    .map(({ code, url }) => `<link rel="alternate" hreflang="${code}" href="${url}">`)
    .join('\n    ');
  return `${links}\n    <link rel="alternate" hreflang="x-default" href="${languages[0].url}">`;
}

function buildOgAlternates(currentLang) {
  return languages
    .filter(({ code }) => code !== currentLang)
    .map(({ ogLocale }) => `<meta property="og:locale:alternate" content="${ogLocale}">`)
    .join('\n    ');
}

function createSchemaJson(localeData, canonicalUrl) {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'STILO MONT s.r.o.',
      image: 'https://stilomont.cz/imgs/logo.svg',
      url: canonicalUrl,
      telephone: '+420608336670',
      email: 'info@stilomont.cz',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Salaš 96',
        addressLocality: 'Zlín',
        postalCode: '763 51',
        addressCountry: 'CZ'
      },
      areaServed: ['CZ', 'SK'],
      description: localeData.schema.description
    },
    null,
    2
  ).replace(/</g, '\\u003c');
}

async function main() {
  const template = await fs.readFile(templatePath, 'utf8');

  for (const { code: langCode } of languages) {
    const localePath = path.join(localesDir, `${langCode}.json`);
    const localeData = JSON.parse(await fs.readFile(localePath, 'utf8'));

    if (!Array.isArray(localeData.services?.items) || !Array.isArray(localeData.process?.steps)) {
      throw new Error(`Locale ${langCode} is missing required dynamic content arrays.`);
    }

    const language = languages.find(({ code }) => code === langCode);
    const canonicalUrl = language.url;
    const data = {
      ...localeData,
      meta: {
        ...localeData.meta,
        canonicalUrl,
        ogUrl: canonicalUrl
      },
      localeDataJson: JSON.stringify(localeData).replace(/</g, '\\u003c'),
      hreflangLinks: buildHreflangs(),
      ogLocaleAlternates: buildOgAlternates(langCode),
      languageSwitcherDesktop: buildLanguageMenu(langCode, localeData),
      languageSwitcherMobile: buildLanguageOptions(langCode, localeData),
      schemaJson: createSchemaJson(localeData, canonicalUrl)
    };

    const html = renderTemplate(template, data);
    const langDir = path.join(outputRoot, langCode);
    await fs.mkdir(langDir, { recursive: true });
    await fs.writeFile(path.join(langDir, 'index.html'), html, 'utf8');
  }

  const rootRedirect = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="https://stilomont.cz/en/">
  <title>STILO MONT</title>
</head>
<body>
  <noscript>
    <meta http-equiv="refresh" content="0; url=/en/">
    <p>Redirecting to the English version… <a href="/en/">Continue</a></p>
  </noscript>
  <script>
    const supportedLanguages = ${JSON.stringify(languages.map(({ code }) => code))};
    const preferredLanguage = (navigator.languages || [navigator.language])
      .map((language) => language.toLowerCase().split('-')[0])
      .find((language) => supportedLanguages.includes(language)) || 'en';
    window.location.replace('/' + preferredLanguage + '/' + window.location.search + window.location.hash);
  </script>
</body>
</html>
`;

  await fs.writeFile(path.join(outputRoot, 'index.html'), rootRedirect, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
