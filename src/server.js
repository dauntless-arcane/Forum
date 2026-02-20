// ─── Forum Backend Server ─────────────────────────────────────────
require('dotenv').config();

const http = require('http'); // Import http module
const express = require('express');
const { Server } = require('socket.io'); // Impor Socket.IOt
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB, closeDB } = require('./config/database');
const { initCollections } = require('./config/init');
const { connectRedis, closeRedis, getRedis } = require('./config/redis');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { verifyToken } = require('./middleware/auth');



// Route imports
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const userRoutes = require('./routes/users');
const moderationRoutes = require('./routes/moderation');
const tagRoutes = require('./routes/tags');
const adminRoutes = require('./routes/admin');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const server = http.createServer(app); // Create HTTP server
const PORT = process.env.PORT || 5000;

// ──────────────── Swagger Documentation ────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ──────────────── Socket.IO Setup with Redis Adapter ────────────────
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'https://forum-gamma-one.vercel.app',
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
    connectTimeout: 10000,
    maxHttpBufferSize: 1e6,
    perMessageDeflate: {
        threshold: 1024,
    },
});

// Redis Adapter logic for scaling across multiple instances
const pubClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true // Prevent instant connection, wait for startServer()
});

pubClient.on('error', (err) => {
    console.warn('⚠️  Redis Pub Client Error:', err.message);
});

const subClient = pubClient.duplicate();

subClient.on('error', (err) => {
    console.warn('⚠️  Redis Sub Client Error:', err.message);
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.IO Redis Adapter configured');
}).catch(err => console.warn('⚠️  Redis Adapter failed (running in single-node mode):', err.message));

io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('join_specialist_room', async (token) => {
        try {
            const user = await verifyToken(token);
            if (user.role === 'specialist' || user.role === 'admin') {
                socket.join('specialists');
                console.log(`Client ${socket.id} (User: ${user.username}) joined specialist room`);
            } else {
                console.warn(`Unauthorized join attempt to specialist room by ${user.username}`);
                socket.emit('error', 'Unauthorized: Specialists only');
            }
        } catch (err) {
            console.error(`Socket auth failed for specialist room: ${err.message}`);
            socket.emit('error', 'Authentication failed');
        }
    });

    socket.on('join_explore', () => {
        socket.join('explore_feed');
        console.log(`Client ${socket.id} joined explore feed`);
    });

    socket.on('leave_explore', () => {
        socket.leave('explore_feed');
        console.log(`Client ${socket.id} left explore feed`);
    });

    socket.on('join_tags', (tags) => {
        if (Array.isArray(tags)) {
            const joined = [];
            tags.forEach(tag => {
                if (typeof tag === 'string') {
                    socket.join(`tag:${tag}`);
                    joined.push(tag);
                }
            });
            if (joined.length) console.log(`Client ${socket.id} joined tag rooms: [${joined.join(', ')}]`);
        }
    });

    socket.on('leave_tags', (tags) => {
        if (Array.isArray(tags)) {
            const left = [];
            tags.forEach(tag => {
                if (typeof tag === 'string') {
                    socket.leave(`tag:${tag}`);
                    left.push(tag);
                }
            });
            if (left.length) console.log(`Client ${socket.id} left tag rooms: [${left.join(', ')}]`);
        }
    });

    socket.on('join_admin_room', async (token) => {
        try {
            const user = await verifyToken(token);
            if (user.role === 'admin') {
                socket.join('admin_feed');
                console.log(`Client ${socket.id} (User: ${user.username}) joined admin feed`);
            } else {
                console.warn(`Unauthorized join attempt to admin room by ${user.username}`);
                socket.emit('error', 'Unauthorized: Admins only');
            }
        } catch (err) {
            console.error(`Socket auth failed for admin room: ${err.message}`);
            socket.emit('error', 'Authentication failed');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Make io accessible to our routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ──────────────── Security Middleware ────────────────
app.use(helmet());

// ──────────────── CORS ────────────────
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'https://forum-gamma-one.vercel.app',
        'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ──────────────── Body Parsing ────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──────────────── Logging ────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// ──────────────── Rate Limiting ────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ──────────────── Health Check ────────────────
app.get('/api/health', async (req, res) => {
    const redis = getRedis();
    const redisStatus = redis ? 'connected' : 'disconnected (operating without cache)';

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: 'connected',
            redis: redisStatus,
            socketio: 'initialized',
        },
    });
});

// ──────────────── API Routes ────────────────
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/admin', adminRoutes);

// ──────────────── 404 Handler ────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ──────────────── Error Handler ────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error.'
            : err.message,
    });
});

// ──────────────── Start Server ────────────────
async function startServer() {
    try {
        // Connect to databases
        await connectDB();

        // Initialize Collections & Indexes
        initCollections();

        connectRedis();

        // Use server.listen instead of app.listen
        server.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════╗
║        🚀 Forum API Server Running          ║
╠══════════════════════════════════════════════╣
║  Port:      ${String(PORT).padEnd(33)}║
║  Mode:      ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║  Docs:      http://localhost:${String(PORT).padEnd(5)}/api-docs     ║
║  MongoDB:   Connected                       ║
║  Redis:     ${(getRedis() ? 'Connected' : 'Disabled (optional)').padEnd(33)}║
║  Socket.IO: Enabled (Specialists Room)      ║
╠══════════════════════════════════════════════╣
║  Endpoints:                                  ║
║  POST   /api/auth/signup                     ║
║  POST   /api/auth/login                      ║
║  POST   /api/auth/bulk-create (admin)        ║
║  GET    /api/auth/me                         ║
║  GET    /api/questions                       ║
║  POST   /api/questions                       ║
║  GET    /api/questions/:id                   ║
║  PUT    /api/questions/:id                   ║
║  DELETE /api/questions/:id                   ║
║  POST   /api/answers/:questionId             ║
║  PUT    /api/answers/:id                     ║
║  DELETE /api/answers/:id                     ║
║  POST   /api/answers/:id/upvote              ║
║  POST   /api/answers/:id/best                ║
║  GET    /api/users/specialists               ║
║  GET    /api/users/:id                       ║
║  PUT    /api/users/profile                   ║
║  GET    /api/tags                            ║
║  POST   /api/moderation/report               ║
║  GET    /api/moderation/reports (admin)       ║
║  GET    /api/moderation/reports (admin)       ║
║  POST   /api/moderation/blocked-words (admin)║
║  GET    /api/admin/stats       (admin)       ║
║  GET    /api/admin/users       (admin)       ║
║  PATCH  /api/admin/users/:id/ban (admin)     ║
║  PATCH  /api/admin/users/:id/role (admin)    ║
║  DELETE /api/admin/questions/:id (admin)     ║
║  DELETE /api/admin/answers/:id   (admin)     ║
║  GET    /api/health                          ║
╚══════════════════════════════════════════════╝
      `);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

// ──────────────── Graceful Shutdown ────────────────
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await closeDB();
    await closeRedis();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await closeDB();
    await closeRedis();
    process.exit(0);
});

startServer();

module.exports = app;
