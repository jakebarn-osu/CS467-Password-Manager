import { useEffect, useState } from 'react'
import type { User } from '@app/shared'
import './App.css'

function App() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<User[]>
      })
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <section id="center">
      <h1>Users</h1>
      {error && <p role="alert">Error: {error}</p>}
      {!error && !users && <p>Loading...</p>}
      {users && (
        <ul>
          {users.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default App
