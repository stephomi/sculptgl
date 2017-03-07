var Tablet = {
  useOnRadius: true, // the pen pressure acts on the tool's radius
  useOnIntensity: false, // the pen pressure acts on the tool's intensity
  pressure: 0.5
};

Tablet.getPressureIntensity = function () {
  return Tablet.useOnIntensity === true ? 0.25 + Tablet.pressure * 1.5 : 1.0;
};

Tablet.getPressureRadius = function () {
  return Tablet.useOnRadius === true ? 0.25 + Tablet.pressure * 1.5 : 1.0;
};

export default Tablet;
