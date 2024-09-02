# Stage 1: Build the React app
FROM node:18 AS build

WORKDIR /app
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend ./
# RUN npm run build

# # Stage 2: Serve the React app
# FROM nginx:alpine

# # Correcting the path to build output
# COPY --from=build /app/build /usr/share/nginx/html

# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
cmd ["npm","start"]
