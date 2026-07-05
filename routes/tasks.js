const express = require('express')
const router  = express.Router()
const pool    = require('../db')
const protect = require('../middleware/auth')

// Every task route is now protected AND scoped to the logged-in user
// (req.userId is set by the protect middleware).

// GET ALL → GET /tasks   (only this user's tasks)
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        )

        res.status(200).json({
            success: true,
            count:   result.rows.length,
            data:    result.rows
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// CREATE → POST /tasks
router.post('/', protect, async (req, res) => {
    try {
        const { title, done } = req.body

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            })
        }

        const result = await pool.query(
            'INSERT INTO tasks (title, done, user_id) VALUES ($1, $2, $3) RETURNING *',
            [title.trim(), done || false, req.userId]
        )

        res.status(201).json({
            success: true,
            message: 'Task created!',
            data:    result.rows[0]
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// UPDATE → PUT /tasks/:id
// Only updates fields that are actually sent. This prevents a "done"-only
// toggle from wiping the task title (which the old version did).
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, done } = req.body
        const { id }          = req.params

        const result = await pool.query(
            `UPDATE tasks
             SET title = COALESCE($1, title),
                 done  = COALESCE($2, done)
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [
                title !== undefined ? title : null,
                done  !== undefined ? done  : null,
                id,
                req.userId
            ]
        )

        // No row means the task doesn't exist OR isn't owned by this user
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Task updated!',
            data:    result.rows[0]
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// DELETE → DELETE /tasks/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

module.exports = router
