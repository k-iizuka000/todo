const promptManager = require('../utils/prompt-manager');
const { fetch } = require('undici');

class SubtaskController {
    async generateSubtasks(req, res) {
        const { taskText } = req.body;

        // 入力値の検証
        if (!taskText || taskText.length > 1000) {
            return res.status(400).json({ 
                error: '無効な入力です。タスクは1000文字以内で入力してください。' 
            });
        }

        try {
            // プロンプトの取得
            const prompt = await promptManager.getPromptTemplate('subtask-generation', taskText);
            if (!prompt) {
                throw new Error('プロンプトの生成に失敗しました');
            }

            // Gemini APIの呼び出し
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API error:', errorData);
                throw new Error('Gemini APIからの応答に失敗しました');
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid API response format');
            }

            const subtasks = data.candidates[0].content.parts[0].text
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^- /, ''));

            if (subtasks.length === 0) {
                throw new Error('サブタスクを生成できませんでした');
            }

            // レスポンスの検証
            if (!await promptManager.validateResponse('subtask-generation', data.candidates[0].content.parts[0].text)) {
                throw new Error('生成されたサブタスクが無効です');
            }

            res.json({ subtasks });
        } catch (error) {
            console.error('Error generating subtasks:', error);
            res.status(500).json({ 
                error: 'サブタスクの生成に失敗しました。しばらく待ってから再度お試しください。',
                details: error.message
            });
        }
    }
}

module.exports = new SubtaskController(); 