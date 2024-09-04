import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const useCurrentProfil = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/current/profil", fetcher)

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

export default useCurrentProfil