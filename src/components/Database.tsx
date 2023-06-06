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

export interface ISeat {
    id: number,
    name: string,
    capacity: number,
    lat1: number,
    lat2: number,
    lng1: number,
    lng2: number,
    floor_id: number
}

export async function initDatabase(db: Database, databaseName: string, schematics: IFloor[]): Promise<boolean> {
    // Create table storing the current schema version allowing for future migrations. 
    await db.execute("BEGIN TRANSACTION;")

    try {
      await db.execute("CREATE TABLE IF NOT EXISTS info (`key` INTEGER NOT NULL PRIMARY KEY, `data` TEXT NOT NULL);")
      await db.execute("INSERT INTO info VALUES ($1, $2)", [DatabaseInfoKey.Version, CURRENT_DATABASE_VERSION])
      await db.execute("INSERT INTO info VALUES ($1, $2)", [DatabaseInfoKey.Name, databaseName])

      await db.execute(`CREATE TABLE IF NOT EXISTS participant (
        id INTEGER PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        guest_amount VARCHAR(255) NOT NULL,
        guests_checkedin VARCHAR(255) NOT NULL
      );`)

      /*await db.execute(`CREATE TABLE IF NOT EXISTS guest (
        id INTEGER PRIMARY KEY,
        participant_id INT NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        FOREIGN KEY (participant_id)
          REFERENCES participant (id)
      );`)*/

      await db.execute(`CREATE TABLE IF NOT EXISTS floor (
        id INTEGER PRIMARY KEY,
        level INT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image BLOB NOT NULL
      )`)

      await db.execute(`CREATE TABLE IF NOT EXISTS seat_assignment (
        participant_id INTEGER,
        seat_id INTEGER,
        FOREIGN KEY (participant_id)
          REFERENCES participant (id),
        FOREIGN KEY (seat_id)
          REFERENCES seat (id),
        PRIMARY KEY (participant_id, seat_id)
      )`)

      await db.execute(`CREATE TABLE IF NOT EXISTS seat (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INT NOT NULL,
        floor_id INT NOT NULL,
        lat1 REAL NOT NULL,
        lat2 REAL NOT NULL,
        lng1 REAL NOT NULL,
        lng2 REAL NOT NULL,
        FOREIGN KEY (floor_id)
          REFERENCES floor (id)
      )`)

      for (let i = 0; i < schematics.length; i++) {
        const schematic = schematics[i]

        try {
          let floorId = (await db.execute(`INSERT INTO floor (level, name, image) VALUES ($1, $2, $3)`, [schematic.level, schematic.name, schematic.image])).lastInsertId
          console.debug("Inserted ID: " + floorId)
        } catch (err) {
          console.error(`Skip import of floor ${schematic.name}: ${err}`)
        }
      }

      await db.execute("COMMIT;")

      return true
    } catch (err) {
      await db.execute("ROLLBACK;")
      console.error("SQLite failed with the following error and all changes were undone:", err)

      return false
    }
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
        
        return null
    }
}

export async function getSeats(db: Database, floorId: number): Promise<Array<ISeat> | null> {
    try {
        return await db.select("SELECT * FROM seat WHERE floor_id = $1", [floorId])
    } catch (err) {
        console.error(`Selection of all seats for floor ${floorId} failed: ${err}`)

        return null
    }
}

export async function addSeat(db: Database, seat: ISeat): Promise<boolean> {
    try {
        await db.execute("INSERT INTO seat (name, capacity, floor_id, lat1, lat2, lng1, lng2) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [seat.name, seat.capacity, seat.floor_id, seat.lat1, seat.lat2, seat.lng1, seat.lng2])
        
        console.log("Added new seat to db: ", seat);
        
        return true
    } catch (err) {
        console.error("Failed to insert new seat: ", err)

        return false
    }
}

export async function deleteSeat(db: Database, seatId: number): Promise<boolean> {
    try {
        await db.execute("DELETE FROM seat WHERE id = $1", [seatId])

        return true
    } catch (err) {
        console.error(`Deletion of ${seatId} failed: ${err}`)

        return false
    }
}

export async function getSeatAmount(db: Database): Promise<number | null> {
    console.log("Actual result: ", await db.select("SELECT count(*) AS amount FROM seat"));
    
    try {
        // @ts-ignore
        return (await db.select("SELECT count(*) AS amount FROM seat"))[0].amount
    } catch (err) {
        console.error("Couldn't count seats: ", err)

        return null
    }
}