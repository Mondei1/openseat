import { Button, Dropdown, Spacer, Text, Tooltip } from "@nextui-org/react";
import { ArrowLeftIcon } from "../icons/ArrowLeftIcon";
import { LayerIcon } from "../icons/LayerIcon";
import { EditIcon } from "../icons/EditIcon";
import { UsersIcon } from "../icons/UsersIcon";
import { SearchIcon } from "../icons/SearchIcon";
import { useTranslation } from "react-i18next";
import { TFunction } from "next-i18next";
import { SettingsIcon } from "../icons/SettingsIcon";
import { useDatabase } from "../DatabaseContext";
import { IFloor, getFloors } from "../Database";
import { useEffect, useState } from "react";

export type OnClickType = () => void;

export type EditorNavbarProps = {
    onSelectLayer: OnClickType,
    onEditLayer: OnClickType,
    onEditGuests: OnClickType,
    onBack: OnClickType
    t: TFunction
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({ onEditGuests, onEditLayer, onSelectLayer, onBack, ...props }) => {
    const [floors, setFloors] = useState<Array<IFloor>>([])
    const [editActive, setEditActive] = useState(false)

    const { t } = useTranslation('common')
    const { database } = useDatabase()

    useEffect(() => {
        if (database !== null) {
            getFloors(database).then(f => {
                if (f !== null) {
                    console.log("Fetched floors: ", f)

                    setFloors(f)
                }
            })
        } else {
            console.log("Couldn't fetch floors since database is null.")
        }
    })

    function editClicked() {
        setEditActive(!editActive)
        onEditLayer()
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
                    <Dropdown>
                        <Dropdown.Button light css={{ padding: "0", margin: "0" }}>
                            <LayerIcon />
                            <Spacer x={.5} />
                            <Text className="ml-3">{t("map.select_layer")}</Text>
                        </Dropdown.Button>

                        <Dropdown.Menu
                            disallowEmptySelection
                            selectionMode="single"
                        >
                            <Dropdown.Item
                                withDivider
                                variant="solid"
                                icon={<SettingsIcon />}>{t("settings")}</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Tooltip>
                <Tooltip onClick={editClicked} content={t("map.edit_layer")} placement="bottom">
                    <Button
                        light
                        color={editActive ? "primary" : "default"}
                        bordered={editActive}
                        css={{ padding: "0", margin: "0" }}
                    >
                        <EditIcon />
                        <Spacer x={.5} />
                        <Text color={editActive ? "primary": "white"} className="ml-3">{t("map.edit_layer")}</Text>
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