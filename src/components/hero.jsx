import React from "react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-40 w-full h-screen px-4 md:px-10 lg:px-40">
      {/* Text Section */}
      <div className="flex flex-col lg:justify-center lg:items-end justify-end items-center text-center lg:text-left">
        <p className="text-[#1A73E8] text-[36px] md:text-[48px] lg:text-[64px] font-bold">
          Frames - Capture
        </p>
        <p className="text-[18px] md:text-[24px] lg:text-[28px] font-bold text-black max-w-[500px] m-1">
          Analyze sudden Emotion changes on accidental events Live from anywhere.
        </p>
        <p className="m-1 text-[14px] md:text-[16px] lg:text-[18px] text-black max-w-[500px]">
          A fast, easy way to collect sentimental facial expression data, from anywhere in
          the world.
        </p>
        <div className="w-[500px]">
          <button
            onClick={() => {
              navigate("/authenticate");
            }}
            className="bg-[#1A73E8] mt-4 text-white rounded px-6 py-3 font-bold hover:bg-blue-600"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Video Section */}
      <div className="flex justify-center items-start lg:items-center lg:justify-start">
        <video
          src="/face.mp4"
          autoPlay
          loop
          muted
          className="w-[90%] md:w-[80%] lg:w-full h-auto object-cover rounded-lg"
        ></video>
      </div>
    </div>
  );
}

export default Hero;
