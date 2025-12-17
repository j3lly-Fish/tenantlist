/**
 * Production Configuration
 *
 * This file contains production-specific configuration settings.
 * Values are loaded from environment variables defined in .env.production
 */

export const productionConfig = {
  // Database Configuration
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'zyx_production',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
    min: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '5', 10),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '',
    publicKey: process.env.JWT_PUBLIC_KEY,
    privateKey: process.env.JWT_PRIVATE_KEY,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || '',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
    refreshTokenExpiryRememberMe: process.env.JWT_REFRESH_TOKEN_EXPIRY_REMEMBER_ME || '30d',
    refreshTokenExpiryNoRemember: process.env.JWT_REFRESH_TOKEN_EXPIRY_NO_REMEMBER || '24h',
    algorithm: process.env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256',
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || '',
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      callbackUrl: process.env.TWITTER_CALLBACK_URL || '',
    },
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    awsSes: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@zyx.com',
    fromName: process.env.EMAIL_FROM_NAME || 'ZYX Platform',
    verificationUrl: process.env.EMAIL_VERIFICATION_URL || 'https://app.zyx.com/verify-email',
    passwordResetUrl: process.env.PASSWORD_RESET_URL || 'https://app.zyx.com/reset-password',
    verificationTokenExpiry: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '1h',
    passwordResetTokenExpiry: process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1h',
  },

  // AWS S3 Configuration
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || process.env.S3_BUCKET_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME || 'zyx-production-profile-photos',
    maxFileSize: parseInt(process.env.S3_MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedFileTypes: (process.env.S3_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(','),
    profilePhotoSize: parseInt(process.env.S3_PROFILE_PHOTO_SIZE || '400', 10),
  },

  // CDN Configuration
  cdn: {
    url: process.env.CDN_URL,
    enabled: process.env.USE_CDN === 'true',
  },

  // Application Configuration
  app: {
    env: 'production',
    frontendUrl: process.env.FRONTEND_URL || 'https://app.zyx.com',
    backendUrl: process.env.BACKEND_URL || 'https://api.zyx.com',
    port: parseInt(process.env.API_PORT || '4000', 10),
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://app.zyx.com',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // HTTPS/SSL Configuration
  https: {
    enabled: process.env.FORCE_HTTPS !== 'false',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
    caPath: process.env.SSL_CA_PATH,
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    },
  },

  // Security Configuration
  security: {
    rateLimit: {
      loginEmail: parseInt(process.env.RATE_LIMIT_LOGIN_EMAIL || '5', 10),
      loginIp: parseInt(process.env.RATE_LIMIT_LOGIN_IP || '10', 10),
      passwordReset: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET || '3', 10),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    },
    session: {
      cookieSecure: process.env.SESSION_COOKIE_SECURE !== 'false',
      cookieHttpOnly: process.env.SESSION_COOKIE_HTTPONLY !== 'false',
      cookieSameSite: process.env.SESSION_COOKIE_SAMESITE || 'strict',
      cookieDomain: process.env.SESSION_COOKIE_DOMAIN || '.zyx.com',
    },
    csrf: {
      enabled: process.env.CSRF_ENABLED !== 'false',
      cookieName: process.env.CSRF_COOKIE_NAME || 'csrf-token',
      headerName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token',
    },
  },

  // Feature Flags
  features: {
    mfa: process.env.ENABLE_MFA === 'true',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    oauth: process.env.ENABLE_OAUTH !== 'false',
    passwordReset: process.env.ENABLE_PASSWORD_RESET !== 'false',
  },

  // Monitoring & Error Tracking
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'production',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      enabled: process.env.SENTRY_ENABLED === 'true',
    },
    datadog: {
      apiKey: process.env.DD_API_KEY,
      appKey: process.env.DD_APP_KEY,
      service: process.env.DD_SERVICE || 'zyx-api',
      env: process.env.DD_ENV || 'production',
      version: process.env.DD_VERSION || '1.0.0',
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME || 'ZYX-API-Production',
      enabled: process.env.NEW_RELIC_ENABLED === 'true',
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE,
    errorFile: process.env.LOG_ERROR_FILE,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14', 10),
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  },

  // Performance & Optimization
  performance: {
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10),
    },
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    bodyParser: {
      jsonLimit: process.env.BODY_PARSER_JSON_LIMIT || '1mb',
      urlLimit: process.env.BODY_PARSER_URL_LIMIT || '1mb',
    },
  },

  // Health Checks
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    path: process.env.HEALTH_CHECK_PATH || '/health',
    readinessPath: process.env.READINESS_CHECK_PATH || '/ready',
    livenessPath: process.env.LIVENESS_CHECK_PATH || '/live',
  },
};

/**
 * Validate production configuration
 * Ensures all required environment variables are set
 */
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required database configuration
  if (!productionConfig.database.password) {
    errors.push('DATABASE_PASSWORD is required in production');
  }

  // Required JWT configuration
  if (!productionConfig.jwt.secret && !productionConfig.jwt.privateKey) {
    errors.push('Either JWT_SECRET or JWT_PRIVATE_KEY is required in production');
  }
  if (!productionConfig.jwt.refreshSecret) {
    errors.push('REFRESH_TOKEN_SECRET is required in production');
  }

  // Required S3 configuration
  if (!productionConfig.s3.accessKeyId || !productionConfig.s3.secretAccessKey) {
    errors.push('AWS S3 credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are required in production');
  }

  // Required email configuration
  if (productionConfig.email.service === 'sendgrid' && !productionConfig.email.sendgrid.apiKey) {
    errors.push('SENDGRID_API_KEY is required when using SendGrid email service');
  }
  if (productionConfig.email.service === 'aws-ses' &&
      (!productionConfig.email.awsSes.accessKeyId || !productionConfig.email.awsSes.secretAccessKey)) {
    errors.push('AWS SES credentials are required when using AWS SES email service');
  }

  // Required OAuth configuration (if OAuth is enabled)
  if (productionConfig.features.oauth) {
    if (!productionConfig.oauth.google.clientId || !productionConfig.oauth.google.clientSecret) {
      errors.push('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are required');
    }
    if (!productionConfig.oauth.facebook.appId || !productionConfig.oauth.facebook.appSecret) {
      errors.push('Facebook OAuth credentials (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET) are required');
    }
    if (!productionConfig.oauth.twitter.clientId || !productionConfig.oauth.twitter.clientSecret) {
      errors.push('Twitter OAuth credentials (TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET) are required');
    }
  }

  // Redis configuration
  if (!productionConfig.redis.url && !productionConfig.redis.host) {
    errors.push('Redis configuration (REDIS_URL or REDIS_HOST) is required in production');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default productionConfig;
