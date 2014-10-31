
var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

koratDragonDen.debtCalculatorSample.model = (function model(){
  'use strict';

  var allDebts = {};
  var subscribers = [];

  // TODO - Add support for this
  // var customPriority = [];

  var allocationMethod = 0;
  var prioritizationMethod = 0;
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

  var getMonthlyMinimumForPayoffTime = function getMonthlyMinimumForPayoffTime(orderedDebtsObject) {

    var currentMonthlyMinimum = 0.0;
    for (var i = 0; i < orderedDebtsObject.length; i++) {
      currentMonthlyMinimum += orderedDebtsObject[i].debtObject.minimumMonthlyPayment;
    }

    return currentMonthlyMinimum;
  };

  // TODO - This whole thing is a brainstormy mess. Fix it.
  var calculatePayoffTime = function calculatePayoffTime() {

    var debt, i;
    var orderedDebts = [];

    // TODO - Change these to enums
    switch (allocationMethod) {

      case 'highestApr':
        orderedDebts = getDebtsSortedByHighestApr();
        break;

      case 'lowestOwed':
        orderedDebts = getDebtsSortedByLowestOwed();
        break;

      case 'custom':
        // TODO - If custom priority, use customPriority
        break;

      default:
        // TODO - How do we want to handle this?
    }

    var months = 0;
    // TODO - Add stop for amounts that are just absurdly long
    while (orderedDebts.length > 0) {
      // Calculate interest first, then remove amount

      months++;

      var orderedDebtsLength = orderedDebts.length;

      // Calculate interest
      for (i = 0; i < orderedDebtsLength; i++) {
        // TODO - Cache monthly interest rate
        orderedDebts[i].remainingOwed *= ( 1.0 + (orderedDebts[i].debtObject.apr / 1200.0) );
      }

      // Determine amount over monthly minimum, if any
      var currentMonthlyMinimum = getMonthlyMinimumForPayoffTime(orderedDebts);
      var amountOverMonthlyMinimum = Math.max(monthlyPayments - currentMonthlyMinimum, 0.0);

      // TODO - Change these to enums
      switch (prioritizationMethod) {

        case 'evenSplit':
          // TODO - Factor in when this is reset mid-calculation because of a debt(s) being paid off
          var evenSplitExtra = amountOverMonthlyMinimum / orderedDebtsLength;

          for (i = 0; i < orderedDebtsLength; i++) {
            // TODO - Check if this subtracts more than owed
            orderedDebts[i].remainingOwed -= (evenSplitExtra + orderedDebts[i].debtObject.minimumMonthlyPayment);
          }
          break;

        case 'priorityFirst':
          var remainingAmountOverMonthlyMinimum = amountOverMonthlyMinimum;
          for (i = 0; i < orderedDebtsLength; i++) {
            // TODO - Check if this subtracts more than owed
            orderedDebts[i].remainingOwed -= (remainingAmountOverMonthlyMinimum + orderedDebts[i].debtObject.minimumMonthlyPayment);
            remainingAmountOverMonthlyMinimum -= remainingAmountOverMonthlyMinimum;
          }
          break;

        case 'proportionalSplit':
          // If proportional split
          var totalAmountRemaining = 0.0;
          // TODO - This is an array
          for (i = 0; i < orderedDebtsLength; i++) {
            totalAmountRemaining += orderedDebts[i].remainingOwed;
          }

          evenSplitExtra = amountOverMonthlyMinimum / orderedDebtsLength;
          // TODO - Factor in when this is reset mid-calculation because of a debt(s) being paid off

          for (i = 0; i < orderedDebtsLength; i++) {
            // TODO - Check if this subtracts more than owed
            orderedDebts[i].remainingOwed -= ((amountOverMonthlyMinimum * (orderedDebts[i].remainingOwed/totalAmountRemaining)) + orderedDebts[i].debtObject.minimumMonthlyPayment);
          }
          break;

        default:
          // TODO - How do we want to handle this?
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


