import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";

// @ts-ignore
export default function Sidebar({ children, show }) {
    const [scope, animate] = useAnimate()

    const variants = {
        out: {
            opacity: 1,
            x: 700,
            scale: 0.9,
            transition: {
                type: "tween",
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1]
            }
        },
        in: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: "tween",
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    }

    useEffect(() => {
        if (show) {
            // @ts-ignore
            animate(scope.current, variants.in, variants.in.transition)
        } else {
            // @ts-ignore
            animate(scope.current, variants.out, variants.out.transition)
        }

        // controls.start("in")
    }, [show])

    return (
        <motion.div
            ref={scope}
            className="absolute h-max m-1 p-4 sidebar fade-in"
            key="sidebar"
            variants={variants}
            animate="in"
            initial="out"
            exit="out"
        >
            {children}
        </motion.div>)
}