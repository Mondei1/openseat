import { createContext, useContext, useEffect, useState } from "react";

const IsClientCtx = createContext(false);

// @ts-ignore
export const IsClientCtxProvider = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return (
    <IsClientCtx.Provider value={isClient}>{children}</IsClientCtx.Provider>
  );
};

export function isClient() {
  return useContext(IsClientCtx);
}