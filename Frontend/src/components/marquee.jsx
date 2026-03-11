import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

const Marquee = ({ word, direction }) => {
  let controls = useAnimation();
  let xPercent = 0;

  useEffect(() => {
    requestAnimationFrame(animation);
  }, []);

  const animation = () => {
    if (xPercent <= -100) {
      xPercent = 0;
    }
    if (xPercent > 0) {
      xPercent = -100;
    }
    controls.set({
      x: xPercent + "%",
    });
    xPercent += 0.1 * direction;
    requestAnimationFrame(animation);
  };

  return (
    <div className="relative m-0 flex whitespace-nowrap font-cinzel text-[13vw] text-white mix-blend-difference">
      <motion.p animate={controls}>{word}</motion.p>
      <motion.p animate={controls} className="absolute left-full">
        {word}
      </motion.p>
    </div>
  );
};

export default Marquee;
{/* <motion.h1
  initial={{ x: direction == "incr" ? 300 : -300 }}
  animate={{ x: 0 }}
  exit={{
    x: direction == "incr" ? -300 : 300,
    transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
  }}
  transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
  className="text-center "
>
  CAINS STORE
</motion.h1>; */}