const api = typeof browser !== "undefined" ? browser : chrome;

const BLOCKED_KEY = "blockedSites";
const listEl = document.getElementById("blocked-list");
const addSite = document.getElementById("add-site");
const addSubmit = document.getElementById("add-submit");
const statusEl = document.getElementById("status");

function sanitizeUrl(url) {
  if (!url) {
    return "";
  }
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = "";
  }, 1500);
}

function normalizeEntry(entry) {
  const trimmed = (entry || "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.includes("*")) {
    return trimmed.toLowerCase();
  }
  try {
    const parsed = new URL(sanitizeUrl(trimmed));
    return parsed.hostname.toLowerCase();
  } catch (error) {
    return trimmed.toLowerCase();
  }
}

function renderSources(sites) {
  listEl.innerHTML = "";
  if (!sites.length) {
    const empty = document.createElement("div");
    empty.className = "blocked-row";
    empty.textContent = "No blocked sites yet.";
    listEl.appendChild(empty);
    return;
  }

  sites
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((site) => {
      const row = document.createElement("div");
      row.className = "blocked-row";

      const text = document.createElement("span");
      text.textContent = site;

      const remove = document.createElement("button");
      remove.className = "blocked-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeSite(site));

      row.appendChild(text);
      row.appendChild(remove);
      listEl.appendChild(row);
    });
}

async function loadSources() {
  const data = await api.storage.sync.get(BLOCKED_KEY);
  const stored = Array.isArray(data[BLOCKED_KEY]) ? data[BLOCKED_KEY] : [];
  renderSources(stored);
}

function clearForm() {
  addSite.value = "";
}

async function addSiteEntry() {
  const normalized = normalizeEntry(addSite.value);
  if (!normalized) {
    showStatus("Enter a site or domain.");
    return;
  }

  const data = await api.storage.sync.get(BLOCKED_KEY);
  const stored = Array.isArray(data[BLOCKED_KEY]) ? data[BLOCKED_KEY] : [];
  if (stored.includes(normalized)) {
    showStatus("Already blocked.");
    return;
  }

  stored.push(normalized);
  await api.storage.sync.set({ [BLOCKED_KEY]: stored });
  clearForm();
  showStatus("Added.");
  renderSources(stored);
}

async function removeSite(site) {
  const data = await api.storage.sync.get(BLOCKED_KEY);
  const stored = Array.isArray(data[BLOCKED_KEY]) ? data[BLOCKED_KEY] : [];
  const updated = stored.filter((entry) => entry !== site);
  await api.storage.sync.set({ [BLOCKED_KEY]: updated });
  renderSources(updated);
}

addSubmit.addEventListener("click", addSiteEntry);
document.addEventListener("DOMContentLoaded", loadSources);
