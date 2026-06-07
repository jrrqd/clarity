# Security Policy

## Local processing

Clarity binds only to `127.0.0.1` and processes images in temporary local
directories. It does not upload images or make application-level network
requests.

## Reporting a vulnerability

Please open a private GitHub security advisory for the repository rather than
posting sensitive details in a public issue.

Do not run Clarity on an untrusted shared machine or change the bind address
from `127.0.0.1` without adding authentication and request-size controls.
