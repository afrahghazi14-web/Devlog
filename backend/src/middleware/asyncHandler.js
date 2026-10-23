// Wraps async route handlers to automatically catch rejections and forward them
// to Express's next(err) error-handling pipeline.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
