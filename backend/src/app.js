const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');
const formRoutes = require('./routes/formRoute');
const whatsappRoutes = require('./routes/whatsappRoute');
const userRoutes = require('./routes/userRoute');
const templateRoutes = require('./routes/templateRoute');
const uploadRoutes = require('./routes/uploadRoute');
const sendTemplateRoutes = require('./routes/sendTemplateRoute');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

app.set('trust proxy', 1);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://enquiry.luisant.cloud', 'https://enquiry.api.luisant.cloud'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'Customer API Documentation'
}));
app.use('/api', formRoutes);
app.use('/api', whatsappRoutes);
app.use('/api/auth', userRoutes);
app.use('/api', templateRoutes);
app.use('/api', uploadRoutes);
app.use('/api', sendTemplateRoutes);

module.exports = app;