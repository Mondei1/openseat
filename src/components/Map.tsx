import styles from './Map.module.css';
import L from "leaflet";
import { ImageOverlay, MapContainer, Marker, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS, LatLng, latLng, latLngBounds, LatLngBounds } from 'leaflet';
import { useState } from 'react';
import { IGuest, ISeat, ISeatOccupation } from './Database';
import { Dropdown } from '@nextui-org/react';
import { DeleteIcon } from './icons/DeleteIcon';
import { TFunction } from 'next-i18next';
import { UsersIcon } from './icons/UsersIcon';

interface IMapSeat extends ISeat {
    bounds?: LatLngBounds,
    divIcon?: L.DivIcon,
    textPosition?: LatLng,
    fillColor?: string
}

export type MapProps = {
    t: TFunction,
    mapUrl: string,
    mapWidth: number,
    mapHeight: number,
    enableSeatEdit?: boolean,
    seats: ISeat[],

    /// Stores amount of needed occupation space
    assignGuest?: IGuest,
    occupations?: ISeatOccupation[],

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
    enableSeatEdit: boolean
}

type SeatEditDropdownProps = {
    t: TFunction,
    seats: ISeat[],
    enableSeatEdit: boolean,
    removeSeat: (seatId: number) => void
}

type SeatDropdownProps = {
    t: TFunction,
    seats: ISeat[]
}

const SeatViewer: React.FC<SeatViewerProps> = ({ seats, addNewSeat, enableSeatEdit, assignGuest, occupations, occupySeat }) => {
    const [initialPosition, setInitialPosition] = useState(latLng(0, 0))
    const [endPosition, setEndPosition] = useState(latLng(0, 0))

    let mapSeats: IMapSeat[] = seats
    mapSeats.map(x => {
        x.bounds = latLngBounds([x.lat1, x.lng1], [x.lat2, x.lng2])
        x.divIcon = L.divIcon({ html: "Sitz " + x.name, className: "map-marker", iconSize: L.point(128, 32) })

        let textPosition = x.bounds.getCenter().clone()
        textPosition.lng -= 0

        x.textPosition = textPosition
        x.fillColor = "#4BB2F2"
        
        if (assignGuest !== undefined && occupations !== undefined) {
            // Occupation of this seat
            let occupation = occupations.find(o => o.id == x.id)
            if (occupation === undefined) {
                return
            }

            if (occupation?.left < (assignGuest.additionalGuestAmount + 1)) {
                x.fillColor = "#F23838"
            }
        }
    })

    const map = useMapEvents({
        click(e) {
            if (assignGuest !== undefined && occupations !== undefined) {
                const seat = getSeatAt(map, mapSeats, e.containerPoint)
                let occupation = occupations.find(o => o.id == seat?.id)
                if (occupation === undefined) {
                    return
                }

                if (occupation?.left < (assignGuest.additionalGuestAmount + 1)) {
                    return
                }

                if (seat === null) {
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
            <>
                <Rectangle key={x.id.toString()} color={x.fillColor} bounds={x.bounds!} fillOpacity={0.6}>
                    <Marker position={x.textPosition!} icon={x.divIcon} />
                </Rectangle>
            </>
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

const SeatDropdown: React.FC<SeatDropdownProps> = ({ seats, t, ...props }) => {
    let [showContextMenu, setShowContextMenu] = useState(false)
    let [contextMenuCoords, setContextMenuCoords] = useState<number[]>([])
    let [targetSeat, setTargetSeat] = useState<IMapSeat | null>()

    const map = useMapEvents({
        click(e) {
            console.log(showContextMenu);
            
            if (showContextMenu) {
                setShowContextMenu(false)
                return
            }
            
            const mapSeats = convertToMapSeat(seats)
            setTargetSeat(getSeatAt(map, mapSeats, e.containerPoint))
        
            // No seat found. Ignore.
            if (targetSeat === null) {
                return
            }

            setContextMenuCoords([e.containerPoint.x, e.containerPoint.y])
            setShowContextMenu(true)
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
                disabledKeys={["people"]}
                onAction={(key) => {
                    if (key.toString() == "delete") {
                        
                    }
                }}
            >
                <Dropdown.Item key="people" icon={<UsersIcon />}>
                    {t("seats")}: 0 {t("of")} {targetSeat?.capacity}
                </Dropdown.Item>
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

            console.log("Open context menu at: ", e.containerPoint)

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
    assignGuest,
    occupySeat,
    occupations,
    addNewSeat: setSeats,
    removeSeat,
    t,
    ...props
}) => {
    mapWidth *= 0.7
    mapHeight *= 0.7

    let bounds = latLngBounds([0.0, mapWidth], [mapHeight, 0.0])
    let center = bounds.getCenter()

    if (typeof window === 'undefined') {
        return (<></>);
    }

    let lastPos = sessionStorage.getItem("center")
    if (lastPos !== null) {
        center = latLng(Number.parseFloat(lastPos.split(" ")[0]), Number.parseFloat(lastPos.split(" ")[1]))
    }
    let zoom = sessionStorage.getItem("zoom") !== null ? Number.parseInt(sessionStorage.getItem("zoom")!) : 0

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            minZoom={0}
            maxZoom={3}
            zoomControl={false}
            scrollWheelZoom={true}
            maxBoundsViscosity={0.8}
            className={styles.map}
            maxBounds={bounds}
            crs={CRS.Simple}
        >

            <PreserveLocation />
            <SeatDropdown t={t} seats={seats} />
            <SeatEditDropdown t={t} seats={seats} enableSeatEdit={enableSeatEdit!} removeSeat={removeSeat} />

            <SeatViewer
                seats={seats}
                addNewSeat={setSeats}
                enableSeatEdit={enableSeatEdit!}
                occupySeat={occupySeat}
                assignGuest={assignGuest}
                occupations={occupations}
            />

            <ImageOverlay
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                opacity={enableSeatEdit ? 0.5 : 1}
                url={mapUrl}>
            </ImageOverlay>
        </MapContainer >
    )
}