import styles from './Map.module.css';
import { ImageOverlay, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { CRS } from 'leaflet';

export default function Map(props: any) {
    console.log("Display map", props.mapUrl);

    let { mapWidth, mapHeight } = props    

    return (
        <MapContainer
            center={[0, 0]}
            zoom={3}
            scrollWheelZoom={true}
            className={styles.map}
            bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
            crs={CRS.Simple}
        >
            
            <ImageOverlay
                bounds={[[0.0, mapWidth], [mapHeight, 0.0]]}
                zIndex={10}
                opacity={1}
                url={props.mapUrl}>
            </ImageOverlay>

            <Marker position={[0.0, 0.0]} draggable={true}>
                <Popup>Hey ! I live here</Popup>
            </Marker>
        </MapContainer >
    );
}