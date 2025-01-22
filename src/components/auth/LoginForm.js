import React from 'react'
import { useAuth } from './AuthContext'

export const LoginForm = () => {
  const { signInWithGoogle, loading, error } = useAuth()

  const handleGoogleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('ログインエラー:', error.message)
    }
  }

  return (
    <div className="login-container">
      <h2>ログイン</h2>
      {error && <div className="error-message">{error}</div>}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="google-login-button"
      >
        {loading ? 'ログイン中...' : 'Googleでログイン'}
      </button>

      <style jsx>{`
        .login-container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-message {
          color: #dc2626;
          background-color: #fee2e2;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .google-login-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .google-login-button:hover {
          background-color: #3367d6;
        }

        .google-login-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}