const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lynkon API',
      version: '1.0.0',
      description: 'API REST para Lynkon - Unificador de perfiles de videojuegos',
    },
    servers: [
      { url: 'https://lynkon.onrender.com/api', description: 'Producción' },
      { url: 'http://localhost:3000/api', description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID Token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.js', 
    './src/app.js',   
    './src/server.js'   
  ],
};

module.exports = swaggerJsdoc(options);
