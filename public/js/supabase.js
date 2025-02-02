// Supabaseクライアントの初期化
const supabaseUrl = 'https://fccrvtqhxqarllbirysg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3J2dHFoeHFhcmxsYmlyeXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNzEwNzksImV4cCI6MjA1MzY0NzA3OX0.-ZHnfyxo0o8cjBSdI9xxctQzKDAp7ipvk0X-By3Wi4k';

// デバッグモード設定
const DEBUG_MODE = true;

console.log('Supabase初期化を開始します');

// グローバルなsupabaseClientオブジェクトを作成
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
window.supabaseClient = supabaseClient;

// 初期化フラグとセッション
let isInitialized = false;
let currentSession = null;

// 現在のページがログイン関連ページかどうかを確認
function isAuthPage() {
    const authPages = ['login.html', 'register.html', 'reset-password.html'];
    const currentPath = window.location.pathname.split('/').pop() || '';
    return authPages.includes(currentPath);
}

// セッションの初期化と監視を行う関数
async function initializeAuth() {
    // 既に初期化済みで有効なセッションがある場合
    if (isInitialized && currentSession) {
        return currentSession;
    }

    try {
        console.log('認証状態を確認中...');

        // 既存のセッションを取得
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            throw sessionError;
        }

        // セッション状態を更新
        currentSession = session;
        const isAuth = isAuthPage();
        const currentPath = window.location.pathname.split('/').pop() || '';
        
        console.log('認証状態:', {
            hasSession: !!session,
            isAuthPage: isAuth,
            currentPath: currentPath
        });

        // セッションがある場合の処理
        if (session) {
            if (isAuth) {
                // 認証済みで認証ページにいる場合はタスクページへ
                console.log('認証済みユーザーをタスクページへリダイレクト');
                window.location.replace('/gemini-todo.html');
                return null;
            }
        } 
        // セッションがない場合の処理
        else {
            if (currentPath === 'gemini-todo.html') {
                // 未認証でタスクページにいる場合はログインページへ
                console.log('未認証ユーザーをログインページへリダイレクト');
                window.location.replace('/login.html');
                return null;
            }
        }

        // 初期化完了
        isInitialized = true;
        return session;
    } catch (error) {
        console.error('認証初期化エラー:', error);
        isInitialized = false;
        currentSession = null;
        return null;
    }
}

// 認証状態の変更を監視
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('認証状態変更:', event);
    currentSession = session;

    // ログアウト時の処理
    if (event === 'SIGNED_OUT') {
        isInitialized = false;
        if (!isAuthPage()) {
            window.location.replace('/login.html');
        }
    }
    // ログイン時の処理
    else if (event === 'SIGNED_IN' && isAuthPage()) {
        window.location.replace('/gemini-todo.html');
    }
});

// ページ読み込み完了時に認証初期化を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('ページ読み込み完了');
        initializeAuth();
    });
} else {
    console.log('ページ既に読み込み済み');
    initializeAuth();
} 
