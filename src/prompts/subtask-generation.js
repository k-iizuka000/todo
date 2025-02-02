export const template = function(taskText) {
    return `
あなたはTODOリストのアシスタントです。
「親タスク: ${taskText}」を達成するために必要なサブタスクを3つ提案してください。

サブタスクは実用的で具体的であり、行動を示す動詞を用いて表現してください。タスクの目的も含めてください。
文章ではなく、箇条書きで出力してください。
卑猥な言葉や犯罪行為を助長するような表現、悪いことを斡旋するような内容は含めないでください。
同じような意味のサブタスクは出力しないでください。

サブタスクは以下の形式で出力してください（必ず各行を「- 」で始めてください）:

- サブタスク1
- サブタスク2
- サブタスク3`.trim();
};

export const validate = function(response) {
    if (!response) return false;
    
    // 改行で分割して空行を除去
    const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    // 有効な行が1つもない場合はfalse
    if (lines.length === 0) return false;
    
    // 各行が以下のいずれかの形式で始まっているかチェック
    const validLines = lines.filter(line => 
        line.startsWith('-') ||      // ハイフンで始まる
        line.startsWith('・') ||     // 中点で始まる
        /^\d+[.．、)]/.test(line) || // 数字+区切り文字で始まる
        line.startsWith('*')         // アスタリスクで始まる
    );
    
    // 少なくとも1つの有効な行があればtrue
    return validLines.length > 0;
}; 