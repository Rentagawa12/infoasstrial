# Docker Deployment for Lost & Found @ TIP Manila

This directory contains the Docker configuration for deploying the application.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git repository cloned

## Building and Running with Docker

1. Navigate to the project directory:
   ```
   cd finalapppp/APPDEV/APPDEV/APPDEVPROG
   ```

2. Build and start the containers:
   ```
   docker-compose -f Dockerfile/docker-compose.yml up -d
   ```

3. The application will be available at http://localhost:5000

## Stopping the Containers

To stop the containers:
```
docker-compose -f Dockerfile/docker-compose.yml down
```

## Deployment to Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. For the build command, use:
   ```
   docker-compose -f Dockerfile/docker-compose.yml up -d
   ```
5. Set any required environment variables in the Render dashboard
