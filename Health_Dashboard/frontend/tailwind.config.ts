import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'pchd-gradient': 'linear-gradient(135deg, #fcedea, #de3e26)',
      },
    },
  },
  plugins: [],
};
export default config;