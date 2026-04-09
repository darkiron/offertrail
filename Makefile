ifeq ($(OS),Windows_NT)
PYTHON_BIN ?= python
PYTHON      = .venv\Scripts\python
RM_FILE     = del /f /q
RM_DIR      = rmdir /s /q
RUN_ALL     = powershell -Command "Start-Process make run-back; Start-Process make run-front"
VENV_EXISTS = if not exist ".venv\Scripts\python.exe"
NPM ?= npm
else
PYTHON_BIN ?= python3
PYTHON      = .venv/bin/python
RM_FILE     = rm -f
RM_DIR      = rm -rf
RUN_ALL     = sh -c '$(MAKE) run-back & $(MAKE) run-front'
NVM_DIR ?= $(HOME)/.nvm
FRONTEND_DIR ?= frontend
FRONT_NODE_VERSION ?= $(strip $(shell cat $(FRONTEND_DIR)/.nvmrc 2>/dev/null))
NVM_BOOTSTRAP = export NVM_DIR="$(NVM_DIR)"; [ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"
endif

.PHONY: install run run-back run-front migrate drop-legacy db-diagnostic reset-db clean test test-isolation test-coverage check-front-env build-front lint-front migrate-prod alembic-migrate alembic-revision db-shell

install: install-back install-front

check-front-env:
ifeq ($(OS),Windows_NT)
	@where $(NPM) >nul 2>&1 || (echo "$(NPM) introuvable dans le PATH. Installe Node.js/npm ou definis NPM=<chemin-vers-npm>." && exit 1)
else
	@[ -n "$(FRONT_NODE_VERSION)" ] || (echo "$(FRONTEND_DIR)/.nvmrc introuvable ou vide."; exit 1)
	@bash -lc '$(NVM_BOOTSTRAP)' >/dev/null 2>&1 || (echo "nvm introuvable. Verifie NVM_DIR=$(NVM_DIR) et l'installation de nvm."; exit 1)
	@bash -lc '$(NVM_BOOTSTRAP); nvm install $(FRONT_NODE_VERSION) >/dev/null; nvm use $(FRONT_NODE_VERSION) >/dev/null; command -v npm >/dev/null 2>&1' || (echo "npm introuvable apres activation de Node $(FRONT_NODE_VERSION) via nvm."; exit 1)
endif


install-back:
ifeq ($(OS),Windows_NT)
	$(VENV_EXISTS) $(PYTHON_BIN) -m venv .venv
	@$(PYTHON) -m pip --version >nul 2>&1 || ($(PYTHON) -m ensurepip --upgrade 2>nul || ($(PYTHON_BIN) -c "import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py', 'get-pip.py')" && $(PYTHON) get-pip.py && del get-pip.py))
else
	@[ -f "$(PYTHON)" ] || $(PYTHON_BIN) -m venv .venv
	@$(PYTHON) -m pip --version > /dev/null 2>&1 || $(PYTHON) -m ensurepip --upgrade 2>/dev/null || ($(PYTHON_BIN) -c "import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py', '/tmp/get-pip.py')" && $(PYTHON) /tmp/get-pip.py)
endif
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

install-front:
	@$(MAKE) check-front-env
ifeq ($(OS),Windows_NT)
	cd frontend && $(NPM) install
else
	cd $(FRONTEND_DIR) && bash -lc '$(NVM_BOOTSTRAP); nvm install $(FRONT_NODE_VERSION) >/dev/null; nvm use $(FRONT_NODE_VERSION) >/dev/null; npm install'
endif

run:
	$(RUN_ALL)

run-back:
	$(PYTHON) -m uvicorn src.main:app --reload --port 8000

run-front:
	@$(MAKE) check-front-env
ifeq ($(OS),Windows_NT)
	cd frontend && $(NPM) run dev
else
	cd $(FRONTEND_DIR) && bash -lc '$(NVM_BOOTSTRAP); nvm install $(FRONT_NODE_VERSION) >/dev/null; nvm use $(FRONT_NODE_VERSION) >/dev/null; npm run dev'
endif

build-front:
	@$(MAKE) check-front-env
ifeq ($(OS),Windows_NT)
	cd frontend && $(NPM) run build
else
	cd $(FRONTEND_DIR) && bash -lc '$(NVM_BOOTSTRAP); nvm install $(FRONT_NODE_VERSION) >/dev/null; nvm use $(FRONT_NODE_VERSION) >/dev/null; npm run build'
endif

lint-front:
	@$(MAKE) check-front-env
ifeq ($(OS),Windows_NT)
	cd frontend && $(NPM) run lint
else
	cd $(FRONTEND_DIR) && bash -lc '$(NVM_BOOTSTRAP); nvm install $(FRONT_NODE_VERSION) >/dev/null; nvm use $(FRONT_NODE_VERSION) >/dev/null; npm run lint'
endif

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

migrate-prod:
	$(PYTHON) scripts/migrate_sqlite_to_supabase.py

alembic-migrate:
	alembic upgrade head

alembic-revision:
	alembic revision --autogenerate -m "$(msg)"

db-shell:
	$(PYTHON) -c "from src.database import engine; print(engine.url)"

reset-db:
	$(RM_FILE) offertrail.db
	$(PYTHON) -c "from src.database import init_db; init_db()"

clean:
	-$(RM_DIR) frontend/dist
	-$(PYTHON) -c "import pathlib, shutil; [shutil.rmtree(path) for path in pathlib.Path('.').rglob('__pycache__') if path.is_dir()]"
