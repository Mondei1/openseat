import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Key, useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { DatabaseInfoKey, getDatabaseInfo, getFloorImage, getFloors } from "@/components/Database";
import dynamic from "next/dynamic";
import { Loading, Text } from "@nextui-org/react";
import { EditorNavbar } from "@/components/editor/Navbar";
import { EditIcon } from "@/components/icons/EditIcon";
import Sidebar from "@/components/editor/Sidebar";

interface ILayerColumn {
  key: Key,
  label: string
}

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
  const Map = dynamic(() => import("../../components/Map").then(res => res.Map), { ssr: false });

  let [mapUrl, setMapUrl] = useState("")
  let [mapHeight, setMapHeight] = useState(0)
  let [mapWidth, setMapWidth] = useState(0)

  let [seatEdit, setSeatEdit] = useState(false)
  let [changeLayer, setChangeLayer] = useState(false)

  async function loadImage() {
    const db = await Database.load("sqlite:" + databasePath as string)

    let floors = await getFloors(db);
    if (floors === null) return;

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
    console.log("Back!");

    router.push({
      pathname: "/"
    })
  }

  const editGuests = () => {
    console.log("Guests edited");

  }

  function editLayer() {
    setSeatEdit(!seatEdit)
  }

  function selectLayer() {
    console.log("Sidebar!");

    setChangeLayer(!changeLayer)
  }

  useEffect(() => {
    loadImage()
  }, [])

  return (
    <>
      <EditorNavbar
        onBack={back}
        onEditGuests={editGuests}
        onEditLayer={editLayer}
        onSelectLayer={selectLayer}
        t={t}
      />
      {changeLayer &&
        <Sidebar>
          <Text h3>{t("map.select_layer")}</Text>
        </Sidebar>
      }
      <div className="map">
        {mapState && <>
          <Map
            mapUrl={mapUrl}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            enableSeatEdit={seatEdit}
          />

          {seatEdit &&
            <div className="flex gap-2 absolute bottom-0 left-0 p-2 pr-5 pl-5 z-20 items-center map-edit-mode">
              <EditIcon />
              <Text h3 className="m-0">{t("map.edit_mode")}</Text>
            </div>
          }
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