"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Error boundary component for Sonner toaster
 */
const ToasterErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (
        error.message?.includes("sonner") ||
        error.message?.includes("toast")
      ) {
        console.error("Sonner error caught:", error)
        setHasError(true)
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    console.warn(
      "Sonner toaster failed to render, notifications will use fallback",
    )
    return null
  }

  return <>{children}</>
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render on server to prevent hydration issues
  if (!isClient) {
    return null
  }

  try {
    return (
      <ToasterErrorBoundary>
        <Sonner
          theme={theme as ToasterProps["theme"]}
          className="toaster group" // eslint-disable-line tailwindcss/no-custom-classname
          position="bottom-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              description: "group-[.toast]:text-muted-foreground",
              actionButton:
                "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
              cancelButton:
                "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
          }}
          {...props}
        />
      </ToasterErrorBoundary>
    )
  } catch (error) {
    console.error("Failed to render Sonner toaster:", error)
    return null
  }
}

export { Toaster }
