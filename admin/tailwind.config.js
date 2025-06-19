/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2F80ED",
        ternary: "#E3F0FF",
      },
    },
  },
  plugins: [],
};
