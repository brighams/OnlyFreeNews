const api = typeof browser !== "undefined" ? browser : chrome;

const SETTINGS_KEY = "settings";
const toggleButton = document.getElementById("toggle-enabled");

let isDisabled = false;

function updateButton() {
  toggleButton.textContent = isDisabled ? "Enable blocking" : "Disable blocking";
  toggleButton.classList.toggle("secondary", isDisabled);
}

async function loadSettings() {
  const data = await api.storage.sync.get(SETTINGS_KEY);
  const settings = data[SETTINGS_KEY] || {};
  isDisabled = Boolean(settings.disabled);
  updateButton();
}

async function toggleBlocking() {
  isDisabled = !isDisabled;
  const data = await api.storage.sync.get(SETTINGS_KEY);
  const settings = data[SETTINGS_KEY] || {};
  await api.storage.sync.set({
    [SETTINGS_KEY]: { ...settings, disabled: isDisabled }
  });
  updateButton();
}

toggleButton.addEventListener("click", toggleBlocking);
loadSettings();
