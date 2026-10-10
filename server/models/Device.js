import mongoose from 'mongoose';
import { jsonPlugin } from './plugins.js';

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, default: 'Living Room TV', maxlength: 60 },
    pairingCode: { type: String, default: null, index: true },
    pairingExpiresAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
    // SHA-256 hashes of session tokens issued to paired phones (raw tokens are never stored)
    tokenHashes: { type: [String], default: [] },
  },
  { timestamps: true }
);
DeviceSchema.plugin(jsonPlugin);
export const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
