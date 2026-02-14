// ─── Database Connection ───────────────────────────────────────────
const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null;
let client = null;

async function connectDB() {
    if (db) return db;

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum';
    client = new MongoClient(uri);

    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');

    // Create indexes for performance (in background)
    console.log('⏳ Initializing indexes...');
    createIndexes(db).catch(err => console.warn('⚠️  Index creation warning:', err.message));

    return db;
}

async function createIndexes(db) {
    try {
        // Users
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });

        // Questions
        await db.collection('questions').createIndex({ userId: 1 });
        await db.collection('questions').createIndex({ tags: 1 });
        await db.collection('questions').createIndex({ status: 1 });
        await db.collection('questions').createIndex({ createdAt: -1 });
        await db.collection('questions').createIndex(
            { title: 'text', description: 'text' },
            { name: 'question_text_search' }
        );

        // Answers
        await db.collection('answers').createIndex({ questionId: 1 });
        await db.collection('answers').createIndex({ userId: 1 });

        // Reports
        await db.collection('reports').createIndex({ status: 1 });
        await db.collection('reports').createIndex({ targetType: 1, targetId: 1 });

        // Moderation logs
        await db.collection('moderation_logs').createIndex({ createdAt: -1 });

        console.log('✅ Database indexes created');
    } catch (err) {
        console.warn('⚠️  Index creation warning:', err.message);
    }
}

function getDB() {
    if (!db) throw new Error('Database not initialized. Call connectDB() first.');
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('🔌 MongoDB connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };
