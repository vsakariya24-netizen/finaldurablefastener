// src/data/knowledgeBase.ts
export const CLASSONE_DATA = {
  company: "Durable Fastener Private Limited (Classone)",
  location: "Rajkot, Gujarat",
  
  // 1. OEM & Manufacturing Section
  oem_services: {
    capabilities: "Custom screw manufacturing, private labeling, and specialized coating.",
    machinery: "Cold heading, thread rolling, and automated plating plants.",
    moq: "Minimum order quantities depend on customization. Contact sales for details."
  },

  // 2. Careers Section
  careers: {
    culture: "We value precision, hard work, and innovation in the fastener industry.",
    how_to_apply: "Send your CV to hr@durablefastener.com or visit our Rajkot office.",
    openings: "We are always looking for production engineers and export sales managers."
  },

  // 3. Product Catalog (Existing)
  products: [
    { name: "SDS (Self Drilling)", spec: "DIN 7504", use: "Heavy steel structures" },
    { name: "Chipboard", spec: "DIN 7505", use: "Furniture/Wood" },
    { name: "Drywall", spec: "DIN 18182", use: "Gypsum board" }
  ],

  // 4. Export & Logistics
  exports: {
    countries: ["Sri Lanka", "UAE", "Nepal", "Bangladesh"],
    shipping: "FOB Mundra Port or CIF to destination port."
  }
};