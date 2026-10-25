# AVRXT Notes Capture extension

This Manifest V3 Chrome extension saves a quick Markdown note, the current page, and selected text to the authenticated user's private AVRXT Notes collection. It never receives AWS credentials or a Discord token.

## Install for development

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this `extensions/avrxt-notes` folder.
3. Copy the displayed 32-character extension ID.
4. Set `NOTES_EXTENSION_IDS` in Vercel to that ID (use comma-separated IDs to allow development and production extensions), then redeploy the site.
5. Click the AVRXT Notes toolbar icon and choose **Connect AVRXT Notes**. The extension uses the existing Discord admin login in the authorization window.

## Publish

Zip the *contents* of this folder (so `manifest.json` is at the archive root) for the Chrome Web Store. After Chrome assigns the production extension ID, add it to `NOTES_EXTENSION_IDS` in Vercel before publishing the build.

The extension requires only the active tab to read a selection when you click its popup, identity for the explicit connection flow, local storage for its short-lived session, and access to `https://www.avrxt.dev`.
