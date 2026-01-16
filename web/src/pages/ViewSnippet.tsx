import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CryptoJS from 'crypto-js'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Copy, Check, QrCode, X } from 'lucide-react'

interface SnippetMetadata {
  presigned_url: string
}

interface DecryptedData {
  title?: string
  code: string
  language: string
}

export function ViewSnippet() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const navigate = useNavigate()
  const [encryptionKey, setEncryptionKey] = useState('')
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null)
  const [decryptionError, setDecryptionError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Extract encryption key from URL fragment
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the '#'
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
    staleTime: 14 * 60 * 1000, // 14 minutes
  })

  // Download and decrypt snippet when metadata is available
  useEffect(() => {
    if (!metadata || !encryptionKey) return

    const downloadAndDecrypt = async () => {
      try {
        // Download encrypted blob from S3
        const response = await fetch(metadata.presigned_url)
        if (!response.ok) throw new Error('Failed to download snippet')
        const encryptedData = await response.text()

        // Decrypt the data
        const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8)
        
        if (!decrypted) {
          setDecryptionError(true)
          return
        }

        const parsedData: DecryptedData = JSON.parse(decrypted)
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

  const getFullUrl = () => {
    return window.location.href // Includes the fragment (#key)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading snippet...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
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
      <div className="container mx-auto max-w-6xl p-6">
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
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Decrypting snippet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {decryptedData.title && (
              <h1 className="text-3xl font-bold mb-2">{decryptedData.title}</h1>
            )}
            <p className="text-sm text-muted-foreground">
              Language: {decryptedData.language}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(true)}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>
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

        {/* Code Display */}
        <div className="rounded-md overflow-hidden border">
          <SyntaxHighlighter
            language={decryptedData.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              fontSize: '0.875rem',
            }}
            showLineNumbers
          >
            {decryptedData.code}
          </SyntaxHighlighter>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => navigate('/')} variant="default">
            Create New Snippet
          </Button>
        </div>
      </div>
    </div>
  )
}
