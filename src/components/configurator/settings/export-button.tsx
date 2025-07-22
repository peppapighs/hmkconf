/*
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */

"use client"

import { useExportConfig } from "@/api/use-export-config"
import { Button } from "@/components/ui/button"
import { useDevice } from "@/components/providers/device-provider"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ExportButton() {
  const { isDemo } = useDevice()
  const { exportConfig, isExporting } = useExportConfig()
  const { toast } = useToast()
  const [isHovered, setIsHovered] = useState(false)

  const handleExport = async () => {
    try {
      // Export process is now handled entirely in the hook with its own toast notifications
      const result = await exportConfig()
      return result
    } catch (error) {
      console.error("Export error:", error)
      
      // Show error toast if an unexpected error occurs
      toast({
        title: "Export Failed",
        description: "An unexpected error occurred during export. Please try again.",
        variant: "destructive",
      })
      
      return false
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={isDemo || isExporting}
            variant="outline"
            onClick={handleExport}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative transition-all hover:bg-primary/10"
            aria-label={isExporting ? "Exporting configuration..." : "Export configuration"}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                Export
                <Download className={`ml-2 h-4 w-4 transition-transform ${isHovered ? 'translate-y-0.5' : ''}`} />
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save your keyboard configuration to a file</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}