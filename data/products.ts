export interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  standards?: string;
  head_type?: string;
  drive_type?: string;
  thread_type?: string;
  applications: string[];
  description: string;
  search_keywords: string[];
  size_metadata: {
    diameters?: string[];
    lengths?: string[];
    finishes?: string[];
    gauges?: string[];
    types?: string[];
    size_table: any[];
  };
}

export const CLASSONE_PRODUCTS: Product[] = [
  // --- EXISTING PRODUCTS ---
  {
    id: "5db92604-f443-4a57-8614-e030fa5df29d",
    name: "Drywall Screw (Gypsum Screw)",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel C1022 / SS 204CU / 304 / 316",
    standards: "DIN 18182",
    head_type: "CSK Phillips Bugle Head",
    drive_type: "Phillips",
    thread_type: "Fine / Coarse",
    applications: ["Gypsum Board", "POP Work", "Metal Framing", "Electrical work"],
    description: "High-speed penetration screw with anti-corrosion black phosphate finish.",
    search_keywords: ["black screw", "gypsum", "bugle head", "drywall fixing"],
    size_metadata: {
      diameters: ["3.5 mm", "4.2 mm", "4.8 mm"],
      finishes: ["Black", "Nickel", "Antique"],
      size_table: [
        { dia: "3.5mm", len: "13, 16, 19, 25, 32, 38, 50, 60, 75", finish: "Black/Nickel/Antique" },
        { dia: "4.2mm", len: "16, 19, 25, 32, 38, 50, 60, 75, 100", finish: "Black/Nickel/Antique" },
        { dia: "4.8mm", len: "50, 60, 75, 100", finish: "Black/Nickel/Antique" }
      ]
    }
  },
  {
    id: "f790900a-b937-4b86-9eeb-08d78b89f3f6",
    name: "Chipboard Screws",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel C1022 / SS 204 / 304 / 316",
    standards: "DIN 7505",
    head_type: "CSK (Countersunk)",
    drive_type: "Pozi & Phillips",
    thread_type: "Deep & Coarse Thread",
    applications: ["MDF", "Plywood", "Furniture", "Wardrobes", "Cupboard Fitting"],
    description: "Superior wood holding power designed to prevent splitting in engineered wood.",
    search_keywords: ["wood screw", "m3 chipboard", "m6 chipboard", "furniture screw"],
    size_metadata: {
      diameters: ["M3.0", "M3.5", "M4.0", "M4.5", "M5.0", "M6.0"],
      finishes: ["Trivalent Zinc"],
      size_table: [
        { dia: "M3.0", len: "13 to 25" },
        { dia: "M4.0", len: "13 to 75" },
        { dia: "M6.0", len: "13 to 150" }
      ]
    }
  },
  {
    id: "5cf14de5-9d9b-4139-9c0f-36c153badb85",
    name: "SDS Hex Head Screw",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel C1022 Hardened",
    standards: "DIN 7504-K",
    head_type: "Hexagonal",
    drive_type: "External Hex Drive",
    applications: ["Sheet Metal", "Roofing", "Solar Mounting", "Steel Structures"],
    description: "High torque self-drilling screw for fast metal-to-metal fastening.",
    search_keywords: ["hex sds", "tek screw", "roofing screw", "5.5mm sds"],
    size_metadata: {
      diameters: ["4.8 mm", "5.5 mm"],
      finishes: ["Trivalent Zinc"],
      size_table: [
        { dia: "4.8mm", len: "20, 25" },
        { dia: "5.5mm", len: "20, 25, 35, 45, 55, 63, 68, 75, 90, 100" }
      ]
    }
  },
  {
    id: "21e21ba7-65f0-4fe1-8ea0-91a172d06f9c",
    name: "SS Self Tapping Screw",
    category: "FASTENERS SEGMENT",
    material: "Stainless Steel (Grade 204CU / SS304 / SS316)",
    standards: "DIN 7982 / 7981",
    head_type: "CSK / PAN",
    drive_type: "Phillips",
    applications: ["Aluminium Section", "Sheet Metal", "Marine", "Food Processing"],
    description: "Corrosion-resistant screw for precise fastening in harsh environments.",
    search_keywords: ["stainless tapping", "ss316 screw", "A4 screw", "rust proof"],
    size_metadata: {
      diameters: ["2.8mm", "3.2mm", "3.5mm", "4.2mm", "4.8mm", "5.5mm"],
      finishes: ["S.S. Drum Polish"],
      size_table: [
        { dia: "3.5mm", len: "6.5 to 75" },
        { dia: "5.5mm", len: "19 to 100" }
      ]
    }
  },
  {
    id: "115b9172-5f3d-44b9-9d5d-d28d3a195f95",
    name: "CSK Head Flange Torx Screw",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel Grade C1010",
    head_type: "CSK Head Flange",
    drive_type: "Torx (Star)",
    thread_type: "Dual/Double Thread",
    applications: ["Roofing", "Cement Board", "Electrical & HVAC", "Nylon anchors"],
    description: "Engineered for high torque control and wide load distribution.",
    search_keywords: ["star drive", "torx csk", "nylon frame screw"],
    size_metadata: {
      diameters: ["M8", "M10"],
      finishes: ["Trivalent Zinc"],
      size_table: [
        { dia: "M8", len: "80, 100" },
        { dia: "M10", len: "80, 100, 120, 140" }
      ]
    }
  },
  {
    id: "153d0cc0-585b-4a8c-bad2-1158667ecc9a",
    name: "Carriage Bolt",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel Grade C1010",
    head_type: "Mushroom Head",
    thread_type: "Metric",
    applications: ["Wood working", "Door fitting", "Fencing"],
    description: "Anti-rotation bolt with square neck for timber-to-metal joints.",
    search_keywords: ["square neck bolt", "mushroom head bolt", "timber fastener"],
    size_metadata: {
      diameters: ["3.5mm"],
      finishes: ["Nickel"],
      size_table: [{ dia: "3.5mm", len: "38, 45, 50, 75, 100, 125, 150" }]
    }
  },
  {
    id: "65ac4c61-9fbb-47da-8829-839b4a0f5a34",
    name: "Wire Nails",
    category: "FASTENERS SEGMENT",
    material: "Mild Steel C1008 / C1010",
    applications: ["Woodworking", "Construction", "General industrial"],
    description: "High-quality wire nails with strong holding power.",
    search_keywords: ["iron nail", "wood nail", "gauge nail"],
    size_metadata: {
      gauges: ["8", "10", "12", "14", "17", "18", "19", "20"],
      size_table: [
        { gauge: "8", len_inch: '2", 2.5", 3", 4", 5"' },
        { gauge: "14", len_inch: '1", 1.25", 1.5", 2"' }
      ]
    }
  },
  {
    id: "f1d6452c-d332-404b-814a-5c266b8e04c6",
    name: "Auto Hinge",
    category: "FITTINGS",
    material: "Mild Steel",
    applications: ["Hardware Furniture", "Cupboards", "Kitchen Cabinets"],
    description: "Self-closing hinges designed for smooth door movement.",
    search_keywords: ["2D hinge", "3D hinge", "cabinet hinge", "soft close"],
    size_metadata: {
      types: ["0° (2D/3D)", "8° (2D/3D)", "15° (2D/3D)"],
      finishes: ["Nickel"],
      size_table: [{ type: "0, 8, 15 Degrees", variants: "2D and 3D" }]
    }
  },
  {
    id: "5a488d1f-a08d-479f-898e-1e7105cb1b9c",
    name: "Caster Wheel",
    category: "FITTINGS",
    material: "Plastic",
    applications: ["Industrial equipment", "Furniture", "Luggage carts"],
    description: "Heavy-duty wheel for smooth mobility and high load capacity.",
    search_keywords: ["orange wheel", "trolley wheel", "revolving caster"],
    size_metadata: {
      types: ["4\" Wheel Fix/Mini/Revolving", "6\" Wheel Mini/H Fix/H Revolving"],
      finishes: ["Orange"],
      size_table: [{ size: '4", 6"', type: "Fix, Mini, Revolving, Heavy" }]
    }
  },
  {
    id: "485687c4-3b77-4389-aa45-3f150cd8d015",
    name: "Door Magnet",
    category: "FITTINGS",
    material: "Plastic ABS / PP Virgin",
    applications: ["Cupboard", "Furniture", "Door Fitting"],
    description: "Magnetic door holder for secure and smooth closing.",
    search_keywords: ["l-magnet", "magnetic catch", "round magnet"],
    size_metadata: {
      types: ["M5 PAN", "M6 Round", "M7 Fancy", "M10", "L Type", "S Type"],
      finishes: ["White", "Ivory", "Brown"],
      size_table: [{ type: "Various", finish: "White, Ivory, Brown" }]
    }
  },

  // --- JOB OPENINGS DATA ---
  {
    id: "13",
    name: "Export Sales Executive",
    category: "Sales & Marketing",
    material: "0–5 Years Experience",
    applications: ["International Client Acquisition", "Export Documentation", "GTM Planning", "Customer Servicing"],
    description: "Manage full-lifecycle export operations from lead generation to compliance and shipment execution.",
    search_keywords: ["export manager", "b2b sales", "international sales", "fastener export"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000 + Incentives" }]
    }
  },
  {
    id: "15",
    name: "OEM Sales Executive",
    category: "Sales & Marketing",
    material: "1–3 Years Experience",
    applications: ["Strategic OEM targeting", "Technical Product Demos", "B2B Relationship Management"],
    description: "Targeting manufacturing hubs and industrial clients for bulk and customized fastener solutions.",
    search_keywords: ["oem sales", "industrial sales", "b2b executive", "technical sales"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000" }]
    }
  },
  {
    id: "14",
    name: "Business Development Executive (BDE)",
    category: "Sales & Marketing",
    material: "0–5 Years Experience (Female Preferred)",
    applications: ["Lead Management (Indiamart)", "Inbound Inquiries", "Sales Conversion", "Quotation Preparation"],
    description: "Responsible for converting digital leads and offline inquiries into successful sales.",
    search_keywords: ["female sales", "inside sales", "indiamart manager", "bde"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000" }]
    }
  },
  {
    id: "16",
    name: "Field Sales Executive",
    category: "Sales & Marketing",
    material: "0–5 Years Experience (Male)",
    applications: ["Cold Calling", "Direct Visits", "Targeting Wholesalers/Showrooms", "Market Research"],
    description: "Driving offline sales growth through fieldwork and meeting retailers, architects, and builders.",
    search_keywords: ["field sales", "sales marketing", "rajkot sales", "fastener field work"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000 + Fuel Reimbursement" }]
    }
  },
  {
    id: "12",
    name: "Data Research Assistant",
    category: "Research & Development",
    material: "0–5 Years Experience",
    applications: ["Market Analysis", "Competitor Research", "Report Preparation", "Lead Identification"],
    description: "Conduct meticulous online research to generate business intelligence and market insights.",
    search_keywords: ["research assistant", "data analysis", "market research", "back office"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000" }]
    }
  },
  {
    id: "17",
    name: "Office Executive / PA Admin",
    category: "Research & Development / Admin",
    material: "0–5 Years Experience",
    applications: ["Office Admin", "HR Coordination", "Data Management", "MIS Reporting"],
    description: "Hybrid role acting as the execution backbone of office operations and staff coordination.",
    search_keywords: ["pa admin", "office management", "branch operations", "hr admin"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000" }]
    }
  },
  {
    id: "22",
    name: "Accountant Manager",
    category: "Accounts & Finance",
    material: "5+ Years Experience",
    applications: ["Financial Control", "GST/TDS Compliance", "Audit Documentation", "Team Supervision"],
    description: "Overseeing complete accounting operations and decision-level financial accuracy using Miracle software.",
    search_keywords: ["accounts manager", "senior accountant", "miracle software", "finance manager"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot (HQ)", salary: "₹25,000 – ₹50,000" }]
    }
  },
  {
    id: "18",
    name: "Accountant Executive",
    category: "Accounts & Finance",
    material: "0–5 Years Experience",
    applications: ["Sales & Purchase Invoicing", "Bookkeeping", "GST Data Prep", "Vendor Follow-up"],
    description: "Managing daily accounting activities and invoicing using Miracle accounting software.",
    search_keywords: ["accountant", "bcom fresher", "tally executive", "billing executive"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot (HQ)", salary: "₹12,000 – ₹20,000" }]
    }
  },
  {
    id: "19",
    name: "Dispatch Manager + QA/QC Manager",
    category: "Factory & Warehouse Operations",
    material: "1–2 Years Experience",
    applications: ["Dispatch Planning", "Product Inspection", "Logistics Coordination", "Rejection Reporting"],
    description: "Dual role ensuring zero-error dispatches and strict quality verification before delivery.",
    search_keywords: ["dispatch manager", "qa manager", "qc executive", "warehouse operations"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Ravki Factory (Rajkot)", salary: "₹25,000 – ₹50,000" }]
    }
  },
  {
    id: "21",
    name: "Machine Operator (Header/Threader)",
    category: "Factory & Warehouse Operations",
    material: "2–5 Years Experience",
    applications: ["Cold Header Operation", "Thread Rolling", "Tool Setup", "Quality Control"],
    description: "Expertly operating and maintaining fastener manufacturing machinery to DIN/ISO standards.",
    search_keywords: ["machine operator", "header operator", "threader operator", "factory worker"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Ravki Factory (Rajkot)", salary: "₹25,000 – ₹50,000" }]
    }
  },
  {
    id: "24",
    name: "Machine Helper (Header/Threader)",
    category: "Factory & Warehouse Operations",
    material: "1–2 Years Experience",
    applications: ["Material Loading", "Machine Assistance", "Basic QC Support", "Maintenance Assistance"],
    description: "Support role assisting operators in production flow and learning machinery operation.",
    search_keywords: ["iti helper", "factory helper", "production assistant", "mechanical helper"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Ravki Factory (Rajkot)", salary: "₹10,000 – ₹20,000" }]
    }
  },
  {
    id: "20",
    name: "HR Manager",
    category: "Human Resources",
    material: "1–2 Years Experience",
    applications: ["Talent Acquisition", "Policy Development", "Employee Engagement", "Workforce Analytics"],
    description: "Leading HR strategy and organizational culture development for operational excellence.",
    search_keywords: ["hr manager", "hr strategist", "recruitment manager", "human resources"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹25,000 – ₹50,000" }]
    }
  },
  {
    id: "25",
    name: "HR Executive",
    category: "Human Resources",
    material: "0–5 Years Experience",
    applications: ["Day-to-day HR Operations", "Attendance Tracking", "Onboarding Support", "Query Handling"],
    description: "Supporting the employee lifecycle management and daily administrative HR tasks.",
    search_keywords: ["hr executive", "hr operations", "female hr", "recruiter"],
    size_metadata: {
      types: ["Full-time, On-site"],
      size_table: [{ location: "Rajkot / Surat", salary: "₹12,000 – ₹20,000" }]
    }
  }
];