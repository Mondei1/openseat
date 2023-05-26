import { Text } from "@nextui-org/react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// @ts-ignore
export default function Sidebar({ children }) {
    const controls = useAnimation();

    const variants = {
        out: {
            opacity: 0,
            y: 40,
            transition: {
                duration: 0.2
            }
        },
        in: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2
            }
        }
    }

    useEffect(() => {
        controls.start("in")
    }, [controls])

    return (<>
        <AnimatePresence mode="wait">
            <motion.div
                key="sidebar"
                animate={{ opacity: 1 }}
                transition={{ duration: .2 }}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0 }}>
                <div className="absolute right-4 top-28 bottom-4 w-3/6 h-max max-h-96 m-1 p-8 sidebar fade-in">
                    {children}
                </div>
            </motion.div>
        </AnimatePresence>
        <div className=""></div>
    </>)
}