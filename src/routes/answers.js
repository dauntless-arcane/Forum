// ─── Answer Routes ────────────────────────────────────────────────
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { cacheDel } = require('../config/redis');
const { authenticate, authorize } = require('../middleware/auth');
const { moderateContent, cleanText } = require('../middleware/moderation');

const router = express.Router();

// ──────────────── POST /api/answers/:questionId ────────────────
router.post('/:questionId', authenticate, authorize('specialist', 'admin'), moderateContent(['content']), async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content } = req.body;

        if (!content || content.length < 10) {
            return res.status(400).json({ error: 'Answer must be at least 10 characters.' });
        }

        let qId;
        try {
            qId = new ObjectId(questionId);
        } catch {
            return res.status(400).json({ error: 'Invalid question ID.' });
        }

        const db = getDB();

        // Verify question exists
        const question = await db.collection('questions').findOne({ _id: qId, removed: { $ne: true } });
        if (!question) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        const newAnswer = {
            questionId,
            userId: req.user._id.toString(),
            content: cleanText(content.trim()),
            upvotes: 0,
            upvotedBy: [],
            isBest: false,
            removed: false,
            moderationWarnings: req.moderationWarnings || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('answers').insertOne(newAnswer);
        newAnswer._id = result.insertedId;
        newAnswer.id = result.insertedId.toString();

        // Update question answer count and status
        const answerCount = await db.collection('answers').countDocuments({
            questionId,
            removed: { $ne: true },
        });

        await db.collection('questions').updateOne(
            { _id: qId },
            {
                $set: {
                    status: 'answered',
                    answerCount,
                    updatedAt: new Date(),
                },
            }
        );

        // Invalidate caches
        await cacheDel(`question:${questionId}`);
        await cacheDel('questions:*');

        // Emit real-time event
        if (req.io) req.io.to('specialists').emit('new_answer', { ...newAnswer, user: req.user });

        res.status(201).json({
            message: 'Answer posted successfully!',
            answer: { ...newAnswer, user: req.user },
            warnings: req.moderationWarnings || [],
        });
    } catch (err) {
        console.error('Create answer error:', err);
        res.status(500).json({ error: 'Failed to post answer.' });
    }
});

// ──────────────── PUT /api/answers/:id ────────────────
router.put('/:id', authenticate, moderateContent(['content']), async (req, res) => {
    try {
        const { id } = req.params;
        let answerId;
        try {
            answerId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid answer ID.' });
        }

        const db = getDB();
        const answer = await db.collection('answers').findOne({ _id: answerId });

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found.' });
        }

        if (answer.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only edit your own answers.' });
        }

        const updates = {};
        if (req.body.content) updates.content = cleanText(req.body.content.trim());
        updates.updatedAt = new Date();

        await db.collection('answers').updateOne({ _id: answerId }, { $set: updates });

        await cacheDel(`question:${answer.questionId}`);

        res.json({ message: 'Answer updated successfully.' });
    } catch (err) {
        console.error('Update answer error:', err);
        res.status(500).json({ error: 'Failed to update answer.' });
    }
});

// ──────────────── DELETE /api/answers/:id ────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let answerId;
        try {
            answerId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid answer ID.' });
        }

        const db = getDB();
        const answer = await db.collection('answers').findOne({ _id: answerId });

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found.' });
        }

        if (answer.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own answers.' });
        }

        // Soft delete
        await db.collection('answers').updateOne(
            { _id: answerId },
            { $set: { removed: true, removedAt: new Date(), removedBy: req.user._id.toString() } }
        );

        // Update question answer count
        const answerCount = await db.collection('answers').countDocuments({
            questionId: answer.questionId,
            removed: { $ne: true },
        });

        let questionId;
        try {
            questionId = new ObjectId(answer.questionId);
        } catch {
            questionId = answer.questionId;
        }

        await db.collection('questions').updateOne(
            { _id: questionId },
            {
                $set: {
                    answerCount,
                    status: answerCount > 0 ? 'answered' : 'pending',
                    updatedAt: new Date(),
                },
            }
        );

        await cacheDel(`question:${answer.questionId}`);
        await cacheDel('questions:*');

        res.json({ message: 'Answer deleted successfully.' });
    } catch (err) {
        console.error('Delete answer error:', err);
        res.status(500).json({ error: 'Failed to delete answer.' });
    }
});

// ──────────────── POST /api/answers/:id/upvote ────────────────
router.post('/:id/upvote', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let answerId;
        try {
            answerId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid answer ID.' });
        }

        const db = getDB();
        const answer = await db.collection('answers').findOne({ _id: answerId });

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found.' });
        }

        const userId = req.user._id.toString();
        const upvotedBy = answer.upvotedBy || [];

        if (upvotedBy.includes(userId)) {
            // Remove upvote (toggle)
            await db.collection('answers').updateOne(
                { _id: answerId },
                {
                    $pull: { upvotedBy: userId },
                    $inc: { upvotes: -1 },
                }
            );
            await cacheDel(`question:${answer.questionId}`);
            return res.json({ message: 'Upvote removed.', upvoted: false });
        }

        // Add upvote
        await db.collection('answers').updateOne(
            { _id: answerId },
            {
                $push: { upvotedBy: userId },
                $inc: { upvotes: 1 },
            }
        );

        await cacheDel(`question:${answer.questionId}`);
        res.json({ message: 'Upvoted!', upvoted: true });
    } catch (err) {
        console.error('Upvote error:', err);
        res.status(500).json({ error: 'Failed to upvote.' });
    }
});

// ──────────────── POST /api/answers/:id/best ────────────────
// Mark answer as best (only question author can do this)
router.post('/:id/best', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        let answerId;
        try {
            answerId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid answer ID.' });
        }

        const db = getDB();
        const answer = await db.collection('answers').findOne({ _id: answerId });

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found.' });
        }

        // Verify the requester owns the question
        let questionId;
        try {
            questionId = new ObjectId(answer.questionId);
        } catch {
            questionId = answer.questionId;
        }

        const question = await db.collection('questions').findOne({ _id: questionId });

        if (!question) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        if (question.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the question author can mark the best answer.' });
        }

        // Unmark all current best answers for this question
        await db.collection('answers').updateMany(
            { questionId: answer.questionId },
            { $set: { isBest: false } }
        );

        // Mark this one as best
        await db.collection('answers').updateOne(
            { _id: answerId },
            { $set: { isBest: true } }
        );

        await cacheDel(`question:${answer.questionId}`);

        res.json({ message: 'Answer marked as best!' });
    } catch (err) {
        console.error('Mark best error:', err);
        res.status(500).json({ error: 'Failed to mark best answer.' });
    }
});

module.exports = router;
