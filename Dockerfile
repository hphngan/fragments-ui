# Base image to use
FROM node:18.13.0 AS dependencies

LABEL maintainer="Phuong Ngan Huynh <phuynh22@myseneca.ca>"
LABEL description="Fragments-UI node.js microservice"

# We default to use port 1234 in our service
ENV PORT=1234
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Define build arguments for Cognito settings (replace with actual values)

# AWS Amazon Cognito User Pool ID (use your User Pool ID)
ARG AWS_COGNITO_POOL_ID=us-east-1_D7cFrN8u4

# AWS Amazon Cognito Client App ID (use your Client App ID)
ARG AWS_COGNITO_CLIENT_ID=45hhrtd6906r1omlja316l7dug

# AWS Amazon Cognito Host UI domain (use your domain only, not the full URL)
ARG AWS_COGNITO_HOSTED_UI_DOMAIN=hphngan-fragments.auth.us-east-1.amazoncognito.com

# OAuth Sign-In Redirect URL (use the port for your fragments-ui web app)
ARG OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:1234

# OAuth Sign-Out Redirect URL (use the port for your fragments-ui web app)
ARG OAUTH_SIGN_OUT_REDIRECT_URL=http://localhost:1234

ARG API_URL=http://fragments-load-balancer-1416756098.us-east-1.elb.amazonaws.com:8080

# Set environment variables for AWS Cognito settings
ENV AWS_COGNITO_POOL_ID=$AWS_COGNITO_POOL_ID
ENV AWS_COGNITO_CLIENT_ID=$AWS_COGNITO_CLIENT_ID
ENV AWS_COGNITO_HOSTED_UI_DOMAIN=$AWS_COGNITO_HOSTED_UI_DOMAIN

WORKDIR /app

# copy dep files
COPY package*.json ./

# Install only production dependencies defined in package-lock.json
RUN npm ci 

#########################################################

FROM node:18.13.0-slim AS builder

WORKDIR /app

# Copy cached dependencies from previous stage so we don't have to download
COPY --from=dependencies /app /app

# copy all of the project source into the image
COPY . .

ENV NODE_ENV=production

RUN npm run build

#########################################################

# Production stage
FROM nginx:alpine AS deploy

# Copy the built assets from the builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


