import styles from './Map.module.css';
import L from "leaflet";
import { ImageOverlay, MapContainer, Marker, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS, LatLng, latLng, latLngBounds, LatLngBounds } from 'leaflet';
import { Dispatch, SetStateAction, useState } from 'react';
import { ISeat, deleteSeat } from './Database';
import { Dropdown } from '@nextui-org/react';
import { DeleteIcon } from './icons/DeleteIcon';

interface IMapSeat extends ISeat {
    bounds?: LatLngBounds,
    divIcon?: L.DivIcon
}

export type MapProps = {
    mapUrl: string,
    mapWidth: number,
    mapHeight: number,
    enableSeatEdit?: boolean,
    seats: ISeat[],
    addNewSeat: (seat: LatLngBounds) => Promise<void>
}

type SeatViewerProps = {
    seats: ISeat[],
    addNewSeat: (seat: LatLngBounds) => Promise<void>
}

type SeatDropdownProps = {
    seats: ISeat[],
    enableSeatEdit: boolean
}

const SeatViewer: React.FC<SeatViewerProps> = ({ seats, addNewSeat }) => {
    const [initialPosition, setInitialPosition] = useState(latLng(0, 0))
    const [endPosition, setEndPosition] = useState(latLng(0, 0))
    const map = useMapEvents({
        mousedown(e) {
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
            if (e.originalEvent.button === 2) {
                return
            }

            map.dragging.enable()
            addNewSeat(latLngBounds([initialPosition.lat, initialPosition.lng], [endPosition.lat, endPosition.lng]))

            console.log("List:", seats);

            setInitialPosition(latLng(0, 0))
            setEndPosition(latLng(0, 0))
        }
    })

    let mapSeats: IMapSeat[] = seats
    mapSeats.map(x => {
        x.bounds = latLngBounds([x.lat1, x.lng1], [x.lat2, x.lng2])
        x.divIcon = L.divIcon({ html: "Sitz " + x.name, className: "map-marker" })
    })

    return <>
        {mapSeats.map(x => (
            <>
                <Rectangle key={x.id.toString()} bounds={x.bounds!}>
                    <Marker position={x.bounds!.getCenter()} title='Test' icon={x.divIcon} />
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

const SeatDropdown: React.FC<SeatDropdownProps> = ({ seats, enableSeatEdit, ...props }) => {
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
            console.log("Open context menu at: ", e.containerPoint)

            if (!enableSeatEdit) {
                return
            }

            let mapSeats: IMapSeat[] = seats
            mapSeats.map(x => {
                x.bounds = latLngBounds([x.lat1, x.lng1], [x.lat2, x.lng2])
                x.divIcon = L.divIcon({ html: "Sitz " + x.name, className: "map-marker" })
            })
            
            // Figure out which rectangle was right clicked
            for (let i = 0; i < mapSeats.length; i++) {
                let seat = mapSeats[i]

                if (seat.bounds?.contains(map.containerPointToLatLng(e.containerPoint))) {
                    setTargetSeat(seat)                    
                }
            }

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
            <Dropdown.Trigger style={{ position: "absolute", opacity: 0.5, zIndex: 999999, top: `${contextMenuCoords[1]}px`, left: `${contextMenuCoords[0]}px` }}>
                <div></div>
            </Dropdown.Trigger>
            <Dropdown.Menu
                variant="light"
                aria-label="Actions"
                disabledKeys={["name"]}
                onSelectionChange={(key) => {
                    if (key.toString() == "delete") {
                        
                    }
                }}
            >
                <Dropdown.Item key="name" withDivider>{targetSeat?.name}</Dropdown.Item>
                <Dropdown.Item key="delete" color="error" withDivider>
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
    addNewSeat: setSeats,
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
            <SeatDropdown seats={seats} enableSeatEdit={enableSeatEdit!} />

            {(enableSeatEdit || false) && <SeatViewer seats={seats} addNewSeat={setSeats} />}

            <ImageOverlay
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                opacity={enableSeatEdit ? 0.5 : 1}
                url={mapUrl}>
            </ImageOverlay>
        </MapContainer >
    )
}