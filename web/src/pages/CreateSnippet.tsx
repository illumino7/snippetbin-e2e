import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CryptoJS from 'crypto-js'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
]

const EXPIRATIONS = [
  { value: '10min', label: '10 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: '1y', label: '1 Year' },
]

interface PresignedResponse {
  id: string
  presigned_url: string
}

interface CreateSnippetResponse {
  short_code: string
  id: string
}

export function CreateSnippet() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [expiration, setExpiration] = useState('1d')
  const [showPreview, setShowPreview] = useState(true)

  const createSnippetMutation = useMutation({
    mutationFn: async () => {
      // 1. Generate encryption key
      const encryptionKey = CryptoJS.lib.WordArray.random(32).toString()
      
      // 2. Prepare data to encrypt
      const dataToEncrypt = JSON.stringify({
        title,
        code,
        language,
      })
      
      // 3. Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, encryptionKey).toString()
      
      // 4. Fetch presigned URL
      const presignedRes = await fetch('/api/snippets/presigned')
      if (!presignedRes.ok) throw new Error('Failed to get presigned URL')
      const presignedData: PresignedResponse = await presignedRes.json()
      
      // 5. Upload encrypted blob to S3
      const uploadRes = await fetch(presignedData.presigned_url, {
        method: 'PUT',
        body: encrypted,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
      if (!uploadRes.ok) throw new Error('Failed to upload to S3')
      
      // 6. Create snippet record
      const createRes = await fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: presignedData.id,
          expires: expiration,
        }),
      })
      if (!createRes.ok) throw new Error('Failed to create snippet')
      const createData: CreateSnippetResponse = await createRes.json()
      
      return { shortCode: createData.short_code, encryptionKey }
    },
    onSuccess: ({ shortCode, encryptionKey }) => {
      // Navigate to view page with encryption key in URL fragment
      navigate(`/${shortCode}#${encryptionKey}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    createSnippetMutation.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // Handle Tab key - insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
      return
    }
    
    // Handle Enter key - smart auto-indentation
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Get current line
      const beforeCursor = code.substring(0, start)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
      const currentLine = beforeCursor.substring(currentLineStart)
      
      // Calculate current indentation
      const indentMatch = currentLine.match(/^(\s*)/)
      const currentIndent = indentMatch ? indentMatch[1] : ''
      
      // Determine if we need extra indentation
      let extraIndent = ''
      const trimmedLine = currentLine.trim()
      
      // Python: indent after colon (def, if, for, while, class, etc.)
      if (language === 'python' && trimmedLine.endsWith(':')) {
        extraIndent = '  '
      }
      // Bracket-based languages: indent after opening bracket
      else if (['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php'].includes(language)) {
        if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
          extraIndent = '  '
        }
      }
      
      const newValue = code.substring(0, start) + '\n' + currentIndent + extraIndent + code.substring(end)
      setCode(newValue)
      
      setTimeout(() => {
        const newCursorPos = start + 1 + currentIndent.length + extraIndent.length
        textarea.selectionStart = textarea.selectionEnd = newCursorPos
      }, 0)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Snippet</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            placeholder="My awesome code snippet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Language and Expiration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Syntax Highlighting</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration</Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATIONS.map((exp) => (
                  <SelectItem key={exp.value} value={exp.value}>
                    {exp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Code Editor with Side-by-Side Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="code">New Snippet</Label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
          
          <div className={`grid gap-4 ${showPreview ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            <Textarea
              id="code"
              placeholder="Paste your code here... (Press Tab to indent)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono min-h-[500px] resize-y"
              required
            />
            
            {showPreview && code && (
              <div className="rounded-md overflow-hidden border min-h-[500px]">
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    height: '100%',
                  }}
                  showLineNumbers
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={createSnippetMutation.isPending || !code.trim()}
          className="w-full md:w-auto"
        >
          {createSnippetMutation.isPending ? 'Creating...' : 'Create Snippet'}
        </Button>

        {createSnippetMutation.isError && (
          <p className="text-sm text-destructive">
            Failed to create snippet. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}
