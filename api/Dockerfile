FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY api/package.json ./api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install --workspace=api --workspace=@app/shared

COPY api ./api
COPY packages/shared ./packages/shared

EXPOSE 5000

CMD ["npm", "run", "dev", "--workspace=api"]
