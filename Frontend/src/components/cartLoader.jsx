// Create a LoadingSpinner component (or you can use a library like react-loader-spinner)
import React from "react";

const CartLoading = () => {
  return (
    <div className="absolute bg-white inset-0 z-50 bg-[url('/bg.png')]">
      <div className="flex w-full h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-t-4 border-t-asisDark"></div>
      </div>
    </div>
  );
};

export default CartLoading;
