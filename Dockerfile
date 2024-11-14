FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4200
ENTRYPOINT ["node", "app-tj.js"]