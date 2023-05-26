import { Col, Row, Text, Tooltip } from "@nextui-org/react"
import React, { Key, useState } from "react"
import { useTranslation } from "react-i18next"
import { IconButton } from "./IconButton"
import { ArrowUpIcon } from "./icons/ArrowUpIcon"
import { ArrowDownIcon } from "./icons/ArrowDownIcon"
import { DeleteIcon } from "./icons/DeleteIcon"
import { open } from "@tauri-apps/api/dialog";

interface ISchematicRow {
    level: number,
    name: string,
    path: string
}

interface ISchematicColumn {
    key: Key,
    label: string
}

type LayerSelectorProps = {
    schematics: ISchematicRow[],
    setSchematics: React.Dispatch<React.SetStateAction<ISchematicRow[]>>
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({ schematics, setSchematics, ...props }) => {
    const { t } = useTranslation('common')

    // Table structure
    const columns: Array<ISchematicColumn> = [
        {
            key: "level",
            label: t("level")!
        },
        {
            key: "name",
            label: t("name")!
        },
        {
            key: "path",
            label: t("file_path")!
        },
        {
            key: "actions",
            label: "Actions"
        }
    ]

    async function addSchematic() {
        const filePath = await open({
            filters: [{
                name: 'Image',
                extensions: ['png', 'jpg', 'jpeg']
            }],
            multiple: false
        });

        let parsedPath: string;
        if (Array.isArray(filePath)) {
            parsedPath = filePath[0];
        } else if (typeof filePath === "string") {
            parsedPath = filePath as string;
        } else {
            return;
        }

        console.log("Selected:", filePath);

        const newFloor: ISchematicRow = {
            level: schematics.length + 1,
            name: t("floor") + (schematics.length + 1),
            path: parsedPath
        }

        setSchematics((prev: any) => [
            ...prev,
            newFloor
        ])
    }

    function moveSchematic(level: number, direction: 'UP' | 'DOWN') {
        let clone = [...schematics]
        console.log(clone);

        const indexSrc = clone.findIndex(x => x.level === level)

        if (indexSrc === undefined || indexSrc === -1) {
            return
        }

        const indexDst = direction == 'UP' ? indexSrc - 1 : indexSrc + 1;

        console.log("Source index: " + indexSrc);
        console.log("Destination index: " + indexDst + " (max " + clone.length + ")");

        if (indexDst >= clone.length || indexDst < 0) {
            return
        }
        console.log("Swap ", clone[indexSrc].path + " with " + clone[indexDst].path)

        const srcClone = clone[indexSrc]
        clone[indexSrc] = clone[indexDst]
        clone[indexDst] = srcClone

        // Fix leveling
        for (let i = 0; i < clone.length; i++) {
            clone[i].level = i + 1
            console.log(`Set ${clone[i].path} to ${i + 1}`);
        }

        clone = clone.sort((a, b) => a.level - b.level)

        setSchematics([...clone])
    }

    function deleteSchematic(index: number) {
        const clone = schematics
        clone.splice(index, 1)
        setSchematics(clone)
    }


    const renderCell = (schematic: ISchematicRow, columnKey: React.Key) => {
        console.log("Render cell: ", schematic);

        // @ts-ignore
        const cellValue: any = schematic[columnKey];
        switch (columnKey) {
            case "level":
            case "name":
                return (
                    <Text>
                        {cellValue}
                    </Text>
                );

            case "actions":
                return (
                    <Row justify="center" align="center">
                        <Col css={{ d: "flex" }}>
                            <Tooltip content={t("up")}>
                                <IconButton onClick={() => moveSchematic(schematic.level, 'UP')}>
                                    <ArrowUpIcon size={20} />
                                </IconButton>
                            </Tooltip>
                        </Col>
                        <Col css={{ d: "flex" }}>
                            <Tooltip content={t("down")}>
                                <IconButton onClick={() => moveSchematic(schematic.level, 'DOWN')}>
                                    <ArrowDownIcon rotate={90} size={20} />
                                </IconButton>
                            </Tooltip>
                        </Col>
                        <Col css={{ d: "flex" }}>
                            <Tooltip
                                content={t("delete")}
                                color="error"
                                onClick={() => deleteSchematic(schematic.level - 1)}
                            >
                                <IconButton>
                                    <DeleteIcon size={20} fill="#FF0080" />
                                </IconButton>
                            </Tooltip>
                        </Col>
                    </Row>
                );
            default:
                return cellValue;
        }

        return (<>

        </>)
    }
}