const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

/**
 * Setup Swagger UI middleware
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  try {
    const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/swagger.yaml'));

    // Custom CSS for enhanced Swagger UI appearance
    const swaggerOptions = {
      customCss: `
        .swagger-ui .topbar { background-color: #2c3e50; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .btn.authorize { background-color: #3498db; color: #fff; border-color: #3498db; }
      `,
      customSiteTitle: 'Library Management API Documentation',
      customfavIcon: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png'
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
    console.log('📖 Swagger documentation available at http://localhost:5000/api-docs');
  } catch (err) {
    console.error('⚠️ Failed to load Swagger document:', err.message);
  }
};

module.exports = { setupSwagger };
