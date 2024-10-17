# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json /app

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN npm install --only=production

EXPOSE 4001

USER node

# start service
CMD ["node", "dist/main.js"]