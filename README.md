# Gestion BDC App

A full-stack application for managing "bon de commande" (purchase orders) data with React frontend and Spring Boot backend, containerized with Docker Compose and connected to Aiven MySQL database.

## ⚠️ Status

**This application is currently incomplete**


## Requirements

- **Node.js** 18+ (for React frontend)
- **Java** 17 (for Spring Boot backend)
- **Maven** (for Java dependency management)
- **Docker** and **Docker Compose**
- **Aiven MySQL database credentials** (host, port, username, password)
- **SMTP credentials** (for email functionality)
- **JWT secret key** (for authentication)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd App
   ```

2. **Create environment configuration:**
   ```bash
   # IMPORTANT: Create your own .env file in gestion_bc folder from .env.example
   # You must create this file with your own configuration values
   cp gestion_bc/.env.example gestion_bc/.env
   ```
   
   **IMPORTANT:** Replace the placeholder values in `gestion_bc/.env.example` with your actual configuration
   

3. **Install dependencies:**
   ```bash
   # Frontend dependencies
   cd frontend_bc
   npm install
   cd ..
   
   # Backend dependencies (Maven will handle this via Docker)
   # No manual installation needed
   ```

## Running the Application

**Start the entire application with Docker Compose:**
```bash
docker-compose up --build
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:9090

## API Endpoints

### Available Endpoints:
- `GET /api/bon-de-commande` - Retrieve BDC (bon de commande) data
- `GET /api/site` - Retrieve site data
- `GET /api/services` - Retrieve service catalog
- `GET /api/zones` - Retrieve zones (requires authentication)
- `GET /api/users/id-by-email/{email}` - Get user ID by email
- `POST /api/auth/login` - User authentication

### Authentication:
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Known Issues


### Database Connection:
- Application will fail to start if `.env` file is missing or incorrectly configured
- Aiven database credentials must be valid and accessible



## Troubleshooting

### Common Problems:

1. **Database Connection Failed:**
   - Verify Aiven database credentials in `.env`
   - Ensure database is accessible from your network
   - Check if database service is running

2. **Frontend Build Errors:**
   - Run `npm install` in `frontend_bc` directory
   - Fix TypeScript errors before building
   - Check for missing dependencies

3. **500 Internal Server Error:**
   - Check backend logs in Docker container
   - Verify environment variables are set correctly
   - Ensure all required services are running

4. **Authentication Issues:**
   - Verify JWT_SECRET is set in `.env`
   - Check if user credentials are valid
   - Ensure token is being sent in requests


## Contact

For questions or issues related to this project, please contact the development team via email. Support will be available for one week after handover.

---

**Note:** This application is in development and may require significant work to become production-ready. Review all code and configurations before deployment.
