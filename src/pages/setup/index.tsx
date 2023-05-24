import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip } from "@nextui-org/react";
import { Key, useEffect, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { IconButton } from "@/components/IconButton";
import { DeleteIcon } from "@/components/icons/DeleteIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { ArrowDownIcon } from "@/components/icons/ArrowDownIcon";
import Database from "tauri-plugin-sql-api";
import { CURRENT_DATABASE_VERSION, DatabaseInfoKey } from "@/components/Database";

// @ts-ignore
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common'
      ])),
      // Will be passed to the page component as props
    },
  }
}

export default function Router() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { databasePath } = router.query

  interface ISchematicColumn {
    key: Key,
    label: String
  }
  // Table structure
  const columns: Array<ISchematicColumn> = [
    {
      key: "level",
      label: t("level")!
    },
    {
      key: "name",
      label: t("name")!
    },
    {
      key: "path",
      label: t("file_path")!
    },
    {
      key: "actions",
      label: "Actions"
    }
  ]

  interface ISchematicRow {
    level: number,
    name: string,
    path: string
  }

  let [isNext, setNext] = useState(false)
  let [databaseName, setDatabaseName] = useState("");
  let [schematics, setSchematics] = useState<ISchematicRow[]>([]);

  useEffect(() => {
    setDatabaseName(t("setup.initial_name")!)
  })
  
  async function addSchematic() {
    const filePath = await open({
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg']
      }],
      multiple: false
    });

    let parsedPath: string;
    if (Array.isArray(filePath)) {
      parsedPath = filePath[0];
    } else if (typeof filePath === "string") {
      parsedPath = filePath as string;
    } else {
      return;
    }

    console.log("Selected:", filePath);

    const newFloor: ISchematicRow = {
      level: schematics.length + 1,
      name: t("floor") + (schematics.length + 1),
      path: parsedPath
    }

    setSchematics(prev => [
      ...prev,
      newFloor
    ])
  }

  function moveSchematic(level: number, direction: 'UP' | 'DOWN') {
    let clone = [...schematics]
    console.log(clone);

    const indexSrc = clone.findIndex(x => x.level === level)

    if (indexSrc === undefined || indexSrc === -1) {
      return
    }

    const indexDst = direction == 'UP' ? indexSrc - 1 : indexSrc + 1;

    console.log("Source index: " + indexSrc);
    console.log("Destination index: " + indexDst + " (max " + clone.length + ")");

    if (indexDst >= clone.length || indexDst < 0) {
      return
    }
    console.log("Swap ", clone[indexSrc].path + " with " + clone[indexDst].path)

    const srcClone = clone[indexSrc]
    clone[indexSrc] = clone[indexDst]
    clone[indexDst] = srcClone

    // Fix leveling
    for (let i = 0; i < clone.length; i++) {
      clone[i].level = i + 1
      console.log(`Set ${clone[i].path} to ${i + 1}`);
    }

    clone = clone.sort((a, b) => a.level - b.level)

    setSchematics([...clone])
  }

  function deleteSchematic(index: number) {
    const clone = schematics
    clone.splice(index, 1)
    setSchematics(clone)
  }

  async function setupDatabase() {
    setNext(true);

    // @ts-ignore
    const fs: any = window.__TAURI__.fs;

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
          let image = await fs.readBinaryFile(schematic.path)

          let floorId = (await db.execute(`INSERT INTO floor (level, name, image) VALUES ($1, $2, $3)`, [schematic.level, schematic.name, Array.from(image)])).lastInsertId
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

  const renderCell = (schematic: ISchematicRow, columnKey: React.Key) => {
    console.log("Render cell: ", schematic);

    // @ts-ignore
    const cellValue: any = schematic[columnKey];
    switch (columnKey) {
      case "level":
      case "name":
        return (
          <Text>
            {cellValue}
          </Text>
        );

      case "actions":
        return (
          <Row justify="center" align="center">
            <Col css={{ d: "flex" }}>
              <Tooltip content={t("up")}>
                <IconButton onClick={() => moveSchematic(schematic.level, 'UP')}>
                  <ArrowUpIcon size={20} />
                </IconButton>
              </Tooltip>
            </Col>
            <Col css={{ d: "flex" }}>
              <Tooltip content={t("down")}>
                <IconButton onClick={() => moveSchematic(schematic.level, 'DOWN')}>
                  <ArrowDownIcon rotate={90} size={20} />
                </IconButton>
              </Tooltip>
            </Col>
            <Col css={{ d: "flex" }}>
              <Tooltip
                content={t("delete")}
                color="error"
                onClick={() => deleteSchematic(schematic.level - 1)}
              >
                <IconButton>
                  <DeleteIcon size={20} fill="#FF0080" />
                </IconButton>
              </Tooltip>
            </Col>
          </Row>
        );
      default:
        return cellValue;
    }
  };

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
      {schematics.length > 0 &&
        <>
          <Spacer y={1}></Spacer>
          <Table
            bordered={false}
            css={{
              height: "auto",
              minWidth: "100%",
            }}>
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column
                  key={column.key}
                  hideHeader={column.key == "actions"}
                  align={column.key === "actions" ? "center" : "start"}>{column.label}</Table.Column>
              )}
            </Table.Header>
            <Table.Body items={schematics}>
              {(item) => (
                <Table.Row key={item.level}>
                  {(columnKey) =>
                    <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>
                  }
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <Spacer y={0.5}></Spacer>
        </>
      }
      <div className="w-96 mt-3">
        <Button onPress={addSchematic}>
          <svg xmlns="http://www.w3.org/2000/svg" className="p-1.5" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M15 8h.01"></path>
            <path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5"></path>
            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path>
            <path d="M14 14l1 -1c.67 -.644 1.45 -.824 2.182 -.54"></path>
            <path d="M16 19h6"></path>
            <path d="M19 16v6"></path>
          </svg>

          <Text>{t("setup.select_schematic")} (.png, .jpg)</Text>
        </Button>
      </div>

      <Spacer y={4}></Spacer>
      {!isNext &&
        <Button color="gradient" className="w-full" auto onPress={setupDatabase} disabled={databaseName.length === 0 || schematics.length === 0}>
          {t("next")}
        </Button>
      }

      {isNext &&
        <Button disabled auto bordered color="gradient" css={{ px: "$13" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
      }
    </div>
  )
}