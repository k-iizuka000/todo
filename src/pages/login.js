import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../components/auth/AuthContext'

export default function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">読み込み中...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="login-success">
        <h1>ログイン済み</h1>
        <p>ようこそ、{user.email}さん！</p>
      </div>
    )
  }

  return (
    <div className="login-page">
      <h1>ToDoアプリ</h1>
      <LoginForm />

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background-color: #f9fafb;
        }

        h1 {
          color: #111827;
          margin-bottom: 2rem;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f9fafb;
        }

        .loading-spinner {
          color: #4f46e5;
          font-size: 1.125rem;
        }

        .login-success {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f9fafb;
        }

        .login-success h1 {
          color: #059669;
          margin-bottom: 1rem;
        }

        .login-success p {
          color: #374151;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  )
} 