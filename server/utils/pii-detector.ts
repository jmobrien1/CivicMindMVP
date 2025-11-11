// PII detection utilities for municipal AI platform

export interface PiiDetectionResult {
  hasPii: boolean;
  types: string[];
}

// Regex patterns for common PII
const patterns = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
  zipCode: /\b\d{5}(?:-\d{4})?\b/,
  // Be careful with street addresses - this is a simple pattern
  address: /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/i,
};

export function detectPii(text: string): PiiDetectionResult {
  const detectedTypes: string[] = [];

  if (patterns.ssn.test(text)) {
    detectedTypes.push("SSN");
  }
  if (patterns.phone.test(text)) {
    detectedTypes.push("Phone");
  }
  if (patterns.email.test(text)) {
    detectedTypes.push("Email");
  }
  if (patterns.creditCard.test(text)) {
    detectedTypes.push("Credit Card");
  }
  // We don't flag zip code or address alone as they're common in municipal queries
  // But we track them
  const hasZip = patterns.zipCode.test(text);
  const hasAddress = patterns.address.test(text);

  // Only flag if we have sensitive PII (SSN, credit card, etc.)
  // Email and phone in queries are somewhat expected for contact purposes
  const hasSensitivePii = detectedTypes.some(type => 
    ["SSN", "Credit Card"].includes(type)
  );

  return {
    hasPii: hasSensitivePii,
    types: detectedTypes,
  };
}

export function redactPii(text: string): string {
  let redacted = text;
  
  redacted = redacted.replace(patterns.ssn, "[SSN REDACTED]");
  redacted = redacted.replace(patterns.creditCard, "[CREDIT CARD REDACTED]");
  
  return redacted;
}
