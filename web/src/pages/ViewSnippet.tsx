import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { decrypt } from '@/lib/crypto'
import { isMarkdown } from '@/lib/languageMap'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Copy, Check, QrCode, X, Code, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnippetMetadata {
  presigned_url: string
}

interface DecryptedData {
  filename?: string
  title?: string // backwards compat
  code: string
  language: string
}

export function ViewSnippet({ setShowNewSnippet }: { setShowNewSnippet: (show: boolean) => void }) {
  const { shortCode } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [encryptionKey, setEncryptionKey] = useState('')
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null)
  const [decryptionError, setDecryptionError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview')

  // Derive display name and markdown status
  const displayName = decryptedData?.filename || decryptedData?.title || 'Untitled'
  const isMd = decryptedData ? isMarkdown(decryptedData.filename || '') : false

  // Control navbar button visibility - only show when successfully decrypted
  useEffect(() => {
    setShowNewSnippet(decryptedData !== null && !decryptionError)
  }, [decryptedData, decryptionError, setShowNewSnippet])

  // Extract encryption key from URL fragment
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setEncryptionKey(hash)
    } else {
      setDecryptionError(true)
    }
  }, [])

  // Fetch snippet metadata
  const { data: metadata, isLoading, isError } = useQuery<SnippetMetadata>({
    queryKey: ['snippet', shortCode],
    queryFn: async () => {
      const response = await fetch(`/api/snippets/${shortCode}`)
      if (!response.ok) {
        if (response.status === 410) {
          throw new Error('Snippet has expired')
        }
        throw new Error('Snippet not found')
      }
      return response.json()
    },
    enabled: !!shortCode,
    staleTime: 14 * 60 * 1000,
  })

  // Download and decrypt snippet when metadata is available
  useEffect(() => {
    if (!metadata || !encryptionKey) return

    const downloadAndDecrypt = async () => {
      try {
        const response = await fetch(metadata.presigned_url)
        if (!response.ok) throw new Error('Failed to download snippet')
        const encryptedData = await response.text()

        const decryptedString = await decrypt(encryptedData, encryptionKey)
        
        if (!decryptedString) {
          setDecryptionError(true)
          return
        }

        const parsedData: DecryptedData = JSON.parse(decryptedString)
        setDecryptedData(parsedData)
      } catch (error) {
        console.error('Decryption error:', error)
        setDecryptionError(true)
      }
    }

    downloadAndDecrypt()
  }, [metadata, encryptionKey])

  const handleCopy = async () => {
    if (!decryptedData) return
    await navigator.clipboard.writeText(decryptedData.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getFullUrl = () => window.location.href

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading snippet...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-bold">Snippet Not Found</h1>
          <p className="text-muted-foreground">This snippet may have expired or never existed.</p>
          <Button onClick={() => navigate('/')}>Create New Snippet</Button>
        </div>
      </div>
    )
  }

  if (decryptionError || !encryptionKey) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-bold">Decryption Failed</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Unable to decrypt this snippet. The encryption key may be missing or incorrect.
            Make sure you're using the complete URL that was provided when the snippet was created.
          </p>
          <Button onClick={() => navigate('/')}>Create New Snippet</Button>
        </div>
      </div>
    )
  }

  if (!decryptedData) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Decrypting snippet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="space-y-4">
        {/* Content Card */}
        <div className="rounded-lg border overflow-hidden">
          {/* Tab Header */}
          <div className="flex items-center justify-between border-b bg-muted/30">
            <div className="flex items-center gap-0">
              {/* Filename */}
              <div className="px-4 py-2.5 border-r">
                <span className="text-sm font-medium">{displayName}</span>
              </div>

              {/* Tabs for markdown files */}
              {isMd && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                      activeTab === 'code'
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code className="h-4 w-4" />
                    Code
                  </button>
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
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 px-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(true)}
                className="gap-1.5 h-8"
              >
                <QrCode className="h-3.5 w-3.5" />
                QR
              </Button>
            </div>
          </div>

          {/* Content */}
          {isMd && activeTab === 'preview' ? (
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {decryptedData.code}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <SyntaxHighlighter
              language={decryptedData.language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                fontSize: '0.875rem',
                borderRadius: 0,
              }}
              showLineNumbers
            >
              {decryptedData.code}
            </SyntaxHighlighter>
          )}
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
            <div className="bg-background border rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Share Snippet</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowQR(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={getFullUrl()}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code to open the snippet on your mobile device
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
