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
    const createIndexSafe = async (collection, indexSpec, options = {}) => {
        try {
            console.log(`⏳ Creating index on ${collection}: ${JSON.stringify(indexSpec)}...`);
            await db.collection(collection).createIndex(indexSpec, options);
            console.log(`✅ Index verified on ${collection}: ${JSON.stringify(indexSpec)}`);
        } catch (err) {
            console.warn(`⚠️  Failed to create index on ${collection} (${JSON.stringify(indexSpec)}): ${err.message}`);
        }
    };

    try {
        // Run specific critical indexes first
        await createIndexSafe('questions', { title: 'text', description: 'text' }, { name: 'question_text_search' });

        // Run others in parallel or sequence
        const validations = [
            createIndexSafe('users', { email: 1 }, { unique: true }),
            createIndexSafe('users', { role: 1 }),
            createIndexSafe('questions', { userId: 1 }),
            createIndexSafe('questions', { tags: 1 }),
            createIndexSafe('questions', { status: 1 }),
            createIndexSafe('questions', { createdAt: -1 }),
            createIndexSafe('answers', { questionId: 1 }),
            createIndexSafe('answers', { userId: 1 }),
            createIndexSafe('reports', { status: 1 }),
            createIndexSafe('reports', { targetType: 1, targetId: 1 }),
            createIndexSafe('moderation_logs', { createdAt: -1 })
        ];

        // We don't await all of them to block startup, but we log their completion
        Promise.all(validations).then(() => console.log('✅ All background indexes processed'));

    } catch (err) {
        console.warn('⚠️  Index creation overall warning:', err.message);
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
