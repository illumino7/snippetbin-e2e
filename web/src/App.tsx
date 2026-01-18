import { Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './components/navbar'
import { ThemeProvider } from './components/theme-provider'
import { CreateSnippet } from './pages/CreateSnippet'
import { ViewSnippet } from './pages/ViewSnippet'
import { useState, useEffect } from 'react'

function App() {
  const location = useLocation()
  const [showNewSnippet, setShowNewSnippet] = useState(false)
  
  // Reset button visibility when navigating to home
  useEffect(() => {
    if (location.pathname === '/') {
      setShowNewSnippet(false)
    }
  }, [location.pathname])
  
  return (
    <ThemeProvider defaultTheme="dark" storageKey='ui-theme'>
      <Navbar className="bg-background sticky top-0 z-50 w-full" showNewSnippet={showNewSnippet} />
      <Routes>
        <Route path="/" element={<CreateSnippet />} />
        <Route path="/:shortCode" element={<ViewSnippet setShowNewSnippet={setShowNewSnippet} />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
