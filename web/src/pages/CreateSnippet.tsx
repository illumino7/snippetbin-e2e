import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateKey, encrypt } from '@/lib/crypto'
import { getLanguageFromFilename, isMarkdown } from '@/lib/languageMap'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Code, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [filename, setFilename] = useState('')
  const [code, setCode] = useState('')
  const [expiration, setExpiration] = useState('1d')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  const language = getLanguageFromFilename(filename)
  const showPreviewTab = isMarkdown(filename)

  const createSnippetMutation = useMutation({
    mutationFn: async () => {
      // 1. Generate 256-bit encryption key
      const encryptionKey = await generateKey()
      
      // 2. Prepare data to encrypt
      const dataToEncrypt = JSON.stringify({
        filename,
        code,
        language,
      })
      
      // 3. Encrypt using AES-256-GCM
      const encrypted = await encrypt(dataToEncrypt, encryptionKey)
      
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
      navigate(`/${shortCode}#${encryptionKey}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !filename.trim()) return
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
      
      const beforeCursor = code.substring(0, start)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
      const currentLine = beforeCursor.substring(currentLineStart)
      
      const indentMatch = currentLine.match(/^(\s*)/)
      const currentIndent = indentMatch ? indentMatch[1] : ''
      
      let extraIndent = ''
      const trimmedLine = currentLine.trim()
      
      if (language === 'python' && trimmedLine.endsWith(':')) {
        extraIndent = '  '
      } else if (['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php'].includes(language)) {
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
    <div className="container mx-auto max-w-5xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Editor Card */}
        <div className="rounded-lg border overflow-hidden">
          {/* Tab Header */}
          <div className="flex items-center gap-0 border-b bg-muted/30">
            {/* Filename Input */}
            <div className="px-3 py-2 border-r">
              <Input
                placeholder="Filename with extension"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-8 w-64 text-sm border-0 bg-background focus-visible:ring-1"
                required
              />
            </div>
            
            {/* Tabs */}
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'edit'
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Code className="h-4 w-4" />
              Edit new file
            </button>
            
            {showPreviewTab && (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'preview'
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
          </div>

          {/* Editor / Preview Content */}
          {activeTab === 'edit' ? (
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter or paste content here..."
                className="w-full min-h-[500px] p-4 font-mono text-sm bg-background resize-y outline-none"
                required
              />
            </div>
          ) : (
            <div className="min-h-[500px] p-6">
              {code ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {code}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nothing to preview</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Expiration + Submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Expires in:</span>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="bg-background">
                {EXPIRATIONS.map((exp) => (
                  <SelectItem key={exp.value} value={exp.value}>
                    {exp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            {createSnippetMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to create snippet.
              </p>
            )}
            <Button
              type="submit"
              disabled={createSnippetMutation.isPending || !code.trim() || !filename.trim()}
            >
              {createSnippetMutation.isPending ? 'Creating...' : 'Create Snippet'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
