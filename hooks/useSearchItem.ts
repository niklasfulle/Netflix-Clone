import useSWR from "swr"

import fetcher from "@/lib/fetcher"

const useSearchItem = (item: string) => {
  const { data, error, isLoading } = useSWR(`/api/search?item=${item}`, fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useSearchItem