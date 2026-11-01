/**
 * Trilingual Translation Engine for Property Listings (English, Hindi, Kannada)
 * Covers:
 * - PG & Co-Living Facilities
 * - Independent Houses & Rental Floors
 * - Buy Houses, Luxury Villas & Penthouses
 * - Land Parcels & BDA / DTCP Approved Plots
 */

export type ListingLanguage = 'en' | 'hi' | 'kn';

export interface LanguageMeta {
  code: ListingLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LISTING_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🟡🔴' },
];

export interface TrilingualText {
  en: string;
  hi: string;
  kn: string;
}

export const LISTING_UI_DICTIONARY: Record<string, TrilingualText> = {
  // Navigation & Tabs
  allListings: {
    en: 'All Verified Listings',
    hi: 'सभी सत्यापित लिस्टिंग',
    kn: 'ಎಲ್ಲಾ ದೃಢೀಕೃತ ಪಟ್ಟಿಗಳು',
  },
  pgColiving: {
    en: 'PG & Co-Living Beds',
    hi: 'पीजी और को-लिविंग बेड्स',
    kn: 'ಪಿಜಿ ಮತ್ತು ಕೋ-ಲಿವಿಂಗ್ ಬೆಡ್‌ಗಳು',
  },
  rentalHouses: {
    en: 'Independent Rental Houses & Floors',
    hi: 'स्वतंत्र किराए के मकान और फ्लैट',
    kn: 'ಸ್ವತಂತ್ರ ಬಾಡಿಗೆ ಮನೆಗಳು ಮತ್ತು ಫ್ಲಾಟ್‌ಗಳು',
  },
  buyHouses: {
    en: 'Buy Luxury Villas & Houses',
    hi: 'लक्जरी विला और मकान खरीदें',
    kn: 'ಐಷಾರಾಮಿ ವಿಲ್ಲಾ ಮತ್ತು ಮನೆಗಳನ್ನು ಖರೀದಿಸಿ',
  },
  landPlots: {
    en: 'Buy Land & Villa Plots',
    hi: 'जमीन और विला प्लॉट खरीदें',
    kn: 'ನಿವೇಶನ ಮತ್ತು ಜಮೀನು ಖರೀದಿಸಿ',
  },
  zeroBrokerageBadge: {
    en: '0% Brokerage Direct Owner',
    hi: '0% ब्रोकरेज • सीधे मालिक से',
    kn: '0% ಬ್ರೋಕರೇಜ್ • ನೇರ ಮಾಲೀಕರಿಂದ',
  },
  verifiedTitle: {
    en: 'BBMP / BDA Verified Title',
    hi: 'बीबीएमपी / बीडीए सत्यापित शीर्षक',
    kn: 'ಬಿಬಿಎಂಪಿ / ಬಿಡಿಎ ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳು',
  },
  monthlyRent: {
    en: 'Monthly Rent',
    hi: 'मासिक किराया',
    kn: 'ತಿಂಗಳ ಬಾಡಿಗೆ',
  },
  securityDeposit: {
    en: 'Security Deposit',
    hi: 'सुरक्षा जमा राशि',
    kn: 'ಮುಂಗಡ ಠೇವಣಿ',
  },
  foodIncluded: {
    en: 'Food Included (3 Times Daily)',
    hi: 'भोजन शामिल (प्रतिदिन 3 बार)',
    kn: 'ಊಟ ಒಳಗೊಂಡಿದೆ (ದಿನಕ್ಕೆ 3 ಬಾರಿ)',
  },
  noFood: {
    en: 'Self-Cooking / Kitchen Access',
    hi: 'स्वयं रसोई / किचन उपलब्ध',
    kn: 'ಸ್ವಯಂ ಅಡುಗೆ / ಅಡುಗೆಮನೆ ಲಭ್ಯ',
  },
  noticePeriod: {
    en: 'Notice Period',
    hi: 'नोटिस अवधि',
    kn: 'ನೋಟಿಸ್ ಅವಧಿ',
  },
  gateClosing: {
    en: 'Gate Access / Biometric',
    hi: 'गेट प्रवेश / बायोमेट्रिक',
    kn: 'ಪ್ರವೇಶ ಸಮಯ / ಬಯೋಮೆಟ್ರಿಕ್',
  },
  furnishingStatus: {
    en: 'Furnishing',
    hi: 'फर्नीचर स्थिति',
    kn: 'ಫರ್ನಿಶಿಂಗ್ ವಿವರ',
  },
  fullyFurnished: {
    en: 'Fully Furnished',
    hi: 'पूरी तरह सुसज्जित (फुल फर्निश्ड)',
    kn: 'ಸಂಪೂರ್ಣ ಸುಸಜ್ಜಿತ (ಫುಲ್ಲಿ ಫರ್ನಿಶ್ಡ್)',
  },
  semiFurnished: {
    en: 'Semi-Furnished',
    hi: 'अर्ध-सुसज्जित (सेमी-फर्निश्ड)',
    kn: 'ಭಾಗಶಃ ಸುಸಜ್ಜಿತ (ಸೆಮಿ ಫರ್ನಿಶ್ಡ್)',
  },
  unfurnished: {
    en: 'Unfurnished',
    hi: 'बिना फर्नीचर (अनफर्निश्ड)',
    kn: 'ಖಾಲಿ ಮನೆ (ಅನ್‌ಫರ್ನಿಶ್ಡ್)',
  },
  facingVastu: {
    en: 'Vastu Direction',
    hi: 'वास्तु दिशा',
    kn: 'ವಾಸ್ತು ದಿಕ್ಕು',
  },
  eastFacing: {
    en: 'East Facing (100% Vastu)',
    hi: 'पूर्व मुखी (100% वास्तु)',
    kn: 'ಪೂರ್ವ ಮುಖ (100% ವಾಸ್ತು)',
  },
  northFacing: {
    en: 'North Facing (Kubera Vastu)',
    hi: 'उत्तर मुखी (कुबेर वास्तु)',
    kn: 'ಉತ್ತರ ಮುಖ (ಕುಬೇರ ವಾಸ್ತು)',
  },
  readyToMove: {
    en: 'Ready to Move',
    hi: 'तुरंत रहने योग्य (रेडी टू मूव)',
    kn: 'ತಕ್ಷಣ ಗೃಹಪ್ರವೇಶಕ್ಕೆ ಸಿದ್ಧ',
  },
  carpetArea: {
    en: 'Carpet Area',
    hi: 'कारपेट एरिया',
    kn: 'ಕಾರ್ಪೆಟ್ ವಿಸ್ತೀರ್ಣ',
  },
  plotDimensions: {
    en: 'Plot Dimensions',
    hi: 'प्लॉट का आकार',
    kn: 'ನಿವೇಶನದ ಅಳತೆ',
  },
  callOwner: {
    en: 'Call Owner / Architect',
    hi: 'मालिक / वास्तुकार से बात करें',
    kn: 'ಮಾಲೀಕರಿಗೆ / ವಾಸ್ತುಶಿಲ್ಪಿಗೆ ಕರೆ ಮಾಡಿ',
  },
  whatsappInquiry: {
    en: 'WhatsApp Inquiry',
    hi: 'व्हाट्सएप पूछताछ',
    kn: 'ವಾಟ್ಸಾಪ್ ವಿಚಾರಣೆ',
  },
  scheduleSiteVisit: {
    en: 'Schedule Free Site Visit',
    hi: 'मुफ्त साइट विजिट बुक करें',
    kn: 'ಉಚಿತ ಸೈಟ್ ವೀಕ್ಷಣೆ ಬುಕ್ ಮಾಡಿ',
  },
  viewDetails: {
    en: 'View Property Details',
    hi: 'संपत्ति विवरण देखें',
    kn: 'ಆಸ್ತಿ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
  },
  priceBreakup: {
    en: '0% Brokerage Agreement Ready',
    hi: '0% ब्रोकरेज एग्रीमेंट तैयार',
    kn: '0% ಬ್ರೋಕರೇಜ್ ಕರಾರು ಪತ್ರ ಸಿದ್ಧ',
  },
  amenities: {
    en: 'Verified Amenities',
    hi: 'सत्यापित सुविधाएं',
    kn: 'ದೃಢೀಕೃತ ಸೌಲಭ್ಯಗಳು',
  },
  languageSelectorLabel: {
    en: 'Select Listing Language:',
    hi: 'लिस्टिंग भाषा चुनें:',
    kn: 'ಪಟ್ಟಿಗಳ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
  },
  trilingualSupportNote: {
    en: 'All verified properties available in English, हिन्दी (Hindi), and ಕನ್ನಡ (Kannada). Zero broker fees guaranteed.',
    hi: 'सभी सत्यापित संपत्तियां अंग्रेजी, हिन्दी और ಕನ್ನಡ (कन्नड़) में उपलब्ध हैं। शून्य ब्रोकरेज शुल्क की गारंटी।',
    kn: 'ಎಲ್ಲಾ ದೃಢೀಕೃತ ಆಸ್ತಿಗಳು ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ಲಭ್ಯವಿದೆ. 0% ದಲ್ಲಾಳಿ ರಹಿತ ನೇರ ಮಾಲೀಕತ್ವ ಖಾತರಿ.',
  },
};

// Trilingual Dictionary for PG & Rental Listings
export const PG_LISTINGS_TRANSLATIONS: Record<
  string,
  {
    title: TrilingualText;
    subtitle: TrilingualText;
    foodDescription: TrilingualText;
    zoneDescription: TrilingualText;
    highlights: Record<ListingLanguage, string[]>;
  }
> = {
  'listing-pg-1': {
    title: {
      en: 'UrbanNest Executive PG & Co-Living House',
      hi: 'अर्बननेस्ट एग्जीक्यूटिव पीजी और को-लिविंग हाउस',
      kn: 'ಅರ್ಬನ್‌ನೆಸ್ಟ್ ಎಕ್ಸಿಕ್ಯೂಟಿವ್ ಪಿಜಿ ಮತ್ತು ಕೋ-ಲಿವಿಂಗ್ ಹೌಸ್',
    },
    subtitle: {
      en: 'Sector 2, HSR Layout • 500m to BDA Complex & Outer Ring Road Tech Corridor',
      hi: 'सेक्टर 2, एचएसआर लेआउट • बीडीए कॉम्प्लेक्स और ओआरआर टेक कॉरिडोर से 500 मीटर',
      kn: 'ಸೆಕ್ಟರ್ 2, ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್ • ಬಿಡಿಎ ಕಾಂಪ್ಲೆಕ್ಸ್ ಮತ್ತು ರಿಂಗ್ ರೋಡ್ ಹತ್ತಿರ',
    },
    foodDescription: {
      en: 'North & South Indian (3 Times Daily) + Sunday Biryani Special',
      hi: 'उत्तर और दक्षिण भारतीय भोजन (प्रतिदिन 3 बार) + रविवार स्पेशल बिरयानी',
      kn: 'ಉತ್ತರ ಮತ್ತು ದಕ್ಷಿಣ ಭಾರತೀಯ ಊಟ (ದಿನಕ್ಕೆ 3 ಬಾರಿ) + ಭಾನುವಾರ ಬಿರಿಯಾನಿ',
    },
    zoneDescription: {
      en: 'South Bangalore / HSR Tech Corridor',
      hi: 'साउथ बैंगलोर / एचएसआर टेक हब',
      kn: 'ದಕ್ಷಿಣ ಬೆಂಗಳೂರು / ಎಚ್‌ಎಸ್‌ಆರ್ ಐಟಿ ಕಾರಿಡಾರ್',
    },
    highlights: {
      en: [
        'Single, Double & Triple Sharing AC & Non-AC suites',
        'High-Speed 300 Mbps Dual-Band Wi-Fi with UPS backup',
        'Daily professional housekeeping & sanitized linen change',
        'Biometric thumbprint gate access with 24/7 CCTV recording',
        '0% Brokerage Direct Owner Booking with digital e-receipts',
      ],
      hi: [
        'सिंगल, डबल और ट्रिपल शेयरिंग एसी और नॉन-एसी सुइट्स',
        'हाई-स्पीड 300 एमबीपीएस वाई-फाई और 24/7 पावर बैकअप',
        'दैनिक हाउसकीपिंग और सैनिटाइज्ड लिनेन सर्विस',
        'बायोमेट्रिक फिंगरप्रिंट एक्सेस और 24 घंटे सीसीटीवी सुरक्षा',
        '0% ब्रोकरेज सीधे मालिक से डिजिटल रसीद के साथ',
      ],
      kn: [
        'ಸಿಂಗಲ್, ಡಬಲ್ ಮತ್ತು ಟ್ರಿಪಲ್ ಶೇರಿಂಗ್ ಎಸಿ / ನಾನ್-ಎಸಿ ಕೊಠಡಿಗಳು',
        'ಹೈ-ಸ್ಪೀಡ್ 300 Mbps ವೈ-ಫೈ ಮತ್ತು ಪೂರ್ಣ ಪವರ್ ಬ್ಯಾಕಪ್',
        'ದೈನಂದಿನ ಸ್ವಚ್ಛತೆ ಮತ್ತು ನೈರ್ಮಲ್ಯೀಕೃತ ಬೆಡ್‌ಶೀಟ್ ವ್ಯವಸ್ಥೆ',
        'ಬಯೋಮೆಟ್ರಿಕ್ ಹೆಬ್ಬೆರಳು ಪ್ರವೇಶ ಮತ್ತು 24x7 ಸಿಸಿಟಿವಿ ಕಣ್ಗಾವಲು',
        '0% ಬ್ರೋಕರೇಜ್ ನೇರ ಮಾಲೀಕರ ಬುಕಿಂಗ್ ಮತ್ತು ಇ-ರಸೀದಿ',
      ],
    },
  },
  'listing-pg-2': {
    title: {
      en: 'Silicon Heights Women’s Luxury PG & Studio',
      hi: 'सिलिकॉन हाइट्स विमेंस लक्जरी पीजी और स्टूडियो',
      kn: 'ಸಿಲಿಕಾನ್ ಹೈಟ್ಸ್ ಮಹಿಳೆಯರ ಐಷಾರಾಮಿ ಪಿಜಿ ಮತ್ತು ಸ್ಟುಡಿಯೋ',
    },
    subtitle: {
      en: 'Indiranagar 100ft Road • Walking distance to Metro & CMH Hospital',
      hi: 'इंदिरानगर 100 फीट रोड • मेट्रो स्टेशन और सीएमएच अस्पताल के पास',
      kn: 'ಇಂದಿರಾನಗರ 100 ಅಡಿ ರಸ್ತೆ • ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಹತ್ತಿರ',
    },
    foodDescription: {
      en: 'Nutritious Homestyle Veg & Non-Veg Meals with Organic Milk',
      hi: 'पौष्टिक घर जैसा शाकाहारी और मांसाहारी भोजन + ताजा दूध',
      kn: 'ಮನೆಯೂಟ ಶೈಲಿಯ ಶುದ್ಧ ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ಮಾಂಸಾಹಾರಿ ಊಟ',
    },
    zoneDescription: {
      en: 'Central-East Bangalore / Indiranagar',
      hi: 'मध्य-पूर्व बैंगलोर / इंदिरानगर',
      kn: 'ಮಧ್ಯ-ಪೂರ್ವ ಬೆಂಗಳೂರು / ಇಂದಿರಾನಗರ',
    },
    highlights: {
      en: [
        '24/7 Female security warden with CCTV surveillance',
        'Automated digital laundry with IFB front-load machines',
        'Spacious ergonomic study desks with reading lamps',
        'Rooftop yoga pavilion & open cafeteria lounge',
        'Zero commission Karnataka e-agreement provided',
      ],
      hi: [
        '24/7 महिला सुरक्षा वार्डन और सीसीटीवी निगरानी',
        'स्वचालित लॉन्ड्री और फ्रंट-लोड वाशिंग मशीनें',
        'एर्गोनोमिक स्टडी डेस्क और पर्सनल रीडिंग लैंप',
        'छत पर योग पैवेलियन और कैफेटेरिया लाउंज',
        'शून्य कमीशन कर्नाटक ई-रेंटल एग्रीमेंट',
      ],
      kn: [
        '24/7 ಮಹಿಳಾ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ ಮತ್ತು ಸಿಸಿಟಿವಿ ಭದ್ರತೆ',
        'ಸ್ವಯಂಚಾಲಿತ ವಾಷಿಂಗ್ ಮಷೀನ್ ಲಾಂಡ್ರಿ ಸೌಲಭ್ಯ',
        'ವಿದ್ಯಾರ್ಥಿ / ಉದ್ಯೋಗಿಗಳಿಗೆ ಸೂಕ್ತವಾದ ಸ್ಟಡಿ ಟೇಬಲ್',
        'ಟೆರೇಸ್ ಯೋಗ ಸ್ಥಳ ಮತ್ತು ಓಪನ್ ಕೆಫೆಟೇರಿಯಾ',
        '0% ಕಮಿಷನ್ ಡಿಜಿಟಲ್ ಬಾಡಿಗೆ ಕರಾರು ಪತ್ರ',
      ],
    },
  },
  'listing-house-1': {
    title: {
      en: 'Greenwood Prestige 3BHK Independent Floor Residence',
      hi: 'ग्रीनवुड प्रेस्टीज 3BHK इंडिपेंडेंट फ्लोर रेजिडेंस',
      kn: 'ಗ್ರೀನ್‌ವುಡ್ ಪ್ರೆಸ್ಟೀಜ್ 3BHK ಸ್ವತಂತ್ರ ಮಹಡಿ ಮನೆ',
    },
    subtitle: {
      en: 'Whitefield Main Road • 1.2km to ITPL & Hope Farm Junction',
      hi: 'व्हाइटफील्ड मेन रोड • आईटीपीएल और होप फार्म जंक्शन से 1.2 किमी',
      kn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಮುಖ್ಯ ರಸ್ತೆ • ಐಟಿಪಿಎಲ್ ಹತ್ತಿರ (1.2 ಕಿ.ಮೀ)',
    },
    foodDescription: {
      en: 'Independent Modular Kitchen with piped gas provision',
      hi: 'स्वतंत्र मॉड्यूलर किचन पाइप गैस कनेक्शन के साथ',
      kn: 'ಸ್ವತಂತ್ರ ಮಾಡ್ಯುಲರ್ ಅಡುಗೆಮನೆ ಮತ್ತು ಪೈಪ್ಡ್ ಗ್ಯಾಸ್',
    },
    zoneDescription: {
      en: 'East Bangalore / Whitefield IT Corridor',
      hi: 'पूर्वी बैंगलोर / व्हाइटफील्ड',
      kn: 'ಪೂರ್ವ ಬೆಂಗಳೂರು / ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿ ವಲಯ',
    },
    highlights: {
      en: [
        'Spacious 1,850 sq.ft 3BHK with 3 private balconies',
        '100% East-Facing Vastu layout with ample natural ventilation',
        'Covered stilt car & two-wheeler parking with EV charger',
        'BBMP A-Khata with Kaveri water connection & borewell',
        'Direct owner lease with standard 11-month Karnataka format',
      ],
      hi: [
        'विशाल 1,850 वर्ग फीट 3BHK 3 निजी बालकनियों के साथ',
        '100% पूर्व मुखी वास्तु और प्राकृतिक धूप व हवा',
        'कवर्ड कार पार्किंग और ईवी चार्जर पॉइंट उपलब्ध',
        'बीबीएमपी ए-खाता, कावेरी पानी और बोरवेल कनेक्शन',
        'सीधे मालिक से 11 महीने का कर्नाटक लीज एग्रीमेंट',
      ],
      kn: [
        'ವಿಶಾಲವಾದ 1,850 ಚದರ ಅಡಿ 3BHK 3 ಖಾಸಗಿ ಬಾಲ್ಕನಿಗಳೊಂದಿಗೆ',
        '100% ಪೂರ್ವ ಮುಖ ವಾಸ್ತು ಮತ್ತು ಉತ್ತಮ ನೈಸರ್ಗಿಕ ಬೆಳಕು',
        'ಕವರ್ಡ್ ಕಾರ್ ಪಾರ್ಕಿಂಗ್ ಮತ್ತು ಇವಿ ವಾಹನ ಚಾರ್ಜಿಂಗ್ ಪಾಯಿಂಟ್',
        'ಬಿಬಿಎಂಪಿ ಎ-ಖಾತಾ, ಕಾವೇರಿ ನೀರು ಮತ್ತು ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ',
        'ನೇರ ಮಾಲೀಕರ 11 ತಿಂಗಳ ಅಧಿಕೃತ ಬಾಡಿಗೆ ಕರಾರು',
      ],
    },
  },
  'listing-house-2': {
    title: {
      en: 'Vastupura 2BHK Gated Residential Apartment',
      hi: 'वास्तुपुरा 2BHK गेटेड रेजिडेंशियल अपार्टमेंट',
      kn: 'ವಾಸ್ತುಪುರ 2BHK ಗೇಟೆಡ್ ವಸತಿ ಅಪಾರ್ಟ್‌ಮೆಂಟ್',
    },
    subtitle: {
      en: 'Kanakapura Road • Near Thalaghattapura Metro Station',
      hi: 'कनकपुरा रोड • थलघट्टापुरा मेट्रो स्टेशन के पास',
      kn: 'ಕನಕಪುರ ರಸ್ತೆ • ತಲಘಟ್ಟಪುರ ಮೆಟ್ರೋ ನಿಲ್ದಾಣದ ಬಳಿ',
    },
    foodDescription: {
      en: 'Designer Modular Kitchen with chimney & breakfast counter',
      hi: 'डिजाइनर मॉड्यूलर किचन चिमनी और ब्रेकफास्ट काउंटर सहित',
      kn: 'ಮಾಡ್ಯುಲರ್ ಕಿಚನ್ ಮತ್ತು ಚಿಮಣಿ ಸೌಲಭ್ಯ',
    },
    zoneDescription: {
      en: 'South Bangalore / Kanakapura Green Belt',
      hi: 'साउथ बैंगलोर / कनकपुरा रोड',
      kn: 'ದಕ್ಷಿಣ ಬೆಂಗಳೂರು / ಕನಕಪುರ ರಸ್ತೆ',
    },
    highlights: {
      en: [
        '1,250 sq.ft semi-furnished 2BHK with Italian floor tiles',
        'Full clubhouse with swimming pool, gym, and badminton court',
        '24-Hour power backup, high-speed lift, and intercom',
        '0% Brokerage fee, transparent rent deposit terms',
      ],
      hi: [
        '1,250 वर्ग फीट सेमी-फर्निश्ड 2BHK इटैलियन टाइल्स के साथ',
        'स्विमिंग पूल, जिम और बैडमिंटन कोर्ट युक्त क्लब हाउस',
        '24 घंटे बिजली बैकअप, हाई-स्पीड लिफ्ट और इंटरकॉम',
        'शून्य ब्रोकरेज फीस और पारदर्शी किराया शर्तें',
      ],
      kn: [
        '1,250 ಚದರ ಅಡಿ ಸೆಮಿ-ಫರ್ನಿಶ್ಡ್ 2BHK ಮನೆ',
        'ಸ್ವಿಮ್ಮಿಂಗ್ ಪೂಲ್, ಜಿಮ್ ಮತ್ತು ಕ್ಲಬ್ ಹೌಸ್ ಸೌಲಭ್ಯಗಳು',
        '24 ಗಂಟೆ ವಿದ್ಯುತ್ ಬ್ಯಾಕಪ್, ಲಿಫ್ಟ್ ಮತ್ತು ಭದ್ರತೆ',
        '0% ಬ್ರೋಕರ್ ಕಮಿಷನ್, ನೇರ ಮಾಲೀಕತ್ವದ ಒಪ್ಪಂದ',
      ],
    },
  },
  'listing-pg-3': {
    title: {
      en: 'TechHub Executive Gents PG & Co-Living',
      hi: 'टेकहब एग्जीक्यूटिव जेंट्स पीजी एवं को-लिविंग',
      kn: 'ಟೆಕ್‌ಹಬ್ ಎಕ್ಸಿಕ್ಯೂಟಿವ್ ಜೆಂಟ್ಸ್ ಪಿಜಿ ಮತ್ತು ಕೋ-ಲಿವಿಂಗ್',
    },
    subtitle: {
      en: 'Near RMZ Ecospace, Outer Ring Road, Bellandur, Bangalore 560103',
      hi: 'आरएमजेड इकोस्पेस के पास, आउटर रिंग रोड, बेलंदूर, बैंगलोर 560103',
      kn: 'ಆರ್‌ಎಂಝಡ್ ಇಕೋಸ್ಪೇಸ್ ಹತ್ತಿರ, ಹೊರ ವರ್ತುಲ ರಸ್ತೆ, ಬೆಳ್ಳಂದೂರು, ಬೆಂಗಳೂರು 560103',
    },
    foodDescription: {
      en: '3 Times Unlimited Buffet (North & South Indian)',
      hi: '3 बार असीमित बुफे (उत्तर व दक्षिण भारतीय व्यंजन)',
      kn: 'ದಿನಕ್ಕೆ 3 ಬಾರಿ ಅನ್‌ಲಿಮಿಟೆಡ್ ಬಫೆ ಊಟ (ಉತ್ತರ ಮತ್ತು ದಕ್ಷಿಣ ಭಾರತೀಯ)',
    },
    zoneDescription: {
      en: 'Outer Ring Road / Bellandur Tech Park Hub',
      hi: 'आउटर रिंग रोड / बेलंदूर टेक पार्क',
      kn: 'ಹೊರ ವರ್ತುಲ ರಸ್ತೆ / ಬೆಳ್ಳಂದೂರು ಐಟಿ ಪಾರ್ಕ್',
    },
    highlights: {
      en: [
        '5-minute walking distance to RMZ Ecospace and Bellandur tech hubs',
        '300 Mbps high-speed fiber internet and 24/7 full DG power backup',
        'RFID biometric card access, 24/7 security & CCTV monitoring',
        'Rooftop fitness zone, table tennis, and recreation lounge',
      ],
      hi: [
        'आरएमजेड इकोस्पेस और बेलंदूर टेक हब से केवल 5 मिनट की पैदल दूरी',
        '300 एमबीपीएस हाई-स्पीड फाइबर इंटरनेट और 24/7 डीजी पावर बैकअप',
        'आरएफआईडी बायोमेट्रिक कार्ड एक्सेस और 24 घंटे सीसीटीवी सुरक्षा',
        'रूफटॉप फिटनेस जोन, टेबल टेनिस और मनोरंजन लाउंज',
      ],
      kn: [
        'ಆರ್‌ಎಂಝಡ್ ಇಕೋಸ್ಪೇಸ್ ಮತ್ತು ಬೆಳ್ಳಂದೂರು ಐಟಿ ಹಬ್‌ಗೆ ಕೇವಲ 5 ನಿಮಿಷ ನಡಿಗೆ ದೂರ',
        '300 Mbps ಹೈ-ಸ್ಪೀಡ್ ಫೈಬರ್ ಇಂಟರ್ನೆಟ್ ಮತ್ತು 24/7 ಪೂರ್ಣ ಡಿಜಿ ವಿದ್ಯುತ್ ಬ್ಯಾಕಪ್',
        'ಆರ್‌ಎಫ್‌ಐಡಿ ಬಯೋಮೆಟ್ರಿಕ್ ಕಾರ್ಡ್ ಪ್ರವೇಶ ಮತ್ತು 24/7 ಸಿಸಿಟಿವಿ ಭದ್ರತೆ',
        'ಟೆರೇಸ್ ಜಿಮ್ ಫಿಟ್ನೆಸ್ ವಲಯ, ಟೇಬಲ್ ಟೆನಿಸ್ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಲೌಂಜ್',
      ],
    },
  },
  'listing-house-3': {
    title: {
      en: 'Indiranagar 4BHK Independent Duplex Villa',
      hi: 'इंदिरानगर 4BHK इंडिपेंडेंट डुप्लेक्स विला',
      kn: 'ಇಂದಿರಾನಗರ 4BHK ಸ್ವತಂತ್ರ ಡ್ಯುಪ್ಲೆಕ್ಸ್ ವಿಲ್ಲಾ',
    },
    subtitle: {
      en: 'Defence Colony, 6th Main, Indiranagar, Bangalore 560038',
      hi: 'डिफेंस कॉलोनी, 6वीं मेन, इंदिरानगर, बैंगलोर 560038',
      kn: 'ಡಿಫೆನ್ಸ್ ಕಾಲೋನಿ, 6ನೇ ಮುಖ್ಯ ರಸ್ತೆ, ಇಂದಿರಾನಗರ, ಬೆಂಗಳೂರು 560038',
    },
    foodDescription: {
      en: 'Luxury Island Modular Kitchen with Chimney, Oven & Pantry',
      hi: 'लक्जरी आइलैंड मॉड्यूलर किचन, चिमनी, ओवन और पेंट्री युक्त',
      kn: 'ಐಷಾರಾಮಿ ಐಲ್ಯಾಂಡ್ ಮಾಡ್ಯುಲರ್ ಅಡುಗೆಮನೆ, ಚಿಮಣಿ, ಓವನ್ ಸಹಿತ',
    },
    zoneDescription: {
      en: 'Central-East Bangalore / Indiranagar Defense Enclave',
      hi: 'मध्य-पूर्व बैंगलोर / इंदिरानगर डिफेंस एन्क्लेव',
      kn: 'ಮಧ್ಯ-ಪೂರ್ವ ಬೆಂಗಳೂರು / ಇಂದಿರಾನಗರ ಡಿಫೆನ್ಸ್ ಎನ್‌ಕ್ಲೇವ್',
    },
    highlights: {
      en: [
        '2,850 sq.ft private duplex with landscaped front lawn & terrace garden',
        'North-East facing 100% Vastu layout designed by Ar. S. Gouse Studio',
        'Direct Cauvery water line + 6000L underground storage sump',
        '5 kVA solar hybrid inverter with battery bank for zero-outage living',
      ],
      hi: [
        '2,850 वर्ग फीट निजी डुप्लेक्स, सुंदर लॉन और टेरेस गार्डन',
        'वास्तुकार अर. एस. गौस द्वारा डिजाइन किया गया 100% ईशान कोण वास्तु',
        'प्रत्यक्ष कावेरी जल कनेक्शन और 6000 लीटर भूमिगत संप',
        '5 केवीए सोलर हाइब्रिड इन्वर्टर और बैटरी बैंक',
      ],
      kn: [
        '2,850 ಚ.ಅಡಿ ವಿಸ್ತೀರ್ಣದ ಖಾಸಗಿ ಡ್ಯುಪ್ಲೆಕ್ಸ್ ಮತ್ತು ಸುಂದರ ಉದ್ಯಾನವನ',
        'ಪ್ರಧಾನ ವಾಸ್ತುಶಿಲ್ಪಿ ಅರ್. ಎಸ್. ಗೌಸ್ ವಿನ್ಯಾಸಗೊಳಿಸಿದ 100% ಈಶಾನ್ಯ ಮುಖ ವಾಸ್ತು',
        'ನೇರ ಕಾವೇರಿ ನೀರು ಸರಬರಾಜು ಮತ್ತು 6000 ಲೀಟರ್ ಭೂಗತ ಸಂಪ್',
        '5 kVA ಸೋಲಾರ್ ಹೈಬ್ರಿಡ್ ಇನ್ವರ್ಟರ್ ಮತ್ತು ನಿರಂತರ ವಿದ್ಯುತ್ ಬ್ಯಾಕಪ್',
      ],
    },
  },
};

// Trilingual Dictionary for Buy Houses & Land Plots
export const BUY_PROPERTIES_TRANSLATIONS: Record<
  string,
  {
    title: TrilingualText;
    categoryText: TrilingualText;
    locationText: TrilingualText;
    possessionText: TrilingualText;
    highlights: Record<ListingLanguage, string[]>;
  }
> = {
  'house-1': {
    title: {
      en: 'The Palm Crest Biophilic 4BHK Luxury Villa',
      hi: 'द पाम क्रेस्ट बायोफिलिक 4BHK लक्जरी विला',
      kn: 'ದಿ ಪಾಮ್ ಕ್ರೆಸ್ಟ್ ಬಯೋಫಿಲಿಕ್ 4BHK ಐಷಾರಾಮಿ ವಿಲ್ಲಾ',
    },
    categoryText: {
      en: '4 BHK Duplex Villa + Maid Suite',
      hi: '4 बीएचके डुप्लेक्स विला + मेड सुइट',
      kn: '4 ಬಿಎಚ್‌ಕೆ ಡ್ಯುಪ್ಲೆಕ್ಸ್ ವಿಲ್ಲಾ + ಕೆಲಸದಾಳು ಕೊಠಡಿ',
    },
    locationText: {
      en: 'Indiranagar Defense Colony, Bangalore',
      hi: 'इंदिरानगर डिफेंस कॉलोनी, बैंगलोर',
      kn: 'ಇಂದಿರಾನಗರ ಡಿಫೆನ್ಸ್ ಕಾಲೋನಿ, ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Ready to Move • BDA Approved',
      hi: 'रहने के लिए तैयार • बीडीए स्वीकृत',
      kn: 'ಗೃಹಪ್ರವೇಶಕ್ಕೆ ಸಿದ್ಧ • ಬಿಡಿಎ ಅನುಮೋದಿತ',
    },
    highlights: {
      en: [
        'Architectural design by Ar. S. Gouse with central biophilic courtyard',
        'Double-height living space with imported Italian marble flooring',
        'Zero-clash structural engineering certified to IS 456 standards',
        '0% Broker Commission direct sale with transparent title clearance',
      ],
      hi: [
        'वास्तुकार अर. एस. गौस द्वारा डिजाइन किया गया बायोफिलिक प्रांगण',
        'डबल-हाइट लिविंग रूम और इटैलियन मार्बल फ्लोरिंग',
        'आईएस 456 मानकों के तहत प्रमाणित मजबूत स्ट्रक्चर',
        'सीधे आर्किटेक्ट/बिल्डर से 0% ब्रोकरेज खरीद',
      ],
      kn: [
        'ಪ್ರಧಾನ ವಾಸ್ತುಶಿಲ್ಪಿ ಅರ್. ಎಸ್. ಗೌಸ್ ವಿನ್ಯಾಸಗೊಳಿಸಿದ ನೈಸರ್ಗಿಕ ಪ್ರಾಂಗಣ',
        'ಡಬಲ್ ಹೈಟ್ ಹಾಲ್ ಮತ್ತು ಇಟಾಲಿಯನ್ ಮಾರ್ಬಲ್ ನೆಲಹಾಸು',
        'IS 456 ಗುಣಮಟ್ಟದ ಭೂಕಂಪ ನಿರೋಧಕ ಕಾಂಕ್ರೀಟ್ ರಚನೆ',
        '0% ದಲ್ಲಾಳಿ ರಹಿತ ನೇರ ಖರೀದಿ ಮತ್ತು ಕ್ಲಿಯರ್ ಟೈಟಲ್',
      ],
    },
  },
  'house-2': {
    title: {
      en: 'Skyline Aura 3BHK Penthouse with Private Terrace',
      hi: 'स्काईलाइन ऑरा 3BHK पेंटहाउस निजी छत के साथ',
      kn: 'ಸ್ಕೈಲೈನ್ ಔರಾ 3BHK ಪ್ರೈವೇಟ್ ಟೆರೇಸ್ ಪೆಂಟ್‌ಹೌಸ್',
    },
    categoryText: {
      en: '3 BHK Ultra-Luxury Penthouse',
      hi: '3 बीएचके अल्ट्रा-लक्जरी पेंटहाउस',
      kn: '3 ಬಿಎಚ್‌ಕೆ ಅಲ್ಟ್ರಾ-ಲಕ್ಸುರಿ ಪೆಂಟ್‌ಹೌಸ್',
    },
    locationText: {
      en: 'Prestige Ozone Corridor, Whitefield, Bangalore',
      hi: 'व्हाइटफील्ड आईटी कॉरिडोर, बैंगलोर',
      kn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿ ಕಾರಿಡಾರ್, ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Ready to Move • BBMP A-Khata',
      hi: 'तैयार फ्लैट • बीबीएमपी ए-खाता',
      kn: 'ಸಿದ್ಧ ಮನೆ • ಬಿಬಿಎಂಪಿ ಎ-ಖಾತಾ',
    },
    highlights: {
      en: [
        'Private 850 sq.ft terrace garden with panoramic skyline views',
        'Smart Home SKA automation with voice and biometric locks',
        'Zero contractor variance with locked CPWD quality specs',
        'Direct sale without middlemen or brokerage commission',
      ],
      hi: [
        'निजी 850 वर्ग फीट टेरेस गार्डन और मनोरम दृश्य',
        'स्मार्ट होम ऑटोमेशन और बायोमेट्रिक सुरक्षा लॉक',
        'उच्चतम निर्माण गुणवत्ता और सीपीडब्ल्यूडी मानक',
        'बिना किसी ब्रोकर कमीशन के सीधे पारदर्शी खरीद',
      ],
      kn: [
        'ಖಾಸಗಿ 850 ಚ.ಅಡಿ ಟೆರೇಸ್ ಗಾರ್ಡನ್ ಮತ್ತು ಸಿಟಿ ವ್ಯೂ',
        'ಸ್ಮಾರ್ಟ್ ಹೋಮ್ ಆಟೊಮೇಷನ್ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್ ಲಾಕ್',
        'ಉನ್ನತ ದರ್ಜೆಯ ಸಿವಿಲ್ ನಿರ್ಮಾಣ ಮತ್ತು ಗ್ಯಾರಂಟಿ',
        'ಯಾವುದೇ ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ 0% ಕಮಿಷನ್ ನೇರ ಮಾರಾಟ',
      ],
    },
  },
  'plot-1': {
    title: {
      en: 'Prestige Serene 30x40 BDA Approved Villa Plot',
      hi: 'प्रेस्टीज सेरीन 30x40 बीडीए स्वीकृत विला प्लॉट',
      kn: 'ಪ್ರೆಸ್ಟೀಜ್ ಸೆರೀನ್ 30x40 ಬಿಡಿಎ ಅನುಮೋದಿತ ನಿವೇಶನ',
    },
    categoryText: {
      en: 'Residential Villa Plot (1,200 sq.ft)',
      hi: 'आवासीय विला प्लॉट (1,200 वर्ग फीट)',
      kn: 'ವಸತಿ ವಿಲ್ಲಾ ನಿವೇಶನ (1,200 ಚ.ಅಡಿ)',
    },
    locationText: {
      en: 'Anjanapura 9th Block, South Bangalore',
      hi: 'अंजनापुरा 9वां ब्लॉक, साउथ बैंगलोर',
      kn: 'ಅಂಜನಾಪುರ 9ನೇ ಬ್ಲಾಕ್, ದಕ್ಷಿಣ ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Immediate Registration • BDA Khata',
      hi: 'तत्काल रजिस्ट्री • बीडीए खाता',
      kn: 'ತಕ್ಷಣ ನೋಂದಣಿ • ಬಿಡಿಎ ಖಾತಾ',
    },
    highlights: {
      en: [
        '100% Clear Title with 30-year Non-Encumbrance Certificate (EC)',
        '40-foot wide tar road with underground storm drains and BESCOM lines',
        'Direct owner sale with zero brokerage or hidden fees',
        'Turnkey architectural construction package available with Ar. S. Gouse',
      ],
      hi: [
        '30 साल का गैर-भार प्रमाणपत्र (ईसी) और 100% स्पष्ट स्वामित्व',
        '40 फीट चौड़ी डामर सड़क, भूमिगत जल निकासी और बिजली लाइन',
        'सीधे मालिक से बिक्री, शून्य ब्रोकरेज व शून्य छिपे शुल्क',
        'वास्तुकार अर. एस. गौस के साथ टर्नकी विला निर्माण विकल्प',
      ],
      kn: [
        '30 ವರ್ಷಗಳ ನಿರಾಕ್ಷೇಪಣಾ ಪ್ರಮಾಣಪತ್ರ (EC) ಮತ್ತು 100% ಕ್ಲಿಯರ್ ಟೈಟಲ್',
        '40 ಅಡಿ ಅಗಲದ ಡಾಂಬರು ರಸ್ತೆ, ಭೂಗತ ಚರಂಡಿ ಮತ್ತು ಬೆಸ್ಕಾಂ ಸಂಪರ್ಕ',
        'ನೇರ ಮಾಲೀಕರಿಂದ ಮಾರಾಟ, ಯಾವುದೇ ದಲ್ಲಾಳಿ ಶುಲ್ಕವಿಲ್ಲ',
        'ವಾಸ್ತುಶಿಲ್ಪಿ ಅರ್. ಎಸ್. ಗೌಸ್ ಅವರಿಂದ ಮನೆ ನಿರ್ಮಾಣ ಮಾರ್ಗದರ್ಶನ',
      ],
    },
  },
  'plot-2': {
    title: {
      en: 'Green Meadows 40x60 BIAAPA Approved Luxury Plot',
      hi: 'ग्रीन मीडोज 40x60 बीआईएएपीए स्वीकृत लक्जरी प्लॉट',
      kn: 'ಗ್ರೀನ್ ಮೆಡೋಸ್ 40x60 ಬಿಐಎಎಪಿಎ ಅನುಮೋದಿತ ಐಷಾರಾಮಿ ನಿವೇಶನ',
    },
    categoryText: {
      en: 'Villa Plot (2,400 sq.ft)',
      hi: 'विला प्लॉट (2,400 वर्ग फीट)',
      kn: 'ವಿಲ್ಲಾ ನಿವೇಶನ (2,400 ಚ.ಅಡಿ)',
    },
    locationText: {
      en: 'Devanahalli Airport Corridor, North Bangalore',
      hi: 'देवनहल्ली एयरपोर्ट कॉरिडोर, नॉर्थ बैंगलोर',
      kn: 'ದೇವನಹಳ್ಳಿ ವಿಮಾನ ನಿಲ್ದಾಣ ರಸ್ತೆ, ಉತ್ತರ ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Ready for Construction • BIAAPA Approved',
      hi: 'निर्माण के लिए तैयार • बीआईएएपीए स्वीकृत',
      kn: 'ಮನೆ ಕಟ್ಟಲು ಸಿದ್ಧ • ಬಿಐಎಎಪಿಎ ಅನುಮೋದಿತ',
    },
    highlights: {
      en: [
        'Gated community with 24/7 security, clubhouse, and park amenities',
        'Just 15 minutes drive to Kempegowda International Airport',
        'High capital appreciation zone in North Bangalore tech aerotropolis',
        '100% direct sale without brokers',
      ],
      hi: [
        '24/7 सुरक्षा, क्लब हाउस और पार्क युक्त गेटेड कम्युनिटी',
        'केम्पेगौड़ा अंतरराष्ट्रीय हवाई अड्डे से केवल 15 मिनट की दूरी',
        'उत्तर बैंगलोर एरोट्रोपोलिस में उच्च पूंजी वृद्धि क्षेत्र',
        'शून्य ब्रोकर कमीशन - सीधे पारदर्शी रजिस्ट्री',
      ],
      kn: [
        '24/7 ಭದ್ರತೆ, ಕ್ಲಬ್ ಹೌಸ್ ಮತ್ತು ಉದ್ಯಾನವನವಿರುವ ಗೇಟೆಡ್ ಬಡಾವಣೆ',
        'ಕೆಂಪೇಗೌಡ ಅಂತರರಾಷ್ಟ್ರೀಯ ವಿಮಾನ ನಿಲ್ದಾಣಕ್ಕೆ ಕೇವಲ 15 ನಿಮಿಷಗಳ ಪ್ರಯಾಣ',
        'ಉತ್ತರ ಬೆಂಗಳೂರಿನ ವೇಗವಾಗಿ ಬೆಳೆಯುತ್ತಿರುವ ಪ್ರಮುಖ ಹೂಡಿಕೆ ವಲಯ',
        '0% ಬ್ರೋಕರೇಜ್ - ನೇರ ಮಾಲೀಕತ್ವದ ಖಾತ್ರಿ',
      ],
    },
  },
  'plot-3': {
    title: {
      en: 'Sarjapur Tech Corridor 1.2 Acre Commercial Land Parcel',
      hi: 'सरजापुर टेक कॉरिडोर 1.2 एकड़ कमर्शियल लैंड पार्सल',
      kn: 'ಸರ್ಜಾಪುರ ಐಟಿ ಕಾರಿಡಾರ್ 1.2 ಎಕರೆ ವಾಣಿಜ್ಯ ಜಮೀನು ನಿವೇಶನ',
    },
    categoryText: {
      en: 'Commercial Land Parcel (52,272 sq.ft)',
      hi: 'कमर्शियल लैंड पार्सल (52,272 वर्ग फीट)',
      kn: 'ವಾಣಿಜ್ಯ ಜಮೀನು ಪಾರ್ಸೆಲ್ (52,272 ಚ.ಅಡಿ)',
    },
    locationText: {
      en: 'Sarjapur Main Road, Near Wipro SEZ Campus, Bangalore',
      hi: 'सरजापुर मेन रोड, विप्रो एसईजेड कैंपस के पास, बैंगलोर',
      kn: 'ಸರ್ಜಾಪುರ ಮುಖ್ಯ ರಸ್ತೆ, ವಿಪ್ರೋ ಎಸ್ಇಝಡ್ ಕ್ಯಾಂಪಸ್ ಹತ್ತಿರ, ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Converted Commercial • 35-Yr EC Clear',
      hi: 'कन्वर्टेड कमर्शियल • 35-वर्षीय स्पष्ट ईसी',
      kn: 'ವಾಣಿಜ್ಯ ಭೂಪರಿವರ್ತನೆ • 35 ವರ್ಷಗಳ ಕ್ಲಿಯರ್ ಇಸಿ',
    },
    highlights: {
      en: [
        '150 feet high-visibility frontage on 80ft wide Sarjapur highway',
        'Non-agricultural converted commercial A-Khata with industrial NOC',
        'Suitable for IT tech campus, multi-specialty hospital, or co-living',
        'Soil bearing capacity and topographical survey verified by CoA engineer',
      ],
      hi: [
        '80 फीट चौड़े सरजापुर हाईवे पर 150 फीट का प्रमुख फ्रंट फेसिंग',
        'गैर-कृषि व्यावसायिक ए-खाता और प्रदूषण एनओसी स्वीकृत',
        'आईटी टेक पार्क, मल्टी-स्पेशियलिटी अस्पताल या बड़े को-लिविंग के लिए उपयुक्त',
        'सीओए इंजीनियर द्वारा प्रमाणित मृदा परीक्षण और भूमि सर्वेक्षण',
      ],
      kn: [
        '80 ಅಡಿ ಅಗಲದ ಸರ್ಜಾಪುರ ಹೆದ್ದಾರಿಯಲ್ಲಿ 150 ಅಡಿ ವಿಸ್ತಾರವಾದ ಮುಂಭಾಗ',
        'ಕೃಷಿಯೇತರ ವಾಣಿಜ್ಯ ಭೂಪರಿವರ್ತಿತ ಎ-ಖಾತಾ ಮತ್ತು ಕೈಗಾರಿಕಾ ನಿರಾಕ್ಷೇಪಣಾ ಪತ್ರ',
        'ಐಟಿ ಕ್ಯಾಂಪಸ್, ಸೂಪರ್ ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ ಅಥವಾ ಬೃಹತ್ ಕೋ-ಲಿವಿಂಗ್‌ಗೆ ಸೂಕ್ತ',
        'ವಾಸ್ತುಶಿಲ್ಪ ತಜ್ಞರಿಂದ ಮಣ್ಣಿನ ಸಾಮರ್ಥ್ಯ ಹಾಗೂ ಭೂಮಾಪನ ದೃಢೀಕೃತ',
      ],
    },
  },
  'plot-4': {
    title: {
      en: 'Whitefield Inner Circle 50x80 Luxury Corner Plot',
      hi: 'व्हाइटफील्ड इनर सर्कल 50x80 लक्जरी कॉर्नर प्लॉट',
      kn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಇನ್ನರ್ ಸರ್ಕಲ್ 50x80 ಐಷಾರಾಮಿ ಕಾರ್ನರ್ ನಿವೇಶನ',
    },
    categoryText: {
      en: 'Residential Villa Plot (4,000 sq.ft)',
      hi: 'आवासीय विला प्लॉट (4,000 वर्ग फीट)',
      kn: 'ವಸತಿ ವಿಲ್ಲಾ ನಿವೇಶನ (4,000 ಚ.ಅಡಿ)',
    },
    locationText: {
      en: 'ECC Road, Whitefield (Near ITPL & Metro Station), Bangalore',
      hi: 'ईसीसी रोड, व्हाइटफील्ड (आईटीपीएल और मेट्रो के पास), बैंगलोर',
      kn: 'ಇಸಿಸಿ ರಸ್ತೆ, ವೈಟ್‌ಫೀಲ್ಡ್ (ಐಟಿಪಿಎಲ್ & ಮೆಟ್ರೋ ಬಳಿ), ಬೆಂಗಳೂರು',
    },
    possessionText: {
      en: 'Immediate Sanction • BDA Approved',
      hi: 'तत्काल प्लान पास • बीडीए स्वीकृत',
      kn: 'ತಕ್ಷಣ ಕಟ್ಟಡ ಪರವಾನಗಿ • ಬಿಡಿಎ ಅನುಮೋದಿತ',
    },
    highlights: {
      en: [
        'Quiet leafy residential avenue 800m from Whitefield Metro Station',
        'Fully compound-walled with 3-inch active sweet-water borewell',
        'Surrounded by premium high-net-worth architect-designed villas',
        'Immediate construction sanction available with FAR 2.25',
      ],
      hi: [
        'व्हाइटफील्ड मेट्रो स्टेशन से 800 मीटर शांत और हरियाली युक्त आवासीय क्षेत्र',
        'पूरी तरह चारदीवारी से घिरा, 3-इंच मीठे पानी का चालू बोरवेल',
        'आसपास प्रतिष्ठित विला और उच्च-वर्गीय पड़ोस',
        'एफएआर 2.25 के साथ तत्काल निर्माण योजना स्वीकृति उपलब्ध',
      ],
      kn: [
        'ವೈಟ್‌ಫೀಲ್ಡ್ ಮೆಟ್ರೋ ನಿಲ್ದಾಣದಿಂದ 800 ಮೀಟರ್ ದೂರದಲ್ಲಿರುವ ಹಸಿರಿನ ನೆಮ್ಮದಿಯ ರಸ್ತೆ',
        'ಸಂಪೂರ್ಣ ಕಾಂಪೌಂಡ್ ಗೋಡೆ ಮತ್ತು 3-ಇಂಚಿನ ಸಕ್ರಿಯ ಕುಡಿಯುವ ನೀರಿನ ಬೋರ್‌ವೆಲ್',
        'ಸುತ್ತಲೂ ಪ್ರತಿಷ್ಠಿತ ವಾಸ್ತುಶಿಲ್ಪಿ ವಿನ್ಯಾಸದ ಐಷಾರಾಮಿ ವಿಲ್ಲಾಗಳು',
        'FAR 2.25 ನೊಂದಿಗೆ ತಕ್ಷಣದ ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಮಂಜೂರಾತಿ ಲಭ್ಯ',
      ],
    },
  },
};

/**
 * Helper to fetch localized string from dictionary
 */
export function t(key: keyof typeof LISTING_UI_DICTIONARY, lang: ListingLanguage): string {
  const entry = LISTING_UI_DICTIONARY[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

/**
 * Localizes a PG listing based on selected language
 */
export function getLocalizedPgListing(
  listingId: string,
  lang: ListingLanguage,
  fallbackTitle: string,
  fallbackSubtitle: string,
  fallbackFood: string,
  fallbackZone: string
) {
  const trans = PG_LISTINGS_TRANSLATIONS[listingId];
  if (!trans) {
    return {
      title: fallbackTitle,
      subtitle: fallbackSubtitle,
      foodDescription: fallbackFood,
      zoneDescription: fallbackZone,
      highlights: [],
    };
  }

  return {
    title: trans.title[lang] || trans.title.en,
    subtitle: trans.subtitle[lang] || trans.subtitle.en,
    foodDescription: trans.foodDescription[lang] || trans.foodDescription.en,
    zoneDescription: trans.zoneDescription[lang] || trans.zoneDescription.en,
    highlights: trans.highlights[lang] || trans.highlights.en,
  };
}

/**
 * Localizes a Buy House / Land Plot listing based on selected language
 */
export function getLocalizedBuyListing(
  listingId: string,
  lang: ListingLanguage,
  fallbackTitle: string,
  fallbackCat: string,
  fallbackLoc: string,
  fallbackPossession: string
) {
  const trans = BUY_PROPERTIES_TRANSLATIONS[listingId];
  if (!trans) {
    return {
      title: fallbackTitle,
      categoryText: fallbackCat,
      locationText: fallbackLoc,
      possessionText: fallbackPossession,
      highlights: [],
    };
  }

  return {
    title: trans.title[lang] || trans.title.en,
    categoryText: trans.categoryText[lang] || trans.categoryText.en,
    locationText: trans.locationText[lang] || trans.locationText.en,
    possessionText: trans.possessionText[lang] || trans.possessionText.en,
    highlights: trans.highlights[lang] || trans.highlights.en,
  };
}
