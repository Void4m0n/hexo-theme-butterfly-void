'use strict'

const path = require('path')
const multilingualConfig = require(path.join(hexo.base_dir, 'multilingual.config.cjs'))
const { defaultLanguage, languages } = multilingualConfig

function getLanguage (value) {
  const language = Array.isArray(value) ? value[0] : value
  return languages.some(item => item.code === language) ? language : defaultLanguage
}

function getLanguageConfig (code) {
  return languages.find(language => language.code === code) || languages.find(language => language.code === defaultLanguage)
}

function getOrigin (config) {
  return new URL(config.url).origin
}

function canonicalRoute (route, config) {
  if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//') || /[?#]/.test(route)) return null

  try {
    const origin = getOrigin(config)
    const url = new URL(route, `${origin}/`)
    if (url.origin !== origin) return null
    if (config.pretty_urls?.trailing_index !== false && url.pathname.endsWith('/')) url.pathname += 'index.html'
    return url.href
  } catch {
    return null
  }
}

function currentCanonical (context, config) {
  try {
    const origin = getOrigin(config)
    const url = new URL(context.url || '/', `${origin}/`)
    if (config.pretty_urls?.trailing_index !== false && url.pathname.endsWith('/')) url.pathname += 'index.html'
    return url.href
  } catch {
    return config.url
  }
}

function navigationPath (url, fallback = '/') {
  try {
    const pathname = new URL(url).pathname
    return pathname.endsWith('/index.html') ? pathname.slice(0, -'index.html'.length) : pathname
  } catch {
    return fallback
  }
}

function homeRoute (language) {
  const mount = getLanguageConfig(language).mount
  return mount ? `/${mount}/` : '/'
}

function archivesRoute (language, archiveDir) {
  const directory = String(archiveDir || 'archives').replace(/^\/+|\/+$/g, '')
  return `${homeRoute(language)}${directory}/`.replace(/\/{2,}/g, '/')
}

function isNoindex (page) {
  return page.noindex === true || page.indexable === false || String(page.robots || '').toLowerCase().includes('noindex')
}

hexo.extend.helper.register('multilingual_page_links', function (page, pageType) {
  const config = this.config
  const currentLang = getLanguage(config.language)
  const currentLanguage = getLanguageConfig(currentLang)
  const currentUrl = currentCanonical(this, config)
  const paginated = Number(page.current || 1) > 1
  const notFound = pageType === '404' || page.type === '404'
  const datedArchive = pageType === 'archive' && Boolean(page.year || page.month)
  const eligible = !notFound && !paginated && !datedArchive && !isNoindex(page)
  const exactUrls = new Map([[currentLang, currentUrl]])

  if (eligible && pageType === 'home') {
    languages.forEach(language => {
      exactUrls.set(language.code, canonicalRoute(homeRoute(language.code), config))
    })
  } else if (eligible && pageType === 'archive') {
    languages.forEach(language => {
      exactUrls.set(language.code, canonicalRoute(archivesRoute(language.code, config.archive_dir), config))
    })
  } else if (eligible && page.translations && typeof page.translations === 'object') {
    Object.entries(page.translations).forEach(([language, route]) => {
      if (language === currentLang || !languages.some(item => item.code === language)) return
      const counterpart = canonicalRoute(route, config)
      if (counterpart) exactUrls.set(language, counterpart)
    })
  }

  const exact = exactUrls.size > 1
  const items = languages.map(language => ({
    language: language.code,
    label: language.label,
    active: language.code === currentLang,
    href: navigationPath(
      exactUrls.get(language.code) || canonicalRoute(homeRoute(language.code), config),
      homeRoute(language.code)
    )
  }))

  let alternates = null
  const defaultUrl = exactUrls.get(defaultLanguage)
  if (exact && defaultUrl) {
    alternates = languages
      .filter(language => exactUrls.has(language.code))
      .map(language => ({ language: language.code, href: exactUrls.get(language.code) }))
    alternates.push({ language: 'x-default', href: defaultUrl })
  }

  return { currentLang, currentShortLabel: currentLanguage.shortLabel || currentLang.toUpperCase(), items, alternates, exact }
})
