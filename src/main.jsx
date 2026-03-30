import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import InvitePage from './InvitePage'
import RsvpPage from './RsvpPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/rsvp/:code" element={<RsvpPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
