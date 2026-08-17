const BASE = "https://tcbonepiecechapters.com";

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function absoluteURL(raw) {
  if (!raw) return null;
  try {
    return new URL(decodeEntities(raw), BASE).href;
  } catch (_) {
    return null;
  }
}

async function getHTML(url) {
  const response = await mihon.request({
    url,
    method: "GET",
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Referer": BASE + "/"
    }
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status} while requesting ${url}`);
  }
  return response.body;
}

function slugTitle(url) {
  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "Untitled";
    return slug.split("-").map(part => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
  } catch (_) {
    return "Untitled";
  }
}

function idFromURL(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const index = parts.indexOf("mangas");
    return index >= 0 && parts[index + 1] ? parts[index + 1] : url;
  } catch (_) {
    return url;
  }
}

function extractMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta\\b[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]).trim();
  }
  return null;
}

function extractHeading(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : null;
}

function projectManga(html) {
  const items = [];
  const seen = new Set();
  const anchor = /<a\b[^>]*href=["']([^"']*\/mangas\/\d+\/[^"'?#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchor.exec(html)) !== null) {
    const url = absoluteURL(match[1]);
    if (!url || seen.has(url)) continue;

    let title = stripTags(match[2]);
    if (!title) {
      const alt = match[2].match(/<img\b[^>]*alt=["']([^"']+)["']/i);
      if (alt) title = decodeEntities(alt[1]).trim();
    }
    if (!title) title = slugTitle(url);

    seen.add(url);
    items.push({
      id: idFromURL(url),
      title,
      url,
      thumbnailURL: null,
      author: null,
      artist: null,
      summary: null,
      genres: [],
      status: null
    });
  }
  return items;
}

function chapterRows(html, mangaTitle) {
  const chapters = [];
  const seen = new Set();
  const anchor = /<a\b[^>]*href=["']([^"']*\/chapters\/\d+\/[^"'?#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchor.exec(html)) !== null) {
    const url = absoluteURL(match[1]);
    if (!url || seen.has(url)) continue;
    const title = stripTags(match[2]) || slugTitle(url);
    const numberMatch = title.match(/chapter\s+([0-9]+(?:\.[0-9]+)?)/i);
    const number = numberMatch ? Number(numberMatch[1]) : null;
    const idMatch = new URL(url).pathname.match(/\/chapters\/(\d+)\//);

    seen.add(url);
    chapters.push({
      id: idMatch ? idMatch[1] : url,
      title: title || `${mangaTitle || "Chapter"}${number != null ? ` Chapter ${number}` : ""}`,
      url,
      number: Number.isFinite(number) ? number : null,
      scanlator: "TCB Scans",
      uploadedAt: null
    });
  }
  return chapters;
}

function chapterPages(html) {
  const pages = [];
  const seen = new Set();

  const add = raw => {
    const url = absoluteURL(raw);
    if (!url || seen.has(url)) return;
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host !== "cdn.onepiecechapters.com") return;
    } catch (_) {
      return;
    }
    seen.add(url);
    pages.push({ url, referer: BASE + "/" });
  };

  const image = /<img\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = image.exec(html)) !== null) add(match[1]);

  const link = /<a\b[^>]*href=["'](https?:\/\/cdn\.onepiecechapters\.com\/[^"']+)["'][^>]*>/gi;
  while ((match = link.exec(html)) !== null) add(match[1]);

  return pages;
}

globalThis.source = {
  async search(query, page) {
    const html = await getHTML(BASE + "/projects");
    const normalized = String(query || "").trim().toLowerCase();
    const all = projectManga(html).filter(item => !normalized || item.title.toLowerCase().includes(normalized));
    const pageSize = 24;
    const safePage = Math.max(1, Number(page) || 1);
    const start = (safePage - 1) * pageSize;
    return {
      manga: all.slice(start, start + pageSize),
      hasNextPage: start + pageSize < all.length
    };
  },

  async details(manga) {
    const html = await getHTML(manga.url);
    const title = extractHeading(html) || manga.title;
    const image = extractMeta(html, "og:image");
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");

    return {
      id: manga.id,
      title,
      url: manga.url,
      thumbnailURL: image || manga.thumbnailURL || null,
      author: manga.author || null,
      artist: manga.artist || null,
      summary: description || manga.summary || null,
      genres: manga.genres || [],
      status: manga.status || null
    };
  },

  async chapters(manga) {
    const html = await getHTML(manga.url);
    const chapters = chapterRows(html, manga.title);
    if (!chapters.length) throw new Error("No chapters were found on this manga page.");
    return chapters;
  },

  async pages(chapter) {
    const html = await getHTML(chapter.url);
    const pages = chapterPages(html);
    if (!pages.length) throw new Error("No reader images were found on this chapter page.");
    return pages;
  }
};
