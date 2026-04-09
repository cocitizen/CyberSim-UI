# Stage 1: build the React app
FROM node:22-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# REACT_APP_API_URL must be provided at build time:
#   docker build --build-arg REACT_APP_API_URL=https://cybersim-backend.onrender.com .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Stage 2: serve via nginx
FROM nginx:1.27-alpine

RUN apk upgrade --no-cache

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
