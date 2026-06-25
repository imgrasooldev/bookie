// Bundled demo data so the app runs before the backend is reachable.
// Mirrors apps/api seed + apps/web mock.

import 'models.dart';

const verticals = <Vertical>[
  Vertical(type: 'BUS', label: 'Bus', tagline: 'Intercity tickets, live seat selection', icon: '🚌', flavor: 'SCHEDULED_SEAT'),
  Vertical(type: 'CAR', label: 'City Ride', tagline: 'Book a car within the city', icon: '🚗', flavor: 'ON_DEMAND_RIDE'),
  Vertical(type: 'PICNIC', label: 'Picnic & Party', tagline: 'Charter a coach for your group', icon: '🎉', flavor: 'CHARTER'),
  Vertical(type: 'CORPORATE', label: 'Corporate', tagline: 'Staff & event transport, on contract', icon: '🏢', flavor: 'CHARTER'),
];

const cities = <City>[
  City(id: 'lhe', name: 'Lahore'),
  City(id: 'isb', name: 'Islamabad'),
  City(id: 'khi', name: 'Karachi'),
  City(id: 'rwp', name: 'Rawalpindi'),
  City(id: 'fsd', name: 'Faisalabad'),
  City(id: 'multan', name: 'Multan'),
  City(id: 'pesh', name: 'Peshawar'),
  City(id: 'sialkot', name: 'Sialkot'),
];

const _daewoo = Operator(id: 'daewoo', name: 'Daewoo Express', rating: 4.6, logoColor: '#1d4ed8');
const _faisal = Operator(id: 'faisal', name: 'Faisal Movers', rating: 4.3, logoColor: '#b91c1c');
const _skyways = Operator(id: 'skyways', name: 'Skyways', rating: 4.1, logoColor: '#047857');
const _bookie = Operator(id: 'bookie', name: 'Bookie Fleet', rating: 4.8, logoColor: '#7c3aed');

const trips = <Trip>[
  Trip(id: 'bus-1', serviceType: 'BUS', operator: _daewoo, title: 'Lahore → Islamabad', departAt: '2026-06-26T07:00:00+05:00', arriveAt: '2026-06-26T11:30:00+05:00', durationMin: 270, price: 2400, priceUnit: 'per_seat', seatsAvailable: 18, vehicle: 'Volvo 9700 (Business)', amenities: ['wifi', 'ac', 'meal', 'usb']),
  Trip(id: 'bus-2', serviceType: 'BUS', operator: _faisal, title: 'Lahore → Islamabad', departAt: '2026-06-26T09:30:00+05:00', arriveAt: '2026-06-26T14:15:00+05:00', durationMin: 285, price: 1950, priceUnit: 'per_seat', seatsAvailable: 6, vehicle: 'Hino (Executive)', amenities: ['ac', 'usb', 'water']),
  Trip(id: 'bus-3', serviceType: 'BUS', operator: _skyways, title: 'Lahore → Islamabad', departAt: '2026-06-26T14:00:00+05:00', arriveAt: '2026-06-26T18:40:00+05:00', durationMin: 280, price: 1700, priceUnit: 'per_seat', seatsAvailable: 24, vehicle: 'Yutong (Standard)', amenities: ['ac', 'water']),
  Trip(id: 'car-1', serviceType: 'CAR', operator: _bookie, title: 'City Ride — Sedan', price: 850, priceUnit: 'from', vehicle: 'Toyota Corolla', amenities: ['ac', 'tracking']),
  Trip(id: 'car-2', serviceType: 'CAR', operator: _bookie, title: 'City Ride — Mini', price: 550, priceUnit: 'from', vehicle: 'Suzuki Cultus', amenities: ['ac', 'tracking']),
  Trip(id: 'picnic-1', serviceType: 'PICNIC', operator: _bookie, title: '15-Seater Hiace — Day Trip', price: 18000, priceUnit: 'from', vehicle: 'Toyota Hiace (Grand Cabin)', amenities: ['ac', 'music', 'driver']),
  Trip(id: 'picnic-2', serviceType: 'PICNIC', operator: _skyways, title: '30-Seater Coaster — Group', price: 32000, priceUnit: 'from', vehicle: 'Toyota Coaster', amenities: ['ac', 'music', 'driver']),
  Trip(id: 'corp-1', serviceType: 'CORPORATE', operator: _bookie, title: 'Staff Pick & Drop — Monthly', price: 0, priceUnit: 'from', vehicle: 'Fleet (mixed)', amenities: ['contract', 'tracking', 'invoice']),
  Trip(id: 'corp-2', serviceType: 'CORPORATE', operator: _daewoo, title: 'Corporate Event Transport', price: 45000, priceUnit: 'from', vehicle: 'Coaster + Hiace fleet', amenities: ['contract', 'tracking', 'invoice']),
];

const amenityLabels = <String, String>{
  'wifi': 'Wi-Fi', 'ac': 'Air-conditioned', 'meal': 'Onboard meal', 'usb': 'USB charging',
  'water': 'Water', 'tracking': 'Live tracking', 'music': 'Music system', 'driver': 'Driver included',
  'contract': 'Contract billing', 'invoice': 'GST invoice',
};
