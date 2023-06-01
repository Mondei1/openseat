import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip } from "@nextui-org/react";
import { Key, useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { IconButton } from "@/components/IconButton";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { ArrowDownIcon } from "@/components/icons/ArrowDownIcon";
import Database from "tauri-plugin-sql-api";
import { CURRENT_DATABASE_VERSION, DatabaseInfoKey, IFloor } from "@/components/Database";
import { makeStaticProps, getStaticPaths } from "@/lib/getStatic";
import { LayerManager } from "@/components/LayerManager";

const getStaticProps = makeStaticProps(['common'])
export { getStaticPaths, getStaticProps }

export default function Router() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { databasePath } = router.query

  let [isNext, setNext] = useState(false)
  let [databaseName, setDatabaseName] = useState("");
  let [schematics, setSchematics] = useState<IFloor[]>([]);

  useEffect(() => {
    setDatabaseName(t("setup.initial_name")!)
  })

  async function setupDatabase() {
    setNext(true);

    // @ts-ignore
    const fs: any = window.__TAURI__.fs

    if (await fs.exists(databasePath as string)) {
      await fs.removeFile(databasePath as string)
      console.log(`Deleted file ${databasePath} because it already exists.`);
    }

    const db = await Database.load("sqlite:" + databasePath)

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
          console.debug("Inserted ID: " + floorId);
        } catch (err) {
          console.error("Failed to read image from disk:", err);
          console.error(`Skip import of floor ${schematic.name}`);

        }
      }

      await db.execute("COMMIT;")
    } catch (err) {
      await db.execute("ROLLBACK;")
      console.error("SQLite failed with the following error and all changes were undone:", err);
    }

    db.close()
    router.push({
      pathname: "/editor",
      query: {
        databasePath
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col content-center p-24">
      <h1>{t("setup.welcome")}</h1>
      <p>Saving at: {databasePath}</p>

      <Spacer y={3}></Spacer>

      <Input
        clearable
        bordered
        underlined
        required
        type="text"
        maxLength={255}
        minLength={1}
        labelPlaceholder={t("setup.plan_name")!}
        initialValue={t("setup.initial_name")!}
        onChange={e => setDatabaseName(e.target.value)}
        color="primary"
        className="w-fit border-none"
      />

      <Spacer y={1.5}></Spacer>
      <Text h3>Schematics</Text>
      <Text>{t("setup.select_schematic_label")}</Text>

      <Spacer y={1} />
      <LayerManager schematics={schematics} setSchematics={setSchematics} />

      <Spacer y={4}></Spacer>
      {isNext
        ?
        <Button disabled auto shadow bordered color="gradient" css={{ px: "$13" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
        :
        <Button color="gradient" className="w-full" auto onPress={setupDatabase} disabled={(databaseName.trim().length === 0 && schematics.length === 0)}>
          {t("next")}
        </Button>
      }
    </div>
  )
}