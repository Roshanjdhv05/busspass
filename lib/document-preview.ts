/**
 * Generates high-fidelity SVG data URLs for student verification documents
 * (Passport Photo, Student ID Card, Aadhar Card, PAN Card, Bonafide Letter).
 * These serve as realistic digital document representations when raw files
 * are unavailable across devices or for verified demo accounts.
 */

export interface StudentDocInfo {
  name?: string;
  studentId?: string;
  college?: string;
  course?: string;
  year?: string;
  mobile?: string;
  email?: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "ST").toUpperCase();
}

/**
 * 1. PASSPORT SIZE PHOTOGRAPH
 */
export function generatePassportPhotoSvg(info: StudentDocInfo): string {
  const name = escapeXml(info.name || "Student");
  const sid = escapeXml(info.studentId || "STU2025");
  const college = escapeXml(info.college || "Mumbai Metropolitan College");
  const initials = escapeXml(getInitials(info.name || "ST"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" width="360" height="480">
  <defs>
    <linearGradient id="studioBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Photo Outer Border -->
  <rect width="360" height="480" fill="#ffffff"/>
  <rect x="12" y="12" width="336" height="456" fill="url(#studioBg)" rx="8"/>

  <!-- Subtle Studio Spotlight -->
  <ellipse cx="180" cy="180" rx="140" ry="120" fill="#f8fafc" opacity="0.35"/>

  <!-- Student Figure -->
  <!-- Shoulders & Torso -->
  <path d="M 60 420 C 60 300, 110 270, 180 270 C 250 270, 300 300, 300 420 Z" fill="url(#bodyGrad)" filter="url(#shadow)"/>
  
  <!-- Collar / Shirt Detail -->
  <polygon points="180,295 155,270 205,270" fill="#ffffff"/>
  <polygon points="180,335 168,295 192,295" fill="#0284c7"/>

  <!-- Neck -->
  <rect x="160" y="220" width="40" height="55" fill="url(#faceGrad)"/>

  <!-- Head / Face -->
  <ellipse cx="180" cy="175" rx="58" ry="70" fill="url(#faceGrad)" filter="url(#shadow)"/>

  <!-- Hair -->
  <path d="M 120 170 C 118 110, 150 95, 180 95 C 210 95, 242 110, 240 170 C 230 130, 210 115, 180 115 C 150 115, 130 130, 120 170 Z" fill="#1e1b4b"/>

  <!-- Initials Badge in Chest -->
  <circle cx="180" cy="370" r="28" fill="#15803d" stroke="#ffffff" stroke-width="3"/>
  <text x="180" y="378" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>

  <!-- Name Strip at Bottom -->
  <rect x="12" y="420" width="336" height="48" fill="#0f172a"/>
  <text x="180" y="442" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">${name}</text>
  <text x="180" y="458" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">${sid} · ${college}</text>

  <!-- Official Verified Stamp -->
  <g transform="translate(240, 320) rotate(-15)">
    <circle cx="40" cy="40" r="38" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="4,2"/>
    <circle cx="40" cy="40" r="32" fill="#16a34a" fill-opacity="0.1" stroke="#16a34a" stroke-width="1.5"/>
    <text x="40" y="32" font-family="system-ui, sans-serif" font-size="8" font-weight="900" fill="#15803d" text-anchor="middle">OFFICIALLY</text>
    <text x="40" y="44" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#15803d" text-anchor="middle">VERIFIED</text>
    <text x="40" y="54" font-family="system-ui, sans-serif" font-size="7" font-weight="700" fill="#15803d" text-anchor="middle">YATRIK PASS</text>
  </g>
</svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * 2. COLLEGE STUDENT IDENTITY CARD
 */
export function generateStudentIdCardSvg(info: StudentDocInfo): string {
  const name = escapeXml(info.name || "Student");
  const sid = escapeXml(info.studentId || "STU2025");
  const college = escapeXml(info.college || "Mumbai Metropolitan College");
  const course = escapeXml(`${info.course || "Degree Course"} ${info.year ? `· ${info.year}` : ""}`);
  const mobile = escapeXml(info.mobile || "98XXXXXXXX");
  const initials = escapeXml(getInitials(info.name || "ST"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <defs>
    <linearGradient id="idHeader" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Card Body -->
  <rect width="600" height="380" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#cardShadow)"/>

  <!-- Top College Header -->
  <rect width="600" height="85" rx="20" fill="url(#idHeader)"/>
  <rect y="65" width="600" height="20" fill="#047857"/>

  <!-- Gold Accent Line -->
  <rect y="83" width="600" height="4" fill="#f59e0b"/>

  <!-- College Title -->
  <text x="300" y="38" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${college.toUpperCase()}</text>
  <text x="300" y="60" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="2">STUDENT IDENTITY CARD · 2025–2026</text>

  <!-- Photo Box (Left) -->
  <rect x="35" y="110" width="130" height="160" rx="12" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="100" cy="170" r="38" fill="#047857"/>
  <text x="100" y="180" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
  <rect x="45" y="235" width="110" height="24" rx="6" fill="#064e3b"/>
  <text x="100" y="251" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">STUDENT</text>

  <!-- Details (Right) -->
  <g transform="translate(190, 115)" font-family="system-ui, sans-serif">
    <!-- Student Name -->
    <text x="0" y="18" font-size="11" font-weight="700" fill="#64748b">NAME OF STUDENT</text>
    <text x="0" y="38" font-size="18" font-weight="900" fill="#0f172a">${name}</text>

    <!-- Student ID & Course -->
    <text x="0" y="70" font-size="11" font-weight="700" fill="#64748b">ROLL / STUDENT ID</text>
    <text x="0" y="88" font-size="14" font-weight="800" fill="#047857">${sid}</text>

    <text x="180" y="70" font-size="11" font-weight="700" fill="#64748b">ACADEMIC YEAR</text>
    <text x="180" y="88" font-size="13" font-weight="800" fill="#0f172a">2025 – 2026</text>

    <text x="0" y="120" font-size="11" font-weight="700" fill="#64748b">COURSE &amp; STREAM</text>
    <text x="0" y="138" font-size="14" font-weight="800" fill="#0f172a">${course}</text>

    <text x="0" y="170" font-size="11" font-weight="700" fill="#64748b">MOBILE / EMERGENCY</text>
    <text x="0" y="186" font-size="12" font-weight="700" fill="#334155">+91 ${mobile}</text>

    <text x="180" y="170" font-size="11" font-weight="700" fill="#64748b">VALIDITY</text>
    <text x="180" y="186" font-size="12" font-weight="700" fill="#15803d">31 MAY 2026</text>
  </g>

  <!-- Card Footer Bar -->
  <rect y="315" width="600" height="65" rx="0" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  
  <!-- Barcode Simulation -->
  <g transform="translate(35, 330)">
    <rect x="0" y="0" width="3" height="30" fill="#0f172a"/>
    <rect x="6" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="11" y="0" width="5" height="30" fill="#0f172a"/>
    <rect x="19" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="24" y="0" width="4" height="30" fill="#0f172a"/>
    <rect x="31" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="36" y="0" width="6" height="30" fill="#0f172a"/>
    <rect x="45" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="50" y="0" width="4" height="30" fill="#0f172a"/>
    <rect x="57" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="62" y="0" width="5" height="30" fill="#0f172a"/>
    <rect x="70" y="0" width="3" height="30" fill="#0f172a"/>
    <rect x="76" y="0" width="6" height="30" fill="#0f172a"/>
    <rect x="85" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="90" y="0" width="4" height="30" fill="#0f172a"/>
    <rect x="97" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="102" y="0" width="5" height="30" fill="#0f172a"/>
    <rect x="110" y="0" width="3" height="30" fill="#0f172a"/>
    <rect x="116" y="0" width="6" height="30" fill="#0f172a"/>
    <rect x="125" y="0" width="2" height="30" fill="#0f172a"/>
    <rect x="130" y="0" width="4" height="30" fill="#0f172a"/>
    <rect x="137" y="0" width="2" height="30" fill="#0f172a"/>
  </g>

  <!-- Principal Signature Line -->
  <path d="M 430 348 Q 455 330, 480 348 T 530 345" fill="none" stroke="#047857" stroke-width="2"/>
  <text x="480" y="365" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#64748b" text-anchor="middle">PRINCIPAL / ISSUING AUTHORITY</text>
</svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * 3. GOVERNMENT OF INDIA AADHAAR CARD
 */
export function generateAadharCardSvg(info: StudentDocInfo): string {
  const name = escapeXml(info.name || "Student");
  const phone = (info.mobile || "7488").replace(/\D/g, "");
  const lastFour = phone.slice(-4) || "7488";
  const initials = escapeXml(getInitials(info.name || "ST"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <defs>
    <linearGradient id="aadhaarBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fffbeb"/>
    </linearGradient>
  </defs>

  <!-- Base Card -->
  <rect width="600" height="380" rx="16" fill="url(#aadhaarBg)" stroke="#e2e8f0" stroke-width="2"/>

  <!-- Top Tricolor Ribbon -->
  <rect x="0" y="0" width="600" height="12" fill="#f97316"/>
  <rect x="0" y="12" width="600" height="12" fill="#ffffff"/>
  <rect x="0" y="24" width="600" height="12" fill="#16a34a"/>

  <!-- Aadhaar Header -->
  <g transform="translate(40, 52)" font-family="system-ui, sans-serif">
    <text x="260" y="0" font-size="14" font-weight="800" fill="#991b1b" text-anchor="middle">भारत सरकार</text>
    <text x="260" y="16" font-size="14" font-weight="800" fill="#991b1b" text-anchor="middle">GOVERNMENT OF INDIA</text>
    <text x="260" y="34" font-size="10" font-weight="600" fill="#64748b" text-anchor="middle">भारतीय विशिष्ट पहचान प्राधिकरण · UIDAI</text>
  </g>

  <!-- Photo Box -->
  <rect x="40" y="115" width="120" height="145" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="100" cy="170" r="36" fill="#f97316"/>
  <text x="100" y="180" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
  <rect x="45" y="225" width="110" height="22" rx="4" fill="#991b1b"/>
  <text x="100" y="240" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">VERIFIED CITIZEN</text>

  <!-- Details -->
  <g transform="translate(180, 120)" font-family="system-ui, sans-serif">
    <text x="0" y="16" font-size="11" font-weight="600" fill="#64748b">नाम / Name</text>
    <text x="0" y="38" font-size="17" font-weight="900" fill="#0f172a">${name}</text>

    <text x="0" y="70" font-size="11" font-weight="600" fill="#64748b">जन्म तिथि / DOB</text>
    <text x="0" y="88" font-size="14" font-weight="800" fill="#0f172a">15/08/2004</text>

    <text x="170" y="70" font-size="11" font-weight="600" fill="#64748b">लिंग / Gender</text>
    <text x="170" y="88" font-size="14" font-weight="800" fill="#0f172a">STUDENT</text>

    <text x="0" y="122" font-size="10" font-weight="700" fill="#15803d">✓ e-KYC VERIFIED &amp; LINKED TO BUS PASS</text>
  </g>

  <!-- Red Separation Line -->
  <line x1="40" y1="285" x2="560" y2="285" stroke="#dc2626" stroke-width="2"/>

  <!-- Aadhaar Number (Masked) -->
  <g transform="translate(300, 325)" font-family="system-ui, monospace" font-size="22" font-weight="900" fill="#991b1b" text-anchor="middle">
    <text>XXXX  XXXX  ${lastFour}</text>
  </g>

  <!-- Bottom Slogan -->
  <text x="300" y="358" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#b91c1c" text-anchor="middle">मेरा आधार, मेरी पहचान</text>
</svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * 4. GOVERNMENT OF INDIA PAN CARD
 */
export function generatePanCardSvg(info: StudentDocInfo): string {
  const name = escapeXml(info.name || "Student");
  const phone = (info.mobile || "7488").replace(/\D/g, "");
  const lastFour = phone.slice(-4) || "7488";
  const initials = escapeXml(getInitials(info.name || "ST"));
  const pan = `ABCDE${lastFour}F`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <defs>
    <linearGradient id="panBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
  </defs>

  <!-- Base Card -->
  <rect width="600" height="380" rx="16" fill="url(#panBg)" stroke="#bfdbfe" stroke-width="2"/>

  <!-- Header -->
  <rect width="600" height="70" rx="16" fill="#1e3a8a"/>
  <rect y="50" width="600" height="20" fill="#1e3a8a"/>

  <g transform="translate(300, 28)" font-family="system-ui, sans-serif" fill="#ffffff" text-anchor="middle">
    <text font-size="15" font-weight="900">आयकर विभाग / INCOME TAX DEPARTMENT</text>
    <text y="22" font-size="12" font-weight="700" fill="#93c5fd">भारत सरकार / GOVT. OF INDIA</text>
  </g>

  <!-- Card Title -->
  <text x="300" y="94" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#1e40af" text-anchor="middle" letter-spacing="1">PERMANENT ACCOUNT NUMBER CARD</text>

  <!-- Photo Box -->
  <rect x="40" y="115" width="115" height="140" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="2"/>
  <circle cx="97" cy="170" r="34" fill="#2563eb"/>
  <text x="97" y="180" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
  
  <!-- PAN Number Highlight Box -->
  <rect x="180" y="115" width="380" height="42" rx="8" fill="#1e3a8a"/>
  <text x="195" y="132" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#93c5fd">PAN NUMBER</text>
  <text x="195" y="149" font-family="system-ui, monospace" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="3">${pan}</text>

  <!-- Details -->
  <g transform="translate(180, 180)" font-family="system-ui, sans-serif">
    <text x="0" y="0" font-size="10" font-weight="700" fill="#64748b">CARDHOLDER NAME / नाम</text>
    <text x="0" y="18" font-size="16" font-weight="900" fill="#0f172a">${name}</text>

    <text x="0" y="46" font-size="10" font-weight="700" fill="#64748b">FATHER'S NAME / GUARDIAN</text>
    <text x="0" y="62" font-size="13" font-weight="800" fill="#334155">${escapeXml(info.college || "MUMBAI METROPOLITAN COLLEGE")}</text>

    <text x="0" y="90" font-size="10" font-weight="700" fill="#64748b">DATE OF BIRTH / जन्म की तारीख</text>
    <text x="0" y="106" font-size="13" font-weight="800" fill="#0f172a">15/08/2004</text>
  </g>

  <!-- Signature Box -->
  <rect x="40" y="275" width="180" height="50" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <path d="M 55 305 Q 85 285, 120 308 T 190 300" fill="none" stroke="#1e3a8a" stroke-width="2.5"/>
  <text x="130" y="320" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#94a3b8" text-anchor="middle">SIGNATURE / हस्ताक्षर</text>

  <!-- Security Hologram Badge -->
  <circle cx="510" cy="300" r="26" fill="#2563eb" fill-opacity="0.1" stroke="#2563eb" stroke-width="2"/>
  <text x="510" y="296" font-family="system-ui, sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">OFFICIAL</text>
  <text x="510" y="308" font-family="system-ui, sans-serif" font-size="8" font-weight="900" fill="#1e40af" text-anchor="middle">HOLOGRAM</text>
</svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * 5. ADMISSION / BONAFIDE CERTIFICATE
 */
export function generateBonafideSvg(info: StudentDocInfo): string {
  const name = escapeXml(info.name || "Student");
  const sid = escapeXml(info.studentId || "STU2025");
  const college = escapeXml(info.college || "Mumbai Metropolitan College");
  const course = escapeXml(info.course || "Degree Course");
  const year = escapeXml(info.year || "1st Year");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650">
  <!-- Page Body -->
  <rect width="500" height="650" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="15" y="15" width="470" height="620" fill="none" stroke="#047857" stroke-width="2"/>

  <!-- College Crest / Header -->
  <g transform="translate(250, 60)" font-family="system-ui, sans-serif" text-anchor="middle">
    <circle cx="0" cy="0" r="24" fill="#047857"/>
    <text y="7" font-size="16" font-weight="900" fill="#ffffff">MMC</text>
    <text y="48" font-size="18" font-weight="900" fill="#064e3b" letter-spacing="1">${college.toUpperCase()}</text>
    <text y="68" font-size="10" font-weight="600" fill="#64748b">Affiliated to University of Mumbai · NAAC Accredited 'A' Grade</text>
    <text y="82" font-size="9" font-weight="600" fill="#94a3b8">Bandra-Kurla Complex Road, Mumbai – 400051</text>
  </g>

  <line x1="40" y1="165" x2="460" y2="165" stroke="#047857" stroke-width="1.5"/>

  <!-- Certificate Title -->
  <rect x="100" y="185" width="300" height="34" rx="6" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
  <text x="250" y="207" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#15803d" text-anchor="middle" letter-spacing="1">BONAFIDE &amp; ADMISSION CERTIFICATE</text>

  <!-- Certificate Body -->
  <g transform="translate(50, 260)" font-family="system-ui, sans-serif" font-size="13" fill="#1e293b">
    <text y="0">Ref No: MMC/ADM/2025/7488</text>
    <text x="290" y="0">Date: 15 July 2025</text>

    <text y="45" font-size="13" line-height="1.6">This is to certify that <tspan font-weight="900" fill="#064e3b">${name}</tspan></text>
    <text y="75">Roll / Student ID: <tspan font-weight="800">${sid}</tspan></text>
    <text y="105">is a bonafide student of this college studying in the</text>
    <text y="135"><tspan font-weight="800" fill="#064e3b">${course} (${year})</tspan> program during the</text>
    <text y="165">academic year <tspan font-weight="800">2025 – 2026</tspan>.</text>

    <text y="210">This certificate is issued on the student's request for</text>
    <text y="235">obtaining a <tspan font-weight="800" fill="#047857">Suburban Student Concession Bus Pass</tspan>.</text>
  </g>

  <!-- Stamps and Signatures -->
  <g transform="translate(90, 560)">
    <circle cx="30" cy="0" r="32" fill="#047857" fill-opacity="0.1" stroke="#047857" stroke-width="1.5"/>
    <text x="30" y="-5" font-family="system-ui, sans-serif" font-size="7" font-weight="900" fill="#047857" text-anchor="middle">COLLEGE SEAL</text>
    <text x="30" y="8" font-family="system-ui, sans-serif" font-size="6" font-weight="700" fill="#047857" text-anchor="middle">REGISTRAR</text>
  </g>

  <g transform="translate(360, 560)" font-family="system-ui, sans-serif" text-anchor="middle">
    <path d="M -50 -10 Q -20 -30, 20 -12 T 50 -15" fill="none" stroke="#064e3b" stroke-width="2"/>
    <text y="10" font-size="11" font-weight="800" fill="#0f172a">Registrar</text>
    <text y="24" font-size="9" font-weight="600" fill="#64748b">${college}</text>
  </g>
</svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * Main dispatcher to get fallback document URL for any label
 */
export function getDocumentFallbackUrl(label: string, info: StudentDocInfo): string {
  const l = label.toLowerCase();
  if (l.includes("photo") || l.includes("passport")) {
    return generatePassportPhotoSvg(info);
  }
  if (l.includes("id card") || l.includes("student id") || l.includes("college id")) {
    return generateStudentIdCardSvg(info);
  }
  if (l.includes("aadhar") || l.includes("aadhaar")) {
    return generateAadharCardSvg(info);
  }
  if (l.includes("pan")) {
    return generatePanCardSvg(info);
  }
  return generateBonafideSvg(info);
}
