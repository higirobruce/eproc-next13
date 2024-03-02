"use client";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import LoginForm from "../components/loginForm";
import LoginText from "../components/loginText";
import { getIpAddress } from "../helpers/rtc";

export default function LoginPage() {
  
  const searchParams = useSearchParams()
  return (
    <div className="grid md:grid-cols-3 bg-blue-500 text-white -m-4">
      <LoginText />

      <div>
        {" "}
        <LoginForm goTo={searchParams.get('goTo')}/>
      </div>
    </div>
  );
}
