# Architecture

Clarity is deliberately small and local-first.

## Components

- `index.html` defines the application shell.
- `src/app.js` manages browser state, drag-and-drop, the queue, settings,
  comparison preview, API requests, and downloads.
- `src/styles.css` contains the responsive macOS-inspired interface.
- `server.py` serves static files and exposes two local endpoints:
  - `GET /api/status` reports the active processing engine.
  - `POST /api/upscale` accepts an image, scale, and output format.
- `vendor/` contains the universal macOS Real-ESRGAN executable and the
  `realesrgan-x4plus` photo model.

## Processing flow

1. The browser sends the selected image to the loopback-only Python service.
2. The service writes the image to an OS-managed temporary directory.
3. Real-ESRGAN processes the image with the `realesrgan-x4plus` model.
4. If the executable is unavailable, Pillow performs Lanczos resampling.
5. The result is returned to the browser and downloaded by the user.

No image is persisted by the service.
