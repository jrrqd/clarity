# Development

## Requirements

- macOS on Apple Silicon or Intel
- Python 3.9+
- Pillow

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 server.py
```

Open `http://127.0.0.1:4173`.

Use a different port with:

```bash
PORT=8080 python3 server.py
```

## Verification

```bash
PYTHONPYCACHEPREFIX=/tmp/clarity-pycache python3 -m py_compile server.py
node --check src/app.js
curl http://127.0.0.1:4173/api/status
```

The status response should report `Real-ESRGAN · Neural upscale` when the
bundled runtime is executable.
