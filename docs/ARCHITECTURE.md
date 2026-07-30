# Style Mind — Faz 1: Mimari & İskelet Kurulumu

> **Not:** Bu doküman Faz 1'in ilk planlama notlarıdır. Aşağıdaki veritabanı bölümü o an
> planlanan **MSSQL** kurulumunu anlatıyor; proje ilerledikçe **SQLite**'a geçildi (kurulumsuz,
> tek dosya — bkz. kök dizindeki [README.md](../README.md)). Güncel şema ve bağlantı ayarları
> için `backend/app/core/database.py`, `backend/app/core/config.py` ve `backend/alembic/`
> koduna bakın; buradaki MSSQL/pyodbc detayları artık sadece tarihsel bir referanstır.

## Context

Style Mind, kullanıcının gardırobunu dijitalleştirip Gemini AI ile kişiselleştirilmiş kombin önerileri sunan premium bir web uygulaması olacak. Proje dizini şu anda tamamen boş — sıfırdan bir kurulum yapılıyor. Kullanıcı açıkça "önce mimariyi/klasör yapısını kur, sonra özellikleri adım adım geliştirelim, her adımda önce plan onayı alalım" dedi. Bu yüzden bu ilk faz **sadece iskeleti** kapsar: çalışan bir proje omurgası (routing, DB modelleri, auth akışı uçtan uca) — wardrobe/chat/weather/stats gibi özelliklerin iş mantığı sonraki fazlarda, ayrı ayrı onay alınarak eklenecek.

Teknoloji ve tasarım kararları kullanıcıyla netleştirildi:
- Görsel depolama: yerel dosya sistemi (`backend/uploads`)
- Veritabanı: mevcut bir MSSQL sunucusuna SQL Server Authentication ile bağlanılacak (Docker yok)
- Hava durumu: Open-Meteo (API key gerekmez) — Faz 1'de entegre edilmeyecek, sadece mimari buna hazır olacak
- Auth: JWT — access token bellekte/zustand'da tutulur, refresh token httpOnly cookie'de tutulur (rotation destekli)
- Faz 1'de Login/Register/Profil **gerçekten çalışır** olacak (diğer her şey buna bağımlı)
- Tema: sabit premium dark tema (Notion/Linear esintili), ileride light mode CSS değişkenleriyle eklenebilir şekilde

## Kök dizin yapısı

```
Style Mind/
├── .gitignore
├── README.md                  # kurulum adımları (Node, Python, ODBC Driver 18 kurulumu, .env doldurma)
├── package.json                # kök: concurrently ile `npm run dev` -> frontend+backend birlikte
├── frontend/
└── backend/
```
Monorepo aracı (Nx/Turborepo) kullanılmayacak — iki bağımsız uygulama için gereksiz karmaşıklık.

## Backend (FastAPI)

```
backend/
├── .env.example                 # DB_*, JWT_SECRET_KEY, ACCESS/REFRESH ömürleri, UPLOAD_DIR, CORS_ORIGINS
├── requirements.txt
├── alembic.ini
├── alembic/
│   ├── env.py                   # app.core.database.Base + app.models hedef metadata
│   └── versions/                # ilk migration: users, clothing_items, outfits, outfit_items, events, refresh_tokens
├── uploads/.gitkeep
├── app/
│   ├── main.py                  # FastAPI app, CORS (allow_credentials=True), StaticFiles("/uploads"), router include, GET /health
│   ├── core/
│   │   ├── config.py            # pydantic-settings: DB URL, JWT secret/alg/expiry, UPLOAD_DIR, CORS_ORIGINS
│   │   ├── database.py          # sync SQLAlchemy engine (mssql+pyodbc), SessionLocal, Base, get_db()
│   │   ├── security.py          # passlib(bcrypt) hash/verify, PyJWT create_access/create_refresh/decode
│   │   └── deps.py              # OAuth2PasswordBearer + get_current_user dependency
│   ├── models/
│   │   ├── __init__.py          # Alembic autogenerate için tüm modelleri import eder
│   │   ├── mixins.py            # TimestampMixin (created_at/updated_at)
│   │   ├── user.py / clothing_item.py / outfit.py (+ OutfitItem) / event.py / refresh_token.py
│   ├── features/
│   │   ├── auth/
│   │   │   ├── router.py        # POST /register /login /refresh /logout, GET /me
│   │   │   ├── schemas.py       # RegisterRequest, LoginRequest, UserPublic, TokenResponse
│   │   │   └── service.py       # create_user, authenticate_user, issue tokens, rotate refresh token
│   │   ├── wardrobe/router.py   # sadece kayıtlı, gerçek endpoint yok (TODO — Faz 2)
│   │   ├── chat/router.py       # placeholder
│   │   ├── events/router.py     # placeholder
│   │   └── stats/router.py      # placeholder
│   └── shared/exceptions.py     # app exception -> HTTPException mapping
└── tests/
    ├── conftest.py               # TestClient + test DB session fixture
    └── test_health.py / test_auth.py   # register->login->me->refresh->logout uçtan uca kanıtlanır
```

**Neden modeller ayrı `app/models/` altında, feature-bazlı değil**: `Outfit`, hem `ClothingItem` hem `Event`'e referans veriyor; hepsi `User`'a bağlı. ORM modellerini feature klasörlerine bölmek dairesel import riskine yol açar. DB şeması küçük bir "shared kernel" olarak ele alınıyor; vertical-slice ayrımı asıl faydalı olduğu yerde (router/service/iş mantığı) uygulanıyor.

**Bağımlılıklar**: fastapi, `uvicorn[standard]`, `sqlalchemy>=2.0`, **pyodbc**, alembic, pydantic-settings, `passlib[bcrypt]`, PyJWT, python-multipart, pytest/httpx/ruff/black (dev). `google-generativeai`, `pillow`, weather client Faz 2+'de eklenecek.

**MSSQL sürücü kararı**: FastAPI async-first olsa da olgun bir async MSSQL sürücüsü yok (`aioodbc` sadece pyodbc'yi thread'e sarıyor). Bu ölçekte gerçek bir kazanç sağlamadığından **senkron SQLAlchemy + `mssql+pyodbc`** kullanılacak; DB'ye dokunan path fonksiyonları `def` (async değil) yazılacak, FastAPI bunları otomatik threadpool'da çalıştırır.

Bağlantı string formatı:
```
mssql+pyodbc://<user>:<url_encoded_password>@<host>[,<port>]/<database>?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

**Windows/MSSQL notları**:
1. `ODBC Driver 18 for SQL Server` sistem genelinde kurulu olmalı (msodbcsql18.msi) — `pip install pyodbc` sadece Python bağlayıcısıdır, sürücünün kendisi değil. `pyodbc.drivers()` ile doğrulanır.
2. Driver 18 varsayılan olarak `Encrypt=yes` ve sıkı sertifika doğrulaması yapar; yerel sunucularda geçerli TLS sertifikası olmadığından `TrustServerCertificate=yes` eklenmeli.
3. Adlandırılmış instance (`localhost\SQLEXPRESS`) kullanılıyorsa SQL Server Browser servisi çalışmalı veya doğrudan TCP portu belirtilmeli.
4. TCP/IP protokolü Express kurulumlarında genelde kapalıdır — SQL Server Configuration Manager'dan açılıp servis yeniden başlatılmalı.
5. Şifredeki özel karakterler (`@ # % /`) `urllib.parse.quote_plus` ile encode edilmeli.
6. Alembic + MSSQL: SQLAlchemy `MetaData` üzerinde açık bir `naming_convention` tanımlanacak, migration'lar arasında constraint isimleri kararlı kalsın diye.

→ Kodlamaya geçmeden önce sizden gerekecek bilgiler: SQL Server host adı (default mi named instance mı, TCP portu), app için oluşturulacak SQL kullanıcı adı/şifre. Bunlar `.env` dosyasına siz tarafınızdan girilecek — placeholder `.env.example` ile bırakılacak.

## DB varlıkları (entities)

- **User**: id, email(unique, lowercase), hashed_password, full_name, avatar_url, timestamps. 1→N ClothingItem, Outfit, Event, RefreshToken.
- **ClothingItem**: id, user_id FK, photo_url, category, color, fabric, style, season, brand, last_worn_date, wear_count, timestamps. category/style/season/brand app-seviyesinde Python `Enum` ile doğrulanan `String` kolonlar (MSSQL native enum desteklemiyor; yeni kategori eklemek migration değil kod değişikliği olsun diye).
- **Outfit**: id, user_id FK, event_id FK (nullable), name (nullable), ai_explanation (text), is_favorite, created_at. `OutfitItem` (outfit_id, clothing_item_id, role/slot) ile ClothingItem'a many-to-many.
- **Event**: id, user_id FK, title, event_type (interview/wedding/meeting/coffee/vacation/other), event_date, location, notes.
- **RefreshToken**: id, user_id FK, token_hash, expires_at, revoked_at(nullable), created_at — logout/revocation ve rotation-reuse tespiti için.

İleride (şemayı bozmadan) eklenecek: chat conversation/message tablosu (AI Chat geçmişi için).

Primary key: Faz 1'de düz integer identity (MSSQL IDENTITY ile en uyumlu). Gerekirse sonra `public_id` UUID kolonu eklenebilir.

## Auth akışı (uçtan uca çalışır halde)

- **Hashing**: passlib + bcrypt.
- **Access token**: ~15-30 dk ömürlü, response body'de döner, frontend zustand store'da (bellekte) tutulur — localStorage'a yazılmaz.
- **Refresh token**: ~7-30 gün ömürlü, `jti` içerir, hash'i `RefreshToken` tablosunda saklanır (revoke/rotation için), **httpOnly + Secure + SameSite=Lax cookie** olarak set edilir — JS'ten erişilemez.
- **Endpoint'ler**: `POST /auth/register`, `POST /auth/login` (access token body + refresh cookie set), `POST /auth/refresh` (cookie'den okur, doğrular, rotate eder), `POST /auth/logout` (DB'de revoke + cookie temizler), `GET /auth/me` (korumalı).
- **CORS**: `allow_credentials=True` + explicit origin (Vite dev server) — cookie'li cross-origin istekler için zorunlu.
- **`get_current_user`**: `OAuth2PasswordBearer(tokenUrl="/auth/login")`, bearer access token decode, `type=access` kontrolü, kullanıcı yükleme, 401 — sonraki tüm feature router'ları buna bağımlı olacak.

## Frontend (Vite + React + TS)

```
frontend/
├── vite.config.ts
├── tailwind.config.ts
├── .env.example                  # VITE_API_BASE_URL
├── src/
│   ├── main.tsx                  # QueryClientProvider + RouterProvider
│   ├── App.tsx
│   ├── router/
│   │   ├── index.tsx             # createBrowserRouter, React.lazy per sayfa
│   │   └── ProtectedRoute.tsx    # auth yoksa /login'e yönlendirir
│   ├── layouts/
│   │   ├── AppLayout.tsx         # sidebar/topnav + <Outlet/> + framer-motion AnimatePresence
│   │   ├── AuthLayout.tsx        # login/register için ortalanmış kart layout
│   │   └── Sidebar.tsx / Navbar.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/LoginPage.tsx, RegisterPage.tsx, ProfilePage.tsx   # GERÇEK, backend'e bağlı
│   │   │   ├── components/LoginForm.tsx, RegisterForm.tsx  # react-hook-form + zod
│   │   │   ├── api/authApi.ts    # axios (withCredentials:true) -> /auth/*
│   │   │   └── store/authStore.ts # zustand: user, accessToken, isAuthenticated, actions
│   │   ├── dashboard/pages/DashboardPage.tsx   # kart grid, empty-state (Faz 2'de veri bağlanacak)
│   │   ├── wardrobe/pages/WardrobePage.tsx     # masonry grid empty-state + devre dışı "Ekle"
│   │   ├── chat/pages/ChatPage.tsx             # boş mesaj listesi shell
│   │   ├── events/pages/EventsPage.tsx         # empty-state liste
│   │   └── stats/pages/StatsPage.tsx           # empty-state grafik placeholder
│   ├── shared/ui/                 # Button, Card, Input, Modal, Skeleton, EmptyState, Spinner, Badge, Avatar
│   ├── shared/motion/PageTransition.tsx
│   ├── lib/apiClient.ts           # axios instance, request interceptor (Bearer ekler), response interceptor (401 -> /auth/refresh -> retry)
│   ├── lib/queryClient.ts
│   └── types/                     # backend şemalarını yansıtan paylaşılan TS tipleri
```

**Bağımlılıklar**: react-router-dom, `@tanstack/react-query`, axios, zustand, tailwindcss, **framer-motion**, clsx + tailwind-merge, lucide-react, react-hook-form + zod, date-fns. Sonraki fazlara özel (şimdi kurulmayacak): recharts (stats), react-dropzone (wardrobe upload).

**Tema**: sabit premium dark tema, CSS custom properties üzerinden (Inter font, katmanlı koyu arkaplanlar, tek accent renk) — ileride `data-theme` attribute'u ile light mode eklenebilir, yeniden yazım gerekmez.

**Routing**: `createBrowserRouter` — public dallar (`/login`, `/register`) `AuthLayout` altında, korumalı dallar (`/dashboard`, `/wardrobe`, `/chat`, `/events`, `/stats`, `/profile`) `AppLayout` + `ProtectedRoute` altında. Her sayfa `React.lazy`, ortak `Suspense` fallback. `/` auth durumuna göre `/dashboard` veya `/login`'e yönlenir; catch-all `NotFoundPage`. Her feature kendi `pages/` klasörüne sahip olduğundan sonraki fazlar sadece mevcut slot içine gerçek bileşen/mantık ekler, routing yeniden yapılandırılmaz.

## Faz 1 kapsam dışı (bilinçli olarak)

Wardrobe CRUD iş mantığı, Gemini entegrasyonu (metin + vision), Open-Meteo entegrasyonu, chat AI mantığı, event-AI eşleştirmesi, stats/grafik hesaplamaları — bunların hepsi ayrı fazlarda, önce plan sunularak eklenecek. Faz 1 sonunda: kayıt ol → giriş yap → dashboard'a yönlen → sidebar'dan tüm placeholder sayfalara gidilebilir → çıkış yap, tam çalışır olacak.

## Doğrulama (Faz 1 sonu)

1. Backend: `uvicorn app.main:app --reload` ile ayağa kalkar, `GET /health` 200 döner, Alembic migration `alembic upgrade head` ile tabloları oluşturur.
2. `pytest` — health + auth (register→login→me→refresh→logout) testleri geçer.
3. Frontend: `npm run dev`, tarayıcıda kayıt ol → login → dashboard'a yönlendiği, sidebar'dan tüm sayfalara (boş/placeholder halde) gidilebildiği, çıkış yapınca `/login`'e döndüğü doğrulanır (Browser tool ile).
4. CORS + cookie akışı: login sonrası DevTools/Network'te refresh cookie'sinin `HttpOnly` set edildiği, sayfa yenilenince `/auth/refresh` ile oturumun korunduğu kontrol edilir.

## Sonraki adımlar (bu fazdan sonra, ayrı onayla)

Faz 2: Dijital Gardırop (upload + Gemini Vision otomatik tespit + CRUD + filtre/arama). Faz 3: Hava durumu + Dashboard verileri. Faz 4: AI Chat + kombin önerisi. Faz 5: Etkinlik planlama. Faz 6: Kombin geçmişi + favoriler. Faz 7: İstatistikler + akıllı öneriler. Her faz kendi planıyla ayrı sunulacak.
