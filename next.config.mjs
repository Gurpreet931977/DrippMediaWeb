/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/developermodeon',
        destination: '/official-preview/index.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
