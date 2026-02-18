FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache make caddy

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY . .

RUN make compile

CMD ["make", "start"]

EXPOSE 8080
