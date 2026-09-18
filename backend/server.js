// ============================================================
// BMAS - BACKEND SERVER
// Budget Monitoring and Allocation System
// ============================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ============================================================
// IMPORT ROUTES
// ============================================================

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const budgetProposalsRoutes = require('./routes/budgetProposals');
const budgetRoutes = require('./routes/budget');
const raodRoutes = require('./routes/raod');
const rbudRoutes = require('./routes/rbud');
const financialReportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const fundsourcesRoutes = require('./routes/fundsources');
const exportsRoutes = require('./routes/exports');
const masterdataRoutes = require('./routes/masterdata');

// ============================================================
// CREATE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// BASIC CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

// ============================================================
// CORS CONFIGURATION
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// ============================================================
// ROOT / HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BMAS API is running',
    server: 'Budget Monitoring and Allocation System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BMAS API endpoints are available',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Backend server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// AUTHENTICATION
// ============================================================

app.use('/api/auth', authRoutes);

// ============================================================
// ADMIN
// ============================================================

app.use('/api/admin', adminRoutes);

// ============================================================
// DASHBOARD
// ============================================================

app.use('/api/dashboard', dashboardRoutes);

app.use(
    '/api/budget-proposals',
    budgetProposalsRoutes
);

// ============================================================
// BUDGET
// ============================================================

app.use('/api/budget', budgetRoutes);

// ============================================================
// RAOD REGISTRY
// ============================================================
//
// Main route:
//   /api/raod
//
// Legacy route:
//   /api/budget/raod
//
// Both are kept so existing frontend code will continue working.
//

app.use('/api/raod', raodRoutes);

app.use('/api/budget/raod', raodRoutes);

// ============================================================
// RBUD REGISTRY
// ============================================================
//
// Main route:
//   /api/rbud
//

app.use('/api/rbud', rbudRoutes);

// ============================================================
// FINANCIAL REPORTS
// ============================================================
//
// IMPORTANT:
//
// The frontend Reports module calls:
//
// GET /api/financial-reports/summary
// GET /api/financial-reports/fund-groups
// GET /api/financial-reports/departments
// GET /api/financial-reports/monthly
// GET /api/financial-reports/raod
// GET /api/financial-reports/rbud
//
// Therefore reports.js MUST be mounted here.
//

app.use('/api/financial-reports', financialReportsRoutes);

// ============================================================
// SETTINGS
// ============================================================

app.use('/api/settings', settingsRoutes);

// ============================================================
// FUND SOURCES
// ============================================================

app.use('/api/fundsources', fundsourcesRoutes);

// ============================================================
// EXPORTS
// ============================================================

app.use('/api/exports', exportsRoutes);

// ============================================================
// MASTER DATA
// ============================================================

app.use('/api/masterdata', masterdataRoutes);

// ============================================================
// API ROUTE INFORMATION
// ============================================================
//
// Useful when testing the server.
//

app.get('/api/routes', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BMAS API routes',
    routes: {
      authentication: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      budget: '/api/budget',

      raod: '/api/raod',
      raodLegacy: '/api/budget/raod',

      rbud: '/api/rbud',

      financialReports: '/api/financial-reports',

      settings: '/api/settings',
      fundsources: '/api/fundsources',
      exports: '/api/exports',
      masterdata: '/api/masterdata',
    },
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.log(
    `404 - Route not found: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('');
  console.error('==========================================');
  console.error('GLOBAL SERVER ERROR');
  console.error('==========================================');
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Error:', err);
  console.error('==========================================');
  console.error('');

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err.status ||
    err.statusCode ||
    500;

  res.status(statusCode).json({
    success: false,
    message:
      err.message ||
      'Internal server error occurred.',
    error:
      process.env.NODE_ENV === 'development'
        ? err.stack
        : undefined,
  });
});

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('   BUDGET MONITORING & ALLOCATION SYSTEM');
  console.log('==========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Routes: http://localhost:${PORT}/api/routes`);
  console.log('');
  console.log('Modules:');
  console.log(`  Auth:            /api/auth`);
  console.log(`  Admin:           /api/admin`);
  console.log(`  Dashboard:       /api/dashboard`);
  console.log(`  Budget:          /api/budget`);
  console.log(`  RAOD:            /api/raod`);
  console.log(`  RBUD:            /api/rbud`);
  console.log(`  Reports:         /api/financial-reports`);
  console.log(`  Settings:        /api/settings`);
  console.log(`  Fund Sources:    /api/fundsources`);
  console.log(`  Exports:         /api/exports`);
  console.log(`  Master Data:     /api/masterdata`);
  console.log('==========================================');
  console.log('');
});

// ============================================================
// SERVER ERROR HANDLER
// ============================================================

server.on('error', (error) => {
  console.error('');
  console.error('==========================================');
  console.error('SERVER ERROR');
  console.error('==========================================');

  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already being used by another process.`
    );

    console.error(
      'Please stop the existing server or change the PORT.'
    );
  } else {
    console.error(error);
  }

  console.error('==========================================');
  console.error('');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log('');
  console.log(`${signal} received.`);
  console.log('Shutting down server...');

  server.close((error) => {
    if (error) {
      console.error(
        'Error while closing HTTP server:',
        error
      );

      process.exit(1);
    }

    console.log('HTTP server closed.');
    console.log('Server shutdown completed.');

    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      'Could not close server gracefully.'
    );

    console.error(
      'Forcing shutdown...'
    );

    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

// ============================================================
// UNHANDLED PROMISE REJECTION
// ============================================================

process.on('unhandledRejection', (reason) => {
  console.error('');
  console.error('==========================================');
  console.error('UNHANDLED PROMISE REJECTION');
  console.error('==========================================');
  console.error(reason);
  console.error('==========================================');
  console.error('');
});

// ============================================================
// UNCAUGHT EXCEPTION
// ============================================================

process.on('uncaughtException', (error) => {
  console.error('');
  console.error('==========================================');
  console.error('UNCAUGHT EXCEPTION');
  console.error('==========================================');
  console.error(error);
  console.error('==========================================');
  console.error('');
});

// ============================================================
// EXPORT APP
// ============================================================
//
// Exporting the app is useful for testing.
// The server is still started above when this file is run.
//

module.exports = app;