const jwt = require('jsonwebtoken')
require('dotenv').config()

const protect = (req, res, next) => {
    try {
        // Step 1: Get token from header
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — no token'
            })
        }

        // Step 2: Extract token
        const token = authHeader.split(' ')[1]

        // Step 3: Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Step 4: Attach userId to request
        req.userId = decoded.userId

        // Step 5: Move to route
        next()

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized — invalid token'
        })
    }
}



module.exports = protect