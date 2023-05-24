import styles from './Map.module.css';
import { ImageOverlay, MapContainer, Marker, Popup, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS, LatLng, latLng, latLngBounds } from 'leaflet';
import { Dispatch, SetStateAction, useState } from 'react';

export type MapProps = {
    mapUrl: string,
    mapWidth: number,
    mapHeight: number,
    enableSeatEdit?: boolean
}

function SeatViewer() {
    const [seats, setSeats] = useState([latLngBounds([[0, 0], [0, 0]])])
    const [initialPosition, setInitialPosition] = useState(latLng(0, 0))
    const [endPosition, setEndPosition] = useState(latLng(0, 0))
    const map = useMapEvents({
        mousedown(e) {
            map.dragging.disable()
            setInitialPosition(e.latlng)
            setEndPosition(e.latlng)
        },
        mousemove(e) {
            if (initialPosition.lat !== 0 && initialPosition.lng !== 0) {
                setEndPosition(e.latlng)
            }
        },
        mouseup() {
            map.dragging.enable()

            const clone = seats
            clone.push(latLngBounds([initialPosition.lat, initialPosition.lng], [endPosition.lat, endPosition.lng]))
            setSeats(clone)

            console.log("List:", seats);


            setInitialPosition(latLng(0, 0))
            setEndPosition(latLng(0, 0))
        }
    })

    return <>
        {seats.map(x => (
            <Rectangle bounds={x} />
        ))}

        {initialPosition.lat != 0 &&
            <Rectangle bounds={latLngBounds([initialPosition.lat, initialPosition.lng], [endPosition.lat, endPosition.lng])} />}
    </>
}

function PreserveLocation({ ...props }) {
    console.log(props);
    
    const map = useMapEvents({
        zoomend(e) {
            sessionStorage.setItem("zoom", map.getZoom().toString())
        },
        dragend(e) {
            sessionStorage.setItem("center", `${map.getCenter().lat.toString()} ${map.getCenter().lng.toString()}`)
        }
    })

    return (<></>)
}

export const Map: React.FC<MapProps> = ({
    mapHeight,
    mapUrl,
    mapWidth,
    enableSeatEdit,
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
            { (enableSeatEdit || false) && <SeatViewer />}

            <ImageOverlay
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                opacity={enableSeatEdit ? 0.5 : 1}
                url={mapUrl}>
            </ImageOverlay>

            <Marker position={[0.0, 0.0]} draggable={true}>
                <Popup>Hey ! I live here</Popup>
            </Marker>
        </MapContainer >
    )
}