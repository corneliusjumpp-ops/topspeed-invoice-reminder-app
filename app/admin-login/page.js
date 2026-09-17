'use client'

import { useState } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Login failed.')
        setLoading(false)
        return
      }

      window.location.href = '/'
    } catch {
      setMessage('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7f9',
        padding: '24px'
      }}
    >
      <form
        onSubmit={login}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
        }}
      >
        <h1 style={{ marginTop: 0 }}>
          TopSpeed Admin
        </h1>

        <p>Enter your password to access the invoice dashboard.</p>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Admin password"
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px',
            marginTop: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '18px',
            padding: '14px',
            border: 0,
            borderRadius: '8px',
            background: '#075b73',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {message && (
          <p style={{ color: 'crimson', marginTop: '16px' }}>
            {message}
          </p>
        )}
      </form>
    </main>
  )
}
