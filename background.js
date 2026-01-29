const api = typeof browser !== "undefined" ? browser : chrome;

const STORAGE_KEY = "sources";
const SETTINGS_KEY = "settings";
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

async function ensureDefaults() {
  const data = await api.storage.sync.get(STORAGE_KEY);
  const sources = data[STORAGE_KEY];
  if (!Array.isArray(sources) || sources.length === 0) {
    await api.storage.sync.set({ [STORAGE_KEY]: DEFAULT_SOURCES });
  }
}

async function installRules() {
  const allowRule = {
    id: 1,
    priority: 2,
    action: { type: "allow" },
    condition: {
      regexFilter: "^https?://news\\.google\\.[^/]+/.*[?&]nmg=1",
      resourceTypes: ["main_frame"]
    }
  };

  const redirectRule = {
    id: 2,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: "/blocked.html"
      }
    },
    condition: {
      regexFilter: "^https?://news\\.google\\.[^/]+/.*",
      resourceTypes: ["main_frame"]
    }
  };

  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2],
    addRules: [allowRule, redirectRule]
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
  applyRulesFromSettings();
});

api.runtime.onStartup.addListener(() => {
  applyRulesFromSettings();
});

api.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[SETTINGS_KEY]) {
    return;
  }
  applyRulesFromSettings();
});
