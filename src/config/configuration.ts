export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '3000', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-db',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`,
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'noreply@example.com',
  },
  admin: {
    url: process.env.ADMIN_URL || 'http://localhost:5173',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:8081',
  },
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:3000',
  },
});
