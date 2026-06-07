# Contributing

Contributions are welcome.

1. Fork the repository and create a focused branch.
2. Install dependencies with `python3 -m pip install -r requirements.txt`.
3. Run the app with `python3 server.py`.
4. Verify both the Real-ESRGAN path and the fallback path when changing image
   processing.
5. Open a pull request describing the behavior change and verification steps.

Keep the app local-first. Do not add telemetry, remote image processing, or
cloud uploads without making the behavior explicit and opt-in.
