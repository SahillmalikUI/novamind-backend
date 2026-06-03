const express   = require('express')
const app       = express()
require('dotenv').config()

app.use(express.json())

// Routes
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const aiRoutes = require('./routes/ai')

app.use('/auth',  authRoutes)
app.use('/tasks', taskRoutes)
app.use('/ai', aiRoutes)

app.listen(3000, () => {
    console.log('Server running on port 3000')
})