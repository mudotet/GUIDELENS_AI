import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#DEE2F2",
          secondary: "#F5F5F5",
          button: "#E48C3A",
          ink: "#1F2433"
        }
      },
      fontFamily: {
        roboto: ["Roboto", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 44px rgba(31, 36, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
