import mongoose from 'mongoose';
import { Task, Schedule, Device, AIConversation, User } from '../../models/index.js';

const j = (doc) => (doc ? doc.toJSON() : null);
const validId = (id) => mongoose.isValidObjectId(id);

export const mongoRepo = {
  kind: 'mongodb',
  tasks: {
    list: async () => (await Task.find().sort({ createdAt: -1 })).map(j),
    get: async (id) => (validId(id) ? j(await Task.findById(id)) : null),
    create: async (data) => j(await Task.create(data)),
    update: async (id, patch) =>
      validId(id) ? j(await Task.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true })) : null,
    remove: async (id) => (validId(id) ? Boolean(await Task.findByIdAndDelete(id)) : false),
    count: () => Task.countDocuments(),
    clear: () => Task.deleteMany({}),
  },
  schedule: {
    listByDate: async (date) => (await Schedule.find({ date }).sort({ startTime: 1 })).map(j),
    create: async (data) => j(await Schedule.create(data)),
    remove: async (id) => (validId(id) ? Boolean(await Schedule.findByIdAndDelete(id)) : false),
    removeBySource: (date, source) => Schedule.deleteMany({ date, source }),
    countByDate: (date) => Schedule.countDocuments({ date }),
    clear: () => Schedule.deleteMany({}),
  },
  devices: {
    get: async (deviceId) => j(await Device.findOne({ deviceId })),
    findByCode: async (code) => j(await Device.findOne({ pairingCode: code, pairingExpiresAt: { $gt: new Date() } })),
    upsert: async (deviceId, patch) =>
      j(await Device.findOneAndUpdate({ deviceId }, { $set: patch }, { new: true, upsert: true, setDefaultsOnInsert: true })),
    addTokenHash: (deviceId, hash) => Device.updateOne({ deviceId }, { $addToSet: { tokenHashes: hash } }),
    hasTokenHash: async (deviceId, hash) => Boolean(await Device.exists({ deviceId, tokenHashes: hash })),
  },
  messages: {
    add: async (data) => j(await AIConversation.create(data)),
    recent: async (limit = 6) => (await AIConversation.find().sort({ timestamp: -1 }).limit(limit)).map(j).reverse(),
  },
  user: {
    get: async () => j(await User.findOne()),
    save: async (data) => j(await User.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true, setDefaultsOnInsert: true })),
  },
};
