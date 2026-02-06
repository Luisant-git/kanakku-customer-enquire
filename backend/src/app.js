const express = require('express');
const cors = require('cors');
const formRoutes = require('./routes/formRoute');
const whatsappRoutes = require('./routes/whatsappRoute');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'Customer API Documentation'
}));
app.use('/api', formRoutes);
app.use('/api', whatsappRoutes);

module.exports = app;