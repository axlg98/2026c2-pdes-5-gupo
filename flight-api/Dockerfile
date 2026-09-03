FROM node:24.14.1-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm start"]