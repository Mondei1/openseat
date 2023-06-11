import { Button, FormElement, Input, Modal, Text } from "@nextui-org/react"
import { TFunction } from "next-i18next"
import { UserAddIcon } from "../icons/UserAddIcon"
import { EraserIcon } from "../icons/EraserIcon"
import { IGuest } from "../Database"
import { KeyboardEventHandler, useState } from "react"

export type GuestModalProps = {
    t: TFunction,
    visible: boolean,
    closeHandler: () => void,
    addGuest: (guest: IGuest) => void
}

export const GuestModal: React.FC<GuestModalProps> = ({ t, closeHandler, visible, addGuest }) => {

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [additionalGuests, setAdditionalGuests] = useState<number>(0)

    function save() {
        addGuest({
            firstName,
            lastName,
            additionalGuestAmount: additionalGuests!,
            additionalGuestCheckedin: 0,
            checkedIn: false
        })
        clear()
    }

    function clear() {
        setFirstName("")
        setLastName("")
        setAdditionalGuests(0)

        document.getElementById("first-name-input")?.focus()
    }

    function triggerEnter(e: KeyboardEvent) {
        if (e.code === "Enter") {
            save()
        }
    }

    function validateAdditionalGuests(value: number) {
        if (value < 0) {
            setAdditionalGuests(0)
            return
        }

        setAdditionalGuests(value)
    }

    return (
        <Modal
            closeButton
            aria-labelledby="add-new-guest"
            open={visible}
            onClose={closeHandler}
        >
            <Modal.Header>
                <Text size={18}>{t("map.new_guest")}</Text>
            </Modal.Header>

            <Modal.Body>
                <Input
                    id="first-name-input"
                    bordered
                    required
                    fullWidth
                    autoFocus
                    autoComplete="off"
                    color="primary"
                    size="lg"
                    fill="false"
                    label={t("first_name")!}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    // @ts-ignore: I don't care seriously.
                    onKeyDown={triggerEnter}
                />
                <Input
                    bordered
                    fullWidth
                    color="primary"
                    size="lg"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    label={t("last_name")!}

                    // @ts-ignore: Same as above.
                    onKeyDown={triggerEnter}
                />
                <Input
                    clearable
                    bordered
                    fullWidth
                    color="primary"
                    size="lg"
                    type="number"
                    value={additionalGuests!}
                    onChange={(e) => { validateAdditionalGuests(Number.parseInt(e.target.value)) }}
                    label={t("additional_guests")!}

                    // @ts-ignore: Guess what
                    onKeyDown={triggerEnter}
                />
            </Modal.Body>

            <Modal.Footer>
                <div className="grid gap-4 grid-cols-2">
                    <Button
                        auto
                        bordered
                        color="error"
                        icon={<EraserIcon />}
                        onPress={clear}
                    >
                        {t("clear_input")}
                    </Button>
                    <Button
                        auto
                        onPress={save}
                        icon={<UserAddIcon />}
                    >
                        {t("add_guest")}
                    </Button>
                </div>
                
                <Text small color="gray" className="pt-3">{t("add_guest_tip")}</Text>
            </Modal.Footer>
        </Modal>
    )
}