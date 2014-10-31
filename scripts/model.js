
var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

koratDragonDen.debtCalculatorSample.model = (function model(){
  'use strict';

  var allDebts = {};
  var uniqueDebtIdCounter = 0;
  // var customPriority = [];

  // var allocationMethod = 0;
  // var prioritizationMethod = 0;
  var monthlyPayments = 0.0;

  var Debt = function Debt(uid) {
    this.uid = uid;
  };
  Debt.prototype.apr = 0.0;
  Debt.prototype.amountOwed = 0.0;
  Debt.prototype.minimumMonthlyPayment = 0.0;

  // TODO - This whole thing is a brainstormy mess. Fix it.
  function calculatePayoffTime() {

    var debt, unorderedDebts, i, l;

    var orderedDebts = [];

    // If custom priority, use customPriority

    // If highest APR
    unorderedDebts = [];

    for (debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        unorderedDebts.push(allDebts[debt].uid);
      }
    }

    var highestAprDebt;
    while (unorderedDebts.length > 0) {

      highestAprDebt = 0;

      for (i = 1, l = unorderedDebts.length; i < l; i++) {
        if (allDebts[unorderedDebts[i]].apr > allDebts[unorderedDebts[highestAprDebt]].apr) {
          highestAprDebt = i;
        }
      }

      orderedDebts.push({
        debtObject : allDebts[unorderedDebts[highestAprDebt]],
        remainingOwed : allDebts[unorderedDebts[highestAprDebt]].amountOwed
      });

      unorderedDebts.splice(highestAprDebt, 1);
    }

    // If lowest owed
    unorderedDebts = [];

    for (debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        unorderedDebts.push(allDebts[debt].uid);
      }
    }

    var lowestOwedDebt;
    while (unorderedDebts.length > 0) {

      lowestOwedDebt = 0;

      for (i = 1, l = unorderedDebts.length; i < l; i++) {
        if (allDebts[unorderedDebts[i]].amountOwed < allDebts[unorderedDebts[lowestOwedDebt]].amountOwed) {
          lowestOwedDebt = i;
        }
      }

      orderedDebts.push({
        debtObject : allDebts[unorderedDebts[lowestOwedDebt]],
        remainingOwed : allDebts[unorderedDebts[lowestOwedDebt]].amountOwed
      });

      unorderedDebts.splice(lowestOwedDebt, 1);
    }

    // Recursive function
    var months = 0;
    // TODO - Add stop for amounts that are just absurdly long
    while (orderedDebts.length > 0) {
      // Calculate interest first, then remove amount

      months++;

      // Calculate interest
      // TODO - This is an array
      for (debt in orderedDebts) {
        if (orderedDebts.hasOwnProperty(debt)) {
          orderedDebts[debt].remainingOwed *= ( 1.0 + (orderedDebts[debt].debtObject.apr / 1200.0) );
        }
      }

      // Determine amount over monthly minimum, if any
      var currentMonthlyMinimum = 0.0;
      // TODO - This is an array
      for (debt in orderedDebts) {
        if (orderedDebts.hasOwnProperty(debt)) {
          currentMonthlyMinimum += orderedDebts[debt].debtObject.minimumMonthlyPayment;
        }
      }

      var amountOverMonthlyMinimum = Math.max(monthlyPayments - currentMonthlyMinimum, 0.0);

        // If even split
        var debtRemainingCounter = 0.0;
        // TODO - This is an array
        for (debt in orderedDebts) {
          if (orderedDebts.hasOwnProperty(debt)) {
            debtRemainingCounter++;
          }
        }

        var evenSplitExtra = amountOverMonthlyMinimum / debtRemainingCounter;
        // TODO - Factor in when this is reset mid-calculation because of a debt(s) being paid off

        for (debt in orderedDebts) {
        // TODO - This is an array
          if (orderedDebts.hasOwnProperty(debt)) {
            // Check if this subtracts more than owed
            orderedDebts[debt].remainingOwed -= (evenSplitExtra + orderedDebts[debt].debtObject.minimumMonthlyPayment);
          }
        }





        // If pay to priority
        var remainingAmountOverMonthlyMinimum = amountOverMonthlyMinimum;
        for (debt in orderedDebts) {
        // TODO - This is an array
          if (orderedDebts.hasOwnProperty(debt)) {
            // Check if this subtracts more than owed
            orderedDebts[debt].remainingOwed -= (remainingAmountOverMonthlyMinimum + orderedDebts[debt].debtObject.minimumMonthlyPayment);
            remainingAmountOverMonthlyMinimum -= remainingAmountOverMonthlyMinimum;
          }
        }




        // If proportional split
        var totalAmountRemaining = 0.0;
        // TODO - This is an array
        for (debt in orderedDebts) {
          if (orderedDebts.hasOwnProperty(debt)) {
            totalAmountRemaining += orderedDebts[debt].remainingOwed;
          }
        }

        evenSplitExtra = amountOverMonthlyMinimum / debtRemainingCounter;
        // TODO - Factor in when this is reset mid-calculation because of a debt(s) being paid off

        for (debt in orderedDebts) {
        // TODO - This is an array
          if (orderedDebts.hasOwnProperty(debt)) {
            // Check if this subtracts more than owed
            orderedDebts[debt].remainingOwed -= ((amountOverMonthlyMinimum * (orderedDebts[debt].remainingOwed/totalAmountRemaining)) + orderedDebts[debt].debtObject.minimumMonthlyPayment);
          }
        }
    }
  }

  function getNewUid() {

    return uniqueDebtIdCounter++;
  }

  return {
    'newDebt' : function newDebt(debtData) {

      var uid = getNewUid();
      var debt = new Debt(uid);

      if (debtData !== undefined) {
        if (debtData.apr !== undefined){
          debt.apr = debtData.apr;
        }
        if (debtData.amountOwed !== undefined){
          debt.amountOwed = debtData.amountOwed;
        }
        if (debtData.minimumMonthlyPayment !== undefined){
          debt.minimumMonthlyPayment = debtData.minimumMonthlyPayment;
        }
      }

      allDebts[uid] = new Debt(uid);

      // TODO - Publish debt update
    },

    'updateDebtInfo' : function updateDebtInfo(debtUid, property, amount) {

      if (allDebts[debtUid]) {
        allDebts[debtUid][property] = amount;
      }

      // TODO - Publish debt update
    },

    'deleteDebt' : function deleteDebt(uid, test) {

      if (allDebts[uid]) {
        delete allDebts[uid];
      }

      // TODO - Publish debt update
    },

    'getTotalAmountOwed' : function getTotalAmountOwed() {

      var totalAmountOwed = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          totalAmountOwed += allDebts[debt].amountOwed;
        }
      }

      return totalAmountOwed;
    },

    'getTotalMinimumMonthlyPayment' : function getTotalMinimumMonthlyPayment() {

      var totalMinimumMonthlyPayment = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          totalMinimumMonthlyPayment += allDebts[debt].minimumMonthlyPayment;
        }
      }

      return totalMinimumMonthlyPayment;
    }
  };

}());


