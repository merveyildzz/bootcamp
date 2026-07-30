import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Tests run against their own isolated in-memory SQLite DB, separate from the
# file-based one used at runtime (backend/data/style_mind.db) — fast, and every
# test starts from a clean schema regardless of what's in the real dev database.
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    # base_url uses https so the httpOnly+Secure refresh cookie is actually stored/sent
    # by the test client's cookie jar (browsers apply the same Secure-over-http restriction).
    with TestClient(app, base_url="https://testserver") as c:
        yield c


def register_and_get_headers(client, email="test@example.com") -> dict:
    response = client.post(
        "/auth/register",
        json={"email": email, "password": "supersecret123", "full_name": "Test User"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
