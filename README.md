# NoMoreGoogleNews

I've used Google News for years, but I noticed I was bouncing into more paywalls and registration gates than I wanted.
This extension helps me change that habit by nudging me toward other sources while still letting me continue if I want.

Browser plugin that gently suggests alternate news sources before Google News.

## Source rules

This project aims to list sources that avoid:
- Paywalls
- Registration required
- Limited number of articles per month

## What it does

- Detects navigation to `news.google.*` and shows a friendly interstitial page instead.
- Offers a curated list of reputable, non-paywalled sources (no registration and no meter).
- Lets you edit the alternate sources list (name, URL, optional icon) from the extension popup.

## Load the extension

### Chrome (and Chromium browsers)

1. Open `chrome://extensions`
2. Enable Developer mode.
3. Click "Load unpacked" and select `L:\NoMoreGoogleNews`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `L:\NoMoreGoogleNews\manifest.json`

### Safari

1. Use Xcode 15+ to create a Safari Web Extension from this folder.
2. Follow Apple's "Safari Web Extensions" workflow to run the extension in Safari.

## Links

- Report Paywall or Registration Required Site: https://github.com/brighams/NoMoreGoogleNews/issues
- Pull Requests Welcome
- Repo: https://github.com/brighams/NoMoreGoogleNews
