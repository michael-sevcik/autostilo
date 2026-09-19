import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'src', 'template.html');
const localesDir = path.join(rootDir, 'src', 'locales');
const outputRoot = rootDir;

const languages = ['cs', 'en', 'de'];
const localeUrls = {
  cs: 'https://stilomont.cz/cs/',
  en: 'https://stilomont.cz/en/',
  de: 'https://stilomont.cz/de/'
};

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

function buildLanguageSwitcher(currentLang, localeData) {
  return languages
    .map((langCode) => {
      const current = langCode === currentLang ? ' aria-current="page"' : '';
      const langName = localeData.ui.languageNames[langCode];
      return `<a href="/${langCode}/" lang="${langCode}"${current}>${escapeHtml(langName)}</a>`;
    })
    .join('');
}

function buildHreflangs() {
  const links = languages
    .map((langCode) => `<link rel="alternate" hreflang="${langCode}" href="${localeUrls[langCode]}">`)
    .join('\n    ');
  return `${links}\n    <link rel="alternate" hreflang="x-default" href="${localeUrls.cs}">`;
}

function buildOgAlternates(currentLang) {
  return languages
    .filter((langCode) => langCode !== currentLang)
    .map((langCode) => `<meta property="og:locale:alternate" content="${langCode === 'cs' ? 'cs_CZ' : langCode === 'en' ? 'en_US' : 'de_DE'}">`)
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

  for (const langCode of languages) {
    const localePath = path.join(localesDir, `${langCode}.json`);
    const localeData = JSON.parse(await fs.readFile(localePath, 'utf8'));

    if (!Array.isArray(localeData.services?.items) || !Array.isArray(localeData.process?.steps)) {
      throw new Error(`Locale ${langCode} is missing required dynamic content arrays.`);
    }

    const canonicalUrl = localeUrls[langCode];
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
      languageSwitcherDesktop: buildLanguageSwitcher(langCode, localeData),
      languageSwitcherMobile: buildLanguageSwitcher(langCode, localeData),
      schemaJson: createSchemaJson(localeData, canonicalUrl)
    };

    const html = renderTemplate(template, data);
    const langDir = path.join(outputRoot, langCode);
    await fs.mkdir(langDir, { recursive: true });
    await fs.writeFile(path.join(langDir, 'index.html'), html, 'utf8');
  }

  const rootRedirect = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/cs/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="https://stilomont.cz/cs/">
  <title>STILO MONT</title>
</head>
<body>
  <p>Přesměrování na českou verzi… <a href="/cs/">Pokračovat</a></p>
</body>
</html>
`;

  await fs.writeFile(path.join(outputRoot, 'index.html'), rootRedirect, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
