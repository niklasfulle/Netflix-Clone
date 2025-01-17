import getUser from "./useUser";

export const useCurrentRole = () => {
  return getUser().data.user.role
}