const api = typeof browser !== "undefined" ? browser : chrome;

const STORAGE_KEY = "sources";
const SETTINGS_KEY = "settings";
const BLOCKED_KEY = "blockedSites";
const DEFAULT_BLOCKED = ["news.google.*"];
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
  {
    name: "Associated Press",
    url: "https://apnews.com/",
    category: "General",
    rss: "",
    sortOrder: 30
  },
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

async function ensureDefaults() {
  const data = await api.storage.sync.get(STORAGE_KEY);
  const sources = data[STORAGE_KEY];
  if (!Array.isArray(sources) || sources.length === 0) {
    await api.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SOURCES });
  }
}

async function ensureBlockedSites() {
  const data = await api.storage.sync.get(BLOCKED_KEY);
  const blocked = data[BLOCKED_KEY];
  if (!Array.isArray(blocked) || blocked.length === 0) {
    await api.storage.sync.set({ [BLOCKED_KEY]: DEFAULT_BLOCKED });
  }
}

function normalizeBlockedEntry(entry) {
  const trimmed = (entry || "").trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.toLowerCase();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBlockedRegex(entry) {
  const normalized = normalizeBlockedEntry(entry);
  if (!normalized) {
    return "";
  }
  const pattern = escapeRegex(normalized).replace(/\\\*/g, ".*");
  return `^https?://(www\\.)?${pattern}(/.*)?$`;
}

async function installRules() {
  const data = await api.storage.sync.get(BLOCKED_KEY);
  const blocked = Array.isArray(data[BLOCKED_KEY]) ? data[BLOCKED_KEY] : DEFAULT_BLOCKED;

  const allowRule = {
    id: 1,
    priority: 2,
    action: { type: "allow" },
    condition: {
      regexFilter: "^https?://news\\.google\\.[^/]+/.*[?&]nmg=1",
      resourceTypes: ["main_frame"]
    }
  };
  const redirectRules = blocked
    .map((entry, index) => ({
      id: index + 2,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: "/blocked.html"
        }
      },
      condition: {
        regexFilter: buildBlockedRegex(entry),
        resourceTypes: ["main_frame"]
      }
    }))
    .filter((rule) => rule.condition.regexFilter);

  const removeRuleIds = Array.from({ length: redirectRules.length + 1 }, (_, index) => index + 1);

  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: [allowRule, ...redirectRules]
  });
}

async function applyRulesFromSettings() {
  const data = await api.storage.sync.get(SETTINGS_KEY);
  const settings = data[SETTINGS_KEY] || {};
  if (settings.disabled) {
    await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1, 2] });
    return;
  }
  await installRules();
}

api.runtime.onInstalled.addListener(() => {
  ensureDefaults();
  ensureBlockedSites();
  applyRulesFromSettings();
});

api.runtime.onStartup.addListener(() => {
  applyRulesFromSettings();
});

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[SETTINGS_KEY]) {
    if (area === "sync" && changes[BLOCKED_KEY]) {
      applyRulesFromSettings();
    }
    return;
  }
  applyRulesFromSettings();
});
