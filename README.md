## Running the Project with Docker

This project provides a Docker-based setup for running the TypeScript application in a production-ready environment. Below are the key details and steps specific to this project:

### Project-Specific Docker Requirements
- **Node.js Version:** Uses Node.js `22.13.1-slim` (as specified by `ARG NODE_VERSION=22.13.1` in the Dockerfile).
- **Build Process:** The Dockerfile builds the TypeScript source code and installs only production dependencies in the final image.
- **User Security:** Runs the app as a non-root user (`appuser`).

### Environment Variables
- The application supports environment variables via a `.env` file. If you have a `.env` file, uncomment the `env_file: ./.env` line in the `docker-compose.yml` to load it automatically.
- **No required environment variables are hardcoded in the Dockerfile or compose file**, but your application may require variables defined in `.env`.

### Build and Run Instructions
1. **(Optional) Prepare your `.env` file** in the project root if your application requires environment variables.
2. **Build and start the application:**
   ```sh
   docker compose up --build
   ```
   This will build the Docker image and start the `typescript-app` service.

### Special Configuration
- **Assets:** The `assets` directory is included in the final image for runtime use.
- **Logs:** If your application writes logs to the `assets/logs/` directory, ensure this directory exists or is handled by your application.
- **Network:** The service is attached to a custom Docker network `appnet` (bridge driver).

### Ports
- **Service:** `typescript-app`
- **Exposed Port:** `3000` (container) → `3000` (host)

### Additional Notes
- If you add other services (e.g., a database), update the `docker-compose.yml` accordingly and use the `depends_on` field as needed.
- The application is started with: `node build/main.js`.

---
