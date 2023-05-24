import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { DatabaseInfoKey, getDatabaseInfo, getFloorImage, getFloors } from "@/components/Database";
import dynamic from "next/dynamic";
import { Loading, Text } from "@nextui-org/react";
import { EditorNavbar } from "@/components/editor/Navbar";
import { latLng } from "leaflet";

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
      <div className="map">
        {mapState && <>
          <Map
            mapUrl={mapUrl}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            enableSeatEdit={seatEdit}
          />

          {seatEdit &&
            <Text h3 color="red" className="absolute bottom-0 left-0 p-2 z-20 map-edit-mode">Edit mode</Text>
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