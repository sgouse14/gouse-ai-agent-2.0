// Sample architectural blueprints as SVG data URIs for 1-click testing of multimodal BOQ Auto-Calculation
export interface BlueprintPreset {
  id: string;
  title: string;
  titleHi: string;
  titleKn: string;
  defaultArea: number;
  dimensions: string;
  typology: string;
  description: string;
  detectedElements: string[];
  getDataUri: () => string;
}

function svgToBase64(svg: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. 30x40 Duplex Villa (2,400 sq.ft)
const VILLA_30x40_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#091428;font-family:ui-monospace,Menlo,Monaco,monospace;">
  <!-- Grid background -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#132747" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#091428"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Title Block Header -->
  <rect x="30" y="25" width="740" height="60" rx="6" fill="#0d1f3d" stroke="#1e4976" stroke-width="1.5"/>
  <text x="50" y="52" fill="#38bdf8" font-size="16" font-weight="bold">ARCHITECTURAL FLOOR PLAN • 30' x 40' DUPLEX VILLA (G+1)</text>
  <text x="50" y="72" fill="#94a3b8" font-size="12">SCALE: 1:100 • BUILT-UP AREA: 2,400 SQ.FT (GROUND: 1,200 SQ.FT + FIRST: 1,200 SQ.FT)</text>
  <text x="630" y="60" fill="#f59e0b" font-size="13" font-weight="bold">IS 456 / CPWD</text>

  <!-- Plot Border (30ft x 40ft boundary) -->
  <rect x="120" y="110" width="560" height="420" fill="#0a1832" stroke="#38bdf8" stroke-width="4"/>

  <!-- External Dimension Lines -->
  <!-- Width 30'-0" -->
  <line x1="120" y1="95" x2="680" y2="95" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="120" y1="88" x2="120" y2="102" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="680" y1="88" x2="680" y2="102" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="360" y="90" fill="#f59e0b" font-size="12" font-weight="bold" text-anchor="middle">WIDTH: 30'-0" (9.14 m)</text>

  <!-- Length 40'-0" -->
  <line x1="100" y1="110" x2="100" y2="530" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="93" y1="110" x2="107" y2="110" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="93" y1="530" x2="107" y2="530" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="85" y="325" fill="#f59e0b" font-size="12" font-weight="bold" transform="rotate(-90 85 325)" text-anchor="middle">LENGTH: 40'-0" (12.19 m)</text>

  <!-- Room Layout Partitions (9" Masonry Walls) -->
  <!-- Foyer & Car Porch -->
  <rect x="120" y="390" width="220" height="140" fill="#0d244a" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="230" y="455" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">CAR PORCH &amp; ENTRY</text>
  <text x="230" y="475" fill="#94a3b8" font-size="11" text-anchor="middle">12'-0" x 15'-0" (180 sq.ft)</text>

  <!-- Living Hall (Spacious) -->
  <rect x="340" y="330" width="340" height="200" fill="#0f2b57" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="510" y="420" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="middle">LIVING &amp; DRAWING HALL</text>
  <text x="510" y="442" fill="#94a3b8" font-size="11" text-anchor="middle">18'-0" x 16'-0" (288 sq.ft) • Vitrified 800x800mm</text>

  <!-- Dining & Open Kitchen -->
  <rect x="420" y="110" width="260" height="220" fill="#0c2243" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="550" y="205" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">MODULAR KITCHEN &amp; DINING</text>
  <text x="550" y="225" fill="#94a3b8" font-size="11" text-anchor="middle">14'-0" x 16'-0" (224 sq.ft)</text>
  <text x="550" y="243" fill="#34d399" font-size="10" text-anchor="middle">Granite Counter • SS Sink</text>

  <!-- Master Bedroom 1 -->
  <rect x="120" y="110" width="300" height="180" fill="#0c2243" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="270" y="195" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">MASTER BEDROOM</text>
  <text x="270" y="215" fill="#94a3b8" font-size="11" text-anchor="middle">16'-0" x 13'-0" (208 sq.ft)</text>

  <!-- Attached Toilet / Bath -->
  <rect x="120" y="290" width="130" height="100" fill="#0a1932" stroke="#38bdf8" stroke-width="2"/>
  <text x="185" y="340" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">TOILET</text>
  <text x="185" y="355" fill="#94a3b8" font-size="9" text-anchor="middle">7'x5' (Anti-skid)</text>

  <!-- Staircase Core -->
  <rect x="250" y="290" width="90" height="100" fill="#132c52" stroke="#f59e0b" stroke-width="2"/>
  <!-- Steps -->
  <line x1="250" y1="305" x2="340" y2="305" stroke="#f59e0b" stroke-width="1"/>
  <line x1="250" y1="320" x2="340" y2="320" stroke="#f59e0b" stroke-width="1"/>
  <line x1="250" y1="335" x2="340" y2="335" stroke="#f59e0b" stroke-width="1"/>
  <line x1="250" y1="350" x2="340" y2="350" stroke="#f59e0b" stroke-width="1"/>
  <line x1="250" y1="365" x2="340" y2="365" stroke="#f59e0b" stroke-width="1"/>
  <line x1="250" y1="380" x2="340" y2="380" stroke="#f59e0b" stroke-width="1"/>
  <text x="295" y="348" fill="#f59e0b" font-size="10" font-weight="bold" text-anchor="middle">STAIRS (UP)</text>

  <!-- 12 RCC Columns (C1 to C12) - 9" x 15" M25 Grade -->
  <!-- Row 1 (Top) -->
  <rect x="115" y="105" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="105" y="125" fill="#fca5a5" font-size="9">C1</text>
  <rect x="412" y="105" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="420" y="100" fill="#fca5a5" font-size="9">C2</text>
  <rect x="672" y="105" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="692" y="120" fill="#fca5a5" font-size="9">C3</text>

  <!-- Row 2 (Mid-upper) -->
  <rect x="115" y="282" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="105" y="300" fill="#fca5a5" font-size="9">C4</text>
  <rect x="332" y="282" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="340" y="278" fill="#fca5a5" font-size="9">C5</text>
  <rect x="672" y="322" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="692" y="338" fill="#fca5a5" font-size="9">C6</text>

  <!-- Row 3 (Mid-lower) -->
  <rect x="115" y="382" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="105" y="400" fill="#fca5a5" font-size="9">C7</text>
  <rect x="332" y="382" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="340" y="380" fill="#fca5a5" font-size="9">C8</text>

  <!-- Row 4 (Bottom) -->
  <rect x="115" y="522" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="105" y="545" fill="#fca5a5" font-size="9">C9</text>
  <rect x="332" y="522" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="340" y="550" fill="#fca5a5" font-size="9">C10</text>
  <rect x="672" y="522" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="672" y="550" fill="#fca5a5" font-size="9">C11</text>
  <rect x="502" y="522" width="16" height="16" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="502" y="550" fill="#fca5a5" font-size="9">C12</text>

  <!-- Bottom Spec Schedule -->
  <rect x="30" y="550" width="740" height="35" rx="4" fill="#0d1f3d" stroke="#1e4976" stroke-width="1"/>
  <text x="50" y="572" fill="#38bdf8" font-size="11">STRUCTURAL SPEC: 12 RCC Columns (M25) • 9" External AAC Blocks • Plinth: 1,200 sq.ft • Total Built-up (G+1): 2,400 sq.ft</text>
</svg>
`;

// 2. 40x60 Luxury Residence (4,800 sq.ft)
const LUXURY_40x60_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#081325;font-family:ui-monospace,Menlo,Monaco,monospace;">
  <defs>
    <pattern id="luxgrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#122748" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#081325"/>
  <rect width="100%" height="100%" fill="url(#luxgrid)"/>

  <!-- Title Block -->
  <rect x="30" y="20" width="740" height="65" rx="6" fill="#0c1d38" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="50" y="48" fill="#fbbf24" font-size="16" font-weight="bold">PREMIUM ARCHITECTURAL BLUEPRINT • 40' x 60' LUXURY VILLA (G+2)</text>
  <text x="50" y="70" fill="#94a3b8" font-size="12">TOTAL BUILT-UP AREA: 4,800 SQ.FT • 16 RCC COLUMNS • LIFT CORE &amp; DOUBLE HEIGHT LIVING</text>
  <text x="635" y="55" fill="#34d399" font-size="13" font-weight="bold">LUXURY TIER</text>

  <!-- Plot (40ft x 60ft) -->
  <rect x="100" y="105" width="600" height="430" fill="#0a1932" stroke="#fbbf24" stroke-width="3.5"/>

  <!-- Dimension Lines -->
  <line x1="100" y1="92" x2="700" y2="92" stroke="#fbbf24" stroke-width="1.5"/>
  <text x="400" y="87" fill="#fbbf24" font-size="12" font-weight="bold" text-anchor="middle">WIDTH: 40'-0" (12.19 m)</text>
  <line x1="82" y1="105" x2="82" y2="535" stroke="#fbbf24" stroke-width="1.5"/>
  <text x="70" y="320" fill="#fbbf24" font-size="12" font-weight="bold" transform="rotate(-90 70 320)" text-anchor="middle">LENGTH: 60'-0" (18.28 m)</text>

  <!-- Rooms -->
  <!-- Grand Foyer & Double Height Living -->
  <rect x="100" y="320" width="380" height="215" fill="#132c52" stroke="#fbbf24" stroke-width="2"/>
  <text x="290" y="420" fill="#fbbf24" font-size="16" font-weight="bold" text-anchor="middle">DOUBLE-HEIGHT GRAND LIVING</text>
  <text x="290" y="445" fill="#94a3b8" font-size="11" text-anchor="middle">24'-0" x 20'-0" (480 sq.ft) • Italian Statuario Marble</text>

  <!-- Dining & Island Kitchen -->
  <rect x="480" y="320" width="220" height="215" fill="#0f2647" stroke="#fbbf24" stroke-width="2"/>
  <text x="590" y="415" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">ISLAND KITCHEN &amp; BAR</text>
  <text x="590" y="435" fill="#94a3b8" font-size="10" text-anchor="middle">16'-0" x 14'-0" (224 sq.ft)</text>

  <!-- Master Suite Deluxe -->
  <rect x="100" y="105" width="340" height="215" fill="#0f2647" stroke="#fbbf24" stroke-width="2"/>
  <text x="270" y="200" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">PRESIDENTIAL MASTER SUITE</text>
  <text x="270" y="222" fill="#94a3b8" font-size="11" text-anchor="middle">22'-0" x 16'-0" (352 sq.ft) • Engineered Hardwood</text>

  <!-- Lift Core & Staircase -->
  <rect x="440" y="105" width="100" height="215" fill="#1a365d" stroke="#38bdf8" stroke-width="2"/>
  <rect x="455" y="125" width="70" height="70" fill="#0c1d38" stroke="#34d399" stroke-width="1.5"/>
  <text x="490" y="165" fill="#34d399" font-size="10" font-weight="bold" text-anchor="middle">HYDRAULIC LIFT</text>
  <text x="490" y="260" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">STAIRS</text>

  <!-- Guest Suite & Home Theater -->
  <rect x="540" y="105" width="160" height="215" fill="#0a1c35" stroke="#fbbf24" stroke-width="2"/>
  <text x="620" y="205" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">GUEST SUITE</text>
  <text x="620" y="225" fill="#94a3b8" font-size="10" text-anchor="middle">14'x15' (210 sq.ft)</text>

  <!-- 16 Columns (C1 to C16) -->
  <g fill="#f59e0b" stroke="#fef3c7" stroke-width="1.5">
    <rect x="94" y="99" width="18" height="18"/><rect x="290" y="99" width="18" height="18"/><rect x="435" y="99" width="18" height="18"/><rect x="690" y="99" width="18" height="18"/>
    <rect x="94" y="205" width="18" height="18"/><rect x="290" y="205" width="18" height="18"/><rect x="435" y="205" width="18" height="18"/><rect x="690" y="205" width="18" height="18"/>
    <rect x="94" y="315" width="18" height="18"/><rect x="290" y="315" width="18" height="18"/><rect x="435" y="315" width="18" height="18"/><rect x="690" y="315" width="18" height="18"/>
    <rect x="94" y="525" width="18" height="18"/><rect x="290" y="525" width="18" height="18"/><rect x="475" y="525" width="18" height="18"/><rect x="690" y="525" width="18" height="18"/>
  </g>

  <!-- Footer Schedule -->
  <rect x="30" y="550" width="740" height="35" rx="4" fill="#0c1d38" stroke="#f59e0b" stroke-width="1"/>
  <text x="50" y="572" fill="#fbbf24" font-size="11">STRUCTURAL: 16 Heavy RCC Columns (M30) • Fe550D Steel • Built-Up Area: 4,800 sq.ft (G+2 Floors)</text>
</svg>
`;

// 3. Apartment Stilt + 3 Floors (6,000 sq.ft)
const APARTMENT_G3_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#061426;font-family:ui-monospace,Menlo,Monaco,monospace;">
  <defs>
    <pattern id="aptgrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f294a" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#061426"/>
  <rect width="100%" height="100%" fill="url(#aptgrid)"/>

  <!-- Header -->
  <rect x="30" y="20" width="740" height="65" rx="6" fill="#0b2240" stroke="#34d399" stroke-width="1.5"/>
  <text x="50" y="48" fill="#34d399" font-size="16" font-weight="bold">MULTI-FAMILY APARTMENT (STILT + 3 FLOORS) • 6,000 SQ.FT</text>
  <text x="50" y="70" fill="#94a3b8" font-size="12">TYPICAL FLOOR PLATE: 1,500 SQ.FT (2 UNITS/FLOOR) • STILT PARKING + 6 APARTMENTS</text>
  <text x="645" y="55" fill="#38bdf8" font-size="13" font-weight="bold">RERA / NBC</text>

  <!-- Floor Plate -->
  <rect x="90" y="105" width="620" height="430" fill="#091b33" stroke="#34d399" stroke-width="3"/>

  <!-- Left Unit A (3BHK) -->
  <rect x="90" y="105" width="260" height="430" fill="#0c2344" stroke="#38bdf8" stroke-width="2"/>
  <text x="220" y="280" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="middle">UNIT 101 (3BHK)</text>
  <text x="220" y="305" fill="#94a3b8" font-size="12" text-anchor="middle">Carpet: 680 sq.ft</text>
  <text x="220" y="325" fill="#94a3b8" font-size="10" text-anchor="middle">Super Built-up: 750 sq.ft</text>

  <!-- Central Lobby & Core -->
  <rect x="350" y="105" width="100" height="430" fill="#132c4e" stroke="#34d399" stroke-width="2"/>
  <rect x="365" y="240" width="70" height="70" fill="#07182c" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="400" y="275" fill="#f59e0b" font-size="10" font-weight="bold" text-anchor="middle">8-PASS LIFT</text>
  <text x="400" y="400" fill="#34d399" font-size="11" font-weight="bold" text-anchor="middle">FIRE EXIT</text>
  <text x="400" y="420" fill="#94a3b8" font-size="9" text-anchor="middle">STAIRS</text>

  <!-- Right Unit B (3BHK) -->
  <rect x="450" y="105" width="260" height="430" fill="#0c2344" stroke="#38bdf8" stroke-width="2"/>
  <text x="580" y="280" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="middle">UNIT 102 (3BHK)</text>
  <text x="580" y="305" fill="#94a3b8" font-size="12" text-anchor="middle">Carpet: 680 sq.ft</text>
  <text x="580" y="325" fill="#94a3b8" font-size="10" text-anchor="middle">Super Built-up: 750 sq.ft</text>

  <!-- 18 Heavy Columns Grid -->
  <g fill="#34d399" stroke="#d1fae5" stroke-width="1.5">
    <rect x="85" y="100" width="16" height="16"/><rect x="215" y="100" width="16" height="16"/><rect x="345" y="100" width="16" height="16"/><rect x="445" y="100" width="16" height="16"/><rect x="575" y="100" width="16" height="16"/><rect x="700" y="100" width="16" height="16"/>
    <rect x="85" y="310" width="16" height="16"/><rect x="215" y="310" width="16" height="16"/><rect x="345" y="310" width="16" height="16"/><rect x="445" y="310" width="16" height="16"/><rect x="575" y="310" width="16" height="16"/><rect x="700" y="310" width="16" height="16"/>
    <rect x="85" y="525" width="16" height="16"/><rect x="215" y="525" width="16" height="16"/><rect x="345" y="525" width="16" height="16"/><rect x="445" y="525" width="16" height="16"/><rect x="575" y="525" width="16" height="16"/><rect x="700" y="525" width="16" height="16"/>
  </g>

  <!-- Footer -->
  <rect x="30" y="550" width="740" height="35" rx="4" fill="#0b2240" stroke="#34d399" stroke-width="1"/>
  <text x="50" y="572" fill="#34d399" font-size="11">TOTAL BUILT-UP: 6,000 SQ.FT (4 SLABS @ 1,500 SQ.FT) • 18 RCC COLUMNS • FIRE MEP COMPLIANT</text>
</svg>
`;

export const ARCHITECTURAL_BLUEPRINT_PRESETS: BlueprintPreset[] = [
  {
    id: 'villa_30x40',
    title: '30x40 Duplex Villa (2,400 sq.ft)',
    titleHi: '30x40 डुप्लेक्स विला (2,400 वर्ग फुट)',
    titleKn: '30x40 ಡುಪ್ಲೆಕ್ಸ್ ವಿಲ್ಲಾ (2,400 ಚದರ ಅಡಿ)',
    defaultArea: 2400,
    dimensions: '30ft x 40ft (G+1 Floors)',
    typology: 'Residential Architecture',
    description: 'Complete duplex architectural plan with 12 RCC columns, living hall, modular kitchen, master bed, and staircase.',
    detectedElements: [
      '12 RCC Columns (9" x 15" M25)',
      '9" AAC External Masonry Walls',
      '4.5" Internal Brick Partitions',
      'Staircase RCC Dog-legged Core',
      'Plinth Footprint: 1,200 sq.ft',
      'Built-up Area: 2,400 sq.ft (G+1)',
    ],
    getDataUri: () => svgToBase64(VILLA_30x40_SVG),
  },
  {
    id: 'luxury_40x60',
    title: '40x60 Luxury Residence (4,800 sq.ft)',
    titleHi: '40x60 लक्जरी आवास (4,800 वर्ग फुट)',
    titleKn: '40x60 ಐಷಾರಾಮಿ ನಿವಾಸ (4,800 ಚದರ ಅಡಿ)',
    defaultArea: 4800,
    dimensions: '40ft x 60ft (G+2 Floors)',
    typology: 'Luxury Mansion',
    description: 'High-end residence with 16 heavy columns, hydraulic lift core, double-height grand living, and 4 luxury suites.',
    detectedElements: [
      '16 Heavy RCC Columns (M30 Grade)',
      'Hydraulic Passenger Lift Core',
      'Double-Height Living Void (24\'x20\')',
      'Italian Statuario Marble Flooring',
      'Plinth Footprint: 1,600 sq.ft',
      'Built-up Area: 4,800 sq.ft (G+2)',
    ],
    getDataUri: () => svgToBase64(LUXURY_40x60_SVG),
  },
  {
    id: 'apartment_g3',
    title: 'Apartment Stilt + 3 Floors (6,000 sq.ft)',
    titleHi: 'अपार्टमेंट स्टिल्ट + 3 मंजिल (6,000 वर्ग फुट)',
    titleKn: 'ಅಪಾರ್ಟ್ಮೆಂಟ್ ಸ್ಟಿಲ್ಟ್ + 3 ಮಹಡಿಗಳು (6,000 ಚದರ ಅಡಿ)',
    defaultArea: 6000,
    dimensions: '50ft x 60ft (Stilt + 3 Floors)',
    typology: 'Multi-family Residential',
    description: 'Commercial/residential apartment with 18 column grid, stilt parking, 2 units per floor, and fire exit staircase.',
    detectedElements: [
      '18 RCC Columns (12" x 18" M30)',
      'Stilt Parking Structural Grid',
      'Central Lift & Fire Exit Shaft',
      '2 Units / Floor (3BHK Typology)',
      'Floor Plate: 1,500 sq.ft x 4 Slabs',
      'Built-up Area: 6,000 sq.ft Total',
    ],
    getDataUri: () => svgToBase64(APARTMENT_G3_SVG),
  },
];
