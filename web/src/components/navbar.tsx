import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { NavigationMenu } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Plus } from "lucide-react"



export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("flex items-center justify-between px-6 py-2 border-b", className)} role="banner">
      <NavigationMenu>
        <Link to="/">
          <h2 className="text-xl font-bold">SnippetBin</h2>
        </Link>
      </NavigationMenu>
      
      <div className="ml-auto flex items-center gap-3">
        <Button asChild size="sm" variant="default">
          <Link to="/" className="gap-2">
            <Plus className="h-4 w-4" />
            New Snippet
          </Link>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}


