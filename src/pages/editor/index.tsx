import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { ComponentType, useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { DatabaseInfoKey, getDatabaseInfo, getFloorImage, getFloors } from "@/components/database";
import dynamic from "next/dynamic";
import { Dropdown, Input, Loading, Text, Tooltip } from "@nextui-org/react";
import { SearchIcon } from "@/components/icons/searchIcon";
import { LayerIcon } from "@/components/icons/layerIcon";
import { EditIcon } from "@/components/icons/editIcon";
import { UsersIcon } from "@/components/icons/usersIcon";
import { ArrowDownIcon } from "@/components/icons/arrowDownIcon";
import { ArrowLeftIcon } from "@/components/icons/arrowLeftIcon";

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

  const [mapState, setMapState] = useState(false)
  const Map = dynamic(() => import("../../components/Map"), { ssr: false });

  let [mapUrl, setMapUrl] = useState("")
  let [mapHeight, setMapHeight] = useState(0)
  let [mapWidth, setMapWidth] = useState(0)

  async function loadImage() {
    const db = await Database.load("sqlite:" + databasePath as string)
    console.log("Version: ", await getDatabaseInfo(db, DatabaseInfoKey.Version))

    let floors = await getFloors(db);
    if (floors === null) return;

    console.log(floors);

    if (floors.length > 0) {
      let image = await getFloorImage(db, floors[0].id);

      if (image === null) return;

      let reader = new FileReader();
      reader.readAsDataURL(new Blob([image]))
      reader.onloadend = () => {
        let image = new Image()
        image.src = reader.result?.toString()!!
        console.log("Load image ...");


        image.onload = () => {
          console.log("Width: ", image.width, " Height: ", image.height);

          setMapUrl(image.src)
          setMapWidth(image.width)
          setMapHeight(image.height)

          //console.log("Loaded image as Base64", mapUrl)
          setMapState(true)
        }
      }
    }
  }

  function back() {
    router.push({
      pathname: "/"
    })
  }

  useEffect(() => {
    loadImage()
  }, [])

  return (
    <>
      <div className="flex controlpanel">
        <div className="flex w-full justify-start items-center">
          <Tooltip onClick={back} content={t("map.close_project")} placement="bottomStart">
            <ArrowLeftIcon />
          </Tooltip>
        </div>
        <div className="flex w-full gap-10 p-2 justify-center items-center">
          <Tooltip content={t("map.select_layer")} placement="bottom">
            <LayerIcon />
            <Text className="ml-3">{t("map.select_layer")}</Text>
          </Tooltip>
          <Tooltip content={t("map.edit_layer")} placement="bottom">
            <EditIcon />
            <Text className="ml-3">{t("map.edit_layer")}</Text>
          </Tooltip>
          <Tooltip content={t("map.edit_guests")} placement="bottom">
            <UsersIcon />
            <Text className="ml-3">{t("map.edit_guests")}</Text>
          </Tooltip>
        </div>
        <div className="flex w-full justify-end items-center">
          <SearchIcon />
        </div>
      </div>
      <div id="map">
        {mapState && <>
          <Map {...{ mapUrl, mapWidth, mapHeight }}></Map>
        </>}
        {!mapState && <>
          <div className="flex w-full h-full justify-center ">

          </div>
          <Loading>{t("map.load")}</Loading>
        </>}
      </div>
    </>
  )
}