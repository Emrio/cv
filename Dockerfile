FROM node:21.1.0-alpine

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY src src
COPY tsconfig.json tsconfig.json

RUN npm ci
RUN npm run build

ENV NODE_ENV=production
CMD ["node", "."]
