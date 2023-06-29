import styles from './Map.module.css';
import L from "leaflet";
import { ImageOverlay, MapContainer, Marker, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS, LatLng, latLng, latLngBounds, LatLngBounds } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { IGuest, ISeat, ISeatOccupation, getGuestsOnSeat } from './Database';
import { Dropdown } from '@nextui-org/react';
import { DeleteIcon } from './icons/DeleteIcon';
import { TFunction } from 'next-i18next';
import { UsersIcon } from './icons/UsersIcon';
import Database from 'tauri-plugin-sql-api';
import { useAsync } from 'react-async';

interface IMapSeat extends ISeat {
    bounds?: LatLngBounds,
    divIcon?: L.DivIcon,
    textPosition?: LatLng,
    fillColor?: string,
    occupation?: ISeatOccupation
}

export type MapProps = {
    t: TFunction,
    db: Database,
    mapUrl: string,
    mapWidth: number,
    mapHeight: number,
    enableSeatEdit?: boolean,
    seats: ISeat[],
    guests: IGuest[],

    /// Stores amount of needed occupation space
    assignGuest?: IGuest,
    occupations?: ISeatOccupation[],
    focusSeat?: ISeat

    addNewSeat: (seat: LatLngBounds) => Promise<void>,
    removeSeat: (seatId: number) => void,
    occupySeat: (seatId: number, guest: IGuest) => void
}

type SeatViewerProps = {
    seats: ISeat[],

    /// Stores amount of needed occupation space
    assignGuest?: IGuest,
    occupations?: ISeatOccupation[],

    addNewSeat: (seat: LatLngBounds) => Promise<void>,
    occupySeat: (seatId: number, guest: IGuest) => void,
    enableSeatEdit: boolean,
    focusSeat?: ISeat
}

type SeatEditDropdownProps = {
    t: TFunction,
    seats: ISeat[],
    enableSeatEdit: boolean,
    removeSeat: (seatId: number) => void
}

type SeatDropdownProps = {
    t: TFunction,
    db: Database,
    occupations?: ISeatOccupation[],
    seats: ISeat[],
    guests: IGuest[]
}

const SeatViewer: React.FC<SeatViewerProps> = ({ seats, addNewSeat, enableSeatEdit, assignGuest, occupations, occupySeat, focusSeat }) => {
    const [initialPosition, setInitialPosition] = useState(latLng(0, 0))
    const [endPosition, setEndPosition] = useState(latLng(0, 0))

    let mapSeats: IMapSeat[] = seats
    mapSeats.map(x => {
        x.bounds = latLngBounds([x.lat1, x.lng1], [x.lat2, x.lng2])

        let textPosition = x.bounds.getCenter().clone()
        textPosition.lng -= 0

        x.textPosition = textPosition
        x.fillColor = "#4BB2F2"

        if (occupations !== undefined) {
            let occupation = occupations.find(o => o.id == x.id)

            if (occupation === undefined) {
                x.divIcon = L.divIcon({ html: `<p>Sitz ${x.name}</p><br /><small>${x.capacity} Plätze frei</small>`, className: "map-marker", iconSize: L.point(128, 32) })
            } else {
                x.occupation = occupation
                x.divIcon = L.divIcon({ html: `<p>Sitz ${x.name}</p><br /><small>${x.occupation!.left} Plätze frei</small>`, className: "map-marker", iconSize: L.point(128, 32) })
            }
        } else {
            x.divIcon = L.divIcon({ html: `<p>Sitz ${x.name}</p>`, className: "map-marker", iconSize: L.point(128, 32) })
        }

        if (assignGuest !== undefined && occupations !== undefined) {
            // Occupation of this seat
            if (x.occupation === undefined) {
                x.occupation = {
                    guests: [],
                    id: x.id,
                    left: x.capacity,
                    occupied: 0
                }
            }

            if (x.occupation!.left < (assignGuest.additionalGuestAmount + 1)) {
                x.fillColor = "#F23838"
            }
        }
    })

    useMemo(() => {
        if (focusSeat === null || focusSeat === undefined) {
            return
        }

        const seat = convertToMapSeat([focusSeat])[0]

        const targetSeat = mapSeats.find(x => x.id = focusSeat.id)
        if (targetSeat === undefined) {
            return
        }

        const oldColor = targetSeat.fillColor
        targetSeat.fillColor = "#a32372"

        setTimeout(() => {
            targetSeat.fillColor = oldColor
        }, 1000)
    }, [focusSeat])

    const map = useMapEvents({
        click(e) {
            if (assignGuest !== undefined && occupations !== undefined) {
                const seat = getSeatAt(map, mapSeats, e.containerPoint)

                if (seat === null) {
                    return
                }

                if (seat.occupation?.left! < (assignGuest.additionalGuestAmount + 1)) {
                    return
                }

                occupySeat(seat.id, assignGuest)
            }
        },
        mousedown(e) {
            if (!enableSeatEdit) {
                return
            }

            if (e.originalEvent.button === 2) {
                return
            }

            map.dragging.disable()
            setInitialPosition(e.latlng)
            setEndPosition(e.latlng)
        },
        mousemove(e) {
            if (initialPosition.lat !== 0 && initialPosition.lng !== 0) {
                setEndPosition(e.latlng)
            }
        },
        mouseup(e) {
            if (!enableSeatEdit) {
                return
            }

            if (e.originalEvent.button === 2) {
                return
            }

            map.dragging.enable()
            addNewSeat(latLngBounds([initialPosition.lat, initialPosition.lng], [endPosition.lat, endPosition.lng]))

            setInitialPosition(latLng(0, 0))
            setEndPosition(latLng(0, 0))
        }
    })

    return <>
        {mapSeats.map(x => (
            <Rectangle key={x.id.toString() + x.lat1 + x.lng1} color={x.fillColor} bounds={x.bounds!} fillOpacity={0.6}>
                <Marker position={x.textPosition!} icon={x.divIcon} />
            </Rectangle>
        ))}

        {initialPosition.lat != 0 &&
            <Rectangle key={initialPosition.toString()} bounds={latLngBounds([initialPosition.lat, initialPosition.lng], [endPosition.lat, endPosition.lng])} />}
    </>
}

// This stores the current position in session storage. This way the map wont reset after state change.
function PreserveLocation({ ...props }) {
    const map = useMapEvents({
        zoomend(e) {
            sessionStorage.setItem("zoom", map.getZoom().toString())
            sessionStorage.setItem("center", `${map.getCenter().lat.toString()} ${map.getCenter().lng.toString()}`)
        },
        dragend(e) {
            sessionStorage.setItem("center", `${map.getCenter().lat.toString()} ${map.getCenter().lng.toString()}`)
        }
    })

    useEffect(() => {
        console.log("MAP going to focus ", props.focusSeat);
        
        if (props.focusSeat !== undefined) {
            const seat = convertToMapSeat([props.focusSeat])[0]
            map.flyTo(latLng(seat.bounds?.getCenter()!), 1, { duration: 0.2 })

            sessionStorage.setItem("zoom", map.getZoom().toString())
            sessionStorage.setItem("center", `${seat.bounds!.getCenter().lat.toString()} ${seat.bounds!.getCenter().lng.toString()}`)
        }
    }, [props.focusSeat])

    return (<></>)
}

function convertToMapSeat(seats: ISeat[]): IMapSeat[] {
    let mapSeats: IMapSeat[] = seats
    mapSeats.map(x => {
        x.bounds = latLngBounds([x.lat1, x.lng1], [x.lat2, x.lng2])
        x.divIcon = L.divIcon({ html: "Sitz " + x.name, className: "map-marker" })
    })

    return mapSeats
}

function getSeatAt(map: L.Map, mapSeats: IMapSeat[], point: L.Point) {
    // Figure out which rectangle was right clicked
    for (let i = 0; i < mapSeats.length; i++) {
        let seat = mapSeats[i]

        if (seat.bounds?.contains(map.containerPointToLatLng(point))) {
            return seat
        }
    }

    return null
}

const SeatDropdown: React.FC<SeatDropdownProps> = ({ t, db, seats, guests, occupations, ...props }) => {
    let [showContextMenu, setShowContextMenu] = useState(false)
    let [contextMenuCoords, setContextMenuCoords] = useState<number[]>([])
    let [targetSeat, setTargetSeat] = useState<IMapSeat | null>()
    let [seatedGuests, setSeatedGuests] = useState<IGuest[] | null>(null)

    const map = useMapEvents({
        click(e) {
            setShowContextMenu(false)

            // Fake guest to display total occupation in dropdown.
            const fakeGuest: IGuest = {
                id: -1,
                additionalGuestAmount: 0,
                additionalGuestCheckedin: 0,
                checkedIn: false,
                firstName: "",
                lastName: ""
            }

            const mapSeats = convertToMapSeat(seats)
            const localTargetSeat = getSeatAt(map, mapSeats, e.containerPoint)

            // No seat found. Ignore.
            if (localTargetSeat === null || localTargetSeat === undefined) {
                console.log("No valid seat clicked ", getSeatAt(map, mapSeats, e.containerPoint), " ", localTargetSeat);

                return (<></>)
            }

            let occupation = occupations?.find(x => x.id == localTargetSeat!.id)?.guests
            if (occupation === null || occupation === undefined) {
                setSeatedGuests([fakeGuest])
            } else {
                let guestsAtSeat: IGuest[] = []

                for (let i = 0; i < occupation.length; i++) {
                    const guestId = occupation[i]
                    const guest = guests.find(x => x.id === guestId)

                    if (guest === undefined) {
                        continue
                    }

                    guestsAtSeat.push(guest)
                }

                guestsAtSeat.push(fakeGuest)

                setSeatedGuests(guestsAtSeat)
            }

            setContextMenuCoords([e.containerPoint.x, e.containerPoint.y])
            setShowContextMenu(true)
            setTargetSeat(localTargetSeat)
        }
    })

    if (occupations === undefined) {
        return (<></>)
    }

    const thisSeat = occupations.find(x => x.id == targetSeat?.id)
    if (thisSeat === undefined) {
        return (<></>)
    }

    return (<>
        <Dropdown isOpen={showContextMenu} onClose={() => setTargetSeat(null)}>
            { /* @ts-ignore */}
            <Dropdown.Trigger style={{ position: "absolute", opacity: 0.5, zIndex: 999999, top: `${contextMenuCoords[1]}px`, left: `${contextMenuCoords[0]}px` }}>
                <div></div>
            </Dropdown.Trigger>
            <Dropdown.Menu
                variant="light"
                aria-label="Actions"
                disabledKeys={["people"]}
                items={seatedGuests || []}
                onAction={(key) => {
                    if (key.toString() == "delete") {

                    }
                }}
            >
                {(item: any) =>
                    item.id === -1 ?
                        <Dropdown.Item key="people" icon={<UsersIcon />} withDivider={seatedGuests!.length > 1}>
                            {t("seats")}: {thisSeat.occupied} {t("of")} {targetSeat?.capacity}
                        </Dropdown.Item> :
                        <Dropdown.Item key={"i" + item.id}>
                            {item.firstName} {item.lastName} + <b>{item.additionalGuestAmount}</b>
                        </Dropdown.Item>
                }
            </Dropdown.Menu>
        </Dropdown>
    </>)
}

const SeatEditDropdown: React.FC<SeatEditDropdownProps> = ({ seats, enableSeatEdit, removeSeat, t, ...props }) => {
    let [showContextMenu, setShowContextMenu] = useState(false)
    let [contextMenuCoords, setContextMenuCoords] = useState<number[]>([])
    let [targetSeat, setTargetSeat] = useState<IMapSeat | null>()

    const map = useMapEvents({
        click(e) {
            if (showContextMenu) {
                setShowContextMenu(false)
            }
        },
        contextmenu(e) {
            if (!enableSeatEdit) {
                return
            }

            const mapSeats = convertToMapSeat(seats)
            setTargetSeat(getSeatAt(map, mapSeats, e.containerPoint))

            // No seat found. Ignore.
            if (targetSeat === null) {
                return
            }

            setContextMenuCoords([e.containerPoint.x, e.containerPoint.y])
            setShowContextMenu(!showContextMenu)
        }
    })

    return (<>
        <Dropdown isOpen={showContextMenu} onClose={() => setTargetSeat(null)}>
            { /* @ts-ignore */}
            <Dropdown.Trigger style={{ position: "absolute", opacity: 0.5, zIndex: 999999, top: `${contextMenuCoords[1]}px`, left: `${contextMenuCoords[0]}px` }}>
                <div></div>
            </Dropdown.Trigger>
            <Dropdown.Menu
                variant="light"
                aria-label="Actions"
                disabledKeys={["name"]}
                onAction={(key) => {
                    if (key.toString() == "delete") {
                        removeSeat(targetSeat?.id!)
                    }
                }}
            >
                <Dropdown.Item key="delete" color="error" icon={<DeleteIcon />}>
                    Löschen
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    </>)
}

export const Map: React.FC<MapProps> = ({
    mapHeight,
    mapUrl,
    mapWidth,
    enableSeatEdit,
    seats,
    guests,
    assignGuest,
    occupySeat,
    occupations,
    addNewSeat: setSeats,
    removeSeat,
    focusSeat,
    t,
    db,
    ...props
}) => {
    mapWidth *= 0.7
    mapHeight *= 0.7

    const MARGIN = 250;

    let bounds = latLngBounds([-MARGIN, mapWidth + MARGIN], [mapHeight + MARGIN, -MARGIN])
    let center = bounds.getCenter()

    let lastPos = sessionStorage.getItem("center")
    if (lastPos !== null) {
        center = latLng(Number.parseFloat(lastPos.split(" ")[0]), Number.parseFloat(lastPos.split(" ")[1]))
    }
    let zoom = sessionStorage.getItem("zoom") !== null ? Number.parseInt(sessionStorage.getItem("zoom")!) : 0

    return (
        <MapContainer
            key="map"
            center={center}
            zoom={zoom}
            minZoom={0}
            maxZoom={3}
            zoomControl={false}
            scrollWheelZoom={true}
            maxBoundsViscosity={0.3}
            className={styles.map}
            maxBounds={bounds}
            crs={CRS.Simple}
        >

            <PreserveLocation key="pl" focusSeat={focusSeat} />
            <SeatDropdown guests={guests} key="sd" t={t} db={db} seats={seats} occupations={occupations} />
            <SeatEditDropdown key="sed" t={t} seats={seats} enableSeatEdit={enableSeatEdit!} removeSeat={removeSeat} />

            <SeatViewer
                key="sv"
                seats={seats}
                addNewSeat={setSeats}
                enableSeatEdit={enableSeatEdit!}
                occupySeat={occupySeat}
                assignGuest={assignGuest}
                occupations={occupations}
                focusSeat={focusSeat}
            />

            <ImageOverlay
                key="io"
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                opacity={enableSeatEdit ? 0.5 : 1}
                url={mapUrl}>
            </ImageOverlay>
        </MapContainer >
    )
}