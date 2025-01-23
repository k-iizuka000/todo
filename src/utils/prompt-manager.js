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

    async generateSubtasks(title, description = '') {
        try {
            const prompt = await this.loadPrompt('subtask-generation');
            const template = await this.getPromptTemplate('subtask-generation', title);

            const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(template);
            const response = await result.response.text();

            if (!prompt.validate(response)) {
                throw new Error('生成されたサブタスクが無効です');
            }

            // 応答から箇条書きの行を抽出
            const subtasks = response.split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().substring(2).trim());

            return subtasks;
        } catch (error) {
            console.error('Error generating subtasks:', error);
            throw new Error('サブタスク生成中にエラーが発生しました: ' + error.message);
        }
    }
} 