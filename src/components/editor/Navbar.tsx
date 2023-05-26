import { Text, Tooltip } from "@nextui-org/react";
import { ArrowLeftIcon } from "../icons/ArrowLeftIcon";
import { LayerIcon } from "../icons/LayerIcon";
import { EditIcon } from "../icons/EditIcon";
import { UsersIcon } from "../icons/UsersIcon";
import { SearchIcon } from "../icons/SearchIcon";
import { useTranslation } from "react-i18next";
import { TFunction } from "next-i18next";

export type OnClickType = () => void;

export type EditorNavbarProps = {
    onSelectLayer: OnClickType,
    onEditLayer: OnClickType,
    onEditGuests: OnClickType,
    onBack: OnClickType
    t: TFunction
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({ onEditGuests, onEditLayer, onSelectLayer, onBack, ...props }) => {
    const { t } = useTranslation('common')

    return (
        <div className="flex controlpanel">
            <div className="flex w-full justify-start items-center">
                <Tooltip onClick={onBack} content={t("map.close_project")} placement="bottomStart">
                    <ArrowLeftIcon />
                </Tooltip>
            </div>
            <div className="flex w-full gap-10 p-2 justify-center items-center">
                <Tooltip onClick={onSelectLayer} content={t("map.select_layer")} placement="bottom">
                    <LayerIcon />
                    <Text className="ml-3">{t("map.select_layer")}</Text>
                </Tooltip>
                <Tooltip onClick={onEditLayer} content={t("map.edit_layer")} placement="bottom">
                    <EditIcon />
                    <Text className="ml-3">{t("map.edit_layer")}</Text>
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