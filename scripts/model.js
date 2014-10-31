
var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

koratDragonDen.debtCalculatorSample.model = (function model(){
  'use strict';

  var allDebts = {};
  var subscribers = [];

  // TODO - Add support for this
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

  var publishDebtUpdates = function publishDebtUpdates(uid, updateType) {

    var debtObject;

    if (updateType === 'delete') {
      debtObject = undefined;
    } else {
      debtObject = allDebts[uid];
    }

    var data = {
      'debtObject' : debtObject,
      'type' : updateType
    };

    for (var i = 0; i < subscribers.length; i++) {
      subscribers[i](data);
    }
  };

  var getDebtsSortedByHighestApr = function getDebtsSortedByHighestApr() {
    // TODO

    var unorderedDebts = [];
    var orderedDebts = [];

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        unorderedDebts.push(allDebts[debt].uid);
      }
    }

    var highestAprDebt = 0;
    while (unorderedDebts.length > 0) {

      highestAprDebt = 0;

      for (var i = 1, l = unorderedDebts.length; i < l; i++) {
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

    return orderedDebts;

  };

  var getDebtsSortedByLowestOwed = function getDebtsSortedByLowestOwed() {
    // TODO

    var unorderedDebts = [];
    var orderedDebts = [];

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        unorderedDebts.push(allDebts[debt].uid);
      }
    }

    var lowestOwedDebt;
    while (unorderedDebts.length > 0) {

      lowestOwedDebt = 0;

      for (var i = 1, l = unorderedDebts.length; i < l; i++) {
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

    return orderedDebts;
  };

  // TODO - This whole thing is a brainstormy mess. Fix it.
  var calculatePayoffTime = function calculatePayoffTime() {

    var debt;
    var orderedDebts = [];

    // If custom priority, use customPriority

    // If highest APR
    orderedDebts = getDebtsSortedByHighestApr();

    // If lowest owed
    orderedDebts = getDebtsSortedByLowestOwed();

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
  };

  function getNewUid() {

    return Math.random().toString(36).substr(2,9);
  }

  return {
    'subscribeToDebtUpdates' : function subscribeToDebtUpdates(callback) {

      // Sanity check. Don't let the same callback subscribe twice.
      for (var i = 0; i < subscribers.length; i++) {
        if (subscribers[i] === callback) {
          return;
        }
      }

      subscribers.push(callback);
    },

    'unsubscribeFromDebtUpdates' :
        function unsubscribeFromDebtUpdates(callback) {

      for (var i = 0; i < subscribers.length; i++) {
        if (subscribers[i] === callback) {
          subscribers.pop(i);
          return;
        }
      }
    },

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

      publishDebtUpdates(uid, 'add');
    },

    'updateDebtInfo' : function updateDebtInfo(uid, property, amount) {

      if (allDebts[uid]) {
        allDebts[uid][property] = amount;
      }

      publishDebtUpdates(uid, 'update');
    },

    'deleteDebt' : function deleteDebt(uid, test) {

      if (allDebts[uid]) {
        delete allDebts[uid];
      }

      publishDebtUpdates(uid, 'delete');
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


