const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Forum API Documentation',
            version: '1.0.0',
            description: `
# Forum Backend API
Comprehensive REST API for a community forum application.

## Key Features
- **Authentication**: JWT-based auth with role management (Student, Specialist, Admin).
- **Questions & Answers**: Full CRUD with tagging, search, and view counting.
- **Moderation system**: 
  - **Automated**: Profanity/spam filtering on all posts.
  - **Manual**: Report system with admin dashboard for banning users or removing content.
- **Real-time**: Socket.IO events for live updates on the Specialist Panel.

## Roles
- **Student**: Can ask questions, answer, upvote.
- **Specialist**: Verified users (marked with distinct UI), same capabilities as students but highlighted.
- **Admin**: Can manage users, moderate content, bulk-create accounts.

## Usage
Most endpoints require a Bearer Token. Login to get one, then click **Authorize** at the top right.
      `,
            contact: {
                name: 'Support Team',
                email: 'help@forum-app.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Local Development Server',
            },
            {
                url: 'https://forum-gamma-one.vercel.app/api',
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Unique MongoDB ObjectId', example: '65a9f1b2c3d4e5f6g7h8i9j0' },
                        name: { type: 'string', description: 'Full name', example: 'Dr. Jane Smith' },
                        email: { type: 'string', format: 'email', example: 'jane@example.com' },
                        role: { type: 'string', enum: ['student', 'specialist', 'admin'] },
                        avatar: { type: 'string', example: '👩‍⚕️' },
                        profession: { type: 'string', example: 'Psychologist' },
                        expertise: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['Anxiety']
                        },
                        verified: { type: 'boolean', example: true },
                        banned: { type: 'boolean', example: false },
                        _links: {
                            type: 'object',
                            description: 'HATEOAS Navigation Links',
                            example: {
                                self: { href: '/api/users/65a9f1b2c3d4e5f6g7h8i9j0', method: 'GET' },
                                questions: { href: '/api/questions?userId=65a9f1b2c3d4e5f6g7h8i9j0', method: 'GET' }
                            }
                        }
                    },
                },
                Question: {
                    type: 'object',
                    required: ['title', 'description'],
                    properties: {
                        id: { type: 'string', example: '65a9f1b2c3d4e5f6g7h8i9j0' },
                        userId: { type: 'string' },
                        title: { type: 'string', minLength: 10, example: 'How to manage exam stress?' },
                        description: { type: 'string', minLength: 20, example: 'I am feeling overwhelmed...' },
                        tags: { type: 'array', items: { type: 'string' }, example: ['mental-health'] },
                        views: { type: 'integer', example: 42 },
                        answerCount: { type: 'integer', example: 2 },
                        status: { type: 'string', enum: ['pending', 'answered', 'closed'] },
                        removed: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        _links: {
                            type: 'object',
                            description: 'HATEOAS Navigation Links',
                            example: {
                                self: { href: '/api/questions/65a9f1b2c3d4e5f6g7h8i9j0', method: 'GET' },
                                answers: { href: '/api/questions/65a9f1b2c3d4e5f6g7h8i9j0', method: 'GET' },
                                reply: { href: '/api/answers/65a9f1b2c3d4e5f6g7h8i9j0', method: 'POST' }
                            }
                        }
                    },
                },
                Answer: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        id: { type: 'string' },
                        questionId: { type: 'string' },
                        userId: { type: 'string' },
                        content: { type: 'string', minLength: 10, example: 'Try breaking down tasks...' },
                        upvotes: { type: 'integer', example: 5 },
                        isBest: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        _links: {
                            type: 'object',
                            description: 'HATEOAS Navigation Links',
                            example: {
                                upvote: { href: '/api/answers/abc12345/upvote', method: 'POST' },
                                markBest: { href: '/api/answers/abc12345/best', method: 'POST' }
                            }
                        }
                    },
                },
                Report: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        targetType: { type: 'string', enum: ['question', 'answer', 'user'] },
                        targetId: { type: 'string' },
                        reason: { type: 'string', description: 'Why this was reported' },
                        status: { type: 'string', enum: ['pending', 'dismissed', 'resolved'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    }
                }
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'User registration, login, and profile management' },
            { name: 'Questions', description: 'Main forum threads - Create, Read, Update, Delete' },
            { name: 'Answers', description: 'Responses to questions, upvoting, and best answer selection' },
            { name: 'Users', description: 'Public profiles and specialist directory' },
            { name: 'Moderation', description: 'Admin tools for content safety, reporting, and banning' },
            { name: 'Tags', description: 'Taxonomy for questions' },
            { name: 'Socket.IO', description: 'Real-time event documentation' },
        ],
        paths: {
            '/auth/signup': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a new user',
                    description: 'Creates a new account. Password is required. returns the created user and a JWT token.',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'password'],
                                    properties: {
                                        name: { type: 'string', example: 'John Doe' },
                                        email: { type: 'string', format: 'email', example: 'john@student.com' },
                                        password: { type: 'string', minLength: 6, example: 'securePassword123' },
                                        role: { type: 'string', enum: ['student', 'specialist'], default: 'student', description: 'Requested role' },
                                        avatar: { type: 'string', example: '👨‍⚕️', description: 'Optional avatar URL or emoji' },
                                        profession: { type: 'string', example: 'Psychologist', description: 'Required for specialists' },
                                        expertise: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            example: ['CBT', 'Anxiety'],
                                            description: 'Areas of expertise'
                                        }
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User created successfully. Returns token.' },
                        400: { description: 'Validation error (e.g. password too short)' },
                        409: { description: 'Email already exists' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    description: 'Authenticates a user and returns a JWT token used for subsequent requests.',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'john@student.com' },
                                        password: { type: 'string', example: 'securePassword123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: { type: 'string', description: 'JWT Bearer token' },
                                            user: { $ref: '#/components/schemas/User' }
                                        }
                                    }
                                }
                            }
                        },
                        401: { description: 'Invalid email or password' },
                    },
                },
            },
            '/auth/bulk-create': {
                post: {
                    tags: ['Auth'],
                    summary: 'Bulk create users (Admin only)',
                    description: "Allows admins to create up to 500 users at once. Passwords are auto-generated and returned in the response.\n\n**Requires 'Authorization: Bearer <token>' header with Admin role.**",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        users: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                required: ['name', 'email', 'role'],
                                                properties: {
                                                    name: { type: 'string' },
                                                    email: { type: 'string' },
                                                    role: { type: 'string', enum: ['student', 'specialist'] },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Users created. Response contains credentials for all created users.' },
                        401: { description: 'Unauthorized. Missing header.' },
                        403: { description: 'Forbidden. Admin access required.' },
                    },
                },
            },
            '/questions': {
                get: {
                    tags: ['Questions'],
                    summary: 'List questions',
                    description: 'Fetch a paginated list of questions. Supports filtering by tag, status, keyword search, or sorting options.',
                    parameters: [
                        { name: 'page', in: 'query', description: 'Page number (default 1)', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', description: 'Items per page (default 20, max 50)', schema: { type: 'integer', default: 20 } },
                        { name: 'tag', in: 'query', description: 'Filter by specific tag', schema: { type: 'string' } },
                        { name: 'status', in: 'query', description: 'Filter by status', schema: { type: 'string', enum: ['pending', 'answered'] } },
                        { name: 'sort', in: 'query', description: 'Sort order', schema: { type: 'string', enum: ['newest', 'oldest', 'popular', 'unanswered'] } },
                        { name: 'search', in: 'query', description: 'Full-text search on title and description', schema: { type: 'string' } },
                    ],
                    security: [],
                    responses: {
                        200: {
                            description: 'List of questions retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    page: { type: 'integer' },
                                                    limit: { type: 'integer' },
                                                    total: { type: 'integer' },
                                                    totalPages: { type: 'integer' }
                                                }
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Questions'],
                    summary: 'Create a new question',
                    description: "Post a new question. Content is auto-moderated for profanity.\n\n**Available to all logged-in users (Student, Specialist, Admin).**\nIf successful, emits `new_question` event via Socket.IO.",
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['title', 'description'],
                                    properties: {
                                        title: { type: 'string', description: 'Question title', minLength: 10 },
                                        description: { type: 'string', description: 'Question body', minLength: 20 },
                                        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' }
                                    }
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Question created successfully' },
                        400: { description: 'Validation failed or content blocked by moderation filter' },
                    },
                },
            },
            '/questions/{id}': {
                get: {
                    tags: ['Questions'],
                    summary: 'Get question details',
                    description: 'Retrieve a single question by ID, including its answers and author details. Increments view count.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Question ObjectId' }],
                    security: [],
                    responses: {
                        200: { description: 'Question details returned' },
                        404: { description: 'Question not found' },
                    },
                },
                put: {
                    tags: ['Questions'],
                    summary: 'Update question',
                    description: 'Update title, description, or tags. Only allowed for the author or admins.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Question' } } },
                    },
                    responses: {
                        200: { description: 'Updated successfully' },
                        403: { description: 'Forbidden. You are not the author.' },
                    },
                },
                delete: {
                    tags: ['Questions'],
                    summary: 'Delete question',
                    description: 'Soft-delete a question. Only allowed for the author or admins.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Deleted successfully (marked as removed)' },
                        403: { description: 'Forbidden.' },
                    },
                },
            },
            '/answers/{questionId}': {
                post: {
                    tags: ['Answers'],
                    summary: 'Post an answer',
                    description: "Add an answer to a specific question. Emits `new_answer` event via Socket.IO.\n\n**Restricted to Specialists and Admins.**",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'questionId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID of the question to answer' }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['content'],
                                    properties: { content: { type: 'string', minLength: 10, example: 'Here is the solution...' } },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Answer posted successfully' },
                        400: { description: 'Validation failed or content blocked' },
                        403: { description: 'Forbidden. Specialist role required.' },
                        404: { description: 'Question not found' },
                    },
                },
            },
            '/answers/{id}/upvote': {
                post: {
                    tags: ['Answers'],
                    summary: 'Toggle upvote',
                    description: 'Add or remove an upvote from an answer. Users cannot upvote multiple times (it toggles).',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Answer ID' }],
                    responses: { 200: { description: 'Upvote toggled (returns new status)' } },
                },
            },
            '/answers/{id}/best': {
                post: {
                    tags: ['Answers'],
                    summary: 'Mark as Best Answer',
                    description: 'Mark this answer as the accepted solution. only the ORIGINAL QUESTION AUTHOR can perform this action.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Marked as best answer' },
                        403: { description: 'Forbidden. Only the question author can do this.' }
                    },
                },
            },
            '/users/specialists': {
                get: {
                    tags: ['Users'],
                    summary: 'Get all specialists',
                    description: 'Returns a list of all users with the "specialist" role.',
                    security: [],
                    responses: {
                        200: {
                            description: 'List of specialists',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
                        },
                    },
                },
            },
            '/moderation/report': {
                post: {
                    tags: ['Moderation'],
                    summary: 'Report content',
                    description: 'Flag a question, answer, or user for admin review.',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['targetType', 'targetId', 'reason'],
                                    properties: {
                                        targetType: { type: 'string', enum: ['question', 'answer', 'user'] },
                                        targetId: { type: 'string', description: 'ID of the item being reported' },
                                        reason: { type: 'string', example: 'Harassment or Spam' },
                                        details: { type: 'string', example: 'This user is posting repetitive spam links.' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Report submitted successfully' } },
                },
            },
            '/moderation/reports': {
                get: {
                    tags: ['Moderation'],
                    summary: 'View reports (Admin only)',
                    description: "Get a list of user-submitted reports for review.\n\n**Requires 'Authorization: Bearer <token>' header with Admin role.**",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'status', in: 'query', schema: { type: 'string', default: 'pending', enum: ['pending', 'resolved', 'dismissed'] } }],
                    responses: {
                        200: { description: 'List of reports returned' },
                        401: { description: 'Unauthorized' },
                        403: { description: 'Admin access required' }
                    },
                },
            },
            '/moderation/blocked-words': {
                get: {
                    tags: ['Moderation'],
                    summary: 'Get blocked words',
                    description: 'Retrieve the list of words blocked by the moderation filter.',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of blocked words', content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } } } },
                },
                post: {
                    tags: ['Moderation'],
                    summary: 'Add blocked words',
                    description: 'Add new words to the blocklist. Updates take effect within 30 seconds.',
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { words: { type: 'array', items: { type: 'string' } } } } } } },
                    responses: { 201: { description: 'Words added' } },
                },
            },
            '/moderation/blocked-words/{word}': {
                delete: {
                    tags: ['Moderation'],
                    summary: 'Remove blocked word',
                    description: 'Remove a word from the blocklist.',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'word', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Word removed' } },
                },
            },
            '/tags': {
                get: {
                    tags: ['Tags'],
                    summary: 'Get all tags',
                    description: 'Get the list of available tags for questions.',
                    security: [],
                    responses: { 200: { description: 'List of tags' } },
                },
            },
        },
        'x-socketio-events': {
            summary: 'Real-time WebSocket Events',
            description: 'The server uses Socket.IO to push updates to connected clients. Primarily used for the Specialist Dashboard.',
            channels: {
                'join_specialist_room': {
                    publish: {
                        summary: 'Client -> Server: Join Specialist Room',
                        description: 'Subscribe to updates relevant for specialists (new questions/answers).',
                        example: 'socket.emit("join_specialist_room");'
                    },
                },
                'join_explore': {
                    publish: {
                        summary: 'Client -> Server: Join Explore Feed',
                        description: 'Subscribe to the public feed of new questions.',
                        example: 'socket.emit("join_explore");'
                    },
                },
                'new_question': {
                    subscribe: {
                        summary: 'Server -> Client: New Question',
                        description: 'Broadcasted to "specialists" and "explore_feed" rooms when a user posts a new question.',
                        message: { payload: { $ref: '#/components/schemas/Question' } },
                    },
                },
                'new_answer': {
                    subscribe: {
                        summary: 'Server -> Client: New Answer',
                        description: 'Broadcasted to "specialists" room when a user posts a new answer.',
                        message: { payload: { $ref: '#/components/schemas/Answer' } },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
