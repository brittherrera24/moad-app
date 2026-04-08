import { Heart } from 'lucide-react'

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--surface-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Heart size={48} color="var(--color-bright-lavender)" fill="var(--color-bright-lavender)" />
      <h1 style={{ 
        fontFamily: 'var(--font-sans)',
        fontSize: '28px', 
        fontWeight: 800,
        color: 'var(--text-primary)'
      }}>
        Welcome, Brittani!
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
        MOAD is loading up 💜
      </p>
    </div>
  )
}

export default App