# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Accept build arguments for Supabase configuration
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
