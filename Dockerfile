FROM node:22-alpine
COPY . .
RUN npm ci
RUN apk add --no-cache make
RUN make compile
CMD ["npm", "start"]
