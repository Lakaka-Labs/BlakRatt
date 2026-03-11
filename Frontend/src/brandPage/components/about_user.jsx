import React from "react";
import img_border from "../../assets/icons/img_border.svg";
import about_img from "../../assets/images/about_img.png";
import facebook from "../../assets/icons/facebook.svg";
import Instagram from "../../assets/icons/Instagram.svg";
import Twitter from "../../assets/icons/Twitter.svg";
import about_logo from "../../assets/icons/about_logo.svg";

const About_user = () => {
  return (
    <section>
      <section className="mt-[40px] flex items-start justify-between">
        <section className="basis-[40%]">
          <article className="w-[360px]  text-[96px]/[96px] font-medium uppercase text-asisDark">
            <p>/Judith</p>
            <p className="text-right">Bisi</p>
          </article>
          <article>
            <p className="mb-3 mt-14 text-[28px]/[32px] font-[600] text-asisDark">
              FOUNDER. DESIGNER. ARTIST
            </p>
            <p className="text-[14px]/[24px]">
              Racing back to its inception in 2018, CAINS STORE emerged as a testament
              to my boundless ardor for artistic expression and my unyielding
              fascination with the world of fashion.<br></br> <br></br>Fueled by
              an innate talent for visual art since my earliest days, as well as
              a newfound passion for fashion that ignited during my formative
              years at the age of 17, CAINS STORE came to life as a manifestation of my
              creative vision..<br></br> Unbeknownst to formal training or a
              background in design education, I embarked on the ambitious
              endeavor of establishing CAINS STORE. With audacity and determination, I
              sought to redefine the boundaries of traditional fashion,
              unshackled by the constraints of convention. Lacking the resources
              to assemble a dedicated team, I became a tenacious one-person
              army, bearing the weight of all creative and business
              responsibilities. .<br></br> <br></br>While many of my
              contemporaries pursued fashion exclusively, my divergence from the
              norm lay in my status as a visual artist at heart. With one hand
              immersed in crafting ethereal worlds, I painted vivid characters,
              landscapes, and cultural tapestries, allowing my imagination to
              roam unhindered. Simultaneously, I delved into the meticulous
              artistry of fashion design, acquainting myself intimately with
              fabrics, silhouettes, and the guiding principles that breathed
              life into sartorial creations. It was the seamless integration of
              these two realms that transformed CAINS STORE into an unrivaled
              paradigm-shifter. Merging my visual artistry with fashion design,
              I broke new ground, transcending the boundaries imposed by the
              industry. Art became the very fabric woven into every garment,
              enlivening each design and captivating wearers, offering them an
              immersive experience beyond the constraints of mere clothing.
              CAINS STORE's resounding impact reverberates through the industry, and I
              take immense pride in having charted this uncharted course. My
              voyage remains unending—a relentless pursuit to design for the
              creative pioneers of the modern world. asis exists as a testament
              to the potency of artistic expression, transcending norms, and
              empowering individuals to inscribe their narratives upon the
              world's canvas. Step into the realm of CAINS STORE, where creativity
              finds its voice, and self-expression assumes its rightful throne.
            </p>
          </article>
        </section>
        <article className="relative h-[100%] w-[100%] basis-[45%] ">
          <div className="mt-[20px] flex h-[100%] w-[100%] items-center justify-center">
            <img
              src={about_img}
              alt="about_img"
              className=" mb-4 ml-[1px] h-[93%] w-[95%] object-cover object-top"
            />
          </div>
          <img
            src={img_border}
            alt="img_border"
            className="absolute bottom-[0px] right-[0px]"
          />
          <img
            src={img_border}
            alt="img_border"
            className="absolute top-[0px] rotate-[180deg]"
          />
          <img
            src={img_border}
            alt="img_border"
            className="absolute right-[0px] top-[0px] rotate-[270deg]"
          />
          <img
            src={img_border}
            alt="img_border"
            className="absolute bottom-[0px] rotate-[90deg]"
          />
        </article>
      </section>
      <article className="mt-10 flex items-center justify-between">
        <p className="text-[24px]/[32px] font-[600] uppercase text-asisDark">
          -asis
        </p>
        <img src={about_logo} alt="about_logo" />{" "}
        <div className="flex items-center gap-4">
          <img src={facebook} alt="facebook" />
          <img src={Instagram} alt="Instagram" />
          <img src={Twitter} alt="Twitter" />
        </div>{" "}
      </article>
    </section>
  );
};

export default About_user;
