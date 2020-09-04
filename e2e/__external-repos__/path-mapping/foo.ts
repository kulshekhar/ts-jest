interface User {
  isStoreOwner: boolean
}

export const isStoreOwner = (user: User) => user?.isStoreOwner;
