# Runbook — OfferTrail

This document explains how to run, debug, and recover the application.

---

## Status
The application is runnable.

---

## Local Execution
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   make run
   ```
   If `python` is not in your PATH, use:
   ```bash
   make run PYTHON=C:\Python312\python.exe
   ```
   Or:
   ```bash
   C:\Python312\python.exe -m uvicorn src.main:app --reload --port 8000
   ```

## Troubleshooting
- **Port 8000 already in use**: Change the port using the `--port` flag.
- **Python missing**: Ensure Python 3.9+ is installed and on your PATH.
- **Template not found**: Ensure you are running the command from the project root.

---

## Philosophy
If something breaks, this file should answer:
- how to reproduce
- how to inspect
- how to recover

Short, practical instructions only.
