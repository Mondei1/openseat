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
import { CURRENT_DATABASE_VERSION, DatabaseInfoKey, IFloor, initDatabase } from "@/components/Database";
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

    initDatabase(db, databaseName, schematics)

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