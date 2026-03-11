## Personal Finance Tracker API

Simple FastAPI application for managing personal finance transactions using PostgreSQL and SQLModel.

### Stack

- **FastAPI**
- **SQLModel** (models and DB)
- **PostgreSQL**
- **Pydantic v2**

### Installation

```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### Configure PostgreSQL

Create database, for example (Windows with `psql`):

```bash
createdb finances
```

Set connection string (or use default from `database.py`):

```bash
set DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/finances
```

### Running

```bash
uvicorn main:app --reload
```

Open interactive docs at `http://127.0.0.1:8000/docs`.

### Main Endpoints

- **POST** `/transactions` – create transaction
- **GET** `/transactions` – list with filters (date range, category, tags)
- **GET** `/transactions/{id}` – get single transaction
- **PUT** `/transactions/{id}` – update transaction
- **DELETE** `/transactions/{id}` – delete transaction
- **GET** `/stats` – monthly income/expense/balance statistics (`year`, `month` query params)

