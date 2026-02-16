const express = require('express');
const { getDB } = require('../config/database');
const { cacheSet, cacheDel } = require('../config/redis');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ──────────────── GET /api/moderation/blocked-words ────────────────
router.get('/blocked-words', authenticate, authorize('admin'), async (req, res) => {
    try {
        const db = getDB();
        const words = await db.collection('blocked_words')
            .find({})
            .sort({ word: 1 })
            .toArray();

        res.json(words.map(w => w.word));
    } catch (err) {
        console.error('Get blocked words error:', err);
        res.status(500).json({ error: 'Failed to fetch blocked words.' });
    }
});

// ──────────────── POST /api/moderation/blocked-words ────────────────
router.post('/blocked-words', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { words } = req.body;

        if (!Array.isArray(words) || words.length === 0) {
            return res.status(400).json({ error: 'Provide an array of words.' });
        }

        const db = getDB();
        const operations = words.map(word => ({
            updateOne: {
                filter: { word: word.toLowerCase().trim() },
                update: { $setOnInsert: { word: word.toLowerCase().trim(), addedAt: new Date(), addedBy: req.user._id.toString() } },
                upsert: true
            }
        }));

        await db.collection('blocked_words').bulkWrite(operations);

        // Invalidate cache so middleware refreshes immediately on next check (after 30s debounce or tweak debounce)
        // Ideally we should force refresh, but the debounce prevents it. 
        // We will clear the REDIS cache, so other instances will pick it up.
        await cacheDel('blocked_words');

        res.status(201).json({ message: 'Blocked words updated successfully.' });
    } catch (err) {
        console.error('Add blocked words error:', err);
        res.status(500).json({ error: 'Failed to add blocked words.' });
    }
});

// ──────────────── DELETE /api/moderation/blocked-words/:word ────────────────
router.delete('/blocked-words/:word', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { word } = req.params;
        const db = getDB();

        await db.collection('blocked_words').deleteOne({ word: word.toLowerCase().trim() });
        await cacheDel('blocked_words');

        res.json({ message: 'Blocked word removed.' });
    } catch (err) {
        console.error('Remove blocked word error:', err);
        res.status(500).json({ error: 'Failed to remove blocked word.' });
    }
});

// ──────────────── GET /api/moderation/reports ────────────────
// (Existing reports route - moving here if not already or keeping in server.js?)
// Reports route was defined in Swagger but handled where? 
// It seems I missed implementing the routes for Reports! 
// I will add them here.

router.post('/report', authenticate, async (req, res) => {
    try {
        const { targetType, targetId, reason, details } = req.body;

        if (!['question', 'answer', 'user'].includes(targetType)) {
            return res.status(400).json({ error: 'Invalid target type.' });
        }

        const db = getDB();
        const report = {
            reporterId: req.user._id.toString(),
            targetType,
            targetId,
            reason,
            details,
            status: 'pending',
            createdAt: new Date(),
        };

        await db.collection('reports').insertOne(report);
        res.status(201).json({ message: 'Report submitted successfully.' });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ error: 'Failed to submit report.' });
    }
});

router.get('/reports', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const db = getDB();

        const reports = await db.collection('reports')
            .find({ status })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(reports);
    } catch (err) {
        console.error('Get reports error:', err);
        res.status(500).json({ error: 'Failed to fetch reports.' });
    }
});

// ──────────────── PATCH /api/moderation/reports/:id ────────────────
router.patch('/reports/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['resolved', 'dismissed', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const { ObjectId } = require('mongodb');
        let reportId;
        try {
            reportId = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: 'Invalid report ID.' });
        }

        const db = getDB();
        const result = await db.collection('reports').updateOne(
            { _id: reportId },
            {
                $set: {
                    status,
                    resolvedAt: new Date(),
                    resolvedBy: req.user._id.toString()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Report not found.' });
        }

        res.json({ message: `Report marked as ${status}.` });
    } catch (err) {
        console.error('Update report status error:', err);
        res.status(500).json({ error: 'Failed to update report status.' });
    }
});

module.exports = router;
