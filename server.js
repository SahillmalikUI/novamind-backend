const express = require('express')
const app     = express()

// Only load dotenv locally — not on Railway
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

app.use(express.json())

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const aiRoutes   = require('./routes/ai')

app.use('/auth',  authRoutes)
app.use('/tasks', taskRoutes)
app.use('/ai',    aiRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})