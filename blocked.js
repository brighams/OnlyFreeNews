const api = typeof browser !== "undefined" ? browser : chrome;

const STORAGE_KEY = "sources";
const DEFAULT_SOURCES = [
  { name: "ProPublica", url: "https://www.propublica.org/" },
  { name: "NPR", url: "https://www.npr.org/" },
  { name: "The Guardian", url: "https://www.theguardian.com/" },
  { name: "Associated Press", url: "https://apnews.com/" },
  { name: "BBC News", url: "https://www.bbc.com/news" },
  { name: "PBS NewsHour", url: "https://www.pbs.org/newshour/" },
  { name: "The Times of Israel", url: "https://www.timesofisrael.com/" },
  { name: "Al Jazeera English", url: "https://www.aljazeera.com/" },
  { name: "Deutsche Welle (DW)", url: "https://www.dw.com/en" },
  { name: "ABC News (Australia)", url: "https://www.abc.net.au/news" },
  { name: "CBC News (Canada)", url: "https://www.cbc.ca/news" },
  { name: "France 24", url: "https://www.france24.com/en/" },
  { name: "NHK World", url: "https://www3.nhk.or.jp/nhkworld/en/news/" },
  { name: "Hacker News", url: "https://news.ycombinator.com/" },
  { name: "GeekWire", url: "https://www.geekwire.com/" },
  { name: "The Register", url: "https://www.theregister.com/" },
  { name: "Eurogamer", url: "https://www.eurogamer.net/" },
  { name: "TechCrunch", url: "https://techcrunch.com/" }
];

const listEl = document.getElementById("source-list");
const continueLink = document.getElementById("continue-link");
const statusEl = document.getElementById("status");
const addForm = document.getElementById("add-form");
const addName = document.getElementById("add-name");
const addUrl = document.getElementById("add-url");
const addSubmit = document.getElementById("add-submit");
const addCancel = document.getElementById("add-cancel");

let customSources = [];
const DEFAULT_LOOKUP = new Set(
  DEFAULT_SOURCES.map((s) => `${(s.name || "").trim().toLowerCase()}|${sanitizeUrl(s.url).replace(/\/$/, "").toLowerCase()}`)
);

function sanitizeUrl(url) {
  if (!url) {
    return "";
  }
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
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

function renderSources(sources) {
  listEl.innerHTML = "";

  sources.forEach((source) => {
    const link = document.createElement("a");
    link.className = `source ${source.custom ? "custom" : "default"}`;
    link.href = sanitizeUrl(source.url);
    link.target = "_blank";
    link.rel = "noopener";

    const placeholder = document.createElement("div");
    placeholder.className = "source-icon placeholder";
    placeholder.textContent = "!";
    link.appendChild(placeholder);

    const iconUrl = getFaviconUrl(source.url);
    if (iconUrl) {
      const icon = document.createElement("img");
      icon.className = "source-icon";
      icon.src = iconUrl;
      icon.alt = `${source.name || "Source"} icon`;
      icon.referrerPolicy = "no-referrer";
      icon.crossOrigin = "anonymous";

      const swapIn = () => {
        if (!placeholder.isConnected) {
          return;
        }
        placeholder.replaceWith(icon);
      };

      icon.addEventListener("load", () => {
        if (icon.naturalWidth > 0) {
          swapIn();
        }
      });
      icon.addEventListener("error", () => {
        // Keep placeholder when the favicon is blocked or missing.
      });
    }

    const title = document.createElement("span");
    title.className = "source-title";
    title.textContent = source.name || "Untitled source";

    const url = document.createElement("span");
    url.className = "source-url";
    url.textContent = sanitizeUrl(source.url) || "No URL provided";

    link.appendChild(title);
    link.appendChild(url);

    if (source.custom) {
      const remove = document.createElement("button");
      remove.className = "remove";
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", (event) => {
        event.preventDefault();
        removeSource(source);
      });
      link.appendChild(remove);
    }

    listEl.appendChild(link);
  });

  const addCard = document.createElement("button");
  addCard.type = "button";
  addCard.className = "add-card";
  addCard.innerHTML = `<div class="plus">+</div><p class="hint">Add source</p>`;
  addCard.addEventListener("click", () => {
    addForm.classList.remove("hidden");
    addName.focus();
  });
  listEl.appendChild(addCard);
}

async function loadSources() {
  const data = await api.storage.sync.get(STORAGE_KEY);
  const stored = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const custom = [];
  const defaults = [];
  const seenDefaults = new Set();
  stored.forEach((src) => {
    const sig = `${(src.name || "").trim().toLowerCase()}|${sanitizeUrl(src.url || "").replace(/\/$/, "").toLowerCase()}`;
    if (DEFAULT_LOOKUP.has(sig)) {
      defaults.push({ ...src, custom: false });
      seenDefaults.add(sig);
    } else {
      custom.push({ ...src, custom: true });
    }
  });
  DEFAULT_SOURCES.forEach((src) => {
    const sig = `${(src.name || "").trim().toLowerCase()}|${sanitizeUrl(src.url || "").replace(/\/$/, "").toLowerCase()}`;
    if (!seenDefaults.has(sig)) {
      defaults.push({ ...src, custom: false });
    }
  });
  customSources = custom;
  const sources = [...custom, ...defaults];
  renderSources(sources);
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
}

async function saveSources() {
  await api.storage.sync.set({ [STORAGE_KEY]: [...DEFAULT_SOURCES, ...customSources] });
}

async function addSource() {
  const name = addName.value.trim();
  const url = sanitizeUrl(addUrl.value.trim());
  if (!name || !url) {
    showStatus("Name and URL required.");
    return;
  }
  customSources.push({ name, url, custom: true });
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

loadSources();
initContinueLink();

addSubmit.addEventListener("click", addSource);
addCancel.addEventListener("click", () => {
  clearAddForm();
  addForm.classList.add("hidden");
});
