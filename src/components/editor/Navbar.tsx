import { Button, Dropdown, Modal, Spacer, Text, Tooltip } from "@nextui-org/react";
import { ArrowLeftIcon } from "../icons/ArrowLeftIcon";
import { LayerIcon } from "../icons/LayerIcon";
import { EditIcon } from "../icons/EditIcon";
import { UsersIcon } from "../icons/UsersIcon";
import { SearchIcon } from "../icons/SearchIcon";
import { useTranslation } from "react-i18next";
import { TFunction } from "next-i18next";
import { IFloor, getFloors } from "../Database";
import { useMemo, useState } from "react";
import Database from "tauri-plugin-sql-api";
import { SettingsIcon } from "../icons/SettingsIcon";
import { LayerManager } from "../LayerManager";

export type OnClickType = () => void;
export type OnLayerChange = (id: number) => void;

export type EditorNavbarProps = {
    onSelectLayer: OnLayerChange
    onEditLayer: OnClickType
    onEditGuests: OnClickType
    onBack: OnClickType
    t: TFunction
    db: Database | null
}

/** I know this is ugly. But I see no other way passing a "settings" button
 *  into a dropdown that only accepts one array and no custom elements. */
const MAGICAL_SETTINGS_ID = 6969

export const EditorNavbar: React.FC<EditorNavbarProps> = ({ onEditGuests, onEditLayer, onSelectLayer, onBack, db, ...props }) => {
    const [floors, setFloors] = useState<IFloor[]>([])
    const [editActive, setEditActive] = useState(false)
    const [settings, setSettings] = useState(false)

    const [selected, setSelected] = useState(new Set([1]))

    useMemo(
        () => {
            onSelectLayer(selected.keys().next().value)
        },
        [selected]
    );

    function changeSelection(selection: any) {
        const id = Number.parseInt(Array.from(selection).join(""))
        if (id == MAGICAL_SETTINGS_ID) {
            setSettings(true)

            return
        }

        setSelected(new Set([id]))
    }

    const { t } = useTranslation('common')

    useMemo(() => {
        if (db !== null) {
            getFloors(db).then(f => {
                if (f !== null) {
                    console.log("Fetched floors: ", f)

                    // Fake floor that acts as settings.
                    let settingsFloor: IFloor = {
                        id: MAGICAL_SETTINGS_ID,
                        image: new Uint8Array(),
                        level: -1,
                        name: t("settings")
                    }

                    const copy = f

                    copy.push(settingsFloor)

                    setFloors(copy)
                }
            })
        } else {
            console.log("Couldn't fetch floors since database is null.")
        }

    }, [db])

    function editClicked() {
        setEditActive(!editActive)
        onEditLayer()
    }

    function renderDropdownItem(item: IFloor): JSX.Element {
        if (item.id === MAGICAL_SETTINGS_ID) {
            return <Dropdown.Item
                key={item.id}
                withDivider
                icon={<SettingsIcon />}
            >
                {item.name}
            </Dropdown.Item>
        } else {
            return <Dropdown.Item key={item.id}>{item.name}</Dropdown.Item>
        }
    }

    return (
        <div className="flex controlpanel">
            <div className="flex w-full justify-start items-center">
                <Tooltip onClick={onBack} content={t("map.close_project")} placement="bottomStart">
                    <ArrowLeftIcon />
                </Tooltip>
            </div>
            <div className="flex w-full gap-10 p-1 justify-center items-center">
                <Tooltip content={t("map.select_layer")} isDisabled={editActive} placement="bottom">
                    <Dropdown isDisabled={editActive}>
                        <Dropdown.Button disabled={editActive} light css={{ padding: "0" }}>
                            <LayerIcon />
                            <Spacer x={.5} />
                            <Text className="ml-3" color={editActive ? "gray" : ""}>{t("map.select_layer")}</Text>
                        </Dropdown.Button>

                        <Dropdown.Menu
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={selected}
                            onSelectionChange={changeSelection}
                            items={floors}
                        >
                            {(item => (
                                renderDropdownItem(item as IFloor)
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>

                    <Modal
                        closeButton
                        width="600px"
                        open={settings}
                        onClose={() => { setSettings(false) }}
                    >
                        <Modal.Header>
                            <Text h1 size={18}>{t("settings")}</Text>
                        </Modal.Header>
                        <Modal.Body>
                            <LayerManager schematics={floors} setSchematics={setFloors} />
                            <Spacer y={1} />
                        </Modal.Body>
                    </Modal>
                </Tooltip>
                <Tooltip onClick={editClicked} content={t("map.edit_layer")} placement="bottom">
                    <Button
                        light={!editActive}
                        flat={editActive}
                        color={editActive ? "primary" : "default"}
                        bordered={editActive}
                        css={{ padding: "0", margin: "0" }}
                    >
                        <EditIcon />
                        <Spacer x={.5} />
                        <Text color={editActive ? "primary" : "white"} className="ml-3">{t("map.edit_layer")}</Text>
                    </Button>
                </Tooltip>
                <Tooltip isDisabled={editActive} content={t("map.edit_guests")} placement="bottom">
                    <Button
                        light
                        auto
                        css={{ padding: "0" }}
                        icon={<UsersIcon />}
                        onPress={() => { if (!editActive) onEditGuests() }}
                        disabled={editActive}
                    >
                        <Text className="ml-3" color={editActive ? "gray" : ""}>{t("map.edit_guests")}</Text>
                    </Button>
                </Tooltip>
            </div>
            <div className="flex w-full justify-end items-center">
                <SearchIcon />
            </div>
        </div>
    )
}