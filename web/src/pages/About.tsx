import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock, Eye, EyeOff, Key, Shield, Github } from 'lucide-react'

export function About() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-2">About SnippetBin</h1>
      <p className="text-muted-foreground mb-8">
        A zero-knowledge, end-to-end encrypted pastebin
      </p>

      {/* How It Works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          How It Works
        </h2>
        <div className="grid gap-4">
          <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
            <div className="p-2 rounded-full bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">256-bit AES-GCM Encryption</h3>
              <p className="text-sm text-muted-foreground">
                Your content is encrypted in your browser using AES in Galois Counter Mode before being sent anywhere.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
            <div className="p-2 rounded-full bg-primary/10">
              <EyeOff className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Zero Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                The server never sees your content. Only encrypted data is stored.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Key in URL Fragment</h3>
              <p className="text-sm text-muted-foreground">
                The decryption key is in the URL after the #. It's never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Guide */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Quick Guide
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Paste or type your content</li>
          <li>Choose syntax highlighting (optional)</li>
          <li>Click "Create Snippet"</li>
          <li>Share the full URL including the # part or share the QR Code</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground border-l-2 border-primary pl-4">
          <strong className="text-foreground">Important:</strong> If you lose the URL, your content cannot be recovered. We don't have the key!
        </p>
      </section>

      {/* Open Source */}
      <section className="text-center py-6 border-t">
        <p className="text-muted-foreground mb-4">
          SnippetBin is open source
        </p>
        <Button variant="outline" asChild>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="gap-2">
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </Button>
      </section>
    </div>
  )
}
