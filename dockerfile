FROM node:22
WORKDIR /netflix-clone
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
COPY .env_production .env
EXPOSE 3000
RUN npx prisma generate
RUN npm run build
CMD npx prisma db push && npm run start
