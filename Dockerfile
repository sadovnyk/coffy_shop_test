FROM node:24-alpine

WORKDIR /site

COPY package*.json /site/

RUN npm ci --omit=dev

COPY . /site/

EXPOSE 3000

CMD ["node", "server.js"]