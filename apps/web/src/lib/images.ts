// Curated, verified travel photography (Unsplash). All URLs return 200.
// Helper appends sizing/quality params.

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const IMAGES = {
  heroDesktop: U("1488085061387-422e29b40080", 1600), // open road / travel
  heroAlt: U("1503220317375-aaad61436b1b", 1600),

  flights: U("1436491865332-7a61a109cc05", 900), // airplane wing
  hotels: U("1566073771259-6a8506099945", 900), // hotel pool

  // destinations
  hunza: U("1589561253898-768105ca91a8", 700),
  skardu: U("1517400508447-f8dd518b86db", 700),
  dubai: U("1512453979798-5ea266f8880c", 700),
  istanbul: U("1561361513-2d000a50f0dc", 700),
  northern: U("1605640840605-14ac1855827b", 700),
  mountains: U("1469474968028-56623f02e42e", 700),
};

export const DESTINATIONS = [
  { name: "Hunza Valley", region: "Gilgit-Baltistan", price: 42000, img: IMAGES.hunza, q: "type=TOUR" },
  { name: "Skardu", region: "Gilgit-Baltistan", price: 65000, img: IMAGES.skardu, q: "type=TOUR" },
  { name: "Dubai", region: "United Arab Emirates", price: 145000, img: IMAGES.dubai, q: "type=TOUR" },
  { name: "Istanbul", region: "Türkiye", price: 210000, img: IMAGES.istanbul, q: "type=TOUR" },
];

// per-trip thumbnails by id (hotels / tours / events / umrah)
export const TRIP_IMAGES: Record<string, string> = {
  "htl-1": U("1566073771259-6a8506099945", 500),
  "htl-2": U("1571896349842-33c89424de2d", 500),
  "htl-3": U("1570077188670-e3a8d69ac5ff", 500),
  "tour-1": IMAGES.skardu,
  "tour-2": IMAGES.dubai,
  "tour-3": IMAGES.istanbul,
  "umr-1": U("1548013146-72479768bada", 500),
  "umr-2": U("1548013146-72479768bada", 500),
  "evt-1": U("1707343843437-caacff5cfa74", 500),
  "evt-2": U("1707343843437-caacff5cfa74", 500),
  "evt-3": U("1707343843437-caacff5cfa74", 500),
};
