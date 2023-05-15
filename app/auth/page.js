'use client'
import React from "react";
import LoginForm from "../components/loginForm";
import LoginText from "../components/loginText";

export default function LoginPage() {
  return (
    <div className="grid md:grid-cols-3 bg-blue-500 text-white -m-4">
      <LoginText />
      
       <div> <LoginForm /></div>
      
    </div>
  );
}
