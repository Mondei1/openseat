import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";

export type DatabaseContextProps = {
  database: Database | null,
  setDatabase(database: Database): void;
}

const DatabaseContext = createContext<DatabaseContextProps>({
  database: null,
  setDatabase(database) { },
});

// @ts-ignore
export const DatabaseContextProvider = ({ children }) => {
  const [database, setDatabase] = useState<Database | null>(null);

  const updateDatabase = (db: Database) => {
    console.log("Database has been updated to ", db);
    
    setDatabase(db)
  }

  return (
    <DatabaseContext.Provider value={{ database, setDatabase: updateDatabase }}>{children}</DatabaseContext.Provider>
  );
};

export function useDatabase() {
  return useContext(DatabaseContext);
}