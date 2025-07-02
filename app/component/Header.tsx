import React from "react";
import Image from "next/image";

const Header: React.FC = () => {
  return (
    <header className="bg-blue-500 text-white p-4 flex flex-col sm:flex-row items-center justify-between px-16">
      <div>
        <Image
          src={"/logo.jpeg"}
          alt="Logo"
          className="h-11 w-11 sm:h-14 sm:w-14 rounded-full inline-block mr-2"
            width={60}
            height={60}
        />
      </div>
      <div>
        <h1 className="sm:text-2xl font-bold">Welcome comfort management</h1>
      </div>
    </header>
  );
};
export default Header;