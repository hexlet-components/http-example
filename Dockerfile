FROM node:22-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

RUN apk add --no-cache make caddy
RUN npm install -g @stoplight/prism-cli

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY . .
RUN make compile

EXPOSE 8080

CMD ["make", "start"]
