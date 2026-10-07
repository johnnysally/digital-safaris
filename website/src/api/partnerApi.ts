import { api } from "./axios";

export interface PartnerRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  towns: string[];
  businessType?: string;
  cuisine?: string;
}

export const registerTransport = async (data: PartnerRegisterPayload) => {
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    idNumber: `PENDING-${Date.now()}`,
    town: data.towns[0] || "Nairobi",
    serviceTypes: data.businessType ? [data.businessType] : ["car"],
    locationId: data.towns[0] || null,
  };
  const res = await api.post("/public/register/transport", payload);
  return res.data;
};

export const registerRestaurant = async (data: PartnerRegisterPayload) => {
  const payload = {
    name: data.businessName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    town: data.towns[0] || "Nairobi",
    address: data.towns[0] || "Nairobi",
    latitude: -1.286389,
    longitude: 36.817223,
    locationId: data.towns[0] || null,
    description: "",
    cuisineTypes: data.cuisine ? [data.cuisine] : [],
  };
  const res = await api.post("/public/register/restaurant", payload);
  return res.data;
};

export const registerAccommodation = async (data: PartnerRegisterPayload) => {
  const payload = {
    name: data.businessName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    town: data.towns[0] || "Nairobi",
    address: data.towns[0] || "Nairobi",
    latitude: -1.286389,
    longitude: 36.817223,
    locationId: data.towns[0] || null,
    description: "",
    type: "hotel",
    amenities: [],
  };
  const res = await api.post("/public/register/accommodation", payload);
  return res.data;
};

export const registerPartnerByType = async (
  type: string,
  data: PartnerRegisterPayload
) => {
  if (type === "transport") return registerTransport(data);
  if (type === "restaurant") return registerRestaurant(data);
  if (type === "accommodation") return registerAccommodation(data);
  throw new Error("Invalid partner type");
};