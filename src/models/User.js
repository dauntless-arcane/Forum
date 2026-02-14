const { getDB } = require('../config/database');

const userSchema = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
            name: {
                bsonType: 'string',
                minLength: 2,
                maxLength: 50,
                description: 'must be a string and is required'
            },
            email: {
                bsonType: 'string',
                pattern: '^.+@.+$',
                description: 'must be a valid email and is required'
            },
            password: {
                bsonType: 'string',
                minLength: 6,
                description: 'must be a string and is required'
            },
            role: {
                enum: ['student', 'specialist', 'admin'],
                description: 'can only be student, specialist, or admin'
            },
            avatar: {
                bsonType: 'string',
                description: 'must be a string URL or emoji'
            },
            verified: {
                bsonType: 'bool',
                description: 'is verified user (specialist)'
            },
            profession: {
                bsonType: 'string',
                description: 'optional profession string'
            },
            expertise: {
                bsonType: 'array',
                items: {
                    bsonType: 'string'
                }
            },
            banned: {
                bsonType: 'bool',
                description: 'is banned'
            }
        }
    }
};

async function createUserCollection() {
    const db = getDB();
    const collections = await db.listCollections({ name: 'users' }).toArray();

    if (collections.length === 0) {
        await db.createCollection('users', { validator: userSchema });
    } else {
        await db.command({
            collMod: 'users',
            validator: userSchema
        });
    }

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
}

module.exports = { createUserCollection };
