import Database from "tauri-plugin-sql-api";

export const CURRENT_DATABASE_VERSION = 1

export enum DatabaseInfoKey {
    Version = 1,
    Name = 2
}

export interface IGuest {
    id: number,
    participantId: number,
    firstName: number,
    lastName: number
}

export interface IFloor {
    id: number,
    level: number,
    name: string,
    image: Uint8Array | null
}

export async function getDatabaseInfo(db: Database, infoKey: DatabaseInfoKey): Promise<string | null> {
    try {
        // @ts-ignore
        return (await db.select("SELECT data FROM info WHERE key = $1", [infoKey]))[0].data;
    } catch (err) {
        console.error(`Failed to read database info ${infoKey} from file. Is it initialized?`, err);
        return null;
    }
}

export async function isCurrentDatabaseVersion(db: Database): Promise<boolean> {
    let version = await getDatabaseInfo(db, DatabaseInfoKey.Version)

    if (version === null) {
        return false
    }

    return Number.parseInt(version) !== CURRENT_DATABASE_VERSION
}

/**
 * We will only check if we can retrive the database version and name.
 */
export async function isValidDatabase(db: Database): Promise<boolean> {
    return await getDatabaseInfo(db, DatabaseInfoKey.Version) !== null && await getDatabaseInfo(db, DatabaseInfoKey.Name) !== null
}

export async function getFloorImage(db: Database, id: number): Promise<Uint8Array | null> {
    try {        
        // @ts-ignore
        let query: any[] = await db.select("SELECT image FROM floor WHERE id = $1", [id])
        let image: string = query[0].image
        image = image.substring(1, image.length - 1)

        let array = Uint8Array.from(image.split(",").map(x => parseInt(x)))
        return array
    } catch (err) {
        return null
    }
}

export async function getFloors(db: Database): Promise<Array<IFloor> | null> {
    try {
        return await db.select("SELECT id, level, name FROM floor ORDER BY level ASC;");
    } catch (err) {
        console.error("Selection of all floors failed:", err);
        
        return null;
    }
}