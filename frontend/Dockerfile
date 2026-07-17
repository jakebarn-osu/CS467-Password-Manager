FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json
# Resolve fresh so the container gets its own platform native bundler binding
RUN rm -f package-lock.json && npm install --workspace=frontend --workspace=@app/shared

COPY frontend ./frontend
COPY packages/shared ./packages/shared

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
