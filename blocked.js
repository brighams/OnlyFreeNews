const api = typeof browser !== "undefined" ? browser : chrome;

const STORAGE_KEY = "sources";
const DEFAULT_SOURCES = [
  {
    name: "ProPublica",
    url: "https://www.propublica.org/",
    category: "Investigative",
    rss: "https://www.propublica.org/feeds/propublica/main",
    sortOrder: 10
  },
  {
    name: "NPR",
    url: "https://www.npr.org/",
    category: "Public Media",
    rss: "https://feeds.npr.org/1001/rss.xml",
    sortOrder: 10
  },
  {
    name: "PBS NewsHour",
    url: "https://www.pbs.org/newshour/",
    category: "Public Media",
    rss: "https://www.pbs.org/newshour/feeds/rss/headlines",
    sortOrder: 20
  },
  // {
  //   name: "Associated Press",
  //   url: "https://apnews.com/",
  //   category: "World",
  //   rss: "",
  //   sortOrder: 10
  // },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/",
    category: "World",
    rss: "https://www.theguardian.com/world/rss",
    sortOrder: 40
  },
  {
    name: "BBC News",
    url: "https://www.bbc.com/news",
    category: "World",
    rss: "https://feeds.bbci.co.uk/news/rss.xml",
    sortOrder: 50
  },
  {
    name: "Deutsche Welle (DW)",
    url: "https://www.dw.com/en",
    category: "World",
    rss: "https://rss.dw.com/xml/rss-en-all",
    sortOrder: 60
  },
  {
    name: "France 24",
    url: "https://www.france24.com/en/",
    category: "World",
    rss: "https://www.france24.com/en/rss",
    sortOrder: 70
  },
  {
    name: "NHK World",
    url: "https://www3.nhk.or.jp/nhkworld/en/news/",
    category: "World",
    rss: "https://www3.nhk.or.jp/nhkworld/en/news/rss.xml",
    sortOrder: 80
  },
  {
    name: "ABC News (Australia)",
    url: "https://www.abc.net.au/news",
    category: "World",
    rss: "",
    sortOrder: 90
  },
  {
    name: "CBC News (Canada)",
    url: "https://www.cbc.ca/news",
    category: "World",
    rss: "https://www.cbc.ca/cmlink/rss-topstories",
    sortOrder: 100
  },
  {
    name: "The Times of Israel",
    url: "https://www.timesofisrael.com/",
    category: "World",
    rss: "https://www.timesofisrael.com/feed/",
    sortOrder: 110
  },
  {
    name: "Al Jazeera English",
    url: "https://www.aljazeera.com/",
    category: "World",
    rss: "https://www.aljazeera.com/xml/rss/all.xml",
    sortOrder: 999
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/",
    category: "Tech",
    rss: "https://techcrunch.com/feed/",
    sortOrder: 10
  },
  {
    name: "GeekWire",
    url: "https://www.geekwire.com/",
    category: "Tech",
    rss: "https://www.geekwire.com/feed/",
    sortOrder: 20
  },
  {
    name: "The Register",
    url: "https://www.theregister.com/",
    category: "Tech",
    rss: "https://www.theregister.com/headlines.rss",
    sortOrder: 30
  },
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/",
    category: "Tech",
    rss: "https://news.ycombinator.com/rss",
    sortOrder: 40
  },
  {
    name: "Eurogamer",
    url: "https://www.eurogamer.net/",
    category: "Gaming",
    rss: "https://www.eurogamer.net/feed",
    sortOrder: 20
  },
  {
    name: "Steam News",
    url: "https://store.steampowered.com/news/collection/steam/",
    category: "Gaming",
    rss: "",
    sortOrder: 10
  }
];

const listEl = document.getElementById("source-list");
const headlinesList = document.getElementById("headlines-list");
const headlinesStatus = document.getElementById("headlines-status");
const continueLink = document.getElementById("continue-link");
const statusEl = document.getElementById("status");
const addForm = document.getElementById("add-form");
const addName = document.getElementById("add-name");
const addUrl = document.getElementById("add-url");
const addCategory = document.getElementById("add-category");
const addRss = document.getElementById("add-rss");
const addSubmit = document.getElementById("add-submit");
const addCancel = document.getElementById("add-cancel");
const tabButtons = Array.from(document.querySelectorAll(".tab"));
const tabHeadlines = document.getElementById("tab-headlines");
const tabSources = document.getElementById("tab-sources");
const refreshButton = document.getElementById("refresh-headlines");

let customSources = [];

const DEFAULT_BY_SIGNATURE = new Map(
  DEFAULT_SOURCES.map((source) => [signature(source), source])
);

function signature(source) {
  const normalizedUrl = sanitizeUrl(source.url || "").replace(/\/$/, "").toLowerCase();
  const normalizedName = (source.name || "").trim().toLowerCase();
  return `${normalizedName}|${normalizedUrl}`;
}

function sanitizeUrl(url) {
  if (!url) {
    return "";
  }
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function normalizeCategory(category) {
  const normalized = (category || "").trim();
  return normalized || "General";
}

function getFaviconUrl(url) {
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return "";
  }
  try {
    const faviconUrl = new URL("/favicon.ico", sanitized);
    return faviconUrl.toString();
  } catch (error) {
    return "";
  }
}

function appendSourceIcon(container, source) {
  const placeholder = document.createElement("div");
  placeholder.className = "source-icon placeholder";
  placeholder.textContent = "!";
  container.appendChild(placeholder);

  const iconUrl = getFaviconUrl(source.url);
  if (!iconUrl) {
    return;
  }

  const icon = document.createElement("img");
  icon.className = "source-icon";
  icon.src = iconUrl;
  icon.alt = `${source.name || "Source"} icon`;
  icon.referrerPolicy = "no-referrer";
  icon.crossOrigin = "anonymous";

  icon.addEventListener("load", () => {
    if (icon.naturalWidth > 0 && placeholder.isConnected) {
      placeholder.replaceWith(icon);
    }
  });
  icon.addEventListener("error", () => {
    // Keep placeholder when the favicon is blocked or missing.
  });
}

const CATEGORY_ORDER = [
  "News",
  "World",
  "General",
  "Public Media",
  "Investigative",
  "Tech",
  "Technology",
  "Gaming"
];

function categoryRank(category) {
  const normalized = normalizeCategory(category);
  const index = CATEGORY_ORDER.findIndex(
    (entry) => entry.toLowerCase() === normalized.toLowerCase()
  );
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function sortOrderValue(source) {
  if (typeof source.sortOrder === "number" && !Number.isNaN(source.sortOrder)) {
    return source.sortOrder;
  }
  return null;
}

function hasFeed(source) {
  return Boolean(sanitizeUrl(source.rss || ""));
}

function sortSources(sources) {
  return sources.slice().sort((a, b) => {
    const aOrder = sortOrderValue(a);
    const bOrder = sortOrderValue(b);
    if (aOrder !== null || bOrder !== null) {
      if (aOrder === null) return 1;
      if (bOrder === null) return -1;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    const feedCompare = Number(hasFeed(b)) - Number(hasFeed(a));
    if (feedCompare !== 0) {
      return feedCompare;
    }
    const rankCompare = categoryRank(a.category) - categoryRank(b.category);
    if (rankCompare !== 0) {
      return rankCompare;
    }
    if (Boolean(a.custom) !== Boolean(b.custom)) {
      return a.custom ? -1 : 1;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}

function groupSourcesByCategory(sources) {
  const grouped = new Map();
  sources.forEach((source) => {
    const category = normalizeCategory(source.category);
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(source);
  });
  return Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const rankCompare = categoryRank(a) - categoryRank(b);
      if (rankCompare !== 0) {
        return rankCompare;
      }
      return a.localeCompare(b);
    })
    .map(([category, items]) => ({
      category,
      items: sortSources(items)
    }));
}

function renderSources(sources) {
  listEl.innerHTML = "";

  const grouped = groupSourcesByCategory(sources);
  grouped.forEach(({ category, items }) => {
    const section = document.createElement("div");
    section.className = "category-section";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = category;

    const grid = document.createElement("div");
    grid.className = "category-grid";

    items.forEach((source) => {
      const link = document.createElement("a");
      link.className = `source ${source.custom ? "custom" : "default"}`;
      link.href = sanitizeUrl(source.url);
      link.target = "_blank";
      link.rel = "noopener";

      appendSourceIcon(link, source);

      const titleEl = document.createElement("span");
      titleEl.className = "source-title";
      titleEl.textContent = source.name || "Untitled source";

      const url = document.createElement("span");
      url.className = "source-url";
      url.textContent = sanitizeUrl(source.url) || "No URL provided";

      link.appendChild(titleEl);
      link.appendChild(url);

      if (source.custom) {
        const remove = document.createElement("button");
        remove.className = "remove";
        remove.type = "button";
        remove.textContent = "x";
        remove.addEventListener("click", (event) => {
          event.preventDefault();
          removeSource(source);
        });
        link.appendChild(remove);
      }

      grid.appendChild(link);
    });

    section.appendChild(title);
    section.appendChild(grid);
    listEl.appendChild(section);
  });

  const addGrid = document.createElement("div");
  addGrid.className = "category-grid";

  const addCard = document.createElement("button");
  addCard.type = "button";
  addCard.className = "add-card";
  addCard.innerHTML = `<div class="plus">+</div><p class="hint">Add source</p>`;
  addCard.addEventListener("click", () => {
    addForm.classList.remove("hidden");
    addName.focus();
  });
  addGrid.appendChild(addCard);
  listEl.appendChild(addGrid);
}

async function renderHeadlines(sources) {
  headlinesList.innerHTML = "";
  headlinesStatus.textContent = "Loading headlines...";

  const grouped = groupSourcesByCategory(sources);
  const tasks = [];
  const cards = [];

  grouped.forEach(({ category, items }) => {
    const section = document.createElement("div");
    section.className = "headlines-category";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = category;

    const grid = document.createElement("div");
    grid.className = "headlines-grid";

    items.forEach((source) => {
      const card = document.createElement("div");
      card.className = "headline-card";

      const header = document.createElement("div");
      header.className = "headline-header";
      appendSourceIcon(header, source);

      const name = document.createElement("div");
      name.className = "headline-title";
      name.textContent = source.name || "Untitled source";

      header.appendChild(name);

      const itemsEl = document.createElement("div");
      itemsEl.className = "headline-items";
      itemsEl.textContent = "Loading...";

      card.appendChild(header);
      card.appendChild(itemsEl);
      grid.appendChild(card);

      cards.push({ card, grid, section, source });
      tasks.push(
        fillHeadlineItems(itemsEl, source).then((items) => ({
          items,
          card,
          grid,
          section,
          source,
          itemsEl,
          header
        }))
      );
    });

    section.appendChild(title);
    section.appendChild(grid);
    headlinesList.appendChild(section);
  });

  const results = await Promise.all(tasks);
  const missingSources = [];
  results.forEach((result) => {
    if (result.items.length) {
      return;
    }
    result.card.remove();
    if (!result.grid.children.length) {
      result.section.remove();
    }
    missingSources.push(result.source);
  });

  if (missingSources.length) {
    const section = document.createElement("div");
    section.className = "headlines-category";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = "Sites without feeds";

    const grid = document.createElement("div");
    grid.className = "headlines-grid";

    missingSources.forEach((source) => {
      const card = document.createElement("div");
      card.className = "headline-card compact";

      const header = document.createElement("div");
      header.className = "headline-header";
      appendSourceIcon(header, source);

      const name = document.createElement("div");
      name.className = "headline-title";
      name.textContent = source.name || "Untitled source";

      header.appendChild(name);

      const link = document.createElement("a");
      link.className = "headline-fallback compact";
      link.href = sanitizeUrl(source.url);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Visit site";

      card.appendChild(header);
      card.appendChild(link);
      grid.appendChild(card);
    });

    section.appendChild(title);
    section.appendChild(grid);
    headlinesList.appendChild(section);
  }

  headlinesStatus.textContent = "";
}

async function fillHeadlineItems(container, source) {
  container.textContent = "Loading...";
  const items = await getTopHeadlines(source, 3);
  container.innerHTML = "";

  if (!items.length) {
    return [];
  }

  items.forEach((item) => {
    const link = document.createElement("a");
    link.className = "headline-item";
    link.href = item.link || sanitizeUrl(source.url);
    link.target = "_blank";
    link.rel = "noopener";

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.title || "Headline image";
      image.loading = "lazy";
      link.appendChild(image);
    }

    const title = document.createElement("span");
    title.textContent = item.title || "Untitled headline";
    link.appendChild(title);

    container.appendChild(link);
  });

  return items;
}

async function getTopHeadlines(source, limit) {
  const candidates = await getFeedCandidates(source);
  for (const candidate of candidates) {
    const xmlText = await fetchFeed(candidate);
    if (!xmlText) {
      continue;
    }
    const items = parseFeed(xmlText, candidate);
    if (items.length) {
      return items.slice(0, limit);
    }
  }
  return [];
}

async function getFeedCandidates(source) {
  const candidates = [];
  const rss = sanitizeUrl(source.rss || "");
  if (rss) {
    candidates.push(rss);
  }

  const homepage = sanitizeUrl(source.url || "");
  if (!homepage) {
    return candidates;
  }

  const discovered = await discoverFeedFromHomepage(homepage);
  if (discovered) {
    candidates.push(discovered);
  }

  const fallbackPaths = ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml"];
  fallbackPaths.forEach((path) => {
    try {
      const candidate = new URL(path, homepage).toString();
      candidates.push(candidate);
    } catch (error) {
      // Ignore invalid URLs.
    }
  });

  return Array.from(new Set(candidates));
}

async function discoverFeedFromHomepage(homepage) {
  try {
    const response = await fetch(homepage, { redirect: "follow" });
    if (!response.ok) {
      return "";
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll("link[rel='alternate']"));
    const feedLink = links.find((link) => {
      const type = (link.getAttribute("type") || "").toLowerCase();
      return type.includes("rss") || type.includes("atom");
    });
    if (feedLink) {
      const href = feedLink.getAttribute("href") || "";
      return href ? new URL(href, homepage).toString() : "";
    }
  } catch (error) {
    return "";
  }
  return "";
}

async function fetchFeed(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return "";
    }
    return await response.text();
  } catch (error) {
    return "";
  }
}

function parseFeed(xmlText, baseUrl) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    return [];
  }

  const items = Array.from(doc.querySelectorAll("item"));
  if (items.length) {
    return items
      .map((item) => parseRssItem(item, baseUrl))
      .filter((item) => item.title || item.link);
  }

  const entries = Array.from(doc.querySelectorAll("entry"));
  return entries
    .map((entry) => parseAtomEntry(entry, baseUrl))
    .filter((item) => item.title || item.link);
}

function parseRssItem(item, baseUrl) {
  const title = textFrom(item, "title");
  const link = resolveUrl(textFrom(item, "link"), baseUrl);
  const image = resolveUrl(extractImageFromItem(item), baseUrl);
  return { title, link, image };
}

function parseAtomEntry(entry, baseUrl) {
  const title = textFrom(entry, "title");
  const linkEl = entry.querySelector("link[rel='alternate']") || entry.querySelector("link");
  const link = linkEl ? linkEl.getAttribute("href") || "" : "";
  const image = extractImageFromItem(entry);
  return {
    title,
    link: resolveUrl(link, baseUrl),
    image: resolveUrl(image, baseUrl)
  };
}

function textFrom(node, selector) {
  const el = node.querySelector(selector);
  return el ? (el.textContent || "").trim() : "";
}

function extractImageFromItem(item) {
  const mediaContent = item.querySelector("media\\:content");
  if (mediaContent && mediaContent.getAttribute("url")) {
    return mediaContent.getAttribute("url");
  }

  const mediaThumb = item.querySelector("media\\:thumbnail");
  if (mediaThumb && mediaThumb.getAttribute("url")) {
    return mediaThumb.getAttribute("url");
  }

  const enclosure = item.querySelector("enclosure");
  if (enclosure) {
    const type = (enclosure.getAttribute("type") || "").toLowerCase();
    if (type.startsWith("image")) {
      return enclosure.getAttribute("url") || "";
    }
  }

  const encoded = item.querySelector("content\\:encoded");
  if (encoded) {
    const imageUrl = extractImageFromHtml(encoded.textContent || "");
    if (imageUrl) {
      return imageUrl;
    }
  }

  const description = item.querySelector("description");
  if (description) {
    const imageUrl = extractImageFromHtml(description.textContent || "");
    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}

function extractImageFromHtml(html) {
  if (!html) {
    return "";
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const img = doc.querySelector("img");
  return img ? img.getAttribute("src") || "" : "";
}

function resolveUrl(url, baseUrl) {
  if (!url) {
    return "";
  }
  if (!baseUrl) {
    return url;
  }
  try {
    return new URL(url, baseUrl).toString();
  } catch (error) {
    return url;
  }
}

async function loadSources() {
  const data = await api.storage.sync.get(STORAGE_KEY);
  const stored = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const custom = [];
  const defaults = [];
  const seenDefaults = new Set();

  stored.forEach((src) => {
    const sig = signature(src || {});
    if (DEFAULT_BY_SIGNATURE.has(sig)) {
      const base = DEFAULT_BY_SIGNATURE.get(sig);
      defaults.push({
        ...base,
        ...src,
        category: normalizeCategory(src.category || base.category),
        rss: sanitizeUrl(src.rss || base.rss),
        custom: false
      });
      seenDefaults.add(sig);
    } else {
      custom.push({
        ...src,
        category: normalizeCategory(src.category),
        rss: sanitizeUrl(src.rss),
        custom: true
      });
    }
  });

  DEFAULT_SOURCES.forEach((src) => {
    const sig = signature(src);
    if (!seenDefaults.has(sig)) {
      defaults.push({ ...src, custom: false });
    }
  });

  customSources = custom;
  const sources = sortSources([...custom, ...defaults]);
  renderSources(sources);
  renderHeadlines(sources);
}

function initContinueLink() {
  continueLink.href = "https://news.google.com/?nmg=1";
}

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = "";
  }, 1500);
}

function clearAddForm() {
  addName.value = "";
  addUrl.value = "";
  addCategory.value = "";
  addRss.value = "";
}

async function saveSources() {
  await api.storage.sync.set({ [STORAGE_KEY]: [...DEFAULT_SOURCES, ...customSources] });
}

async function addSource() {
  const name = addName.value.trim();
  const url = sanitizeUrl(addUrl.value.trim());
  const category = normalizeCategory(addCategory.value);
  const rss = sanitizeUrl(addRss.value.trim());
  if (!name || !url) {
    showStatus("Name and URL required.");
    return;
  }
  customSources.push({ name, url, category, rss, custom: true });
  await saveSources();
  clearAddForm();
  addForm.classList.add("hidden");
  await loadSources();
  showStatus("Added.");
}

async function removeSource(source) {
  customSources = customSources.filter(
    (s) =>
      s.name !== source.name ||
      sanitizeUrl(s.url || "") !== sanitizeUrl(source.url || "")
  );
  await saveSources();
  await loadSources();
  showStatus("Removed.");
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  tabHeadlines.classList.toggle("hidden", tabName !== "headlines");
  tabSources.classList.toggle("hidden", tabName !== "sources");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

loadSources();
initContinueLink();
setActiveTab("headlines");

addSubmit.addEventListener("click", addSource);
addCancel.addEventListener("click", () => {
  clearAddForm();
  addForm.classList.add("hidden");
});

refreshButton.addEventListener("click", () => {
  loadSources();
});
