import { Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function LoginText() {
  let router = useRouter();
  return (
    <div className="col-span-2 hidden md:flex flex-col px-10 items-center justify-center">
      <div className="opacity-80">
        <Image alt="" src="/login.svg" width={400} height={400} />
      </div>
      <Typography.Title level={2}>
        <div className="text-white">Welcome to Irembo Procure</div>
      </Typography.Title>
      <div className="text-white font-light">
        A tool that aims to simplify the procurement process for suppliers
        looking to work with Irembo.
      </div>

      {/* <div onClick={()=>router.push('/')} className="bg-white text-blue-500 px-5 py-2 mt-10 rounded hover:bg-blue-500 hover:text-white hover:ring-1 hover:ring-white transition-all ease-out duration-300 cursor-pointer">
        More
      </div> */}
      {/* <Image alt="" src="/icons/white icon.png" width={236} height={220} /> */}
      <div className="">
        <div className="self-center flex flex-col"></div>
      </div>
    </div>
  );
}
