# Style Mind

Yapay zekâ destekli kişisel stil asistanı ve dijital gardırop yönetim uygulaması. Kıyafetlerini
fotoğraflayıp dijital gardırobunu oluştur, Gemini ile sohbet ederek gardırobuna ve hava durumuna
göre kombin önerileri al.

## Özellikler

- Kayıt / giriş (JWT)
- Dijital gardırop: fotoğraf yükle, Gemini Vision kategori/renk/stil/mevsimi otomatik tespit eder
- Hava durumu: konum izni veya manuel şehir girişiyle (Open-Meteo, API key gerekmez)
- AI Sohbet: gardırobuna, hava durumuna ve yaklaşan etkinliklerine göre kişiselleştirilmiş kombin önerileri

## Teknolojiler

- **Frontend**: React + TypeScript (Vite), Tailwind CSS, TanStack Query, zustand
- **Backend**: FastAPI, SQLAlchemy, Alembic
- **Veritabanı**: SQLite — tek dosya, kurulum gerektirmez
- **AI**: Google Gemini API

## Kurulum

Tek gereksinim [Docker Desktop](https://www.docker.com/products/docker-desktop/):

```bash
git clone https://github.com/iremdmla/Style-Mind-v2 style-mind
cd style-mind
copy .env.example .env
docker compose up
```

- Uygulama: http://localhost:5173
- API: http://localhost:8000/docs

`.env` dosyasını hiç düzenlemeden de çalışır. Kendi [Gemini API key](https://aistudio.google.com/apikey)'ini
eklemek istersen `.env` içindeki `GEMINI_API_KEY` satırını doldurup `docker compose up`'ı tekrar
çalıştırman yeterli — key olmadan da uygulama çalışır, sadece fotoğraf yüklerken otomatik alan
tespiti devre dışı kalır.

Docker'sız çalıştırmak istersen: backend için Python 3.11+ ile `pip install -r requirements.txt`,
`alembic upgrade head`, `uvicorn app.main:app --reload`; frontend için `npm install && npm run dev`.

## Veri taşınabilirliği

Veritabanı (`backend/data/`) ve yüklenen fotoğraflar (`backend/uploads/`) bilerek `.gitignore`'da —
her kurulumda kendi bilgisayarında kalır, koddan ayrı taşınır.

## Geliştirme durumu

- [x] Faz 1 — Auth
- [x] Faz 2 — Dijital Gardırop
- [x] Faz 3 — Hava durumu + Dashboard
- [x] Faz 4 — AI Chat + kombin önerisi
- [ ] Faz 5 — Etkinlik planlama
- [ ] Faz 6 — Kombin geçmişi + favoriler
- [ ] Faz 7 — İstatistikler
