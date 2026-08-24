/*
 *
 *
 *       Complete the handler logic below
 *
 *
 */

function ConvertHandler() {
  const units = ["gal", "l", "mi", "km", "lbs", "kg"];

  this.getNum = function(input) {
    const unitMatch = input.match(/[a-zA-Z]+$/);
    const numericPart = unitMatch
      ? input.slice(0, -unitMatch[0].length)
      : input;

    if (numericPart === "") {
      return 1;
    }

    const parts = numericPart.split("/");
    if (parts.length > 2) {
      return "invalid number";
    }

    const numerator = Number(parts[0]);
    if (!Number.isFinite(numerator)) {
      return "invalid number";
    }

    if (parts.length === 1) {
      return numerator;
    }

    const denominator = Number(parts[1]);
    if (!Number.isFinite(denominator) || denominator === 0) {
      return "invalid number";
    }

    return numerator / denominator;
  };

  this.getUnit = function(input) {
    const match = input.match(/[a-zA-Z]+$/);
    if (!match || !units.includes(match[0].toLowerCase())) {
      return "invalid unit";
    }
    return match[0];
  };

  this.getReturnUnit = function(initUnit) {
    const conversions = {
      gal: "l",
      lbs: "kg",
      mi: "km",
      l: "gal",
      kg: "lbs",
      km: "mi"
    };
    return conversions[initUnit.toLowerCase()];
  };

  this.spellOutUnit = function(unit) {
    const names = {
      gal: "gallons",
      lbs: "pounds",
      mi: "miles",
      l: "liters",
      kg: "kilograms",
      km: "kilometers"
    };
    return names[unit.toLowerCase()];
  };

  this.convert = function(initNum, initUnit) {
    const galToL = 3.78541;
    const lbsToKg = 0.453592;
    const miToKm = 1.60934;

    switch (initUnit.toLowerCase()) {
      case "gal":
        return initNum * galToL;
      case "lbs":
        return initNum * lbsToKg;
      case "mi":
        return initNum * miToKm;
      case "l":
        return initNum / galToL;
      case "kg":
        return initNum / lbsToKg;
      case "km":
        return initNum / miToKm;
      default:
        return undefined;
    }
  };

  this.getString = function(initNum, initUnit, returnNum, returnUnit) {
    return `${initNum} ${this.spellOutUnit(initUnit)} converts to ${returnNum} ${this.spellOutUnit(returnUnit)}`;
  };
}

module.exports = ConvertHandler;
