NPM ?= npm

ifeq ($(OS),Windows_NT)
PYTHON ?= .venv\Scripts\python
PIP ?= .venv\Scripts\pip
RM_FILE = del /f /q
RM_DIR = rmdir /s /q
RUN_ALL = powershell -Command "Start-Process make run-back; Start-Process make run-front"
else
PYTHON ?= .venv/bin/python
PIP ?= .venv/bin/pip
RM_FILE = rm -f
RM_DIR = rm -rf
RUN_ALL = sh -c '$(MAKE) run-back & $(MAKE) run-front'
endif

.PHONY: install run run-back run-front migrate drop-legacy db-diagnostic reset-db clean test test-isolation test-coverage

install:
	$(PIP) install -r requirements.txt
	@if command -v $(NPM) > /dev/null 2>&1; then cd frontend && $(NPM) install; else echo "npm not found, skipping frontend install"; fi

run:
	$(RUN_ALL)

run-back:
	$(PYTHON) -m uvicorn src.main:app --reload --port 8000

run-front:
	cd frontend && $(NPM) run dev

migrate:
	$(PYTHON) scripts/migrate_to_saas.py

drop-legacy:
	$(PYTHON) scripts/drop_legacy_tables.py

db-diagnostic:
	$(PYTHON) scripts/diagnostic.py

test:
	$(PYTHON) -m pytest tests/test_auth.py -v --tb=short
	$(PYTHON) -m pytest tests/test_candidatures.py -v --tb=short
	$(PYTHON) -m pytest tests/test_etablissements.py -v --tb=short
	$(PYTHON) -m pytest tests/test_isolation.py -v --tb=short
	$(PYTHON) -m pytest tests/test_subscription.py -v --tb=short

test-isolation:
	$(PYTHON) -m pytest tests/test_isolation.py -v

test-coverage:
	$(PYTHON) -m coverage erase
	$(PYTHON) -m pytest tests/test_auth.py tests/test_candidatures.py --cov=src.auth --cov=src.database --cov=src.models --cov=src.routers.auth --cov=src.routers.candidatures --cov=src.routers.etablissements --cov=src.routers.subscription --cov=src.services.subscription --cov-report=
	$(PYTHON) -m pytest tests/test_etablissements.py tests/test_isolation.py tests/test_subscription.py --cov=src.auth --cov=src.database --cov=src.models --cov=src.routers.auth --cov=src.routers.candidatures --cov=src.routers.etablissements --cov=src.routers.subscription --cov=src.services.subscription --cov-report= --cov-append
	$(PYTHON) -m coverage report --show-missing --fail-under=80

reset-db:
	$(RM_FILE) offertrail.db
	$(PYTHON) -c "from src.database import init_db; init_db()"

clean:
	-$(RM_DIR) frontend/dist
	-$(PYTHON) -c "import pathlib, shutil; [shutil.rmtree(path) for path in pathlib.Path('.').rglob('__pycache__') if path.is_dir()]"
