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

import { GithubLink } from "./github-link"
import { ThemeSwitcher } from "./theme-switcher"

export function Footer() {
  return (
    <footer className="flex flex-col border-t">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 p-4">
        <h1 className="text-xl font-extrabold tracking-tight">hmkconf</h1>
        <div className="flex items-center gap-2">
          <GithubLink />
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  )
}
