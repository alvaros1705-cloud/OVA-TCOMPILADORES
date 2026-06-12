.PHONY: backend frontend test

backend:
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && flask run --port 5000

test:
	cd backend && python3 -m pytest ../tests/ -v

install:
	pip install -r backend/requirements.txt flask requests
