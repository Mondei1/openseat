import styles from './Map.module.css';
import { ImageOverlay, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS, latLngBounds } from 'leaflet';

export default function Map(props: any) {
    console.log("Display map", props.mapUrl);

    let { mapWidth, mapHeight } = props    
    mapWidth *= 0.7
    mapHeight *= 0.7

    let bounds = latLngBounds([0.0, mapWidth], [mapHeight, 0.0])

    return (
        <MapContainer
            center={bounds.getCenter()}
            zoom={0}
            minZoom={0}
            maxZoom={3}
            zoomControl={false}
            scrollWheelZoom={true}
            maxBoundsViscosity={0.8}
            className={styles.map}
            maxBounds={bounds}
            crs={CRS.Simple}
        >
            
            <ImageOverlay
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                url={props.mapUrl}>
            </ImageOverlay>

            <Marker position={[0.0, 0.0]} draggable={true}>
                <Popup>Hey ! I live here</Popup>
            </Marker>
        </MapContainer >
    );
}