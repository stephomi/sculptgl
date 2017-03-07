var Tablet = {
  radiusFactor: 0.75, // the pen pressure acts on the tool's radius
  intensityFactor: 0.0, // the pen pressure acts on the tool's intensity
  pressure: 0.5
};

Tablet.getPressureIntensity = function () {
  return 1.0 + Tablet.intensityFactor * (Tablet.pressure * 2.0 - 1.0);
};

Tablet.getPressureRadius = function () {
  return 1.0 + Tablet.radiusFactor * (Tablet.pressure * 2.0 - 1.0);
};

export default Tablet;
