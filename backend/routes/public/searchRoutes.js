import { Router } from "express";
import {
  searchRestaurants,
  searchAccommodations,
  searchProperties,
  searchPropertyDetails,
  searchMenuItems,
  searchLocations,
  globalSearch,
} from "../../controllers/public/searchController.js";

const router = Router();

router.get("/restaurants", searchRestaurants);
router.get("/accommodations", searchAccommodations);
router.get("/properties", searchProperties);
router.get("/properties/:idOrSlug", searchPropertyDetails);
router.get("/menu-items", searchMenuItems);
router.get("/locations", searchLocations);
router.get("/global", globalSearch);

export default router;