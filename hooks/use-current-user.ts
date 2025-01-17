import getUser from "./useUser";

export const useCurrentUser = () => {
  return getUser().data?.user
}

