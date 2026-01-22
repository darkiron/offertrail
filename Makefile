PYTHON ?= .venv\Scripts\python

run:
	$(PYTHON) -m uvicorn src.main:app --reload --port 8000
