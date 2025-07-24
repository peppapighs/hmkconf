/**
 * Simple task queue implementation for managing sequential operations
 */
export class TaskQueue {
  private queue: Array<() => Promise<unknown>> = []
  private isProcessing = false

  /**
   * Add a task to the queue
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.isProcessing) {
        this.process()
      }
    })
  }

  /**
   * Enqueue a task with abort controller support
   */
  enqueue<T>(
    task: (abortController: AbortController) => Promise<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const abortController = new AbortController()

      this.queue.push(async () => {
        try {
          const result = await task(abortController)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.isProcessing) {
        this.process()
      }
    })
  }

  /**
   * Process the queue
   */
  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error("Task queue error:", error)
        }
      }
    }

    this.isProcessing = false
  }

  /**
   * Clear all pending tasks
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Get the number of pending tasks
   */
  get length(): number {
    return this.queue.length
  }
}
