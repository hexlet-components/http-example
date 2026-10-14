FROM node:26-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache caddy

# corepack из образов Node 26 убран, поэтому pnpm ставится напрямую. Версия
# совпадает с полем packageManager, чтобы образ и разработка не расходились.
RUN npm install -g pnpm@12.11.2

# .pnpmfile.cjs участвует в разрешении зависимостей, и без него
# --frozen-lockfile отвергает лок как несовпадающий.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN pnpm install --frozen-lockfile && pnpm store prune

COPY . .

# Спецификации компилирует тот же скрипт, что и `mise run compile`. mise в образ
# не ставится: демонов на хосте здесь заменяет bin/start.sh.
RUN node bin/compile.ts

CMD ["./bin/start.sh"]

EXPOSE 8080
