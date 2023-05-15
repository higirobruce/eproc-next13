import SignupForm from "@/app/components/signupForm";
import React from "react";

export default function page() {
  return (
    <div className='flex space-x-10 bg-blue-500 items-center justify-center px-5'>
      <SignupForm />
    </div>
  );
}
