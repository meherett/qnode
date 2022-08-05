# syntax=docker/dockerfile:1

FROM node:latest

WORKDIR /qnode-web

COPY ./dist ./

RUN npm install -g npm@latest && npm install

EXPOSE 9090

CMD ["npm", "start"]
