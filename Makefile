PYTHON ?= .venv\Scripts\python
PIP ?= .venv\Scripts\pip
NPM ?= npm

.PHONY: install run run-back run-front migrate reset-db clean

install:
	$(PIP) install -r requirements.txt
	cd frontend && $(NPM) install

run:
	powershell -Command "Start-Process make run-back; Start-Process make run-front"

run-back:
	$(PYTHON) -m uvicorn src.main:app --reload --port 8000

run-front:
	cd frontend && $(NPM) run dev

migrate:
	$(PYTHON) scripts/migrate_to_saas.py

reset-db:
	del /f /q offertrail.db && $(PYTHON) -c "from src.database import init_db; init_db()"

clean:
	-rmdir /s /q frontend\dist
	-for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
