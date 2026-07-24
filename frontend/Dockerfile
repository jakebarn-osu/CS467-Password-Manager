FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/crypto/package.json ./packages/crypto/package.json

RUN rm -f package-lock.json && npm install --workspace=frontend --workspace=@app/shared --workspace=@app/crypto

COPY frontend ./frontend
COPY packages/shared ./packages/shared
COPY packages/crypto ./packages/crypto

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
