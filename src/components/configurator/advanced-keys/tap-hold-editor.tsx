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

import { useSetAdvancedKeys } from "@/api/use-set-advanced-keys"
import { useConfigurator } from "@/components/providers/configurator-provider"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MAX_TAPPING_TERM, MIN_TAPPING_TERM } from "@/constants/devices"
import { DeviceAKTapHold } from "@/types/devices"
import { Keycode } from "@/types/keycodes"
import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group"
import { produce } from "immer"
import { useEffect, useState } from "react"
import { KeycodeButton } from "../common/keycode-button"
import { KeycodeSelector } from "../common/keycode-selector"
import { Switch } from "../common/switch"
import { useAdvancedKeysEditor } from "./advanced-keys-editor"
import { KeyTesterTab } from "./key-tester-tab"
import { TickRateTab } from "./tick-rate-tab"

export function TapHoldEditor() {
  const { profile } = useConfigurator()
  const { advancedKeys, akIndex } = useAdvancedKeysEditor()
  const ak = advancedKeys[akIndex].ak as DeviceAKTapHold

  const { mutate: setAdvancedKeys } = useSetAdvancedKeys(profile)

  const [selectedKey, setSelectedKey] = useState("")
  const [uiAdvancedKey, setUIAdvancedKey] = useState(ak)

  const updateAdvancedKey = (ak: DeviceAKTapHold) =>
    setAdvancedKeys({
      start: akIndex,
      advancedKeys: [
        produce(advancedKeys[akIndex], (draft) => {
          draft.ak = ak
        }),
      ],
    })

  useEffect(() => setUIAdvancedKey(ak), [ak])

  return (
    <div className="flex w-full gap-8">
      <div className="flex w-72 flex-col gap-4">
        <div className="flex flex-col">
          <p className="text-sm font-semibold leading-none tracking-tight">
            Configure Tap and Hold Bindings.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the keycodes to be sent when the key is tapped or held.
          </p>
          <ToggleGroup
            type="single"
            value={selectedKey}
            onValueChange={setSelectedKey}
            className="mt-3 flex w-full items-center justify-center"
          >
            <div className="flex flex-col items-center text-center">
              <p className="text-sm">Tap</p>
              <div className="size-16 p-0.5">
                <ToggleGroupItem value="tap" asChild>
                  <KeycodeButton
                    keycode={ak.tapKeycode}
                    className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                    onContextMenu={(e) => {
                      e.preventDefault()
                      updateAdvancedKey({ ...ak, tapKeycode: Keycode.KC_NO })
                      setSelectedKey("")
                    }}
                  />
                </ToggleGroupItem>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-sm">Hold</p>
              <div className="size-16 p-0.5">
                <ToggleGroupItem value="hold" asChild>
                  <KeycodeButton
                    keycode={ak.holdKeycode}
                    className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                    onContextMenu={(e) => {
                      e.preventDefault()
                      updateAdvancedKey({ ...ak, holdKeycode: Keycode.KC_NO })
                      setSelectedKey("")
                    }}
                  />
                </ToggleGroupItem>
              </div>
            </div>
          </ToggleGroup>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold leading-none tracking-tight">
            Tapping Term: {uiAdvancedKey.tappingTerm}ms
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the duration the key must be held to trigger the hold keycode.
            If the hold keycode is a modifier and another non-Tap-Hold key is
            pressed, the tapping term is ignored, and the hold keycode is sent
            immediately.
          </p>
          <Slider
            min={MIN_TAPPING_TERM}
            max={MAX_TAPPING_TERM}
            step={5}
            value={[uiAdvancedKey.tappingTerm]}
            onValueChange={([tappingTerm]) =>
              setUIAdvancedKey({ ...uiAdvancedKey, tappingTerm })
            }
            onValueCommit={() => updateAdvancedKey(uiAdvancedKey)}
            className="mt-3"
          />
        </div>
        <Switch
          size="sm"
          id="hold-on-other-key-press"
          title="Hold On Other Key Press"
          description="When another key is pressed while holding this key, immediately send the hold keycode regardless of the tapping term."
          checked={uiAdvancedKey.holdOnOtherKeyPress}
          onCheckedChange={(checked) =>
            updateAdvancedKey({
              ...ak,
              holdOnOtherKeyPress: checked,
            })
          }
        />
      </div>
      <Tabs defaultValue="bindings" className="flex flex-1 flex-col">
        <div>
          <TabsList>
            <TabsTrigger value="bindings">Bindings</TabsTrigger>
            <TabsTrigger value="key-tester">Key Tester</TabsTrigger>
            <TabsTrigger value="tick-rate">Tick Rate</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="bindings">
          <div className="flex flex-col rounded-md border bg-card p-4 shadow-sm">
            <KeycodeSelector
              disabled={selectedKey === ""}
              onKeycodeSelected={(keycode) => {
                if (selectedKey === "tap") {
                  updateAdvancedKey({ ...ak, tapKeycode: keycode })
                } else if (selectedKey === "hold") {
                  updateAdvancedKey({ ...ak, holdKeycode: keycode })
                }
                setSelectedKey("")
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="key-tester">
          <KeyTesterTab />
        </TabsContent>
        <TabsContent value="tick-rate">
          <TickRateTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
