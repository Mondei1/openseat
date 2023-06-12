import { Text } from "@nextui-org/react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// @ts-ignore
export default function Sidebar({ children }) {
    const controls = useAnimation();

    const variants = {
        out: {
            opacity: 0,
            x: 200,
            scale: 0.9,
            transition: {
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1]
            }
        },
        in: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    }

    useEffect(() => {
        controls.start("in")
    }, [controls])

    return (<>
        <motion.div
            className="absolute h-max m-1 p-4 sidebar fade-in"
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