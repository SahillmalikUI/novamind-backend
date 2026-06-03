const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const pool    = require('../db')

require('dotenv').config()

// SIGNUP → POST /auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body

        // Step 1: Validate
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            })
        }

        // Step 2: Check email already exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )
        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            })
        }

        // Step 3: Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Step 4: Save to database
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        )

        // Step 5: Create JWT token
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token:   token,
            user:    result.rows[0]
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// LOGIN → POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // Step 1: Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            })
        }

        // Step 2: Find user by email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        const user = result.rows[0]

        // Step 3: Compare password
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Step 4: Create JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token:   token,
            user: {
                id:    user.id,
                name:  user.name,
                email: user.email
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})
module.exports = router