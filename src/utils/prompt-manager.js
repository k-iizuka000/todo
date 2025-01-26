import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PromptManager {
    constructor() {
        this.prompts = {};
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async loadPrompt(name) {
        if (this.prompts[name]) {
            return this.prompts[name];
        }

        try {
            const promptModule = await import(path.join(__dirname, '..', 'prompts', `${name}.js`));
            this.prompts[name] = promptModule;
            return promptModule;
        } catch (error) {
            console.error('Failed to load prompt:', error);
            throw new Error(`Failed to load prompt: ${name}`);
        }
    }

    async getPromptTemplate(name, params) {
        try {
            const prompt = await this.loadPrompt(name);
            if (typeof prompt.template !== 'function') {
                throw new Error(`Invalid prompt template for ${name}: template is not a function`);
            }
            return prompt.template(params);
        } catch (error) {
            console.error('Error getting prompt template:', error);
            throw error;
        }
    }

    async validateResponse(name, response) {
        try {
            const prompt = await this.loadPrompt(name);
            return prompt.validate ? prompt.validate(response) : true;
        } catch (error) {
            console.error('Error validating response:', error);
            return false;
        }
    }

    async generateSubtasks(title) {
        try {
            const prompt = await this.loadPrompt('subtask-generation');
            const template = await this.getPromptTemplate('subtask-generation', title);

            const model = this.genAI.getGenerativeModel({ 
                model: 'gemini-pro',
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ]
            });

            const result = await model.generateContent(template);
            
            if (result.response.promptFeedback?.blockReason) {
                console.error('Response blocked:', result.response.promptFeedback);
                throw new Error('不適切なコンテンツの可能性があるため、サブタスクを生成できませんでした');
            }

            const response = await result.response.text();

            // 応答から箇条書きの行を抽出して整形
            const subtasks = response.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('-'))
                .map(line => line.substring(1).trim())
                .filter(task => task.length > 0);

            // バリデーション
            if (subtasks.length === 0) {
                console.error('生成された応答:', response);
                throw new Error('有効なサブタスクが生成されませんでした');
            }

            if (subtasks.length < 3) {
                console.error('生成された応答:', response);
                throw new Error('必要な数のサブタスクが生成されませんでした');
            }

            // 重複チェック
            const uniqueSubtasks = [...new Set(subtasks)];
            if (uniqueSubtasks.length !== subtasks.length) {
                throw new Error('重複したサブタスクが含まれています');
            }

            return subtasks;
        } catch (error) {
            console.error('Error generating subtasks:', error);
            if (error.message.includes('GoogleGenerativeAI')) {
                throw new Error('AIモデルとの通信中にエラーが発生しました。しばらく待ってから再試行してください。');
            }
            throw new Error('サブタスク生成中にエラーが発生しました: ' + error.message);
        }
    }
} 