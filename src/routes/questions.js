// ─── Question Routes ──────────────────────────────────────────────
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { moderateContent, cleanText } = require('../middleware/moderation');

const router = express.Router();

// ──────────────── Helper: Anonymize Question ────────────────
function anonymizeQuestion(question, viewer) {
    if (!question || !question.user) return question;

    // Reveal identity if viewer is Admin or the Author
    const isAuthor = viewer && viewer._id.toString() === question.userId.toString();
    const isAdmin = viewer && viewer.role === 'admin';

    if (isAuthor || isAdmin) {
        return question;
    }

    // Mask identity for everyone else
    return {
        ...question,
        user: {
            ...question.user,
            id: null,
            name: 'Anonymous Student', // Or just 'Anonymous'
            avatar: null, // Hide avatar
            verified: false // Hide verification badge if it reveals identity?
        }
    };
}

// ──────────────── GET /api/questions ────────────────
// List all questions with filters, search, pagination
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            tag,
            status,
            search,
            sort = 'newest',
            userId,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        let result;

        // Build cache key
        const cacheKey = `questions:${JSON.stringify({ page, limit, tag, status, search, sort, userId })}`;
        const cached = await cacheGet(cacheKey);

        if (cached) {
            result = cached;
        } else {
            const db = getDB();
            const filter = { removed: { $ne: true } };

            // Filters
            if (tag) filter.tags = tag;
            if (status) filter.status = status;
            if (userId) filter.userId = userId;
            if (search) {
                filter.$text = { $search: search };
            }

            // Sort
            let sortObj = { createdAt: -1 };
            if (sort === 'oldest') sortObj = { createdAt: 1 };
            if (sort === 'popular') sortObj = { views: -1 };
            if (sort === 'unanswered') {
                filter.status = 'pending';
                sortObj = { createdAt: -1 };
            }

            const [questions, total] = await Promise.all([
                db.collection('questions')
                    .find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNum)
                    .toArray(),
                db.collection('questions').countDocuments(filter),
            ]);

            // Populate user info for each question
            const userIds = [...new Set(questions.map(q => q.userId))];
            const users = await db.collection('users')
                .find(
                    {
                        _id: {
                            $in: userIds.map(id => {
                                try { return new ObjectId(id); } catch { return id; }
                            })
                        }
                    },
                    { projection: { password: 0 } }
                )
                .toArray();

            const userMap = {};
            users.forEach(u => { userMap[u._id.toString()] = u; });

            const enrichedQuestions = questions.map(q => ({
                ...q,
                id: q._id.toString(),
                user: userMap[q.userId] || null,
                answerCount: q.answerCount || 0,
            }));

            result = {
                questions: enrichedQuestions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            };

            await cacheSet(cacheKey, result, 60); // Cache real data
        }

        // Apply Anonymity on the fly based on current viewer
        const cleanQuestions = result.questions.map(q => anonymizeQuestion(q, req.user));

        res.json({
            ...result,
            questions: cleanQuestions
        });

    } catch (err) {
        console.error('Get questions error:', err);
        res.status(500).json({ error: 'Failed to fetch questions.' });
    }
});

// ──────────────── GET /api/questions/:id ────────────────
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        let questionId;
        try {
            questionId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid question ID.' });
        }

        const cacheKey = `question:${id}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
            // Increment view count in background
            const db = getDB();
            db.collection('questions').updateOne({ _id: questionId }, { $inc: { views: 1 } }).catch(() => { });
            return res.json(anonymizeQuestion(cached, req.user));
        }

        const db = getDB();

        // Increment views
        await db.collection('questions').updateOne(
            { _id: questionId },
            { $inc: { views: 1 } }
        );

        const question = await db.collection('questions').findOne({ _id: questionId, removed: { $ne: true } });

        if (!question) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        // Get answers
        const answers = await db.collection('answers')
            .find({ questionId: id, removed: { $ne: true } })
            .sort({ isBest: -1, upvotes: -1, createdAt: 1 })
            .toArray();

        // Get all user info
        const allUserIds = [question.userId, ...answers.map(a => a.userId)];
        const uniqueUserIds = [...new Set(allUserIds)];
        const users = await db.collection('users')
            .find(
                {
                    _id: {
                        $in: uniqueUserIds.map(uid => {
                            try { return new ObjectId(uid); } catch { return uid; }
                        })
                    }
                },
                { projection: { password: 0 } }
            )
            .toArray();

        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const result = {
            ...question,
            id: question._id.toString(),
            user: userMap[question.userId] || null,
            answers: answers.map(a => ({
                ...a,
                id: a._id.toString(),
                user: userMap[a.userId] || null,
            })),
        };

        await cacheSet(cacheKey, result, 120); // Cache real data

        // Anonymize before sending
        res.json(anonymizeQuestion(result, req.user));
    } catch (err) {
        console.error('Get question error:', err);
        res.status(500).json({ error: 'Failed to fetch question.' });
    }
});

// ──────────────── POST /api/questions ────────────────
router.post('/', authenticate, moderateContent(['title', 'description']), async (req, res) => {
    try {
        const { title, description, tags } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        if (title.length < 10) {
            return res.status(400).json({ error: 'Title must be at least 10 characters.' });
        }

        if (description.length < 20) {
            return res.status(400).json({ error: 'Description must be at least 20 characters.' });
        }

        const db = getDB();

        const newQuestion = {
            userId: req.user._id.toString(),
            title: cleanText(title.trim()),
            description: cleanText(description.trim()),
            tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
            views: 0,
            answerCount: 0,
            status: 'pending',
            removed: false,
            moderationWarnings: req.moderationWarnings || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('questions').insertOne(newQuestion);
        newQuestion._id = result.insertedId;
        newQuestion.id = result.insertedId.toString();

        // Enrich with user data for real-time feed
        const questionWithUser = {
            ...newQuestion,
            user: {
                id: req.user._id,
                name: req.user.name,
                avatar: req.user.avatar,
                role: req.user.role,
                verified: req.user.verified
            }
        };

        // Invalidate caches
        await cacheDel('questions:*');

        // Emit real-time event
        if (req.io) {
            // Emits REAL data to specialists (context needed)
            req.io.to('specialists').emit('new_question', questionWithUser);

            // Emits ANONYMIZED data to explore feed (public)
            const anonQuestion = anonymizeQuestion(questionWithUser, null);
            req.io.to('explore_feed').emit('new_question', anonQuestion);
        }

        res.status(201).json({
            message: 'Question posted successfully!',
            question: questionWithUser,
            warnings: req.moderationWarnings || [],
        });
    } catch (err) {
        console.error('Create question error:', err);
        res.status(500).json({ error: 'Failed to post question.' });
    }
});

// ──────────────── PUT /api/questions/:id ────────────────
router.put('/:id', authenticate, moderateContent(['title', 'description']), async (req, res) => {
    try {
        const { id } = req.params;
        let questionId;
        try {
            questionId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid question ID.' });
        }

        const db = getDB();
        const question = await db.collection('questions').findOne({ _id: questionId });

        if (!question) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        // Only the author or admin can edit
        if (question.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only edit your own questions.' });
        }

        const updates = {};
        if (req.body.title) updates.title = cleanText(req.body.title.trim());
        if (req.body.description) updates.description = cleanText(req.body.description.trim());
        if (req.body.tags) updates.tags = req.body.tags.slice(0, 5);
        updates.updatedAt = new Date();

        await db.collection('questions').updateOne({ _id: questionId }, { $set: updates });

        // Invalidate caches
        await cacheDel(`question:${id}`);
        await cacheDel('questions:*');

        res.json({ message: 'Question updated successfully.' });
    } catch (err) {
        console.error('Update question error:', err);
        res.status(500).json({ error: 'Failed to update question.' });
    }
});

// ──────────────── DELETE /api/questions/:id ────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let questionId;
        try {
            questionId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid question ID.' });
        }

        const db = getDB();
        const question = await db.collection('questions').findOne({ _id: questionId });

        if (!question) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        // Only the author or admin can delete
        if (question.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own questions.' });
        }

        // Soft delete
        await db.collection('questions').updateOne(
            { _id: questionId },
            { $set: { removed: true, removedAt: new Date(), removedBy: req.user._id.toString() } }
        );

        // Invalidate caches
        await cacheDel(`question:${id}`);
        await cacheDel('questions:*');

        res.json({ message: 'Question deleted successfully.' });
    } catch (err) {
        console.error('Delete question error:', err);
        res.status(500).json({ error: 'Failed to delete question.' });
    }
});

module.exports = router;
