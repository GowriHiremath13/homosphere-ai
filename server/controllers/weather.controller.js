import { asyncHandler } from '../utils/asyncHandler.js';
import { getWeather } from '../services/weatherService.js';

export const get = asyncHandler(async (req, res) => res.json({ weather: await getWeather({ force: req.query.refresh === '1' }) }));
