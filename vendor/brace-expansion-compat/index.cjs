"use strict";

const modernBraceExpansion = require("brace-expansion-modern");
const expand = modernBraceExpansion.expand
  ?? modernBraceExpansion.default
  ?? modernBraceExpansion;

module.exports = expand;
module.exports.expand = expand;
