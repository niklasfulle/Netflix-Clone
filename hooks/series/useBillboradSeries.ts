import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const useBillboradSeries = () => {
  const { data, error, isLoading } = useSWR("/api/random/series", fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useBillboradSeries