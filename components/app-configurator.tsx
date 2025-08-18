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

import { CableIcon, PaintbrushIcon } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { toast } from "sonner"

import { useHMKKeyboard } from "@/hooks/use-hmk-keyboard"

import { Configurator } from "./configurator"
import { Footer } from "./footer"
import { ConfiguratorProvider } from "./providers/configurator-provider"
import { KeyboardProvider } from "./providers/keyboard-provider"
import { Button } from "./ui/button"

export function AppConfigurator() {
  const { connect, keyboard } = useHMKKeyboard()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        console.error(err)
      }
    }
  }

  useEffect(() => {
    if (keyboard !== null) {
      toast.success(`Successfully connected to ${keyboard.metadata.name}.`)
    }
  }, [keyboard])

  if (keyboard !== null) {
    return (
      <ConfiguratorProvider>
        <KeyboardProvider keyboard={keyboard}>
          <Configurator />
        </KeyboardProvider>
      </ConfiguratorProvider>
    )
  }

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-5xl leading-none font-extrabold tracking-tight">
          hmkconf
        </h1>
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleConnect}>
              <CableIcon /> Authorize Keyboard
            </Button>
            <Button asChild variant="outline">
              <Link href="/demo" replace>
                Demo
              </Link>
            </Button>
          </div>
          <Button asChild variant="link">
            <Link href="/metadata" replace>
              <PaintbrushIcon /> Keyboard Metadata Viewer
            </Link>
          </Button>
        </div>
      </div>
      <Footer />
    </>
  )
}
