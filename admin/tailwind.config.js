/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#E6C211",
        ternary: "#FFF9DB",
      },
    },
  },
  plugins: [],
};
