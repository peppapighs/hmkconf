"use client"

import { initializeNotificationSystem } from "@/lib/notifications"
import { useEffect } from "react"

/**
 * Component to initialize the notification system on app startup
 * Requirement 1.1: When application starts, Sonner component SHALL be properly initialized and ready to display notifications
 */
export const NotificationSystemInitializer = () => {
  useEffect(() => {
    // Initialize notification system with error handling
    const initializeWithRetry = async () => {
      let attempts = 0
      const maxAttempts = 3
      const retryDelay = 1000

      while (attempts < maxAttempts) {
        try {
          const success = initializeNotificationSystem()
          if (success) {
            break
          }
        } catch (error) {
          console.error(
            `Notification system initialization attempt ${attempts + 1} failed:`,
            error,
          )
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      if (attempts === maxAttempts) {
        console.warn(
          "Notification system initialization failed after all attempts, using fallback mode",
        )
      }
    }

    initializeWithRetry()

    // Cleanup function to clear notifications on unmount
    return () => {
      try {
        // Import dynamically to avoid issues if module fails to load
        import("@/lib/notifications")
          .then(({ cleanupNotificationSystem }) => {
            cleanupNotificationSystem()
          })
          .catch((error) => {
            console.error("Failed to cleanup notification system:", error)
          })
      } catch (error) {
        console.error("Failed to import notification cleanup:", error)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
