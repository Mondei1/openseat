import Database from "tauri-plugin-sql-api";
import { escape } from "sqlstring";

export const CURRENT_DATABASE_VERSION = 1

export enum DatabaseInfoKey {
    Version = 1,
    Name = 2
}

export interface IGuest {
    id?: number,
    firstName: string,
    lastName: string,
    additionalGuestAmount: number,
    additionalGuestCheckedin: number,
    checkedIn: boolean,

    // I know, wrong case but I don't want to rename it.
    seatId?: number
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

export interface ISeatOccupation {
    id: number,
    occupied: number,
    left: number,

    /// Guests IDs
    guests: number[] | null
}

export async function initDatabase(db: Database, databaseName: string, schematics: IFloor[]): Promise<boolean> {
    // Create table storing the current schema version allowing for future migrations. 
    await db.execute("BEGIN TRANSACTION;")

    try {
        await db.execute("CREATE TABLE IF NOT EXISTS info (`key` INTEGER NOT NULL PRIMARY KEY, `data` TEXT NOT NULL);")
        await db.execute("INSERT INTO info VALUES ($1, $2)", [DatabaseInfoKey.Version, CURRENT_DATABASE_VERSION])
        await db.execute("INSERT INTO info VALUES ($1, $2)", [DatabaseInfoKey.Name, databaseName])

        await db.execute(`CREATE TABLE IF NOT EXISTS floor (
        id INTEGER PRIMARY KEY,
        level INT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image BLOB NOT NULL
      )`)

        await db.execute(`CREATE TABLE IF NOT EXISTS participant (
        id INTEGER PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        guests_amount INTEGER NOT NULL,
        guests_checkedin INTEGER NOT NULL,
        checkedin BOOLEAN NOT NULL DEFAULT false,
        seat_id INTEGER,
        FOREIGN KEY (seat_id)
          REFERENCES seat (id)
      );`)

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
                // @ts-ignore: Yes, you can do Array.from([UInt8Array]). Don't listen to TypeScript.
                let floorId = (await db.execute(`INSERT INTO floor (level, name, image) VALUES ($1, $2, $3)`, [schematic.level, schematic.name, Array.from(schematic.image)])).lastInsertId
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

export async function getSeatById(db: Database, seatId: number): Promise<ISeat | null> {
    try {
        const result: any[] = await db.select("SELECT * FROM seat WHERE id = $1", [seatId])

        if (result.length > 0) {
            return result[0]
        } else {
            return null
        }
    } catch (err) {
        console.error(`Failed to get seat ${seatId}: ${err}`)

        return null
    }
}

export async function addSeat(db: Database, seat: ISeat): Promise<boolean> {
    try {
        await db.execute("INSERT INTO seat (name, capacity, floor_id, lat1, lat2, lng1, lng2) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [seat.name, seat.capacity, seat.floor_id, seat.lat1, seat.lat2, seat.lng1, seat.lng2])

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
        console.error(`Deletion of seat ${seatId} failed: ${err}`)

        return false
    }
}

export async function getHighestSeatId(db: Database): Promise<number> {
    try {
        // @ts-ignore
        return (await db.select("SELECT MAX(id) AS max FROM seat"))[0].max || 0
    } catch (err) {
        console.error("Couldn't count seats: ", err)

        return 0
    }
}

export async function addGuest(db: Database, guest: IGuest): Promise<boolean> {
    try {
        await db.execute("INSERT INTO participant (first_name, last_name, guests_amount, guests_checkedin, checkedin) VALUES ($1, $2, $3, $4, $5)",
            [guest.firstName, guest.lastName, guest.additionalGuestAmount | 0, guest.additionalGuestCheckedin, guest.checkedIn])

        return true
    } catch (err) {
        console.error("Failed to insert new guest: ", err)

        return false
    }
}

function convertGuest(dbResult: any[]): Array<IGuest> {
    let result = new Array<IGuest>()
    for (let i = 0; i < dbResult.length; i++) {
        const element = dbResult[i];

        result.push({
            id: element.id,
            firstName: element.first_name,
            lastName: element.last_name,
            additionalGuestAmount: element.guests_amount,
            additionalGuestCheckedin: element.guests_checkedin,
            checkedIn: (element.checkedin === "true" ? true : false) || (element.checkedin === 1 ? true : false),
            seatId: element.seat_id
        })
    }

    return result
}

export async function updateGuest(db: Database, guest: IGuest) {
    try {
        db.execute(`UPDATE participant SET
            first_name = $1
            last_name = $2
            guests_amount = $3
            guests_checkedin = $4
            checkedin $5
            WHERE id = $6`,
            [guest.firstName, guest.lastName, guest.additionalGuestAmount, guest.additionalGuestCheckedin, guest.checkedIn, guest.id])
    } catch (err) {
        console.error(`Couldn't update guest ${guest.id}: ${err}`);
    }
}

export async function getGuests(db: Database): Promise<Array<IGuest>> {
    try {
        let rawResult: any[] = await db.select("SELECT * FROM participant ORDER BY id")
        if (rawResult === null || rawResult.length == 0) {
            return []
        }

        return convertGuest(rawResult)
    } catch (err) {
        console.error("Couldn't get guests: ", err)

        return []
    }
}

/**
 * Used to paginate the response.
 * 
 * @param cursor: Where to start returning the next `amount` of results.
 */
export async function getGuestPage(db: Database, lastId: number, amount: number): Promise<Array<IGuest>> {
    try {
        let rawResult: any[] = await db.select("SELECT * FROM participant WHERE id > $1 ORDER BY id LIMIT $2", [lastId, amount])
        if (rawResult === null || rawResult.length == 0) {
            return []
        }

        return convertGuest(rawResult)
    } catch (err) {
        console.error("Couldn't paginate guests: ", err);

        return []
    }
}

export async function searchGuests(db: Database, term: string): Promise<Array<IGuest>> {
    try {
        let escaped: string = escape(term)
        escaped = escaped.substring(1)
        escaped = escaped.substring(0, escaped.length - 1)

        // I need to manually escape the user input as Rust's SQLX fails to detect "$1%" as variable.
        let rawResult: any[] = await db.select(`SELECT * FROM participant WHERE LOWER(first_name) LIKE LOWER('${escaped}%') OR last_name LIKE LOWER('${escaped}%')`)
        if (rawResult === null || rawResult.length == 0) {
            return []
        }

        return convertGuest(rawResult)
    } catch (err) {
        console.error(`Couldn't search for term ${term}: ${err}`);

        return []
    }
}

export async function deleteGuest(db: Database, guestId: number): Promise<boolean> {
    try {
        await db.execute("DELETE FROM participant WHERE id = $1", [guestId])

        return true
    } catch (err) {
        console.error(`Deletion of guest ${guestId} failed: ${err}`)

        return false
    }
}

export async function toggleGuestStatus(db: Database, guestId: number) {
    try {
        await db.execute(`UPDATE participant SET checkedin = CASE WHEN checkedin = 1 THEN 0 ELSE 1 END WHERE id = $1`, [guestId])
    } catch (err) {
        console.error(`Failed to toggle status of guest ${guestId}: ${err}`);
    }
}

export async function updateGuestCheckedIn(db: Database, guestId: number, guestsCheckedIn: number) {
    try {
        await db.execute(`UPDATE participant SET guests_checkedin = $1 WHERE id = $2`, [guestsCheckedIn, guestId])
        
    } catch (err) {
        console.error(`Failed to change checked in guests of guest ${guestId}: ${err}`);
    }
}

/**
 * Find a list of seats that are assignable.
 * @returns Array of seat ids where target guest can be assgined to.
 */
export async function getSeatOccupations(db: Database): Promise<ISeatOccupation[]> {
    try {
        let queryResult: any[] = await db.select(`SELECT
            s.id AS s_id,
            p.id AS u_id,
            s.capacity,
            p.guests_amount
        FROM seat AS s
        LEFT JOIN participant AS p ON p.seat_id = s.id`)        

        // Id seen at index
        let indexed = new Map<number, { capacity: number, left: number, guests: number[] | null }>()
        // Copy results into map
        for (let i = 0; i < queryResult.length; i++) {
            const x = queryResult[i];

            if (indexed.has(x.s_id)) {
                let table = indexed.get(x.s_id)!
                table.left -= x.guests_amount + 1

                if (table.guests === null) {
                    table.guests = [x.u_id]
                } else {
                    table.guests.push(x.u_id)
                }

                indexed.set(x.s_id, table)
                continue
            }

            indexed.set(x.s_id, {
                capacity: x.capacity,
                left: x.capacity - (x.u_id === null ? 0 : (x.guests_amount + 1)),
                guests: x.u_id === null ? null : [x.u_id]
            })
        }
        let result: ISeatOccupation[] = []
        
        // Map to array
        for (const [key, value] of indexed.entries()) {            
            result.push({
                id: key,
                left: value.left,
                occupied: value.capacity - value.left,
                guests: value.guests
            })
        }
        
        return result
    } catch (err) {
        console.error(`Couldn't determine seat occupations: ${err}`)

        return []
    }
}

export async function assignSeat(db: Database, guest: IGuest, seatId: number) {
    // Check if guest can't be seated there.
    const occupations = await getSeatOccupations(db)
    const targetSeat = occupations.find(x => x.id == seatId)

    // Seat doesn't exist
    if (targetSeat === undefined) {
        return
    }

    if (targetSeat.left < (guest.additionalGuestAmount + 1)) {
        console.error(`Cannot occupy seat for guest ${guest.firstName} ${guest.lastName} because there is no space left.`)
        return
    }

    try {
        await db.execute("UPDATE participant SET seat_id = $1 WHERE id = $2", [seatId, guest.id])
    } catch (err) {
        console.error(`Couldn't save occupation for guest ${guest} and seat ${seatId}: ${err}`)

    }
}

export async function getGuestsOnSeat(db: Database, seatId: number): Promise<IGuest[]> {
    try {
        let rawResult: any[] = await db.select("SELECT * FROM participant WHERE seat_id = $1", [seatId])
        if (rawResult === null || rawResult.length == 0) {
            return []
        }

        return convertGuest(rawResult)
    } catch (err) {
        console.error(`Couldn't get guests at seat ${seatId}: ${err}`);
        
        return []
    }
}