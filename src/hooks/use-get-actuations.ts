import { useDevice } from "@/components/providers/device-provider"
import { useQuery } from "@tanstack/react-query"

export function useGetActuations(profileNum: number) {
  const { id, getActuations } = useDevice()

  return useQuery({
    queryKey: [id, "actuations", profileNum],
    queryFn: () => getActuations(profileNum),
  })
}
