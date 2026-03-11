import React, { useState, useEffect } from "react";
import backToTop from "../assets/icons/back_to_top.svg";
import ShopProducts from "./component/shop_products";
import Loading from "../components/loading";
import VowelItalicizer from "../components/vowelItalicizer";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import FrameOne from "./frames/frameOne";
import Filter from "./component/filter";
import { AnimatePresence, motion } from "framer-motion";

const Page = () => {
  // States
  const [hideFilter, setHideFilter] = useState(true);
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // API URL
  const apiUrl = `${import.meta.env.VITE_BACKEND_URL
    }products?&category=${category}&sort=${sort}&gender=${gender}`;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      axios.defaults.withCredentials = true;
      const res = await axios.get(apiUrl);
      setData(res.data);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.log(error);
      navigate("/", { replace: true });
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };
  // Handle scroll to top
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Scroll to top on component mount
  useEffect(() => {
    setIsLoading(true);
    fetchData();
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 2000);
  }, []);
  // Scroll to top on component mount
  useEffect(() => {
    setIsLoading(true);
    fetchData();
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 2000);
  }, [category, sort, gender]);

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div key="loading">
          <Loading />
        </motion.div>
      ) : (
        <main className="flex flex-col items-center py-[10.4vh]">
          <h1 className="mb-10 w-full text-center font-playfair text-[10vw] uppercase leading-none md:mb-20 md:text-[6vw]">
            <VowelItalicizer text="CAINS STORE" />
          </h1>
          <Filter
            category={category}
            sort={sort}
            setSort={setSort}
            setCategory={setCategory}
            gender={gender}
            setGender={setGender}
          />
          {data?.products?.length >= 1 ? (
            <>
              <section className="grid w-full gap-y-20 px-4 sm:grid-cols-2 md:px-0 lg:grid-cols-3">
                {data?.products?.map((product, index) => {
                  return (
                    <Link
                      to={`/product/${product._id}`}
                      className="flex cursor-pointer flex-col gap-4"
                    >
                      <div
                        key={product._id}
                        className="group relative aspect-[8/10] w-full"
                      >
                        <img
                          src={`${import.meta.env.VITE_BLOB_URL}${product.images[0]
                            }`}
                          alt={product.name}
                          className=" absolute h-full w-full object-cover object-center group-hover:hidden"
                        />
                        <img
                          src={`${import.meta.env.VITE_BLOB_URL}${product.images[1] || product.images[0]
                            }`}
                          alt={product.name}
                          className="absolute hidden h-full w-full object-cover object-center group-hover:block md:hidden"
                        />
                      </div>

                      <div className="text-center font-playfair capitalize">
                        <h3 className="text-lg font-bold uppercase">
                          <VowelItalicizer text={product?.name} />
                        </h3>
                        <p>{product?.gender}</p>
                        <p>
                          {Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: "NGN",
                          }).format(product?.price)}{" "}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </section>
            </>
          ) : (
            <section className="flex w-full flex-col">
              <h1 className="w-full text-center font-playfair text-[8vw]">
                <VowelItalicizer text="No Matches Found" />
              </h1>
              <p className="w-full text-center font-playfair">
                Please try another filter
              </p>
            </section>
          )}
          {data?.products?.length > 1 && (
            <img
              src={backToTop}
              alt="back_to_top"
              className="fixed  bottom-8 right-2 w-12 cursor-pointer md:right-10"
              onClick={() => {
                handleScrollToTop();
              }}
            />
          )}
        </main>
      )}
    </AnimatePresence>
  );
};

export default Page;
{
}
