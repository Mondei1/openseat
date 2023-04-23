import Database from "tauri-plugin-sql-api";

export const CURRENT_DATABASE_VERSION = 1

export enum DatabaseInfoKey {
    Version = 1,
    Name = 2
}

export async function getDatabaseInfo(db: Database, infoKey: DatabaseInfoKey): Promise<string> {
    try {
        return await db.select("SELECT data FROM info WHERE key = $1", [infoKey]);
    } catch (err) {
        console.error(`Failed to read database info ${infoKey} from file. Is it initialized?`, err);
        return "";
    }
}

export async function isCurrentDatabaseVersion(db: Database): Promise<boolean> {
    return Number.parseInt(await getDatabaseInfo(db, DatabaseInfoKey.Version)) !== CURRENT_DATABASE_VERSION
}