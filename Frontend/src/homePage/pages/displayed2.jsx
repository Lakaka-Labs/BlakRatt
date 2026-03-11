import React, { useEffect } from "react";
import SelectedOneCS from "./selectedOneCS";
import SelectedOne from "./selectedOne";
import SelectedThree from "./selectedThree";
import SelectedTwo from "./selectedTwo";
import Slider from "../components/slider";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import Curve from "../components/curve";

const Displayed = ({ product, setNavType, bodyRef }) => {
  const [show, setShow] = React.useState(1);
  const [direction, setDirection] = React.useState("incr");
  const [wait, setWait] = React.useState(false);

  // useEffect(() => {
  //   setWait(true);
  //   setTimeout(() => {
  //     setWait(false);
  //   }, 1000);

  // }, []);

  return (
    <motion.div
      // drag="x"
      // dragConstraints={bodyRef}
      // dragMomentum={false}
      className="flex  w-max min-w-full flex-nowrap items-start justify-start h-screen"
    >
      {show == 1 && (
        <SelectedOneCS
          product={product}
          setNavType={setNavType}
          direction={direction}
          wait={wait}
        />
      )}
      {show == 2 && (
        <SelectedTwo
          product={product}
          setNavType={setNavType}
          direction={direction}
          wait={wait}
        />
      )}
      {show == 3 && (
        <SelectedThree
          product={product}
          setNavType={setNavType}
          direction={direction}
          wait={wait}
        />
      )}
      <Slider
        setShow={setShow}
        show={show}
        setDirection={setDirection}
        setWait={setWait}
      />
      <AnimatePresence>
        {wait && (
          <motion.div
            initial={{
              x: `calc(${direction == "incr" ? 100 : -100}% + ${direction == "incr" ? 100 : -100
                }px)`,
            }}
            animate={{
              x: "0",
              transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
            }}
            exit={{
              x: `calc(${direction == "incr" ? -100 : 100}% + ${direction == "incr" ? -100 : 100
                }px)`,
              transition: {
                duration: 0.8,
                ease: [0.76, 0, 0.24, 1],
                delay: 0.3,
              },
            }}
            className="fixed z-10 flex h-screen w-screen flex-col items-center justify-center bg-black"
          >
            <Curve direction={direction} />
            <img src="/whiteSpade.svg" className="w-1/2 md:w-1/4 lg:w-1/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <motion.h1
              initial={{ x: direction == "incr" ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{
                x: direction == "incr" ? -300 : 300,
                transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
              }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="text-center font-cinzel text-[30vw] leading-none text-white sm:text-[20vw] lg:text-[15vw] mix-blend-difference"
            >
              CAINS STORE
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Displayed;
