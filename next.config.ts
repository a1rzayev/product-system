import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en-us', 'az-az', 'ru-ru'],
    defaultLocale: 'en-us',
    localeDetection: true,
  },
};

export default nextConfig;
