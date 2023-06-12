import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Key, useEffect, useMemo, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { IGuest, ISeat, addGuest, addSeat, deleteGuest, getFloorImage, getFloors, getGuests, getHighestSeatId, getSeats, searchGuests, toggleGuestStatus } from "@/components/Database";
import dynamic from "next/dynamic";
import { Button, Divider, Input, Loading, Spacer, Text } from "@nextui-org/react";
import { EditorNavbar } from "@/components/editor/Navbar";
import { EditIcon } from "@/components/icons/EditIcon";
import Sidebar from "@/components/editor/Sidebar";
import { makeStaticProps, getStaticPaths } from "@/lib/getStatic";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { UserAddIcon } from "@/components/icons/UserAddIcon";
import { latLngBounds, LatLngBounds } from 'leaflet';
import { deleteSeat } from "@/components/Database";
import { GuestTable } from "@/components/editor/GuestTable";
import { GuestModal } from "@/components/editor/GuestModal";
import { AnimatePresence, motion, useAnimation } from "framer-motion";

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

  const [mapUrl, setMapUrl] = useState("")
  const [mapHeight, setMapHeight] = useState(0)
  const [mapWidth, setMapWidth] = useState(0)

  const [seats, setSeats] = useState<ISeat[]>([])
  const [guests, setGuests] = useState<IGuest[]>([])
  const [layerId, setLayerId] = useState(1)

  const [seatEdit, setSeatEdit] = useState(false)
  const [guestEdit, setGuestEdit] = useState(false)

  const [guestModal, setGuestModal] = useState(false)

  let [defaultCapacity, setDefaultCapacity] = useState(6)

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

        image.onload = async () => {
          console.log("Width: ", image.width, " Height: ", image.height);

          setMapUrl(image.src)
          setMapWidth(image.width)
          setMapHeight(image.height)

          //console.log("Loaded image as Base64", mapUrl)
          setMapState(true)

          setSeats((await getSeats(database!, layerId))!)
        }
      }
    }
  }, [layerId, database])

  async function search(searchTerm: string) {
    if (searchTerm.trim() === "") {
      setGuests(await getGuests(database!))
      return
    }

    setGuests(await searchGuests(database!, searchTerm))
  }

  async function addNewSeat(bounds: LatLngBounds) {
    if (database === null) return
    let amount = await getHighestSeatId(database!)

    if (amount === null) return;

    let seat: ISeat = {
      id: amount + 1,
      name: (amount + 1).toString(),
      capacity: defaultCapacity,
      floor_id: layerId,
      lat1: bounds.getNorthWest().lat,
      lng1: bounds.getNorthWest().lng,
      lat2: bounds.getSouthEast().lat,
      lng2: bounds.getSouthEast().lng,
    }

    // Prevent creation of accidental rectangles
    let A = Math.abs((seat.lat2 - seat.lat1) * (seat.lng2 - seat.lng1))
    if (A < 512) {
      return
    }

    addSeat(database, seat)
    setSeats((await getSeats(database, layerId))!)
  }

  async function removeSeat(seatId: number) {
    if (database === null) return

    deleteSeat(database, seatId)
    setSeats((await getSeats(database!, layerId))!)
  }

  async function addNewGuest(guest: IGuest) {
    if (database === null) return

    addGuest(database, guest)
    setGuests(await getGuests(database))
  }

  async function removeGuest(guestId: number) {
    if (database === null) return

    deleteGuest(database, guestId)
    setGuests((await getGuests(database))!)
  }

  function back() {
    router.push({
      pathname: "/"
    })
  }

  async function editGuests() {
    setGuests((await getGuests(database!)))
    setGuestEdit(!guestEdit)
  }

  async function toggleGuest(guestId: number) {
    await toggleGuestStatus(database!, guestId)
    setGuests((await getGuests(database!))!)
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
      setTimeout(async () => {
        console.log("Set layer id after db init");

        setLayerId(1)
        setGuests((await getGuests(database!))!)
      })
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
            t={t}
            mapUrl={mapUrl}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            enableSeatEdit={seatEdit}
            seats={seats}
            addNewSeat={addNewSeat}
            removeSeat={removeSeat}
          />

          <GuestModal
            t={t}
            visible={guestModal}
            closeHandler={() => { setGuestModal(false) }}
            addGuest={addNewGuest}
          />

          <AnimatePresence mode="wait">
            {guestEdit &&
              <Sidebar key={"guest-sidebar"}>
                <div className="flex gap-4">
                  <Input
                    contentLeft={<SearchIcon />}
                    bordered
                    clearable
                    width="100%"
                    css={{ backgroundColor: "rgba(var(--background-rgb), 0.3)" }}
                    onChange={(e) => { search(e.target.value) }}
                    placeholder={t("map.search")!}
                  />
                  <Button
                    bordered
                    color={"gradient"}
                    icon={<UserAddIcon />}
                    shadow={hover}
                    onMouseOver={() => { setHover(true) }}
                    onMouseLeave={() => { setHover(false) }}
                    onPress={() => setGuestModal(true)}
                    auto
                  >
                    {t("map.new_guest")}
                  </Button>
                </div>

                <Spacer y={1} />

                <GuestTable
                  db={database!}
                  guests={guests}
                  deleteGuest={removeGuest}
                  newGuest={addNewGuest}
                  toggleGuest={toggleGuest}
                />
              </Sidebar>
            }
          </AnimatePresence>

          {seatEdit && <>
            <div className="flex gap-2 absolute bottom-0 left-0 p-2 pr-5 pl-5 z-20 items-center map-edit-mode">
              <EditIcon />
              <Text h3 className="m-0">{t("map.edit_mode")}</Text>
              <Spacer x={.5} />
              <Input
                value={defaultCapacity}
                onChange={e => setDefaultCapacity(Number.parseInt(e.target.value))}
                width="9rem"
                label={t("map.default_seat_capacity")!}
                type="number"
              />
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