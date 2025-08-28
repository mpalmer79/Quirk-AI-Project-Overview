function validateVehicle(vehicle) {
  const errors = [];
  if (!vehicle.stock_number) errors.push('Missing stock number');
  if (!vehicle.vin || vehicle.vin.length !== 17) errors.push('Invalid VIN');
  if (vehicle.price <= 0) errors.push('Invalid price');
  return errors;
}
