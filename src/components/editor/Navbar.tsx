import { Button, Dropdown, Spacer, Text, Tooltip } from "@nextui-org/react";
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

export const EditorNavbar: React.FC<EditorNavbarProps> = ({ onEditGuests, onEditLayer, onSelectLayer, onBack, db, ...props }) => {
    const [floors, setFloors] = useState<IFloor[]>([])
    const [editActive, setEditActive] = useState(false)

    const [selected, setSelected] = useState(new Set([1]));

    useMemo(
        () => {
            const id = Number.parseInt(Array.from(selected).join(""))
            onSelectLayer(id)
        },
        [selected]
    );

    const { t } = useTranslation('common')

    useMemo(() => {
        if (db !== null) {
            getFloors(db).then(f => {
                if (f !== null) {
                    console.log("Fetched floors: ", f)

                    // Fake floor that acts as settings.
                    let settingsFloor: IFloor = {
                        id: 6969,
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

        console.log(floors);

    }, [db])

    function editClicked() {
        setEditActive(!editActive)
        onEditLayer()
    }

    function renderDropdownItem(item: object): JSX.Element {
        if (item.id === 6969) {
            return <Dropdown.Item key={item.id} withDivider icon={<SettingsIcon />}>{item.name}</Dropdown.Item>
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
                <Tooltip content={t("map.select_layer")} placement="bottom">
                    <Dropdown isDisabled={editActive}>
                        <Dropdown.Button light css={{ padding: "0", margin: "0" }}>
                            <LayerIcon />
                            <Spacer x={.5} />
                            <Text className="ml-3">{t("map.select_layer")}</Text>
                        </Dropdown.Button>

                        <Dropdown.Menu
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={selected}
                            onSelectionChange={setSelected}
                            items={floors}
                        >
                            {(item => (
                                renderDropdownItem(item)
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
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
                <Tooltip onClick={onEditGuests} content={t("map.edit_guests")} placement="bottom">
                    <UsersIcon />
                    <Text className="ml-3">{t("map.edit_guests")}</Text>
                </Tooltip>
            </div>
            <div className="flex w-full justify-end items-center">
                <SearchIcon />
            </div>
        </div>
    )
}