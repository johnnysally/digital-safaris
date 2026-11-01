const TRANSPORT_SERVICE_ALIASES = {
  bike: "bike",
  motorbike: "bike",
  motorcycle: "bike",

  car: "car",
  taxi: "car",
  ride_hailing: "car",
  ridehailing: "car",
  ride_hail: "car",
  car_rental: "car",
  car_hire: "car",
  uber: "car",
  bolt: "car",

  van: "van",
  shuttle: "van",
  minibus: "van",
  matatu: "van",

  truck: "truck",
  lorry: "truck",
  cargo: "truck",

  bus: "bus",
  coach: "bus",

  boat: "boat",
  ferry: "boat",
};

export const TRANSPORT_SERVICE_TYPES = [
  "bike",
  "car",
  "van",
  "truck",
  "bus",
  "boat",
];

export function normalizeTransportServiceTypes(input) {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  const out = [];

  for (const raw of arr) {
    if (typeof raw !== "string") continue;
    const key = raw.toLowerCase().trim();
    const mapped = TRANSPORT_SERVICE_ALIASES[key];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }

  return out.length ? out : ["car"];
}

export { TRANSPORT_SERVICE_ALIASES };