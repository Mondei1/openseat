import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Key, useEffect, useMemo, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { ISeat, addSeat, getFloorImage, getFloors, getSeatAmount, getSeats } from "@/components/Database";
import dynamic from "next/dynamic";
import { Button, Input, Loading, Text } from "@nextui-org/react";
import { EditorNavbar } from "@/components/editor/Navbar";
import { EditIcon } from "@/components/icons/EditIcon";
import Sidebar from "@/components/editor/Sidebar";
import { makeStaticProps, getStaticPaths } from "@/lib/getStatic";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { UserAddIcon } from "@/components/icons/UserAddIcon";
import { latLngBounds, LatLngBounds } from 'leaflet';

interface ILayerColumn {
  key: Key,
  label: string
}

const getStaticProps = makeStaticProps(['common'])
export { getStaticPaths, getStaticProps }

export default function Router() {
  const { t } = useTranslation('common')

  const router = useRouter()
  const { databasePath } = router.query

  const [mapState, setMapState] = useState(false)
  const Map = dynamic(() => import("../../../components/Map").then(res => res.Map), { ssr: false });

  let [mapUrl, setMapUrl] = useState("")
  let [mapHeight, setMapHeight] = useState(0)
  let [mapWidth, setMapWidth] = useState(0)

  let [seats, setSeats] = useState<ISeat[]>([])
  let [seatEdit, setSeatEdit] = useState(false)
  let [guestEdit, setGuestEdit] = useState(false)
  let [layerId, setLayerId] = useState(1)

  let [database, setDatabase] = useState<Database | null>(null)

  async function loadDatabase() {
    const db = await Database.load("sqlite:" + databasePath as string)
    setDatabase(db)
  }

  useMemo(async () => {
    if (database === null) return;

    let floors = await getFloors(database);
    if (floors === null) return;

    if (floors.length > 0) {
      let image = await getFloorImage(database, floors[layerId - 1].id);

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
  }, [layerId, database])

  async function addNewSeat(bounds: LatLngBounds) {
    if (database === null) return

    let amount = await getSeatAmount(database!)
    console.log("Amount: ", amount);
    
    if (amount === null) return;

    let seat: ISeat = {
      id: amount + 1,
      name: (amount + 1).toString(),
      capacity: 12,
      floor_id: layerId,
      lat1: bounds.getNorthWest().lat,
      lng1: bounds.getNorthWest().lng,
      lat2: bounds.getSouthEast().lat,
      lng2: bounds.getSouthEast().lng,
    }

    addSeat(database, seat)
    setSeats((await getSeats(database!, layerId))!)
  }

  function back() {
    console.log("Back!");

    router.push({
      pathname: "/"
    })
  }

  const editGuests = () => {
    setGuestEdit(!guestEdit)
  }

  async function editLayer() {
    setSeats((await getSeats(database!, layerId))!)

    setSeatEdit(!seatEdit)
  }

  function selectLayer(id: number) {
    setLayerId(id)
  }

  useEffect(() => {
    loadDatabase().then(() => {
      setTimeout(() => {
        console.log("Set layer id after db init");

        setLayerId(1)
      }, 500)
    })
  }, [])

  const [hover, setHover] = useState(false)

  return (
    <>
      <EditorNavbar
        onBack={back}
        onEditGuests={editGuests}
        onEditLayer={editLayer}
        onSelectLayer={selectLayer}
        t={t}
        db={database}
      />
      {/*layerId &&
        <Sidebar>
          <Text h3>{t("map.select_layer")}</Text>
        </Sidebar>
  */}
      <div className="map">
        {mapState && <>
          <Map
            mapUrl={mapUrl}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            enableSeatEdit={seatEdit}
            seats={seats}
            addNewSeat={addNewSeat}
          />

          {guestEdit &&
            <Sidebar key={"guest-sidebar"}>
              <div className="flex gap-4">
                <Input
                  contentLeft={<SearchIcon />}
                  bordered
                  width="100%"
                  css={{ backgroundColor: "rgba(var(--background-rgb), 0.3)" }}
                  placeholder={t("map.search")!}
                />
                <Button
                  bordered
                  color={"gradient"}
                  icon={<UserAddIcon />}
                  shadow={hover}
                  onMouseOver={() => { setHover(true) }}
                  onMouseLeave={() => { setHover(false) }}
                  auto
                >
                  {t("map.new_guest")}
                </Button>
              </div>
            </Sidebar>
          }

          {seatEdit && <>
            <div className="flex gap-2 absolute bottom-0 left-0 p-2 pr-5 pl-5 z-20 items-center map-edit-mode">
              <EditIcon />
              <Text h3 className="m-0">{t("map.edit_mode")}</Text>
            </div>
          </>
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