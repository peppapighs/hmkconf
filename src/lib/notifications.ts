import { toast, type ExternalToast } from "sonner"

/**
 * Notification types supported by the system
 */
export type NotificationType = "success" | "error" | "info"

/**
 * Error types for notification system
 */
export enum NotificationError {
  SONNER_NOT_AVAILABLE = "SONNER_NOT_AVAILABLE",
  INVALID_MESSAGE = "INVALID_MESSAGE",
  RENDER_ERROR = "RENDER_ERROR",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
}

/**
 * Maximum number of concurrent notifications to prevent memory issues
 */
const MAX_CONCURRENT_NOTIFICATIONS = 10

/**
 * Track active notifications for memory management
 */
let activeNotificationCount = 0

/**
 * Debounce map to prevent duplicate notifications
 */
const notificationDebounceMap = new Map<string, number>()

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 300

/**
 * Memory cleanup interval in milliseconds
 */
const CLEANUP_INTERVAL = 30000 // 30 seconds

/**
 * Periodic cleanup of debounce map to prevent memory leaks
 */
let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Start memory cleanup interval
 */
const startCleanupInterval = () => {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamp] of notificationDebounceMap.entries()) {
      if (now - timestamp > DEBOUNCE_DELAY * 2) {
        notificationDebounceMap.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Stop memory cleanup interval
 */
const stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

/**
 * Basic notification options for simple usage
 */
export interface BasicNotificationOptions {
  duration?: number
  description?: string
}

/**
 * Extended notification options with additional configuration
 */
export interface NotificationOptions extends Omit<ExternalToast, "id"> {
  message: string
  type: NotificationType
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Configuration for the Sonner toaster
 */
export interface SonnerConfig {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  theme?: "light" | "dark" | "system"
  duration?: number
  dismissible?: boolean
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Pick<SonnerConfig, "duration" | "dismissible">> =
  {
    duration: 4000,
    dismissible: true,
  }

/**
 * Check if Sonner is available and functional
 */
const isSonnerAvailable = (): boolean => {
  try {
    return typeof toast === "function" && typeof toast.success === "function"
  } catch {
    return false
  }
}

/**
 * Fallback notification function when Sonner is not available
 */
const fallbackNotification = (
  type: NotificationType,
  message: string,
): void => {
  try {
    // Ensure message is a valid string
    const safeMessage = typeof message === "string" ? message : String(message)
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${safeMessage}`

    switch (type) {
      case "error":
        console.error(logMessage)
        break
      case "success":
        console.log(logMessage)
        break
      case "info":
      default:
        console.info(logMessage)
        break
    }
  } catch (error) {
    // Ultimate fallback - just log the error without throwing
    console.error("Fallback notification failed:", error)
  }
}

/**
 * Check if we can show more notifications (memory management)
 */
const canShowNotification = (): boolean => {
  return activeNotificationCount < MAX_CONCURRENT_NOTIFICATIONS
}

/**
 * Check if notification should be debounced
 */
const shouldDebounceNotification = (
  type: NotificationType,
  message: string,
): boolean => {
  const key = `${type}:${message}`
  const now = Date.now()
  const lastShown = notificationDebounceMap.get(key)

  if (lastShown && now - lastShown < DEBOUNCE_DELAY) {
    return true
  }

  notificationDebounceMap.set(key, now)
  return false
}

/**
 * Sanitize message to prevent XSS and ensure valid content
 */
const sanitizeMessage = (message: string): string => {
  try {
    if (typeof message !== "string") {
      throw new Error(NotificationError.INVALID_MESSAGE)
    }

    // Remove HTML tags and limit length
    const sanitized = message
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .trim()
      .slice(0, 500) // Limit message length

    if (sanitized.length === 0) {
      throw new Error(NotificationError.INVALID_MESSAGE)
    }

    return sanitized
  } catch (error) {
    // If sanitization fails, return a safe default message
    console.warn("Message sanitization failed:", error)
    return "Invalid message content"
  }
}

/**
 * Display a success notification with success theme styling
 * Requirement 2.1: When displaying success notification, system SHALL display success themed toast
 * @param message - The message to display
 * @param options - Optional basic configuration for the notification
 */
export const showSuccess = (
  message: string,
  options?: BasicNotificationOptions,
) => {
  try {
    // Validate and sanitize input
    const sanitizedMessage = sanitizeMessage(message)

    // Check for debouncing
    if (shouldDebounceNotification("success", sanitizedMessage)) {
      return null
    }

    // Check if Sonner is available
    if (!isSonnerAvailable()) {
      fallbackNotification("success", sanitizedMessage)
      return null
    }

    // Check memory limits
    if (!canShowNotification()) {
      console.warn(
        "Maximum concurrent notifications reached, skipping notification",
      )
      return null
    }

    // Start cleanup interval if not already running
    startCleanupInterval()

    // Increment counter and set up cleanup
    activeNotificationCount++

    const toastId = toast.success(sanitizedMessage, {
      duration: options?.duration ?? DEFAULT_CONFIG.duration,
      dismissible: DEFAULT_CONFIG.dismissible,
      description: options?.description,
      onDismiss: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
      onAutoClose: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
    })

    return toastId
  } catch (error) {
    console.error("Failed to show success notification:", error)
    try {
      const safeMessage = typeof message === "string" && message.trim() 
        ? message.slice(0, 100) // Limit length for safety
        : "Success notification"
      fallbackNotification("success", safeMessage)
    } catch (fallbackError) {
      console.error("Fallback notification also failed:", fallbackError)
    }
    return null
  }
}

/**
 * Display an error notification with error theme styling
 * Requirement 2.2: When displaying error notification, system SHALL display error themed toast
 * @param message - The message to display
 * @param options - Optional basic configuration for the notification
 */
export const showError = (
  message: string,
  options?: BasicNotificationOptions,
) => {
  try {
    // Validate and sanitize input
    const sanitizedMessage = sanitizeMessage(message)

    // Check for debouncing (errors are less aggressively debounced)
    if (shouldDebounceNotification("error", sanitizedMessage)) {
      return null
    }

    // Check if Sonner is available
    if (!isSonnerAvailable()) {
      fallbackNotification("error", sanitizedMessage)
      return null
    }

    // Check memory limits
    if (!canShowNotification()) {
      console.warn(
        "Maximum concurrent notifications reached, skipping notification",
      )
      return null
    }

    // Start cleanup interval if not already running
    startCleanupInterval()

    // Increment counter and set up cleanup
    activeNotificationCount++

    const toastId = toast.error(sanitizedMessage, {
      duration: options?.duration ?? DEFAULT_CONFIG.duration,
      dismissible: DEFAULT_CONFIG.dismissible,
      description: options?.description,
      onDismiss: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
      onAutoClose: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
    })

    return toastId
  } catch (error) {
    console.error("Failed to show error notification:", error)
    try {
      const safeMessage = typeof message === "string" && message.trim() 
        ? message.slice(0, 100) // Limit length for safety
        : "Error notification"
      fallbackNotification("error", safeMessage)
    } catch (fallbackError) {
      console.error("Fallback notification also failed:", fallbackError)
    }
    return null
  }
}

/**
 * Display an info notification with default theme styling
 * Requirement 2.3: When displaying info notification, system SHALL display default themed toast
 * @param message - The message to display
 * @param options - Optional basic configuration for the notification
 */
export const showInfo = (
  message: string,
  options?: BasicNotificationOptions,
) => {
  try {
    // Validate and sanitize input
    const sanitizedMessage = sanitizeMessage(message)

    // Check for debouncing
    if (shouldDebounceNotification("info", sanitizedMessage)) {
      return null
    }

    // Check if Sonner is available
    if (!isSonnerAvailable()) {
      fallbackNotification("info", sanitizedMessage)
      return null
    }

    // Check memory limits
    if (!canShowNotification()) {
      console.warn(
        "Maximum concurrent notifications reached, skipping notification",
      )
      return null
    }

    // Start cleanup interval if not already running
    startCleanupInterval()

    // Increment counter and set up cleanup
    activeNotificationCount++

    const toastId = toast(sanitizedMessage, {
      duration: options?.duration ?? DEFAULT_CONFIG.duration,
      dismissible: DEFAULT_CONFIG.dismissible,
      description: options?.description,
      onDismiss: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
      onAutoClose: () => {
        activeNotificationCount = Math.max(0, activeNotificationCount - 1)
      },
    })

    return toastId
  } catch (error) {
    console.error("Failed to show info notification:", error)
    try {
      const safeMessage = typeof message === "string" && message.trim() 
        ? message.slice(0, 100) // Limit length for safety
        : "Info notification"
      fallbackNotification("info", safeMessage)
    } catch (fallbackError) {
      console.error("Fallback notification also failed:", fallbackError)
    }
    return null
  }
}

/**
 * Notification service object with all notification methods
 * Provides a consistent API for displaying notifications
 */
export const notifications = {
  success: showSuccess,
  error: showError,
  info: showInfo,
} as const

/**
 * Generic notification function that accepts type and message with basic options
 * @param type - The type of notification
 * @param message - The message to display
 * @param options - Optional basic configuration for the notification
 */
export const showNotification = (
  type: NotificationType,
  message: string,
  options?: BasicNotificationOptions,
) => {
  switch (type) {
    case "success":
      return showSuccess(message, options)
    case "error":
      return showError(message, options)
    case "info":
      return showInfo(message, options)
    default:
      return showInfo(message, options)
  }
}

/**
 * Utility function to validate notification message
 * @param message - The message to validate
 * @returns boolean indicating if message is valid
 */
export const isValidMessage = (message: unknown): message is string => {
  return typeof message === "string" && message.trim().length > 0
}

/**
 * Safe notification wrapper that validates input
 * @param type - The type of notification
 * @param message - The message to display
 * @param options - Optional basic configuration for the notification
 */
export const safeShowNotification = (
  type: NotificationType,
  message: unknown,
  options?: BasicNotificationOptions,
) => {
  try {
    if (!isValidMessage(message)) {
      console.warn("Invalid notification message provided:", message)
      // Use a safe fallback message instead of the invalid input
      fallbackNotification("error", "Invalid notification message")
      return null
    }

    return showNotification(type, message, options)
  } catch (error) {
    console.error("Safe notification failed:", error)
    // Ultimate fallback
    try {
      fallbackNotification("error", "Notification system error")
    } catch (fallbackError) {
      console.error("Fallback notification also failed:", fallbackError)
    }
    return null
  }
}

/**
 * Clear all active notifications and reset counter
 * Useful for cleanup and memory management
 */
export const clearAllNotifications = (): void => {
  try {
    if (isSonnerAvailable() && typeof toast.dismiss === "function") {
      toast.dismiss()
    }
  } catch (error) {
    console.error("Failed to clear notifications:", error)
  } finally {
    activeNotificationCount = 0
    notificationDebounceMap.clear()
    stopCleanupInterval()
  }
}

/**
 * Get current notification system status
 */
export const getNotificationSystemStatus = () => {
  return {
    sonnerAvailable: isSonnerAvailable(),
    activeNotifications: activeNotificationCount,
    maxNotifications: MAX_CONCURRENT_NOTIFICATIONS,
    canShowMore: canShowNotification(),
  }
}

/**
 * Initialize notification system with error boundary
 * Should be called once during app initialization
 */
export const initializeNotificationSystem = (): boolean => {
  try {
    // Test if Sonner is working
    if (!isSonnerAvailable()) {
      console.warn("Sonner notification system not available, using fallback")
      return false
    }

    // Reset counters and cleanup
    activeNotificationCount = 0
    notificationDebounceMap.clear()
    startCleanupInterval()

    console.log("Notification system initialized successfully")
    return true
  } catch (error) {
    console.error("Failed to initialize notification system:", error)
    return false
  }
}

/**
 * Cleanup notification system resources
 * Should be called when the app is being destroyed
 */
export const cleanupNotificationSystem = (): void => {
  try {
    clearAllNotifications()
    stopCleanupInterval()
    console.log("Notification system cleaned up successfully")
  } catch (error) {
    console.error("Failed to cleanup notification system:", error)
  }
}

// Default export for convenience
export default notifications
