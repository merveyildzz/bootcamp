# Build context is the repo root (see docker-compose.yml) so this file can live
# here with every other Docker-related file, instead of scattered inside frontend/.
FROM node:20-slim

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

EXPOSE 5173

# --host 0.0.0.0 so the dev server is reachable from outside the container;
# package.json's own "dev" script stays plain (host 0.0.0.0 would be wrong
# for a native `npm run dev` outside Docker).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
