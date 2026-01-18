import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { NavigationMenu } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { useState } from "react"


export function Navbar({ className, showNewSnippet = false }: { className?: string; showNewSnippet?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <header className={cn("flex items-center justify-between px-6 py-2 border-b", className)} role="banner">
      <NavigationMenu>
        <Link to="/">
          <h2 className="text-xl font-bold">SnippetBin</h2>
        </Link>
      </NavigationMenu>
      
      <div className="ml-auto flex items-center gap-3">
        {showNewSnippet && (
          <Button 
            asChild 
            size="sm" 
            variant="default"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="transition-all duration-200 overflow-hidden"
            style={{ width: isHovered ? '140px' : '36px' }}
          >
            <Link to="/" className="gap-2 flex items-center justify-center">
              {/* Show only + when not hovered */}
              <span className={cn(
                "text-lg font-semibold shrink-0 transition-opacity duration-200",
                isHovered ? "opacity-0 absolute pointer-events-none" : "opacity-100"
              )}>
                +
              </span>
              {/* Show + New Snippet when hovered */}
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-200 flex items-center gap-2",
                isHovered ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              )}>
                {/* <span className="text-lg font-semibold"></span> */}
                New Snippet
              </span>
            </Link>
          </Button>
        )}
        <ModeToggle />
      </div>
    </header>
  )
}
