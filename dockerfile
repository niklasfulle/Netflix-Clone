FROM node:18
ARG POSTGRESQL_URL= 
ARG AUTH_TRUST_HOST= 
WORKDIR /netflix-clone
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 6969
RUN npm run build
RUN npm run start