require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./utils/errors');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const caseRoutes = require('./routes/cases');
const prescriptionRoutes = require('./routes/prescriptions');
const appointmentRoutes = require('./routes/appointments');
const billingRoutes = require('./routes/billing');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const clinicRoutes = require('./routes/clinic');
const messageRoutes = require('./routes/messages');
const reportRoutes = require('./routes/reports');
const clinicalRoutes = require('./routes/clinical');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const allowed = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/100\.\d+\.\d+\.\d+(:\d+)?$/,
      /^https:\/\/[\w-]+\.onrender\.com$/,
      /^https:\/\/[\w-]+\.vercel\.app$/,
    ];
    if (allowed.some((re) => re.test(origin))) return cb(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Homeopathy Clinic API running', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patients/:patientId/reports', reportRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/clinical', clinicalRoutes);

if (isProd && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else if (process.env.NODE_ENV !== 'test') {
  app.get('/', (_req, res) => {
    res.status(200).send('API running. In dev, open http://localhost:5173 on your phone (same WiFi).');
  });
}

app.use(errorHandler);

module.exports = app;
