import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default eslintConfig;
