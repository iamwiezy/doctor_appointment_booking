/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#eac319",
        ternary: "#E3F0FF",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
