# ZYX Platform

Demand-first commercial real estate marketplace with user authentication, role-based access control, and tenant dashboard.

## Project Structure

```
zyx-platform/
├── src/
│   ├── frontend/         # React frontend application
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Frontend utilities
│   │   ├── contexts/     # React contexts
│   │   ├── main.tsx      # Frontend entry point
│   │   └── App.tsx       # Root component
│   ├── config/           # Configuration files (database, etc.)
│   ├── database/         # Database layer
│   │   ├── migrations/   # Database migrations
│   │   └── models/       # Data models
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Backend utility functions
│   └── __tests__/        # Test files
├── index.html            # Vite entry HTML
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Node files
├── .env.development      # Development environment variables
├── .env.production       # Production environment variables
├── .env.example          # Environment variables template
├── docker-compose.yml    # Docker services configuration
├── jest.config.js        # Jest testing configuration
└── package.json          # Node.js dependencies and scripts
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional, for rate limiting)
- Docker & Docker Compose (recommended)

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your backend configuration

   # Frontend environment variables are in .env.development and .env.production
   ```

4. Start database services using Docker:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npm run migrate:up
   ```

## Environment Variables

### Backend Environment Variables (.env)
See `.env.example` for backend configuration including:
- Database connection settings
- JWT secrets
- OAuth credentials
- Email service settings
- Redis configuration

### Frontend Environment Variables

#### Development (.env.development)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_BASE_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=ZYX Platform
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
```

#### Production (.env.production)
```bash
# API Configuration
VITE_API_BASE_URL=https://api.zyx-platform.com
VITE_WS_BASE_URL=https://api.zyx-platform.com

# App Configuration
VITE_APP_NAME=ZYX Platform
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_DEBUG_MODE=false
```

**Note:** All frontend environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Development

### Run backend development server
```bash
npm run dev
```

### Run frontend development server (with HMR)
```bash
npm run dev:frontend
```

### Build backend TypeScript
```bash
npm run build
```

### Build frontend for production
```bash
npm run build:frontend
```

### Preview production build
```bash
npm run preview
```

## Database Migrations

### Run migrations
```bash
npm run migrate:up
```

### Rollback migrations
```bash
npm run migrate:down
```

## Testing

### Run all tests
```bash
npm test
```

### Run database model tests only
```bash
npm run test:models
```

### Run authentication endpoint tests
```bash
npm run test:auth-endpoints
```

### Run authentication component tests
```bash
npm run test:auth-components
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Database Schema

The application uses the following database tables:

- **users**: User accounts with email, password, and role
- **user_profiles**: User profile information (one-to-one with users)
- **oauth_accounts**: OAuth provider account linking (one-to-many with users)
- **refresh_tokens**: JWT refresh tokens for session management
- **password_reset_tokens**: Password reset tokens with expiration
- **mfa_settings**: MFA settings (infrastructure built but disabled for MVP)

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Raw SQL with pg driver
- **Authentication**: JWT with refresh tokens
- **Password Hashing**: bcrypt
- **Testing**: Jest with ts-jest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **WebSocket**: Socket.io Client
- **Styling**: CSS Modules
- **Testing**: Jest + React Testing Library

## Frontend Path Aliases

The following path aliases are configured in both `tsconfig.json` and `vite.config.ts`:

- `@components/*` → `src/frontend/components/*`
- `@pages/*` → `src/frontend/pages/*`
- `@hooks/*` → `src/frontend/hooks/*`
- `@utils/*` → `src/frontend/utils/*`
- `@contexts/*` → `src/frontend/contexts/*`
- `@types` → `src/types/index.ts`

Example usage:
```typescript
import { LoginModal } from '@components/LoginModal';
import { UserRole } from '@types';
import { apiClient } from '@utils/apiClient';
```

## Vite Configuration

The Vite configuration includes:
- **Hot Module Replacement (HMR)**: Enabled for fast development
- **API Proxy**: Proxies `/api` requests to backend server
- **WebSocket Proxy**: Proxies `/socket.io` requests for real-time features
- **Path Aliases**: Configured for cleaner imports
- **CSS Modules**: Scoped styling with camelCase locals
- **Code Splitting**: Vendor and utility chunks separated
- **Source Maps**: Enabled for debugging

## License

ISC
