
var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

// TODO - Find places where calculations would demand we cap at two decimals
koratDragonDen.debtCalculatorSample.model = (function model(){
  'use strict';

  var allDebts = {};
  var allocationMethod = 0;
  var prioritizationMethod = 0;
  var monthlyPayments = 0.0;

  var payoffTime = undefined;

  var subscribers = [];

  var prioritizationMethods = {
    'HIGHEST_APR' : 0,
    'LOWEST_OWED' : 1,
    'CUSTOM' : 2
  };

  var allocationMethods = {
    'EVEN_SPLIT' : 0,
    'PRIORITY_FIRST' : 1,
    'PROPORTIONAL_SPLIT' : 2
  };

  var Debt = function Debt(uid) {
    this.uid = uid;
  };
  Debt.prototype.apr = 0.0;
  Debt.prototype.monthlyInterest = 0.0;
  Debt.prototype.amountOwed = 0.0;
  Debt.prototype.minimumMonthlyPayment = 0.0;

  // TODO - Rework this
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

  // TODO - This and the function below might have combinable code
  var getDebtsSortedByHighestApr = function getDebtsSortedByHighestApr() {

    var orderedDebts = [];

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        orderedDebts.push({
          debtObject : allDebts[debt],
          remainingOwed : allDebts[debt].amountOwed
        });
      }
    }

    orderedDebts.sort(function(a, b) {
      // b - a results in highest first sorting
      return b.debtObject.apr - a.debtObject.apr;
    });

    return orderedDebts;
  };

  var getDebtsSortedByLowestOwed = function getDebtsSortedByLowestOwed() {

    var orderedDebts = [];

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {
        orderedDebts.push({
          debtObject : allDebts[debt],
          remainingOwed : allDebts[debt].amountOwed
        });
      }
    }

    orderedDebts.sort(function(a, b) {
      // a - b results in lowest first sorting
      return a.debtObject.amountOwed - b.debtObject.amountOwed;
    });

    return orderedDebts;
  };

  // TODO - Rework this? Move it?
  var getMonthlyMinimumForPayoffTime = function getMonthlyMinimumForPayoffTime(orderedDebtsObject) {

    var currentMonthlyMinimum = 0.0;
    for (var i = 0; i < orderedDebtsObject.length; i++) {
      currentMonthlyMinimum += orderedDebtsObject[i].debtObject.minimumMonthlyPayment;
    }

    return currentMonthlyMinimum;
  };

  var calculatePayoffTime = function calculatePayoffTime() {

    var i, orderedDebts, debt, payment, extra, remaining;

    // TODO - Change these to enums
    switch (prioritizationMethod) {

      case prioritizationMethods.HIGHEST_APR:
        orderedDebts = getDebtsSortedByHighestApr();
        break;

      case prioritizationMethods.LOWEST_OWED:
        orderedDebts = getDebtsSortedByLowestOwed();
        break;

      case prioritizationMethods.CUSTOM:
        // TODO - If custom priority, use customPriority
        break;

      default:
        throw new Error('calculatePayoffTime(): ' +
            'Bad prioritizationMethod: ' + prioritizationMethod);
    }

    var months = 0;
    // TODO - Add stop for amounts that are just absurdly long
    while (orderedDebts.length > 0) {
      // Track how many months of paying this will take
      months++;

      // Calculate interest
      // TODO - Cap this at two decimals
      for (i = 0; i < orderedDebts.length; i++) {
        debt = orderedDebts[i];
        debt.remainingOwed *= debt.monthlyInterest;
      }

      // Determine amount over monthly minimum, if any
      extra = Math.max(monthlyPayments - getMonthlyMinimumForPayoffTime(orderedDebts), 0.0);

      // Handle minimum monthly payments first
      // Looping backwards makes array object deletion logic cleaner
      for (i = orderedDebts.length; i--; ) {
        debt = orderedDebts[i];

        payment = debt.debtObject.minimumMonthlyPayment;
        remaining = debt.remainingOwed;

        if (remaining < payment) {
          extra += (payment - remaining);
          delete orderedDebts[i];
        } else {
          debt.remainingOwed -= payment;
        }
      }

      // TODO - See if there's parts where these can be combined or otherwise
      switch (allocationMethod) {

        case allocationMethods.EVEN_SPLIT:

          while (extra > 0.0 && orderedDebts.length) {
            payment = extra / orderedDebts.length;
            extra = 0.0;
            // Looping backwards makes array object deletion logic cleaner
            for (i = orderedDebts.length; i--; ) {
              debt = orderedDebts[i];
              remaining = debt.remainingOwed;

              if (remaining < payment) {
                extra += (payment - remaining);
                delete orderedDebts[i];
              } else {
                debt.remainingOwed -= payment;
              }
            }
          }
          break;

        case allocationMethods.PRIORITY_FIRST:

          while (extra > 0.0 && orderedDebts.length) {
            debt = orderedDebts[i];
            remaining = debt.remainingOwed;

            if (remaining < extra) {
              extra -= remaining;
              delete orderedDebts[i];
            } else {
              debt.remainingOwed -= extra;
              extra = 0.0;
            }
          }
          break;

        case allocationMethods.PROPORTIONAL_SPLIT:

          while (extra > 0.0 && orderedDebts.length) {

            var fundsAvailableTotal = extra;
            var fundsAvailableRemaining = extra;

            var totalAmountRemaining = 0.0;
            for (i = 0; i < orderedDebts.length; i++) {
              totalAmountRemaining += orderedDebts[i].remainingOwed;
            }

            extra = 0.0;
            // Looping backwards makes array object deletion logic cleaner
            for (i = orderedDebts.length; i--; ) {
              debt = orderedDebts[i];
              remaining = debt.remainingOwed;

              payment = fundsAvailableTotal * (remaining/totalAmountRemaining);
              if (payment > fundsAvailableRemaining) {
                payment = fundsAvailableRemaining;
                fundsAvailableRemaining = 0.0;
              } else {
                fundsAvailableRemaining -= payment;
              }

              if (remaining < payment) {
                extra += (payment - remaining);
                delete orderedDebts[i];
              } else {
                debt.remainingOwed -= payment;
              }
            }
          }
          break;

        default:
          throw new Error('calculatePayoffTime(): ' +
              'Bad allocationMethod: ' + allocationMethod);
      }
    }
    payoffTime = months;
  };

  function getNewUid() {

    return Math.random().toString(36).substr(2,9);
  }

  return {
    'subscribeToDataUpdates' : function subscribeToDataUpdates(callback) {

      // Sanity check. Don't let the same callback subscribe twice.
      for (var i = 0; i < subscribers.length; i++) {
        if (subscribers[i] === callback) {
          return;
        }
      }

      subscribers.push(callback);
    },

    'unsubscribeFromDataUpdates' :
        function unsubscribeFromDataUpdates(callback) {

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

      // TODO - Clean this up?
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

    'getDebtInfo' : function getDebtInfo(uid, property) {
      if (allDebts[uid]) {
        return allDebts[uid][property];
      }
    },

    'getAllDebtInfo' : function getAllDebtInfo() {
      return allDebts;
    },

    'setDebtInfo' : function setDebtInfo(uid, property, amount) {

      if (allDebts[uid]) {
        allDebts[uid][property] = amount;

        // Cache estimated monthly interest rate based on apr
        if (property === 'apr') {
          allDebts[uid].monthlyInterest = ( 1.0 + (amount / 1200.0) );
        }
      }

      publishDebtUpdates(uid, 'update');
    },

    'deleteDebt' : function deleteDebt(uid, test) {

      if (allDebts[uid]) {
        delete allDebts[uid];
      }

      publishDebtUpdates(uid, 'delete');
    },

    'getAllocationMethod' : function getAllocationMethod() {
      return allocationMethod;
    },

    'setAllocationMethod' : function setAllocationMethod() {
      // TODO
    },

    'getPrioritizationMethod' : function getPrioritizationMethod() {
      return prioritizationMethod;
    },

    'setPrioritizationMethod' : function setPrioritizationMethod() {
      // TODO
    },

    'getMonthlyPayments' : function getMonthlyPayments() {
      return monthlyPayments;
    },

    'setMonthlyPayments' : function setMonthlyPayments() {
      // TODO
    },

    // TODO - Cache? Rework?
    'getTotalAmountOwed' : function getTotalAmountOwed() {

      var totalAmountOwed = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          totalAmountOwed += allDebts[debt].amountOwed;
        }
      }

      return totalAmountOwed;
    },

    // TODO - Cache? Rework?
    'getTotalMinimumMonthlyPayment' : function getTotalMinimumMonthlyPayment() {

      var totalMinimumMonthlyPayment = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          totalMinimumMonthlyPayment += allDebts[debt].minimumMonthlyPayment;
        }
      }

      return totalMinimumMonthlyPayment;
    },

    'getPayoffTime' : function getPayoffTime() {
      return payoffTime;
    }
  };

}());


