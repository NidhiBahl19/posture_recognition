# Safety Observation Reporting (Mobile-friendly Web App)

A lightweight, offline-capable web app to record safety observations with positive/negative ratings and optional photos, designed for quick use on mobile devices.

## Features
- Positive or negative observations
- Title and description
- Attach photo from camera or gallery
- Local persistence (stored on device)
- Filter by rating
- Export/Import as JSON
- Delete individual items or clear all

## Quick Start

Open the `index.html` directly or serve the folder with any static server:

```bash
# from the project root
python3 -m http.server 8080 --directory /workspace/safety-observation-app
# then open http://localhost:8080 in your browser
```

On mobile, the file input uses the device camera when available.

## Notes
- All data is stored locally in your browser storage (no backend required).
- Photos are resized client-side to keep storage usage reasonable.
- You can export your data to JSON and import it on another device.