import { Avatar, Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip, User, useAsyncList } from "@nextui-org/react"
import React, { Key, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { IGuest, getGuests, getSeatOccupations, updateGuestCheckedIn } from "../Database"
import { IconButton } from "../IconButton"
import { DeleteIcon } from "../icons/DeleteIcon"
import { EditIcon } from "../icons/EditIcon"
import Database from "tauri-plugin-sql-api"
import { MinusIcon } from "../icons/MinusIcon"
import { PlusIcon } from "../icons/PlusIcon"
import { ChairIcon } from "../icons/ChairIcon"
import { LocateIcon } from "../icons/LocateIcon"

interface ISchematicColumn {
    key: Key,
    label: string
}

type GuestTableProps = {
    //guests: Array<IGuest>,
    db: Database,
    guests: IGuest[],
    deleteGuest: (guestId: number) => void,
    updateGuests: () => void,
    toggleGuest: (guestId: number) => void,
    startGuestOccupation: (guest: IGuest) => void,
    focusSeat: (seatId: number) => void
}

export const GuestTable: React.FC<GuestTableProps> = ({ db, guests, deleteGuest, startGuestOccupation, toggleGuest, focusSeat, updateGuests }) => {
    const { t } = useTranslation('common')

    const [filteredGuests, setFilteredGuests] = useState<IGuest[]>([])

    useEffect(() => {
        getGuests(db).then(async g => {
            setFilteredGuests(g)
        })
    }, [])

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
        // @ts-ignore
        const cellValue: any = guest[columnKey];
        switch (columnKey) {
            case "guests":
                return (<Text>{guest.additionalGuestAmount}</Text>)
            case "present":
                return (<div className="flex gap-2">
                    <IconButton onClick={() => {
                        if (guest.additionalGuestCheckedin == 0) {
                            return
                        }

                        updateGuestCheckedIn(db, guest.id!, guest.additionalGuestCheckedin - 1)
                        updateGuests()
                    }}>
                        <MinusIcon
                            // @ts-ignore: Color props exists but I'm lazy.
                            color={guest.additionalGuestCheckedin == 0 ? "gray" : "white"}
                            width={16}
                            height={16}
                        />
                    </IconButton>
                    <Text>{guest.additionalGuestCheckedin}</Text>
                    <IconButton onClick={() => {
                        if ((guest.additionalGuestCheckedin + 1) > guest.additionalGuestAmount) {
                            return
                        }

                        updateGuestCheckedIn(db, guest.id!, guest.additionalGuestCheckedin + 1)
                        updateGuests()
                    }}>
                        <PlusIcon
                            // @ts-ignore: Color props exists but I'm lazy.
                            color={(guest.additionalGuestCheckedin + 1) > guest.additionalGuestAmount ? "gray" : "white"}
                            width={16}
                            height={16}
                        />
                    </IconButton>
                </div>)
            case "name":
                return (
                    <Tooltip
                        content={guest.checkedIn ? t("map.click_to_checkout") : t("map.click_to_checkin")}
                        onClick={() => { toggleGuest(guest.id!) }}
                        placement="right"
                    >
                        <User
                            squared
                            text={guest.firstName}
                            name={`${guest.firstName} ${guest.lastName}`}
                            color={guest.checkedIn ? "success" : "default"}
                            bordered
                            zoomed
                        >
                            <p>{guest.seatId !== null ? `${t("map.seat")} ${guest.seatId}` : ""}</p>
                        </User>
                    </Tooltip>
                );

            case "actions":
                return (
                    <Col className="flex gap-3 ml-0">
                        <Tooltip
                            content={t("map.assign_seat")}
                        >
                            <IconButton onClick={() => startGuestOccupation(guest)}>
                                <ChairIcon size={20} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip
                            content={t("map.show_on_map")}
                        >
                            <IconButton onClick={() => {
                                if (guest.seatId !== null) {
                                    focusSeat(guest.seatId!)
                                }
                            }}>
                                {/* @ts-ignore */}
                                <LocateIcon color={guest.seatId === null ? "gray" : ""} size={20} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip
                            content={t("delete")}
                            color="error"
                        >
                            <IconButton onClick={async () => { deleteGuest(guest.id!); setFilteredGuests(await getGuests(db)) }}>
                                <DeleteIcon size={20} fill="#FF0080" />
                            </IconButton>
                        </Tooltip>
                    </Col>
                );
            default:
                return cellValue;
        }
    }

    return (<>
        <Table
            bordered={false}
            headerLined={true}
            striped={true}
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
                        width={column.key === "actions" ? "16px" : "auto"}
                        align={column.key === "actions" ? "center" : "start"}
                    >
                        {column.label}
                    </Table.Column>
                )}
            </Table.Header>
            <Table.Body
                items={guests}
            >
                {(item) => (
                    <Table.Row key={item.id}>
                        {(columnKey) =>
                            <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>
                        }
                    </Table.Row>
                )}
            </Table.Body>
            <Table.Pagination
                shadow
                noMargin
                align="center"
                rowsPerPage={20}
            />
        </Table>

    </>)
}