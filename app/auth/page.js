"use client";
import { useSearchParams } from "next/navigation";
import React from "react";
import LoginForm from "../components/loginForm";
import LoginText from "../components/loginText";

export default function LoginPage() {
  const searchParams = useSearchParams()

  console.log(searchParams.get('goTo'))
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
