#!/bin/bash

echo Stop pm2 Netflix-Clone
pm2 stop netflix-clone

echo Delete pm2 Netflix-Clone
pm2 delete netflix-clone

echo Generate DB
npx prisma generate

echo Build Netflix Clone
npm run build

echo Start Netflix Clone
pm2 start yarn --name netflix-clone  -- start --port 6969