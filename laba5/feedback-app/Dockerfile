FROM node:20-alpine


RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install --build-from-source=sqlite3,bcrypt

COPY app.js db.js nginx.conf ./
COPY views ./views
COPY public ./public

RUN mkdir -p data

EXPOSE 3000

CMD ["node", "app.js"]
