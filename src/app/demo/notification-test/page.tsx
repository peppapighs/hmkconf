"use client"

import { Button } from "@/components/ui/button"
import {
  clearAllNotifications,
  getNotificationSystemStatus,
  notifications,
  safeShowNotification,
  showNotification,
} from "@/lib/notifications"
import { useState } from "react"

export default function NotificationTestPage() {
  const [testResults, setTestResults] = useState<{
    success: boolean
    error: boolean
    info: boolean
    autoDelete: boolean
    errorHandling: boolean
    performance: boolean
  }>({
    success: false,
    error: false,
    info: false,
    autoDelete: false,
    errorHandling: false,
    performance: false,
  })

  const [systemStatus, setSystemStatus] = useState<{
    sonnerAvailable: boolean
    activeNotifications: number
    maxNotifications: number
    canShowMore: boolean
  } | null>(null)

  const handleSuccessTest = () => {
    notifications.success("Success notification test")
    setTestResults((prev) => ({ ...prev, success: true }))
  }

  const handleErrorTest = () => {
    notifications.error("Error notification test")
    setTestResults((prev) => ({ ...prev, error: true }))
  }

  const handleInfoTest = () => {
    notifications.info("Info notification test")
    setTestResults((prev) => ({ ...prev, info: true }))
  }

  const handleAutoDeleteTest = () => {
    notifications.info("This notification will auto-delete in 3 seconds", {
      duration: 3000,
    })
    setTestResults((prev) => ({ ...prev, autoDelete: true }))

    // 3秒後にテスト結果をリセット（視覚的確認のため）
    setTimeout(() => {
      console.log("Auto-delete test completed")
    }, 3000)
  }

  const handleMultipleNotifications = () => {
    notifications.success("Notification 1: Success")
    setTimeout(() => notifications.error("Notification 2: Error"), 500)
    setTimeout(() => notifications.info("Notification 3: Info"), 1000)
  }

  const handleGenericFunction = () => {
    showNotification("success", "Success notification using generic function")
  }

  const handleErrorHandlingTest = () => {
    // Test invalid message handling
    safeShowNotification("success", null)
    safeShowNotification("error", "")
    safeShowNotification("info", 123 as unknown)

    // Test XSS prevention
    notifications.success("<script>alert('xss')</script>Test message")

    setTestResults((prev) => ({ ...prev, errorHandling: true }))
  }

  const handlePerformanceTest = () => {
    // Test rapid notifications (should be debounced)
    for (let i = 0; i < 5; i++) {
      notifications.info("Rapid notification test")
    }

    // Test many different notifications (should respect limits)
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        notifications.info(`Performance test notification ${i + 1}`)
      }, i * 100)
    }

    setTestResults((prev) => ({ ...prev, performance: true }))
  }

  const handleSystemStatusCheck = () => {
    const status = getNotificationSystemStatus()
    setSystemStatus(status)
    console.log("Notification system status:", status)
  }

  const handleClearAll = () => {
    clearAllNotifications()
  }

  const resetTests = () => {
    setTestResults({
      success: false,
      error: false,
      info: false,
      autoDelete: false,
      errorHandling: false,
      performance: false,
    })
    setSystemStatus(null)
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Notification System Test Page</h1>

      <div className="space-y-8">
        {/* Basic notification tests */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Basic Notification Type Tests
          </h2>
          <p className="mb-4 text-muted-foreground">
            Verify that each notification type displays correctly (Requirements
            2.1, 2.2, 2.3)
          </p>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              onClick={handleSuccessTest}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Success Notification Test
            </Button>

            <Button onClick={handleErrorTest} variant="destructive">
              Error Notification Test
            </Button>

            <Button onClick={handleInfoTest} variant="outline">
              Info Notification Test
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              ✓ Success notification:{" "}
              {testResults.success ? "Tested" : "Not tested"}
            </p>
            <p>
              ✓ Error notification:{" "}
              {testResults.error ? "Tested" : "Not tested"}
            </p>
            <p>
              ✓ Info notification: {testResults.info ? "Tested" : "Not tested"}
            </p>
          </div>
        </section>

        {/* Auto-delete tests */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Auto-delete Function Test
          </h2>
          <p className="mb-4 text-muted-foreground">
            Verify that notifications auto-delete after specified time
            (Requirements 4.1, 4.2)
          </p>

          <Button onClick={handleAutoDeleteTest} variant="secondary">
            Auto-delete Test (3 seconds)
          </Button>

          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              ✓ Auto-delete: {testResults.autoDelete ? "Tested" : "Not tested"}
            </p>
          </div>
        </section>

        {/* Additional feature tests */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Additional Feature Tests
          </h2>
          <p className="mb-4 text-muted-foreground">
            Verify multiple notification display and generic function behavior
            (Requirements 3.1, 3.2)
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button onClick={handleMultipleNotifications} variant="outline">
              Multiple Notifications Test
            </Button>

            <Button onClick={handleGenericFunction} variant="outline">
              Generic Function Test
            </Button>
          </div>
        </section>

        {/* Error handling tests */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Error Handling Tests</h2>
          <p className="mb-4 text-muted-foreground">
            Verify error handling and fallback functionality (Requirements 1.3,
            3.2)
          </p>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              onClick={handleErrorHandlingTest}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Error Handling Test
            </Button>

            <Button
              onClick={handlePerformanceTest}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Performance Test
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              ✓ Error handling:{" "}
              {testResults.errorHandling ? "Tested" : "Not tested"}
            </p>
            <p>
              ✓ Performance: {testResults.performance ? "Tested" : "Not tested"}
            </p>
          </div>
        </section>

        {/* System status */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">System Status</h2>
          <p className="mb-4 text-muted-foreground">
            Check notification system status and manage notifications
          </p>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button onClick={handleSystemStatusCheck} variant="outline">
              Check System Status
            </Button>

            <Button
              onClick={handleClearAll}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Clear All Notifications
            </Button>
          </div>

          {systemStatus && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h3 className="mb-2 font-semibold">System Status:</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  Sonner Available:{" "}
                  {systemStatus.sonnerAvailable ? "✅ Yes" : "❌ No"}
                </li>
                <li>
                  Active Notifications: {systemStatus.activeNotifications}
                </li>
                <li>Max Notifications: {systemStatus.maxNotifications}</li>
                <li>
                  Can Show More: {systemStatus.canShowMore ? "✅ Yes" : "❌ No"}
                </li>
              </ul>
            </div>
          )}
        </section>

        {/* Test management */}
        <section className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Test Management</h2>

          <Button onClick={resetTests} variant="outline" className="mr-4">
            Reset Test Results
          </Button>

          <div className="mt-4 rounded-lg bg-muted p-4">
            <h3 className="mb-2 font-semibold">Test Procedure:</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>
                Click each notification type button to verify notifications
                display
              </li>
              <li>
                Test auto-delete to verify notifications disappear after 3
                seconds
              </li>
              <li>Test multiple notifications to verify sequential display</li>
              <li>
                Test error handling to verify invalid inputs are handled
                gracefully
              </li>
              <li>
                Test performance to verify debouncing and memory limits work
              </li>
              <li>Check system status to verify monitoring functionality</li>
              <li>Click notifications to verify manual dismissal works</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}
