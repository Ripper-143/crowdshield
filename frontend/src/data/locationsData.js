export const CATEGORIES = {
  temple: {
    label: "Sacred Temples & Pilgrimages",
    icon: "Church", // Handled dynamically in UI
    color: "#f97316",
    layoutType: "temple"
  },
  monument: {
    label: "Heritage Monuments & Tourism",
    icon: "Milestone",
    color: "#06b6d4",
    layoutType: "monument"
  },
  transit: {
    label: "Major Transit Hubs",
    icon: "Train",
    color: "#3b82f6",
    layoutType: "transit"
  },
  festival: {
    label: "Festivals & Mass Gatherings",
    icon: "Flame",
    color: "#ec4899",
    layoutType: "festival"
  }
};

export const LOCATIONS = [
  // --- Category: Temples (12 locations) ---
  {
    id: "tirupati",
    name: "Tirupati Balaji Temple",
    category: "temple",
    state: "Andhra Pradesh",
    baseCapacity: 15000,
    hourlyInflow: 4500,
    bottleneckDesc: "Inner Sanctum (Garbhagriha) silver door access.",
    riskMultiplier: 1.1,
    actions: ["Activate Batch-Release Slots", "Open Auxiliary Queue Compartments", "Deploy TTD Seva Volunteers"],
    funFact: "Receives over 75,000 pilgrims daily; queue halls are fully air-conditioned and catered."
  },
  {
    id: "vaishnodevi",
    name: "Vaishno Devi Shrine",
    category: "temple",
    state: "Jammu & Kashmir",
    baseCapacity: 8000,
    hourlyInflow: 2000,
    bottleneckDesc: "Narrow mountain cave entry (Ardhkuwari bottleneck).",
    riskMultiplier: 1.3,
    actions: ["Pause Katra Yatra Registration", "Hold Pilgrims at Bhawan Plaza", "Enforce Single-File Cave Passage"],
    funFact: "Located at 5,200 feet; monitored by RFID tracking cards issued to every pilgrim."
  },
  {
    id: "kashi",
    name: "Kashi Vishwanath Corridor",
    category: "temple",
    state: "Uttar Pradesh",
    baseCapacity: 12000,
    hourlyInflow: 3800,
    bottleneckDesc: "Ganga Ghat entry portal and narrow security checkpoints.",
    riskMultiplier: 1.15,
    actions: ["Redirect Flow to Ganga Path", "Pulse Gate Controls at Security", "Open Side Darshan Exit"],
    funFact: "The new 5-lakh sq ft corridor connects the Ganges directly with the temple complex."
  },
  {
    id: "kedarnath",
    name: "Kedarnath Temple",
    category: "temple",
    state: "Uttarakhand",
    baseCapacity: 5000,
    hourlyInflow: 1200,
    bottleneckDesc: "Gaurikund trek terminus and narrow temple courtyard entrance.",
    riskMultiplier: 1.45,
    actions: ["Restrict Sonprayag Transit", "Deploy SDRF Barrier Gates", "Enforce Rapid Darshan Movement"],
    funFact: "Situated at 11,755 feet; surrounded by snow-capped peaks and accessible only 6 months a year."
  },
  {
    id: "goldentemple",
    name: "Golden Temple (Harmandir Sahib)",
    category: "temple",
    state: "Punjab",
    baseCapacity: 20000,
    hourlyInflow: 6000,
    bottleneckDesc: "Narrow Causeway (Guru's Bridge) connecting to main sanctum.",
    riskMultiplier: 1.0,
    actions: ["Implement Alternating Causeway Lanes", "Utilize Parikrama Plaza Holding", "Deploy SGPC Task Force"],
    funFact: "Feeds over 100,000 people daily through the world's largest free community kitchen (Langar)."
  },
  {
    id: "sabarimala",
    name: "Sabarimala Hill Temple",
    category: "temple",
    state: "Kerala",
    baseCapacity: 9000,
    hourlyInflow: 2500,
    bottleneckDesc: "Sacred 18 Steps (Pathinettam Padi) climb.",
    riskMultiplier: 1.4,
    actions: ["Activate Virtual Q-System Holds", "Regulate Pamba River Station Inflow", "Deploy Special Police Batons"],
    funFact: "Pilgrims observe a strict 41-day vow before climbing the sacred hill."
  },
  {
    id: "jagannath",
    name: "Jagannath Temple Puri",
    category: "temple",
    state: "Odisha",
    baseCapacity: 14000,
    hourlyInflow: 4000,
    bottleneckDesc: "Lion's Gate (Singhadwara) security scanner entry.",
    riskMultiplier: 1.2,
    actions: ["Establish Radial Barricading", "Use Grand Road Holding Corridors", "Deploy Marine Police Support"],
    funFact: "The temple kitchen cooks food in 7 pots placed on top of each other using firewood."
  },
  {
    id: "meenakshi",
    name: "Meenakshi Amman Temple",
    category: "temple",
    state: "Tamil Nadu",
    baseCapacity: 11000,
    hourlyInflow: 3000,
    bottleneckDesc: "East Gopuram entry gate and pillared halls.",
    riskMultiplier: 1.05,
    actions: ["Open South & West Gopurams", "Direct Traffic through Thousand Pillar Hall", "Restrict VIP Fast-Track Inflow"],
    funFact: "Has 14 magnificent towers (Gopurams), covered in thousands of colorful stone figures."
  },
  {
    id: "somnath",
    name: "Somnath Jyotirlinga",
    category: "temple",
    state: "Gujarat",
    baseCapacity: 10000,
    hourlyInflow: 2800,
    bottleneckDesc: "Sea-facing promenade approach and security gate.",
    riskMultiplier: 1.1,
    actions: ["Activate Promenade Holding Zones", "Open Side Exit Gates", "Deploy Local Volunteers"],
    funFact: "Reconstructed several times, the current temple stands directly on the Arabian Sea shore."
  },
  {
    id: "badrinath",
    name: "Badrinath Temple",
    category: "temple",
    state: "Uttarakhand",
    baseCapacity: 6000,
    hourlyInflow: 1500,
    bottleneckDesc: "Alaknanda River bridge crossing and colorful facade entrance.",
    riskMultiplier: 1.35,
    actions: ["Regulate Bridge Transit Batches", "Use Tapta Kund Plaza for Holding", "Deploy Police Checkpoints"],
    funFact: "Located in the Garhwal hill tracks along the banks of the Alaknanda River."
  },
  {
    id: "akshardham",
    name: "Akshardham Temple Delhi",
    category: "temple",
    state: "Delhi",
    baseCapacity: 16000,
    hourlyInflow: 5000,
    bottleneckDesc: "Strict electronic security screening gates.",
    riskMultiplier: 0.95,
    actions: ["Open Additional X-Ray Lanes", "Utilize Welcome Plaza holding", "Stagger Musical Fountain Crowds"],
    funFact: "A massive modern complex showcasing 10,000 years of Indian culture and spirituality."
  },
  {
    id: "siddhivinayak",
    name: "Siddhivinayak Temple",
    category: "temple",
    state: "Maharashtra",
    baseCapacity: 8000,
    hourlyInflow: 2600,
    bottleneckDesc: "Angarki Sankashti Chaturthi special queue lane entrance.",
    riskMultiplier: 1.25,
    actions: ["Utilize Prabhadevi Road Barricading", "Stagger VIP vs General Queue", "Deploy Mumbai Police QRT"],
    funFact: "Visits spike to over 200,000 people on Angarki Chaturthi Tuesdays."
  },

  // --- Category: Heritage Monuments (11 locations) ---
  {
    id: "tajmahal",
    name: "Taj Mahal",
    category: "monument",
    state: "Uttar Pradesh",
    baseCapacity: 15000,
    hourlyInflow: 4000,
    bottleneckDesc: "Mausoleum white marble dome deck staircase.",
    riskMultiplier: 1.1,
    actions: ["Activate Dome Entry Batching", "Enforce 3-Hour Ticket Expire Check", "Open East and West Gates fully"],
    funFact: "To preserve the marble, tourists are given shoe covers, and industrial pollution is banned nearby."
  },
  {
    id: "redfort",
    name: "Red Fort",
    category: "monument",
    state: "Delhi",
    baseCapacity: 20000,
    hourlyInflow: 5500,
    bottleneckDesc: "Lahori Gate vaulted entry bazaar corridor (Chhatta Chowk).",
    riskMultiplier: 1.05,
    actions: ["Divert to Outer Moat Path", "Establish Single-Way Chhatta Chowk Flow", "Open Ring Road Exit Gate"],
    funFact: "Constructed of red sandstone; the Prime Minister hoists the national flag here on Independence Day."
  },
  {
    id: "gatewayofindia",
    name: "Gateway of India Plaza",
    category: "monument",
    state: "Maharashtra",
    baseCapacity: 18000,
    hourlyInflow: 5000,
    bottleneckDesc: "Elephanta Caves ferry boarding jetty access.",
    riskMultiplier: 1.2,
    actions: ["Erect Promenade Segment Fences", "Pause Ferry Ticket Sales", "Restrict Marine Drive Ingress"],
    funFact: "Built to commemorate the landing of King George V and Queen Mary in India in 1911."
  },
  {
    id: "qutubminar",
    name: "Qutub Minar Complex",
    category: "monument",
    state: "Delhi",
    baseCapacity: 8000,
    hourlyInflow: 2200,
    bottleneckDesc: "Iron Pillar courtyard security enclosure.",
    riskMultiplier: 1.0,
    actions: ["Create Circular Walking Path", "Stagger Entry at Main Gate", "Deploy Archaeology Guards"],
    funFact: "The 73-meter minaret is the tallest brick minaret in the world, built in 1193."
  },
  {
    id: "hawamahal",
    name: "Hawa Mahal",
    category: "monument",
    state: "Rajasthan",
    baseCapacity: 4000,
    hourlyInflow: 1200,
    bottleneckDesc: "Extremely narrow internal staircases leading to upper windows.",
    riskMultiplier: 1.3,
    actions: ["Limit Upper Floor Occupancy", "Establish One-Way Stairs System", "Stagger Ticket Intake"],
    funFact: "Contains 953 small windows (jharokhas) designed for royal women to observe street life unseen."
  },
  {
    id: "amerfort",
    name: "Amer Fort Palace",
    category: "monument",
    state: "Rajasthan",
    baseCapacity: 9000,
    hourlyInflow: 2500,
    bottleneckDesc: "Elephant ramp approach path and Sun Gate (Suraj Pole) entry.",
    riskMultiplier: 1.15,
    actions: ["Pause Elephant/Jeep Ascent", "Stagger Entry at Jaleb Chowk", "Utilize Diwan-i-Aam holding"],
    funFact: "Features the Sheesh Mahal (Mirror Palace), which can be lit by a single candle reflecting in mirrors."
  },
  {
    id: "victoriamemorial",
    name: "Victoria Memorial Gardens",
    category: "monument",
    state: "West Bengal",
    baseCapacity: 12000,
    hourlyInflow: 3500,
    bottleneckDesc: "Main gallery dome central hall entry door.",
    riskMultiplier: 1.0,
    actions: ["Restrict Dome Entrance", "Divert Visitors to Outer Gardens", "Utilize North-Gate Exits"],
    funFact: "Built of white Makrana marble (same as Taj Mahal); combines British and Mughal architecture."
  },
  {
    id: "ajantacaves",
    name: "Ajanta & Ellora Caves",
    category: "monument",
    state: "Maharashtra",
    baseCapacity: 5000,
    hourlyInflow: 1300,
    bottleneckDesc: "Cave 1 (Ajanta) and Cave 16 (Kailasa Temple) narrow cave portals.",
    riskMultiplier: 1.25,
    actions: ["Limit Cave Interior Headcount", "Install Wooden Queue Barricades", "Deploy Shuttle Regulators"],
    funFact: "Rock-cut caves dating back to the 2nd century BCE, featuring masterpiece Buddhist murals."
  },
  {
    id: "golconda",
    name: "Golconda Fort",
    category: "monument",
    state: "Telangana",
    baseCapacity: 7000,
    hourlyInflow: 1800,
    bottleneckDesc: "Clap portico acoustic archway entry (Fateh Darwaza).",
    riskMultiplier: 1.1,
    actions: ["Stagger Fateh Darwaza Entry", "One-way Clamber Paths to Citadel", "Deploy Fort Wardens"],
    funFact: "Famous for its acoustic properties—a handclap at the entrance can be heard at the citadel peak."
  },
  {
    id: "mysorepalace",
    name: "Mysore Palace Complex",
    category: "monument",
    state: "Karnataka",
    baseCapacity: 14000,
    hourlyInflow: 3900,
    bottleneckDesc: "Gilded pillars gallery corridor and shoe stand bottlenecks.",
    riskMultiplier: 1.1,
    actions: ["Multiply Shoe Counter Staff", "Activate Courtyard Holding Zones", "Enable One-Way Gallery Walk"],
    funFact: "Illuminated by 97,000 lightbulbs on Sundays and during the famous Dussehra festival."
  },
  {
    id: "konark",
    name: "Konark Sun Temple",
    category: "monument",
    state: "Odisha",
    baseCapacity: 6000,
    hourlyInflow: 1700,
    bottleneckDesc: "Main temple platform steps and ticket scanners.",
    riskMultiplier: 1.05,
    actions: ["Open Temporary Ticket Lanes", "Restrict Chariot Platform Steps Climb", "Deploy Guard Rails"],
    funFact: "Designed as a giant stone chariot with 24 wheels, pulled by 7 stone horses."
  },

  // --- Category: Transit Hubs (10 locations) ---
  {
    id: "howrah",
    name: "Howrah Junction Station",
    category: "transit",
    state: "West Bengal",
    baseCapacity: 25000,
    hourlyInflow: 8500,
    bottleneckDesc: "Main footover bridge linking platforms 1-23.",
    riskMultiplier: 1.3,
    actions: ["Divert to Subway Underpasses", "Hold Commuters in Main Concourse", "Stagger Train Platform Announces"],
    funFact: "India's oldest and largest railway station complex, serving over 1 million passengers daily."
  },
  {
    id: "ndls",
    name: "New Delhi Railway Station",
    category: "transit",
    state: "Delhi",
    baseCapacity: 22000,
    hourlyInflow: 7500,
    bottleneckDesc: "Paharganj side narrow footover bridge and escalator entries.",
    riskMultiplier: 1.35,
    actions: ["Pause Escalator Operation (Force Stairs)", "Redirect to Ajmeri Gate Terminal", "Activate RPF Ticket Gate Filters"],
    funFact: "Features the world's largest route relay interlocking system and serves 500,000 commuters daily."
  },
  {
    id: "csmt",
    name: "Mumbai CSMT Terminal",
    category: "transit",
    state: "Maharashtra",
    baseCapacity: 24000,
    hourlyInflow: 8000,
    bottleneckDesc: "Suburban local train ticket barrier gates.",
    riskMultiplier: 1.25,
    actions: ["Open Emergency Wide Swing Gates", "Broadcast Safety Delay Notices", "Stagger Entry Point Access"],
    funFact: "A UNESCO World Heritage site displaying stunning Victorian Gothic Revival architecture."
  },
  {
    id: "igiairport",
    name: "IGI Airport Terminal 3",
    category: "transit",
    state: "Delhi",
    baseCapacity: 15000,
    hourlyInflow: 4500,
    bottleneckDesc: "International departure security check & immigration lanes.",
    riskMultiplier: 1.1,
    actions: ["Deploy DigiYatra Express Lanes", "Redirect to Auxiliary Security Hall", "Activate Queue Triage Officers"],
    funFact: "One of the largest airport terminals in the world, handling 40 million passengers annually."
  },
  {
    id: "majestic",
    name: "Majestic Bus Station (KBS)",
    category: "transit",
    state: "Karnataka",
    baseCapacity: 12000,
    hourlyInflow: 3500,
    bottleneckDesc: "Subway stairs connecting city bus and metro stations.",
    riskMultiplier: 1.2,
    actions: ["Establish One-Way Staircases", "Hold Passenger Batches on Platforms", "Deploy BMTC Wardens"],
    funFact: "Connects Bengaluru's city buses, state buses, and twin-line metro station in a single hub."
  },
  {
    id: "chennaicentral",
    name: "Chennai Central Station",
    category: "transit",
    state: "Tamil Nadu",
    baseCapacity: 14000,
    hourlyInflow: 4000,
    bottleneckDesc: "Central waiting hall entrance corridors.",
    riskMultiplier: 1.15,
    actions: ["Open Side Platform Gateways", "Activate Waiting Hall Overflow Rooms", "Stagger Train Placements"],
    funFact: "Distinguished by its iconic red brick Gothic-styled main station building."
  },
  {
    id: "secunderabad",
    name: "Secunderabad Junction",
    category: "transit",
    state: "Telangana",
    baseCapacity: 11000,
    hourlyInflow: 3200,
    bottleneckDesc: "Footover bridge central bottleneck stairs.",
    riskMultiplier: 1.25,
    actions: ["Enforce Alternating Bridge Lanes", "Hold Passengers at Platform Level", "Deploy Railway RPF Force"],
    funFact: "First station in South Central Railway to obtain a green station certification."
  },
  {
    id: "rgiairport",
    name: "Hyderabad Airport Departure",
    category: "transit",
    state: "Telangana",
    baseCapacity: 10000,
    hourlyInflow: 2800,
    bottleneckDesc: "Domestic boarding gates security scanners.",
    riskMultiplier: 1.0,
    actions: ["Increase Active Scanner Count", "Direct Passengers to DigiYatra Gates", "Stagger Airline Check-ins"],
    funFact: "Consistently ranked among the top airports globally for service quality and environment."
  },
  {
    id: "ccuairport",
    name: "Kolkata Airport T2",
    category: "transit",
    state: "West Bengal",
    baseCapacity: 9000,
    hourlyInflow: 2600,
    bottleneckDesc: "Check-in counters foyer entry doors.",
    riskMultiplier: 1.05,
    actions: ["Open Auxiliary Entry Doors", "Hold Taxis on Departure Ramp", "Deploy CISF Flow Officers"],
    funFact: "Named after Netaji Subhash Chandra Bose; incorporates beautiful Bengali writing murals."
  },
  {
    id: "punestation",
    name: "Pune Junction Station",
    category: "transit",
    state: "Maharashtra",
    baseCapacity: 10000,
    hourlyInflow: 3000,
    bottleneckDesc: "Platform 1 main overhead bridge ramp.",
    riskMultiplier: 1.25,
    actions: ["Activate New South Footover Bridge", "Stagger Local Train Arrivals", "Utilize Platform Holds"],
    funFact: "Serves as a crucial junction connecting Pune with Mumbai and southern cities."
  },

  // --- Category: Festivals (8 locations) ---
  {
    id: "sangamghat",
    name: "Prayagraj Sangam Ghat",
    category: "festival",
    state: "Uttar Pradesh",
    baseCapacity: 50000,
    hourlyInflow: 18000,
    bottleneckDesc: "Pontoon bridge river crossings during Mauni Amavasya.",
    riskMultiplier: 1.5,
    actions: ["Enforce One-Way Pontoon Bridges", "Pause Ingress at Sector Barricades", "Deploy Ganga Task Force Boats"],
    funFact: "The focal point of Kumbh Mela, where up to 30 million people bathe on peak auspicious days."
  },
  {
    id: "harkipauri",
    name: "Haridwar Har Ki Pauri",
    category: "festival",
    state: "Uttarakhand",
    baseCapacity: 25000,
    hourlyInflow: 8000,
    bottleneckDesc: "Malviya Ghat footbridge bottleneck during Evening Ganga Aarti.",
    riskMultiplier: 1.4,
    actions: ["Redirect Aarti Crowds to Birla Ghat", "Stop Bridge Pedestrian Stands", "Deploy Water Police Divers"],
    funFact: "Literally means 'Steps of Lord Shiva'; the evening oil-lamp Aarti here is a world-famous spectacle."
  },
  {
    id: "lalbaugcha",
    name: "Lalbaugcha Raja Pandal",
    category: "festival",
    state: "Maharashtra",
    baseCapacity: 30000,
    hourlyInflow: 10000,
    bottleneckDesc: "Mukh Darshan (Viewing) queue lanes winding through Lalbaug lanes.",
    riskMultiplier: 1.45,
    actions: ["Activate Charani Road Buffer Holds", "Implement Snake Barricading", "Request City Police Reinforce"],
    funFact: "The legendary Ganesh idol attracts over 1 million devotees daily during the 10-day festival."
  },
  {
    id: "durgapuja",
    name: "Durga Puja Pandal (Kolkata)",
    category: "festival",
    state: "West Bengal",
    baseCapacity: 18000,
    hourlyInflow: 6500,
    bottleneckDesc: "Pandal theme-hall narrow entry and exit gates.",
    riskMultiplier: 1.3,
    actions: ["Create Wide Unidirectional Bamboo Channels", "Use Ground Halts", "Activate Floodlight Guides"],
    funFact: "Kolkata's Durga Puja is inscribed on UNESCO's Representative List of Intangible Cultural Heritage."
  },
  {
    id: "purirathyatra",
    name: "Puri Grand Road Rath Yatra",
    category: "festival",
    state: "Odisha",
    baseCapacity: 40000,
    hourlyInflow: 15000,
    bottleneckDesc: "Chariot (Rath) pulling ropes rope-cordon corridor.",
    riskMultiplier: 1.45,
    actions: ["Implement Security Cordons around Chariots", "Stagger Grand Road Ingress Points", "Deploy Mounted Police"],
    funFact: "Devotees pull three massive wooden chariots carrying Jagannath, Balabhadra, and Subhadra."
  },
  {
    id: "thrissurpooram",
    name: "Thrissur Pooram Ground",
    category: "festival",
    state: "Kerala",
    baseCapacity: 35000,
    hourlyInflow: 12000,
    bottleneckDesc: "Vadakkunnathan Temple Southern Gate during Kudamattom (umbrella swap).",
    riskMultiplier: 1.4,
    actions: ["Activate Sector Buffer Zones", "Redirect Crowds to Swaraj Round", "Stagger Elephant Formations"],
    funFact: "A magnificent temple festival showcasing a procession of 30 decorated elephants and traditional drums."
  },
  {
    id: "jallianwala",
    name: "Jallianwala Bagh Memorial",
    category: "festival",
    state: "Punjab",
    baseCapacity: 8000,
    hourlyInflow: 2000,
    bottleneckDesc: "Historically narrow, 1.5m wide main entry passage corridor.",
    riskMultiplier: 1.35,
    actions: ["Restrict Main Passway Direction", "Open Rear Memorial Exit Gates", "Deploy Local Marshals"],
    funFact: "The narrow entrance passage is historically famous as the only way in and out of the park."
  },
  {
    id: "chowpatty",
    name: "Girgaon Chowpatty Beach",
    category: "festival",
    state: "Maharashtra",
    baseCapacity: 45000,
    hourlyInflow: 16000,
    bottleneckDesc: "Sands to concrete ramp exit points during Ganesh Visarjan.",
    riskMultiplier: 1.3,
    actions: ["Erect Temporary Bamboo Exit Ramps", "Divide Shoreline into Immersion Zones", "Deploy Lifeguard Boats"],
    funFact: "Up to 500,000 gather here on the final day of Ganesh Utsav for the immersion of giant idols."
  }
];
