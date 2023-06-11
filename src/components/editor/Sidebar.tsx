import { Text } from "@nextui-org/react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// @ts-ignore
export default function Sidebar({ children }) {
    const controls = useAnimation();

    const variants = {
        out: {
            opacity: 0,
            x: 80,
            transition: {
                duration: 0.25
            }
        },
        in: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.25
            }
        }
    }

    useEffect(() => {
        controls.start("in")
    }, [controls])

    return (<>
        <motion.div
            className="absolute right-4 top-28 bottom-4 w-3/6 h-max max-h-96 m-1 p-4 sidebar fade-in"
            key="sidebar"
            variants={variants}
            animate="in"
            initial="out"
            exit="out"
        >
            {children}
        </motion.div>

    </>)
}