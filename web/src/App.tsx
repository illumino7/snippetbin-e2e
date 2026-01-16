import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/navbar'
import { ThemeProvider } from './components/theme-provider'
import { CreateSnippet } from './pages/CreateSnippet'
import { ViewSnippet } from './pages/ViewSnippet'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey='ui-theme'>
      <Navbar className="bg-background sticky top-0 z-50 w-full"/>
      <Routes>
        <Route path="/" element={<CreateSnippet />} />
        <Route path="/:shortCode" element={<ViewSnippet />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
