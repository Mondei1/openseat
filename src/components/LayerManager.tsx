import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip } from "@nextui-org/react"
import React, { Key, useState } from "react"
import { useTranslation } from "react-i18next"
import { IconButton } from "./IconButton"
import { ArrowUpIcon } from "./icons/ArrowUpIcon"
import { ArrowDownIcon } from "./icons/ArrowDownIcon"
import { DeleteIcon } from "./icons/DeleteIcon"
import { open } from "@tauri-apps/api/dialog";
import { IFloor } from "./Database"
import { AddImageIcon } from "./icons/AddImageIcon"

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
    schematics: Array<IFloor>,
    setSchematics(schemas: Array<IFloor>): void
}

export const LayerManager: React.FC<LayerSelectorProps> = ({ schematics, setSchematics }) => {
    const { t } = useTranslation('common')

    let [loadingImage, setLoadingImage] = useState(false)

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
            key: "actions",
            label: "Actions"
        }
    ]

    async function addSchematic() {
        // @ts-ignore
        const fs: any = window.__TAURI__.fs

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

        let filenameWithoutExtension = parsedPath.replace(/^.*[\\\/]/, '').split(".")
        filenameWithoutExtension.pop()

        console.log("Selected:", filePath);

        setLoadingImage(true)
        const newFloor: IFloor = {
            id: Math.max(...schematics.map(x => x.id)) + 1,
            level: schematics.length + 1,
            name: filenameWithoutExtension.join(""),

            // Maybe I should store images in a sperate array and just point to them
            // but I guess this is fine assuming the images are not >10 MB large.
            image: await fs.readBinaryFile(filePath)
        }
        setLoadingImage(false)

        setSchematics(Array.prototype.concat(schematics, newFloor))
    }

    function deleteSchematic(id: number) {
        if (schematics.find(x => x.id === id)?.level === -1) return

        const clone = schematics
        clone.splice(clone.findIndex(x => x.id === id), 1)
        setSchematics(clone)
    }

    const renderCell = (schematic: IFloor, columnKey: React.Key) => {
        console.log("Render cell: ", schematic);

        if (schematic.level === -1) {
            return
        }

        // @ts-ignore
        const cellValue: any = schematic[columnKey];
        switch (columnKey) {
            case "level":
                return (<Text>{cellValue}</Text>)
            case "name":
                return (
                    <Input aria-label="Schematic layer name" bordered initialValue={cellValue} placeholder="Name" />
                );

            case "actions":
                return (
                    <Row justify="flex-end">
                        <Col css={{ d: "flex" }}>
                            <Tooltip
                                content={t("delete")}
                                color="error"
                                onClick={() => deleteSchematic(schematic.id)}
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
    }

    return (<>
        {schematics.length > 0 &&
            <Table
                bordered={true}
                css={{
                    height: "auto",
                    minWidth: "100%",
                }}>
                <Table.Header columns={columns}>
                    {(column) => (
                        <Table.Column
                            key={column.key}
                            hideHeader={column.key == "actions"}
                            // @ts-ignore
                            width={column.key === "actions" ? "12px" : "auto"}
                            align={column.key === "actions" ? "center" : "start"}
                        >
                            {column.label}
                        </Table.Column>
                    )}
                </Table.Header>
                <Table.Body items={schematics}>
                    {(item) => (
                        <Table.Row key={item.level}>
                            {(columnKey) =>
                                <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>
                            }
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        }

        <Spacer y={1} />
        <div className="flex w-fit p-0 m-0">
            <Button onPress={addSchematic} auto icon={<AddImageIcon />} >
                {loadingImage
                    ? <Loading color="currentColor" size="sm" />
                    : <Text>{t("setup.select_schematic")} (.png, .jpg)</Text>}
            </Button>
        </div>
    </>)
}