import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const getProfils = () => {
  const { data, error, isLoading } = useSWR("/api/profil", fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default getProfils