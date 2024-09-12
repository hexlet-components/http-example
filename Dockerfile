FROM node:22-alpine
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "start"]
