// ─── Authentication Middleware ─────────────────────────────────────
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { cacheGet, cacheSet } = require('../config/redis');
const { ObjectId } = require('mongodb');

// Verify JWT and attach user to request
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Try cache first
        const cacheKey = `user:${decoded.id}`;
        let user = await cacheGet(cacheKey);

        if (!user) {
            const db = getDB();
            user = await db.collection('users').findOne(
                { _id: new ObjectId(decoded.id) },
                { projection: { password: 0 } }
            );

            if (!user) {
                return res.status(401).json({ error: 'User not found.' });
            }

            // Cache user for 5 minutes
            await cacheSet(cacheKey, user, 300);
        }

        if (user.banned) {
            return res.status(403).json({ error: 'Your account has been suspended.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        return res.status(500).json({ error: 'Authentication failed.' });
    }
}

// Optional auth – doesn't fail if no token, but populates user if present
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const db = getDB();
            req.user = await db.collection('users').findOne(
                { _id: new ObjectId(decoded.id) },
                { projection: { password: 0 } }
            );
        }
    } catch {
        // Silently continue without user
    }
    next();
}

// Role-based authorization
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions.' });
        }
        next();
    };
}

module.exports = { authenticate, optionalAuth, authorize };
