import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/config';
import logger from './config/logger';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/database';

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.validateEnvironment();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private validateEnvironment() {
    try {
      validateConfig();
      logger.info('Environment variables validated successfully');
    } catch (error) {
      logger.error('Environment validation failed:', error);
      process.exit(1);
    }
  }

  private initializeMiddlewares() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(
      cors({
        origin: config.corsOrigin.split(','),
        credentials: true,
      })
    );

    // Rate limiting - mais permissivo para permitir operações em lote
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.nodeEnv === 'development' ? 10000 : 5000, // Aumentado para 5000 em produção
      message: 'Muitas requisições deste IP, tente novamente mais tarde.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Pular rate limit para IPs locais/internos (Docker, localhost)
        const ip = req.ip || req.socket.remoteAddress || '';
        const trustedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost', '172.17.', '172.18.', '10.'];
        return trustedIPs.some(trusted => ip.includes(trusted));
      }
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  private initializeRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Urban Expansão API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/api/health',
          cities: '/api/cities',
          ai: '/api/ai',
          plannings: '/api/plannings',
        },
      });
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public async start() {
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      const PORT = config.port;
      this.app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
        logger.info(`API available at http://localhost:${PORT}/api`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop() {
    await prisma.$disconnect();
    logger.info('Server stopped and database disconnected');
  }
}

// Create and start server
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

export default server.app;
