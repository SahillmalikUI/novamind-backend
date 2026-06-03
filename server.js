const express = require('express')
const app     = express()
require('dotenv').config()

app.use(express.json())

// Routes
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const aiRoutes   = require('./routes/ai')

app.use('/auth',  authRoutes)
app.use('/tasks', taskRoutes)
app.use('/ai',    aiRoutes)

// ← Use Railway's PORT or 3000 locally
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})