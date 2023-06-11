import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip, User, useAsyncList } from "@nextui-org/react"
import React, { Key, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { IFloor, IGuest, getGuestPage, getGuests } from "../Database"
import { IconButton } from "../IconButton"
import { DeleteIcon } from "../icons/DeleteIcon"
import { EditIcon } from "../icons/EditIcon"
import Database from "tauri-plugin-sql-api"

interface ISchematicColumn {
    key: Key,
    label: string
}

type GuestTableProps = {
    //guests: Array<IGuest>,
    db: Database,
    deleteGuest: (guestId: number) => void,
    newGuest: (guest: IGuest) => void
}

export const GuestTable: React.FC<GuestTableProps> = ({ db, deleteGuest, newGuest }) => {
    const { t } = useTranslation('common')

    const [guests, setGuests] = useState<IGuest[]>([])

    useEffect(() => {
        getGuests(db).then(g => {
            setGuests(g)
        })
    }, [])

    // @ts-ignore
    async function load({ signal, cursor }) {
        return {
            items: await getGuestPage(db, cursor || 0, 3),
            cursor: (cursor || 0) + 3
        }
    }

    // @ts-ignore
    const list = useAsyncList({ load })

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
            case "guests":
                return (<Text>{guest.additionalGuestAmount}</Text>)
            case "present":
                return (<Text>{guest.additionalGuestCheckedin}</Text>)
            case "name":
                return (
                    <User
                        squared
                        text={guest.firstName}
                        name={guest.firstName + " " + guest.lastName}
                        bordered={guest.checkedIn}
                        color="success"
                        zoomed
                    >
                        <p></p>
                    </User>
                );

            case "actions":
                return (
                    <Row justify="flex-end">
                        <Col className="flex gap-4 ml-0">
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
            <Table.Body
                items={list.items}
                loadingState={list.loadingState}
                onLoadMore={list.loadMore}
            >
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