import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip, User } from "@nextui-org/react"
import React, { Key, useState } from "react"
import { useTranslation } from "react-i18next"
import { IFloor, IGuest } from "../Database"
import { IconButton } from "../IconButton"
import { DeleteIcon } from "../icons/DeleteIcon"
import { EditIcon } from "../icons/EditIcon"

interface ISchematicColumn {
    key: Key,
    label: string
}

type GuestTableProps = {
    guests: Array<IGuest>,
    deleteGuest: (guestId: number) => void,
    newGuest: (guest: IGuest) => void
}

export const GuestTable: React.FC<GuestTableProps> = ({ guests, deleteGuest, newGuest }) => {
    const { t } = useTranslation('common')

    // Table structure
    const columns: Array<ISchematicColumn> = [
        {
            key: "name",
            label: t("name")!
        },
        {
            key: "guests",
            label: t("guests")!
        },
        {
            key: "present",
            label: t("present")!
        },
        {
            key: "actions",
            label: "Actions"
        }
    ]

    const renderCell = (guest: IGuest, columnKey: React.Key) => {
        console.log("Render cell: ", guest);

        // @ts-ignore
        const cellValue: any = guest[columnKey];
        switch (columnKey) {
            case "level":
                return (<Text>{cellValue}</Text>)
            case "name":
                return (
                    <User squared text={guest.firstName} name={guest.firstName + " " + guest.lastName}>
                        <p></p>
                    </User>
                );

            case "actions":
                return (
                    <Row justify="flex-end">
                        <Col css={{ d: "flex" }}>
                            <Tooltip
                                content={t("edit")}
                            >
                                <IconButton>
                                    <EditIcon size={20} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip
                                content={t("delete")}
                                color="error"
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
        <Table
            bordered={true}
            css={{
                height: "auto",
                minWidth: "100%",
                backgroundColor: "rgba(var(--background-rgb), 0.3)"
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
            <Table.Body items={guests}>
                {(item) => (
                    <Table.Row key={item.id}>
                        {(columnKey) =>
                            <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>
                        }
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
        
    </>)
}