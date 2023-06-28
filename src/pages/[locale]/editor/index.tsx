import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Key, useEffect, useMemo, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { IGuest, ISeat, ISeatOccupation, addGuest, addSeat, assignSeat, deleteGuest, getFloorImage, getFloors, getGuests, getHighestSeatId, getSeatById, getSeatOccupations, getSeats, searchGuests, toggleGuestStatus } from "@/components/Database";
import dynamic from "next/dynamic";
import { Button, Divider, Input, Loading, Spacer, Text } from "@nextui-org/react";
import { EditorNavbar } from "@/components/editor/Navbar";
import { EditIcon } from "@/components/icons/EditIcon";
import Sidebar from "@/components/editor/Sidebar";
import { makeStaticProps, getStaticPaths } from "@/lib/getStatic";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { UserAddIcon } from "@/components/icons/UserAddIcon";
import { LatLngBounds } from 'leaflet';
import { deleteSeat } from "@/components/Database";
import { GuestTable } from "@/components/editor/GuestTable";
import { GuestModal } from "@/components/editor/GuestModal";
import { AnimatePresence, motion } from "framer-motion";
import { ChairIcon } from "@/components/icons/ChairIcon";

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
  const [focusSeat, setFocusSeat] = useState<ISeat | undefined>(undefined)

  const [guestSearch, setGuestSearch] = useState("")
  const [assignGuest, setAssignGuest] = useState<IGuest | undefined>(undefined)
  const [occupations, setOccupations] = useState<ISeatOccupation[] | undefined>(undefined)

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
      console.log("Layer ", layerId);
      
      if (layerId === undefined) {
        return
      }

      console.log("Search for floor ", layerId, " in ", floors);
      
      let image = await getFloorImage(database, floors[layerId - 1].id);

      if (image === null) return;

      let reader = new FileReader();
      reader.readAsDataURL(new Blob([image]))
      reader.onloadend = () => {
        let image = new Image()
        image.src = reader.result?.toString()!!

        image.onload = async () => {
          setMapUrl(image.src)
          setMapWidth(image.width)
          setMapHeight(image.height)

          //console.log("Loaded image as Base64", mapUrl)
          setMapState(true)
          
          await setSeats((await getSeats(database!, layerId))!)
          await setOccupations(await getSeatOccupations(database!))

          console.log("Loaded seats on load: ", seats);
          console.log("Loaded occupations on load: ", occupations);
          
        }
      }
    }
  }, [layerId, database])

  useMemo(async () => {
    if (guestSearch.trim() === "") {
      setGuests(await getGuests(database!))
      return
    }

    setGuests(await searchGuests(database!, guestSearch))
  }, [guestSearch])

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

  /// Refreshs guests while respecting current search.
  async function refreshGuests() {
    if (guestSearch.trim() === "") {
      setGuests((await getGuests(database!)))
    } else {
      setGuests(await searchGuests(database!, guestSearch))
    }
  }

  async function startGuestOccupation(guest: IGuest) {
    setGuestEdit(false)
    setAssignGuest(guest)
    setOccupations(await getSeatOccupations(database!))
  }

  async function focusSeatFunc(seatId: number) {
    const targetSeat = await getSeatById(database!, seatId)
    console.log("Focus ", targetSeat);
    
    if (targetSeat === null) {
      return
    }

    // We need to switch current layer because seat is somewhere else.
    if (targetSeat.floor_id !== layerId) {
      console.log("Set layer id to ", targetSeat.floor_id, targetSeat);
      
      setLayerId(targetSeat.floor_id)
    }

    setTimeout(() => {
      setFocusSeat(seats.find(x => x.id === seatId))
    }, 50)
  }

  /// Later called by map after startGuestOccupation() has been called.
  async function occupySeat(seatId: number, guest: IGuest) {
    await assignSeat(database!, guest, seatId)

    await refreshGuests()
    setGuestEdit(true)
    setAssignGuest(undefined)
    setOccupations(await getSeatOccupations(database!))
  }

  async function removeSeat(seatId: number) {
    if (database === null) return

    deleteSeat(database, seatId)
    setSeats((await getSeats(database!, layerId))!)
  }

  async function addNewGuest(guest: IGuest) {
    if (database === null) return

    addGuest(database, guest)
    refreshGuests()
  }

  async function removeGuest(guestId: number) {
    if (database === null) return

    deleteGuest(database, guestId)
    refreshGuests()
  }

  function back() {
    router.push({
      pathname: "/"
    })
  }

  async function editGuests() {
    refreshGuests()
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
    loadDatabase().then(async () => {
      console.log("Set layer id after db init");

      setLayerId(1)
      setGuests((await getGuests(database!))!)
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
            db={database!}
            mapUrl={mapUrl}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            enableSeatEdit={seatEdit}
            seats={seats}
            guests={guests}
            assignGuest={assignGuest}
            occupations={occupations}
            addNewSeat={addNewSeat}
            removeSeat={removeSeat}
            occupySeat={occupySeat}
            focusSeat={focusSeat}
          />

          <GuestModal
            t={t}
            visible={guestModal}
            closeHandler={() => { setGuestModal(false) }}
            addGuest={addNewGuest}
          />

          <AnimatePresence mode="wait">
            <Sidebar key={"guest-sidebar"} show={guestEdit}>
              <div className="flex gap-4">
                <Input
                  contentLeft={<SearchIcon />}
                  bordered
                  clearable
                  width="100%"
                  css={{ backgroundColor: "rgba(var(--background-rgb), 0.3)" }}
                  onChange={(e) => { setGuestSearch(e.target.value) }}
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
                updateGuests={refreshGuests}
                startGuestOccupation={startGuestOccupation}
                toggleGuest={toggleGuest}
                focusSeat={focusSeatFunc}
              />
            </Sidebar>

            {seatEdit && <>
              <motion.div
                className="flex gap-2 absolute bottom-0 left-0 p-2 pr-5 pl-5 z-20 items-center map-edit-mode"
                key="edit-bar"
                animate={{ y: 0, opacity: 1 }}
                initial={{ y: 100, opacity: 0 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "tween", ease: [0.33, 1, 0.68, 1] }}
              >
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
              </motion.div>
            </>
            }

            {assignGuest !== undefined && <>
              <motion.div
                className="flex gap-2 absolute bottom-0 left-0 p-2 pr-5 pl-5 z-20 items-center map-edit-mode"
                key="assign-bar"
                animate={{ y: 0, opacity: 1 }}
                initial={{ y: 100, opacity: 0 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "tween", ease: [0.33, 1, 0.68, 1] }}
              >
                <ChairIcon />
                <Text h3 className="m-0">{t("map.assign")}</Text>
                <Spacer x={.5} />
                <Text>{ assignGuest.firstName } { assignGuest.lastName }</Text>
              </motion.div>
            </>
            }
          </AnimatePresence>
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