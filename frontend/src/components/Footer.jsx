import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* Left Section */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </p>
        </div>

        {/* Center Section */}
        <div>
          <p className="text-xl font-medium mb-5">Company</p>
          <ul className="flex flex-col gap-2 text-gray-600 cursor-pointer ">
            <li
              className="hover:text-primary"
              onClick={() => {
                navigate("/"), scrollTo(0, 0);
              }}
            >
              Home
            </li>
            <li
              className="hover:text-primary"
              onClick={() => {
                navigate("/about"), scrollTo(0, 0);
              }}
            >
              About
            </li>
            <li
              className="hover:text-primary"
              onClick={() => {
                navigate("/contact"), scrollTo(0, 0);
              }}
            >
              Contact
            </li>
            <li
              className="hover:text-primary"
              onClick={() => {
                navigate("/"), scrollTo(0, 0);
              }}
            >
              Privacy Policy
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div>
          <p className="text-xl font-medium mb-5">Get In Touch</p>
          <ul className="flex flex-col gap-2 text-gray-600 cursor-pointer ">
            <li>+91 1234567890</li>
            <li>doctor@doc.com</li>
          </ul>
        </div>
      </div>
      {/* Copyright Text */}
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright © 2025{" "}
          <a
            className="text-primary cursor-pointer"
            href="https://www.instagram.com/iamwiezy/"
            target="blank"
          >
            wiezy.io
          </a>{" "}
          - All Right Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
