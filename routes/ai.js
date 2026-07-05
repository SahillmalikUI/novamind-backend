const router  = require('express').Router()
const Groq    = require('groq-sdk')
const protect = require('../middleware/auth')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

// ---------------------------------------------------------------------------
// Helper: safely parse a JSON object out of a model response.
// Groq's json_object mode returns clean JSON, but we still guard against
// stray markdown fences or leading/trailing prose just in case.
// ---------------------------------------------------------------------------
function safeJson(raw) {
    if (!raw) return null
    let text = raw.trim()

    // Strip ```json ... ``` fences if present
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    // Fall back to the first {...} block
    const start = text.indexOf('{')
    const end   = text.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
        text = text.slice(start, end + 1)
    }

    try {
        return JSON.parse(text)
    } catch (e) {
        return null
    }
}

// ===========================================================================
// CHAT  →  POST /ai/chat
// ===========================================================================
router.post('/chat', protect, async (req, res) => {
    try {
        const { message } = req.body

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            })
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are NovaMind, a helpful AI learning and productivity assistant.
Keep answers clear, friendly, and useful.
If the user asks about coding, explain step by step.
If the user asks about productivity, give practical advice.`
                },
                { role: 'user', content: message }
            ],
            model: MODEL,
        })

        const reply =
            completion.choices?.[0]?.message?.content ||
            'Sorry, I could not generate a response.'

        res.status(200).json({ success: true, reply })

    } catch (error) {
        console.error('AI chat error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// ===========================================================================
// SUGGEST TASKS  →  POST /ai/suggest
// Body: { goal }
// Returns: { success, suggestions: [ "task", ... ] }
// ===========================================================================
router.post('/suggest', protect, async (req, res) => {
    try {
        const { goal } = req.body

        if (!goal || !goal.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A goal is required'
            })
        }

        const completion = await groq.chat.completions.create({
            model: MODEL,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are NovaMind, a productivity assistant that breaks a goal into
concrete, actionable to-do items. Return ONLY JSON in the exact shape:
{ "suggestions": ["short actionable task", ...] }
Rules:
- Between 4 and 7 tasks.
- Each task is a short imperative phrase (max ~10 words).
- No numbering, no extra keys, no commentary.`
                },
                { role: 'user', content: `Goal: ${goal.trim()}` }
            ],
        })

        const parsed = safeJson(completion.choices?.[0]?.message?.content)
        let suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : []

        suggestions = suggestions
            .filter((s) => typeof s === 'string' && s.trim())
            .map((s) => s.trim())
            .slice(0, 7)

        if (suggestions.length === 0) {
            return res.status(502).json({
                success: false,
                message: 'Could not generate suggestions. Please try again.'
            })
        }

        res.status(200).json({ success: true, suggestions })

    } catch (error) {
        console.error('AI suggest error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// ===========================================================================
// STUDY PLAN  →  POST /ai/study-plan
// Body: { topic, level, time }
// Returns: { success, plan: "markdown-ish text" }
// ===========================================================================
router.post('/study-plan', protect, async (req, res) => {
    try {
        const { topic, level, time } = req.body

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A topic is required'
            })
        }

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are NovaMind, an expert study coach. Produce a clear, motivating
study plan the learner can follow immediately.
Format as clean, readable plain text:
- A one-line intro.
- Day/week sections with short bullet lines using "-".
- End with one short encouragement line.
Do not use markdown headers with #. Keep it concise and practical.`
                },
                {
                    role: 'user',
                    content: `Create a study plan.
Topic: ${topic.trim()}
Level: ${level || 'Beginner'}
Time available: ${time || '1 week'}`
                }
            ],
        })

        const plan =
            completion.choices?.[0]?.message?.content?.trim() ||
            'Could not generate a study plan. Please try again.'

        res.status(200).json({ success: true, plan })

    } catch (error) {
        console.error('AI study-plan error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// ===========================================================================
// QUIZ  →  POST /ai/quiz
// Body: { topic, count, difficulty }
// Returns: { success, questions: [
//   { question, options: [4], correctIndex, explanation }
// ] }
// ===========================================================================
router.post('/quiz', protect, async (req, res) => {
    try {
        const { topic, count, difficulty } = req.body

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                success: false,
                message: 'A topic is required'
            })
        }

        const n = Math.min(Math.max(parseInt(count, 10) || 5, 3), 10)

        const completion = await groq.chat.completions.create({
            model: MODEL,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are NovaMind, a quiz generator. Return ONLY JSON in the exact shape:
{ "questions": [
  { "question": "...",
    "options": ["...","...","...","..."],
    "correctIndex": 0,
    "explanation": "one short sentence" }
] }
Rules:
- Exactly 4 options per question.
- correctIndex is a 0-based integer (0-3) pointing to the correct option.
- Questions must be factually correct and unambiguous.
- No extra keys, no commentary.`
                },
                {
                    role: 'user',
                    content: `Generate ${n} multiple-choice questions.
Topic: ${topic.trim()}
Difficulty: ${difficulty || 'Medium'}`
                }
            ],
        })

        const parsed = safeJson(completion.choices?.[0]?.message?.content)
        let questions = Array.isArray(parsed?.questions) ? parsed.questions : []

        // Validate & normalise each question
        questions = questions
            .filter((q) =>
                q &&
                typeof q.question === 'string' &&
                Array.isArray(q.options) &&
                q.options.length === 4
            )
            .map((q) => {
                let idx = parseInt(q.correctIndex, 10)
                if (isNaN(idx) || idx < 0 || idx > 3) idx = 0
                return {
                    question: q.question.trim(),
                    options: q.options.map((o) => String(o).trim()),
                    correctIndex: idx,
                    explanation: typeof q.explanation === 'string'
                        ? q.explanation.trim()
                        : ''
                }
            })
            .slice(0, n)

        if (questions.length === 0) {
            return res.status(502).json({
                success: false,
                message: 'Could not generate a quiz. Please try again.'
            })
        }

        res.status(200).json({ success: true, questions })

    } catch (error) {
        console.error('AI quiz error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// ===========================================================================
// SUMMARIZE  →  POST /ai/summarize
// Body: { text, style }   style: 'Brief' | 'Bullets' | 'Simple'
// Returns: { success, summary: "..." }
// ===========================================================================
router.post('/summarize', protect, async (req, res) => {
    try {
        const { text, style } = req.body

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Text to summarize is required'
            })
        }

        if (text.trim().length < 40) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a bit more text to summarize'
            })
        }

        let instruction
        switch (style) {
            case 'Bullets':
                instruction = 'Summarize as 4-6 short bullet lines, each starting with "-".'
                break
            case 'Simple':
                instruction = 'Summarize in plain, simple language a beginner would understand, in 2-4 short sentences.'
                break
            default: // Brief
                instruction = 'Summarize concisely in 2-3 clear sentences.'
        }

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are NovaMind, a summarizer. Capture the key points faithfully.
${instruction}
Do not add information that is not in the source text.`
                },
                { role: 'user', content: text.trim() }
            ],
        })

        const summary =
            completion.choices?.[0]?.message?.content?.trim() ||
            'Could not generate a summary. Please try again.'

        res.status(200).json({ success: true, summary })

    } catch (error) {
        console.error('AI summarize error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
