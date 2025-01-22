const path = require('path');

class PromptManager {
    constructor() {
        this.prompts = {};
    }

    async loadPrompt(name) {
        if (this.prompts[name]) {
            return this.prompts[name];
        }

        try {
            const promptModule = require(path.join(__dirname, '..', 'prompts', `${name}.js`));
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
}

module.exports = new PromptManager(); 