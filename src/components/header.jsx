"use client";
import React from "react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate(); 

  const connectButton = () => {
    return (
      <button
        onClick={() => {
          navigate("/authenticate");
        }}
        className="bg-[#1A73E8] text-white rounded px-3 py-2 font-bold hover:bg-blue-600"
      >
        Get Started
      </button>
    );
  };

  return (
    <nav className="fixed nav z-40 mx-auto p-6 px-2 lg:px-32 w-full flex justify-between items-center">
      <a
        href="/"
        className="font-bold italic text-3xl text-[#1A73E8] font-mono tracking-widest cursor-pointer"
      >
        Accident Detection Frame Capture
      </a>
      {connectButton()}
    </nav>
  );
};
