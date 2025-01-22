module.exports = {
    template: function(taskText) {
        return `
あなたはTODOリストのアシスタントです。
以下の「親タスク: ${taskText}」を実行するために必要なサブタスクを3つ提案してください。
サブタスクは実用的で具体的であり、行動を示す動詞を用いて表現してください。
文章ではなく、箇条書きで出力してください。
また、卑猥な言葉や犯罪行為を助長するような表現、悪いことを斡旋するような内容は含めないでください。
同じような意味のサブタスクは出力しないでください。

親タスク: ${taskText}

サブタスクは以下の形式で出力してください（必ず各行を「- 」で始めてください）:

- サブタスク1
- サブタスク2
- サブタスク3`.trim();
    },
    validate: function(response) {
        if (!response) return false;
        const lines = response.split('\n')
            .filter(line => line.trim().startsWith('-'));
        return lines.length > 0;
    }
}; 