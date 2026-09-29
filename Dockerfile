FROM node:26-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache make caddy

# corepack из образов Node 26 убран, поэтому pnpm ставится напрямую. Версия
# совпадает с полем packageManager, чтобы образ и разработка не расходились.
RUN npm install -g pnpm@12.6.0

# .pnpmfile.cjs участвует в разрешении зависимостей, и без него
# --frozen-lockfile отвергает лок как несовпадающий.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN pnpm install --frozen-lockfile && pnpm store prune

COPY . .

RUN make compile

CMD ["make", "start"]

EXPOSE 8080
