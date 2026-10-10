export function jsonPlugin(schema) {
  schema.set('toJSON', {
    virtuals: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.tokenHashes;
      return ret;
    },
  });
}
