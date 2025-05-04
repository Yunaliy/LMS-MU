export const ErrorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const success = false;

  // Log the error for debugging
  console.error("Error:", {
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Send error response
  res.status(statusCode).json({
    success,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}; 