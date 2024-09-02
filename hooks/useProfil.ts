import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const useProfil = () => {
  const { data, error, isLoading } = useSWR("/api/profil", fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useProfil