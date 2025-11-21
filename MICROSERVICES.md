# Microservices Architecture

The backend has been fully migrated from a monolithic structure to a microservices architecture. This document outlines the new structure, services, and how to run them.

## Architecture Overview

The system uses an **API Gateway** pattern where a single entry point (Gateway) routes requests to appropriate backend services.

### Services

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | `3000` | Entry point, routing, CORS, rate limiting, API docs. |
| **Auth Service** | `3001` | User registration, login, token generation/validation. |
| **Course Service** | `3003` | Course management, enrollment, course rosters. |
| **Notification Service** | `3004` | Real-time notifications (Socket.IO), user alerts. |
| **Schedule Service** | `3005` | Class scheduling, timetable management. |
| **Venue Service** | `3006` | Venue/room management, availability checking. |
| **Announcement Service** | `3007` | Campus announcements, news, comments. |
| **User Service** | `3008` | User profile management, admin user operations. |

### Infrastructure

*   **Database**: Shared PostgreSQL database (via Prisma) for simplicity in this school project. In a production microservices environment, each service would typically have its own database.
*   **Communication**: Services communicate via HTTP requests using `axios`.
*   **Real-time**: `socket.io` is hosted in the Notification Service.
*   **Validation**: Shared validation logic in `utils/validator.js`.

## Directory Structure

```
BACKEND/
├── src/
│   ├── config/             # Shared config (DB, Swagger)
│   ├── middleware/         # Shared middleware (Auth, Role)
│   ├── server.js           # API Gateway entry point
│   ├── services/           # Microservices
│   │   ├── announcement-service/
│   │   ├── auth-service/
│   │   ├── course-service/
│   │   ├── notification-service/
│   │   ├── schedule-service/
│   │   ├── user-service/
│   │   └── venue-service/
│   └── shared/             # Shared utilities
├── start-services.js       # Script to launch all services
└── prisma/                 # Database schema and migrations
```

## Running the System

### Prerequisites
- Node.js
- PostgreSQL running
- `.env` file configured

### Start All Services
To start the Gateway and all 7 microservices simultaneously:

```bash
node start-services.js
```

### API Documentation
Once running, access the Swagger API documentation at:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Key Changes from Monolith

1.  **Routing**: The Gateway (`server.js`) no longer contains business logic. It simply proxies requests to the correct port using `http-proxy-middleware`.
    *   `/api/auth` -> Port 3001
    *   `/api/courses` -> Port 3003
    *   `/api/notifications` -> Port 3004
    *   `/api/schedules` -> Port 3005
    *   `/api/venues` -> Port 3006
    *   `/api/announcements` -> Port 3007
    *   `/api/users` -> Port 3008

2.  **Event Handling**:
    *   The old in-memory `EventBus` has been replaced/supplemented with direct HTTP calls between services (e.g., Course Service calls Notification Service to alert students).

3.  **File Cleanup**:
    *   `src/controllers/` and `src/routes/` in the main directory have been removed. Logic is now encapsulated within each service's `server.js`.

## Troubleshooting

*   **Port Conflicts**: Ensure ports 3000-3008 are free before starting.
*   **Database Connection**: All services share the same connection string in `.env`. If one fails, check your DB status.
*   **Service Discovery**: Services are hardcoded to `localhost` ports in `src/shared/utils.js`.

