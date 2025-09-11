// postcss.config.mjs

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // ↓ ここに設定を追加します
      darkMode: "class",
    },
  },
};

export default config;