import { useDevice } from "@/components/providers/device-provider"
import { useQuery } from "@tanstack/react-query"

export function useGetKeymap(profileNum: number) {
  const { id, getKeymap } = useDevice()

  return useQuery({
    queryKey: [id, "keymap", profileNum],
    queryFn: () => getKeymap(profileNum),
  })
}
