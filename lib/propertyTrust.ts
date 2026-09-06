export type PropertyVerification = {
  identityVerified?: boolean;
  ownershipVerified?: boolean;
  addressVerified?: boolean;
  inspectionVerified?: boolean;
  pricingReviewed?: boolean;
};

export function calculatePropertyTrustScore(verification: PropertyVerification = {}) {
  let score = 0;
  if (verification.identityVerified) score += 15;
  if (verification.ownershipVerified) score += 30;
  if (verification.addressVerified) score += 15;
  if (verification.inspectionVerified) score += 25;
  if (verification.pricingReviewed) score += 15;
  return Math.min(100, score);
}

export function trustLevelForScore(score: number) {
  if (score >= 90) return 'premier' as const;
  if (score >= 60) return 'verified' as const;
  if (score >= 40) return 'reviewed' as const;
  return 'unverified' as const;
}

export function isPropertyVerified(verification: PropertyVerification = {}) {
  return Boolean(
    verification.identityVerified &&
    verification.ownershipVerified &&
    verification.addressVerified
  );
}
