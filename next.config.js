/** @type {import('next').NextConfig} */
const imageDomains = [];
if (process.env.S3_BUCKET) {
  imageDomains.push(`${process.env.S3_BUCKET}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`);
}

const nextConfig = {
  // Lint is enforced separately in CI. Keeping it separate prevents legacy lint
  // debt from making production/deploy-preview builds impossible.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    domains: imageDomains,
  },
};

module.exports = nextConfig;
