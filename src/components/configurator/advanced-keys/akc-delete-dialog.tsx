"use client"

import { useGetAKC } from "@/api/use-get-akc"
import { useSetAKC } from "@/api/use-set-akc"
import { useConfigurator } from "@/components/providers/configurator-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { produce } from "immer"
import { ReactNode } from "react"

interface AKCDeleteDialogProps {
  akcIndex: number
  children: ReactNode
}

export function AKCDeleteDialog({ akcIndex, children }: AKCDeleteDialogProps) {
  const { profileNum } = useConfigurator()

  const { isSuccess, data: akc } = useGetAKC(profileNum)
  const { mutate: setAKC } = useSetAKC(profileNum)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this binding?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this binding?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Cancel
          </DialogClose>
          <DialogClose
            disabled={!isSuccess}
            className={buttonVariants({
              variant: "destructive",
              size: "sm",
            })}
            onClick={() =>
              isSuccess &&
              setAKC(
                produce(akc, (draft) => draft.filter((_, i) => i !== akcIndex)),
              )
            }
          >
            Delete
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
