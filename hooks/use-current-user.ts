import getUser from './useUser';

export const useCurrentUser = () => {
"use client";
  return getUser().data?.user
}

