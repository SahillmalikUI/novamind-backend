const router  = require('express').Router()
const Groq    = require('groq-sdk')
const protect = require('../middleware/auth')
require('dotenv').config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

router.post('/suggest', protect, async (req, res) => {
    try {
        const { goal } = req.body

        if (!goal) {
            return res.status(400).json({
                success: false,
                message: 'Goal is required'
            })
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role:    'user',
                    content: `You are a productivity assistant.
The user wants to achieve: "${goal}".
Generate exactly 4 specific actionable tasks.
Return ONLY a JSON array of strings.
No explanation. No markdown. No extra text.
Example: ["task1", "task2", "task3", "task4"]`
                }
            ],
            model: 'llama-3.3-70b-versatile'
        })

        const text    = completion.choices[0].message.content
        const cleaned = text.replace(/```json|```/g, '').trim()
        const tasks   = JSON.parse(cleaned)

        res.status(200).json({
            success:     true,
            suggestions: tasks
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

module.exports = router