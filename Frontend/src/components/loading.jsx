// Create a LoadingSpinner component (or you can use a library like react-loader-spinner)
import React from "react";
import Marquee from "./marquee";
import { AnimatePresence, motion } from "framer-motion";
import Curve from "./curve";

const Loading = () => {
  return (
    <motion.div
      initial={{
        // y: `calc(100% + 100px)`,
      }}
      animate={{
        y: "0",
        transition: { duration: 2, ease: [0.76, 0, 0.24, 1] },
      }}
      exit={{
        y: `calc(100% + 100px)`,
        transition: {
          duration: 2,
          ease: [0.76, 0, 0.24, 1],
        },
      }}
      className="fixed z-50 flex h-screen w-screen flex-col items-center justify-center bg-black"
    >
      <Curve />
      <img
        src="/whiteSpade.svg"
        className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 md:w-1/3 lg:w-1/4"
      />
      <motion.h1
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{
          y: 100,
          transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
        }}
        transition={{ duration: 1, delay: 0.5, ease: [0.76, 0, 0.24, 1] }}
        className="text-center font-cinzel text-[30vw] leading-none text-white mix-blend-difference sm:text-[20vw] lg:text-[15vw]"
      >
        CAINS STORE
      </motion.h1>
    </motion.div>
  );
};

export default Loading;
