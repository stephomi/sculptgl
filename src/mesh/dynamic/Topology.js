define(function (require, exports, module) {

  'use strict';

  var Subdivision = require('mesh/dynamic/Subdivision');
  var Decimation = require('mesh/dynamic/Decimation');

  var Topology = function (mesh) {
    this._mesh = mesh;
    this._subdivision = new Subdivision(mesh);
    this._decimation = new Decimation(mesh);
  };

  Topology.subFactor = 75; // subdivision factor
  Topology.decFactor = 0; // decimation factor
  Topology.linear = false; // linear subdivision

  Topology.prototype = {
    getSubdivisionFactor: function () {
      return Topology.subFactor * 0.01;
    },
    getDecimationFactor: function () {
      return Topology.decFactor * 0.01;
    },
    subdivision: function (iTris, center, radius2, detail2, states) {
      this._subdivision._linear = Topology.linear;
      return this._subdivision.subdivision(iTris, center, radius2, detail2, states);
    },
    decimation: function (iTris, center, radius2, detail2, states) {
      return this._decimation.decimation(iTris, center, radius2, detail2, states);
    }
  };

  module.exports = Topology;
});