const express = require('express')
const router  = express.Router()
const pool    = require('../db')
const protect = require('../middleware/auth')  // ← ADD THIS


router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC')
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
router.post('/', async (req, res) => {
    try {
        const { title, done } = req.body

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            })
        }

        const result = await pool.query(
            'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
            [title, done || false]
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
router.put('/:id', async (req, res) => {
    try {
        const { title, done } = req.body
        const { id }          = req.params

        const result = await pool.query(
            'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
            [title, done, id]
        )

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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [id]
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