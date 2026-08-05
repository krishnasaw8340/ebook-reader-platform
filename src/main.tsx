import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserProvider } from './contexts/UserContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>,
)
