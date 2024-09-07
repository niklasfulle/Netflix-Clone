import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const useBillboradMovie = () => {
  const { data, error, isLoading } = useSWR("/api/random/movies", fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useBillboradMovie