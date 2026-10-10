// validate(fn): fn(body, req) returns a clean body or throws HttpError(400).
export const validate = (fn) => (req, _res, next) => {
  try {
    req.body = fn(req.body ?? {}, req);
    next();
  } catch (err) {
    next(err);
  }
};
