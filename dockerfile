FROM node:24-alpine3.24

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_URL=file:./dev.db

EXPOSE 3001