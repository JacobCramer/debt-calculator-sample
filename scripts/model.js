
// JSHint directive
/* global define */

define((function model(undefined){
  'use strict';

  var config = {
    // Limit how many months the repayment calculator will max out on
    'monthLimit' : 1200
  };

  var allDebts = {};
  var monthlyPayments = 0.0;
  var customDebtOrder = {};

  var totalAmountOwed = 0.0;
  var totalMinimumMonthlyPayment = 0.0;
  var payoffTime;

  var subscribers = [];

  var usedUids = {};

  var prioritizationMethods = {
    'HIGHEST_APR' : 'HIGHEST_APR',
    'LOWEST_OWED' : 'LOWEST_OWED',
    'CUSTOM' : 'CUSTOM'
  };
  var prioritizationMethod = prioritizationMethods.HIGHEST_APR;

  var allocationMethods = {
    'EVEN_SPLIT' : 'EVEN_SPLIT',
    'PRIORITY_FIRST' : 'PRIORITY_FIRST',
    'PROPORTIONAL_SPLIT' : 'PROPORTIONAL_SPLIT'
  };
  var allocationMethod = allocationMethods.EVEN_SPLIT;

  var publishTypes = {
    'ADD_DEBT' : 'ADD_DEBT',
    'UPDATE_DEBT' : 'UPDATE_DEBT',
    'DELETE_DEBT' : 'DELETE_DEBT',
    'ALLOCATION_METHOD' : 'ALLOCATION_METHOD',
    'PRIORITIZATION_METHOD' : 'PRIORITIZATION_METHOD',
    'MONTHLY_PAYMENTS' : 'MONTHLY_PAYMENTS',
    'TOTAL_AMOUNT_OWED' : 'TOTAL_AMOUNT_OWED',
    'TOTAL_MINIMUM_MONTHLY_PAYMENT' : 'TOTAL_MINIMUM_MONTHLY_PAYMENT',
    'PAYOFF_TIME' : 'PAYOFF_TIME'
  };

  var Debt = function Debt(uid) {
    this.uid = uid;
  };
  Debt.prototype.apr = 0.0;
  Debt.prototype.monthlyInterest = 1.0;
  Debt.prototype.amountOwed = 0.0;
  Debt.prototype.minimumMonthlyPayment = 0.0;

  var init = function init(){
    newDebt();
  };

  var newDebt = function newDebt() {

    var uid = getNewUid();

    allDebts[uid] = new Debt(uid);
    publish(publishTypes.ADD_DEBT, {'uid':uid});
    propagateAddedDebt(uid);
  };

  var emptyDebtExists = function emptyDebtExists() {

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt)) {

        var debtObject = allDebts[debt];

        if (!debtObject.hasOwnProperty('apr') &&
            !debtObject.hasOwnProperty('amountOwed') &&
            !debtObject.hasOwnProperty('minimumMonthlyPayment')) {
          return true;
        }
      }
    }

    return false;
  };

  var debtProprtyIsValid = function debtProprtyIsValid(property) {

    switch (property) {
      case 'apr':
      case 'amountOwed':
      case 'minimumMonthlyPayment':
        return true;
      default:
        return false;
    }
  };

  var propagateAddedDebt = function propagateAddedDebt(uid) {

    var highestRank = 0;

    for (var orderUid in customDebtOrder) {
      if (customDebtOrder.hasOwnProperty(orderUid)) {
        highestRank = Math.max(customDebtOrder[orderUid], highestRank);
      }
    }

    customDebtOrder[uid] = highestRank + 1;
  };

  var propagateDebtChange = function propagateDebtChange(uid, property) {

    switch(property) {

      case 'apr':
        // Cache estimated monthly interest rate based on apr
        allDebts[uid].monthlyInterest = ( 1.0 + (allDebts[uid].apr / 1200.0) );

        // Payoff time is unaffected if there's no amount owed
        // No sense recalculating something that won't change
        if (allDebts[uid].amountOwed > 0.0) {
          calculatePayoffTime();
        }
        break;

      case 'minimumMonthlyPayment':
        calculateTotalMinimumMonthlyPayment();

        // Payoff time is unaffected if there's no amount owed
        // No sense recalculating something that won't change
        if (allDebts[uid].amountOwed > 0.0) {
          calculatePayoffTime();
        }
        break;

      case 'amountOwed':
        calculateTotalAmountOwed();
        calculatePayoffTime();
        break;
    }

    // If no fully empty debt exists, create one
    if (!emptyDebtExists()) {
      newDebt();
    }
  };

  var propagateDeletedDebt = function propagateDeletedDebt(uid) {
    calculateTotalAmountOwed();
    calculateTotalMinimumMonthlyPayment();
    calculatePayoffTime();

    // If no fully empty debt exists, create one
    if (!emptyDebtExists()) {
      newDebt();
    }
  };

  var propagateAllocationChange = function propagateAllocationChange() {
    calculatePayoffTime();
  };

  var propagatePrioritizationChange = function propagatePrioritizationChange() {
    calculatePayoffTime();
  };

  var propagateMonthlyPaymentChange = function propagateMonthlyPaymentChange() {
    calculatePayoffTime();
  };

  var propagateTotalOwedChange = function propagateTotalOwedChange() {

    // This may have been changed because of the new limits
    var newMonthlyPayments = getLimitedMonthlyPayments(monthlyPayments);

    newMonthlyPayments = roundToTwoDecimals(newMonthlyPayments);

    // No need to do anything if it's exactly the same
    if (monthlyPayments === newMonthlyPayments) {
      return;
    }

    monthlyPayments = newMonthlyPayments;
    publish(publishTypes.MONTHLY_PAYMENTS, {'payments':newMonthlyPayments});
    propagateMonthlyPaymentChange();
  };

  var propagateTotalMinimumPaymentChange = function propagateTotalMinimumPaymentChange() {

    // This may have been changed because of the new limits
    var newMonthlyPayments = getLimitedMonthlyPayments(monthlyPayments);

    newMonthlyPayments = roundToTwoDecimals(newMonthlyPayments);

    // No need to do anything if it's exactly the same
    if (monthlyPayments === newMonthlyPayments) {
      return;
    }

    monthlyPayments = newMonthlyPayments;
    publish(publishTypes.MONTHLY_PAYMENTS, {'payments':newMonthlyPayments});
    propagateMonthlyPaymentChange();
  };

  var getLimitedMonthlyPayments = function getLimitedMonthlyPayments(requestedMonthlyPayments) {

    // Sanity check. These amounts are not invalid, but they art illogical.
    if (requestedMonthlyPayments < totalMinimumMonthlyPayment) {
      requestedMonthlyPayments = totalMinimumMonthlyPayment;
    }

    return requestedMonthlyPayments;
  };

  var publish = function publish(publishType, publishData) {

    var data = JSON.stringify({
      'type' : publishType,
      'data' : publishData
    });

    // Ensure this is a valid publish type
    if (!publishTypes.hasOwnProperty(publishType)) {
      throw new Error('publish(): ' +
          'Invalid publishType: ' + publishType);
    }

    for (var i = 0; i < subscribers.length; i++) {
      subscribers[i](data);
    }
  };

  var calculateTotalAmountOwed = function calculateTotalAmountOwed() {

      var total = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          total += allDebts[debt].amountOwed;
        }
      }

      totalAmountOwed = total;
      publish(publishTypes.TOTAL_AMOUNT_OWED, {'total':total});
      propagateTotalOwedChange();
  };

  var calculateTotalMinimumMonthlyPayment = function calculateTotalMinimumMonthlyPayment() {

      var total = 0.0;

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          total += allDebts[debt].minimumMonthlyPayment;
        }
      }

      totalMinimumMonthlyPayment = total;
      publish(publishTypes.TOTAL_MINIMUM_MONTHLY_PAYMENT, {'total':total});
      propagateTotalMinimumPaymentChange();
  };

  var getSortedDebts = function getSortedDebts() {

    var sortedDebts = [];

    for (var debt in allDebts) {
      if (allDebts.hasOwnProperty(debt) && allDebts[debt].amountOwed > 0.0) {
        sortedDebts.push({
          debtObject : allDebts[debt],
          remainingOwed : allDebts[debt].amountOwed
        });
      }
    }

    switch(prioritizationMethod) {

      case prioritizationMethods.HIGHEST_APR:
        sortedDebts.sort(sortByApr);
        break;

      case prioritizationMethods.LOWEST_OWED:
        sortedDebts.sort(sortByAmountOwed);
        break;

      case prioritizationMethods.CUSTOM:
        sortedDebts.sort(sortByCustomOrder);
        break;

      default:
        throw new Error('getSortedDebts(): ' +
            'Bad prioritizationMethod: ' + prioritizationMethod);
    }

    return sortedDebts;
  };

  // getSortedDebts helper function
  var sortByApr = function sortByApr(a, b) {
    // b - a results in highest first sorting
    return b.debtObject.apr - a.debtObject.apr;
  };

  // getSortedDebts helper function
  var sortByAmountOwed = function sortByAmountOwed(a, b) {
    // a - b results in lowest first sorting
    return a.debtObject.amountOwed - b.debtObject.amountOwed;
  };

  // getSortedDebts helper function
  var sortByCustomOrder = function sortByCustomOrder(a, b) {
    var aUid = a.debtObject.uid;
    var bUid = b.debtObject.uid;
    // a - b results in lowest first sorting
    return customDebtOrder[aUid] - customDebtOrder[bUid];
  };


  var calculatePayoffTime = function calculatePayoffTime() {

    // Don't even bother calculating if we're not paying
    if (monthlyPayments === 0) {
      payoffTime = 0;
      publish(publishTypes.PAYOFF_TIME, {'months':0});
    }

    var i, orderedDebts, debt, payment, surplus, remaining;

    orderedDebts = getSortedDebts();

    var months = 0;
    while (orderedDebts.length > 0 && months < config.monthLimit) {

      // Track how many months of paying this will take
      months++;

      // Calculate interest
      for (i = 0; i < orderedDebts.length; i++) {
        debt = orderedDebts[i];
        debt.remainingOwed *= debt.debtObject.monthlyInterest;
        debt.remainingOwed = roundToTwoDecimals(debt.remainingOwed);
      }

      // Determine surplus over monthly minimum, if any
      var currentMonthlyMinimum = 0.0;
      for (i = 0; i < orderedDebts.length; i++) {
        currentMonthlyMinimum += orderedDebts[i].debtObject.minimumMonthlyPayment;
      }
      surplus = Math.max(monthlyPayments - currentMonthlyMinimum, 0.0);

      // Handle minimum monthly payments first
      // Looping backwards makes array object deletion logic cleaner
      for (i = orderedDebts.length; i--; ) {
        debt = orderedDebts[i];

        payment = debt.debtObject.minimumMonthlyPayment;
        remaining = debt.remainingOwed;

        if (remaining < payment) {
          surplus += (payment - remaining);
          orderedDebts.splice(i, 1);
        } else {
          debt.remainingOwed -= payment;
        }
      }

      while (surplus > 0.0 && orderedDebts.length) {

        // Out-of-loop surplus payment information setup
        switch (allocationMethod) {

          case allocationMethods.EVEN_SPLIT:
            payment = roundToTwoDecimals(surplus / orderedDebts.length);
            surplus = 0.0;
            break;

          case allocationMethods.PRIORITY_FIRST:
            // Nothing to do here
            break;

          case allocationMethods.PROPORTIONAL_SPLIT:
            var fundsAvailableTotal = surplus;
            var fundsAvailableRemaining = surplus;

            var totalAmountRemaining = 0.0;
            for (i = 0; i < orderedDebts.length; i++) {
              totalAmountRemaining += orderedDebts[i].remainingOwed;
            }

            surplus = 0.0;
            break;

          default:
            throw new Error('calculatePayoffTime(): ' +
                'Bad allocationMethod: ' + allocationMethod);
        }


        // Main payment loop
        for (i = 0; i < orderedDebts.length; i++) {
          debt = orderedDebts[i];

          // In-loop surplus payment information setup
          switch (allocationMethod) {

            case allocationMethods.EVEN_SPLIT:
              // Nothing to do here
              break;

            case allocationMethods.PRIORITY_FIRST:
              payment = surplus;
              surplus = 0.0;
              break;

            case allocationMethods.PROPORTIONAL_SPLIT:
              remaining = debt.remainingOwed;
              payment = fundsAvailableTotal * (remaining/totalAmountRemaining);
              payment = roundToTwoDecimals(payment);
              payment = Math.min(payment, fundsAvailableRemaining);
              fundsAvailableRemaining -= payment;
              break;

            default:
              throw new Error('calculatePayoffTime(): ' +
                  'Bad allocationMethod: ' + allocationMethod);
          }

          // If the payment is more than owed, add the extra to surplus
          surplus += Math.max(payment - debt.remainingOwed, 0.0);

          // Pay the debt
          debt.remainingOwed = Math.max(debt.remainingOwed - payment, 0.0);
        }

        // Remove debts that are fully paid
        deletePaidTemporaryDebts(orderedDebts);
      }
    }

    // Save the time it will take to payoff debts
    payoffTime = months;
    publish(publishTypes.PAYOFF_TIME, {'months':months});
  };

  var deletePaidTemporaryDebts = function deletePaidTemporaryDebts(debts) {
    // Looping backwards makes array object deletion logic cleaner
    for (var i = debts.length; i--; ) {
      if (debts[i].remainingOwed <= 0.0) {
        debts.splice(i, 1);
      }
    }
  };

  var getNewUid = function getNewUid() {
    var counter = 0;
    var limit = 10000000;

    // There's no reason this should ever happen. Ever. But just in case...
    while (counter < limit) {
      var newUid = Math.random().toString(36).substr(2,9);
      if (!usedUids.hasOwnProperty(newUid)) {
        usedUids[newUid] = true;
        return newUid;
      }
    }

    throw new Error ('getNewUid(): ' +
      'Failed over ' + limit + ' times to find a new unique id. ' +
      'Statistically, this makes no sense. Something\'s broken.');
  };

  var roundToTwoDecimals = function roundToTwoDecimals(num) {
      return +(Math.round(num + 'e+2')  + 'e-2');
  };

  // Initial setup
  init();

  return {
    'subscribeToDataUpdates' : function subscribeToDataUpdates(callback) {

      if (typeof callback !== 'function') {
        throw new Error('subscribeToDataUpdates(): ' +
            'Invalid callback: ' + callback);
      }

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

    'getAllDebtIds' : function getAllDebtIds() {

      var debtIds = [];

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          debtIds.push(debt);
        }
      }

      return debtIds;
    },

    'getDebtInfo' : function getDebtInfo(uid, property) {

      if (allDebts[uid]) {
        if (allDebts[uid].hasOwnProperty(property)) {
          return allDebts[uid][property];
        } else {
          return undefined;
        }
      } else {
        return null;
      }
    },

    'setDebtInfo' : function setDebtInfo(uid, property, amount) {

      if (!debtProprtyIsValid(property)) {
        throw new Error('setDebtInfo(): ' +
            'Invalid property: ' + property);
      }

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setDebtInfo(): ' +
            'Invalid amount: ' + amount);
      }

      if (allDebts[uid]) {

        if(property === 'amountOwed' || property === 'minimumMonthlyPayment') {
          amount = roundToTwoDecimals(amount);
        }

        // No need to do anything if it's exactly the same
        if (allDebts[uid][property] === amount) {
          return;
        }

        allDebts[uid][property] = amount;

        var publishData = {
          'uid' : uid,
          'property' : property,
          'amount' : amount
        };
        publish(publishTypes.UPDATE_DEBT, publishData);

        propagateDebtChange(uid, property);
      }
    },

    'deleteDebt' : function deleteDebt(uid, test) {

      if (allDebts[uid]) {
        delete allDebts[uid];
        publish(publishTypes.DELETE_DEBT, {'uid':uid});
        propagateDeletedDebt(uid);
      }
    },

    'getAllocationMethod' : function getAllocationMethod() {
      return allocationMethod;
    },

    'setAllocationMethod' : function setAllocationMethod(method) {

      // No need to do anything if it's exactly the same
      if (allocationMethod === method) {
        return;
      }

      switch(method) {
        case allocationMethods.EVEN_SPLIT:
        case allocationMethods.PRIORITY_FIRST:
        case allocationMethods.PROPORTIONAL_SPLIT:
          allocationMethod = method;
          publish(publishTypes.ALLOCATION_METHOD, {'method':method});
          propagateAllocationChange();
          break;
        default:
          throw new Error('setAllocationMethod(): ' +
              'Invalid method: ' + method);
      }
    },

    'getPrioritizationMethod' : function getPrioritizationMethod() {
      return prioritizationMethod;
    },

    'setPrioritizationMethod' : function setPrioritizationMethod(method) {

      // No need to do anything if it's exactly the same
      if (prioritizationMethod === method) {
        return;
      }

      switch(method) {
        case prioritizationMethods.HIGHEST_APR:
        case prioritizationMethods.LOWEST_OWED:
        case prioritizationMethods.CUSTOM:
          prioritizationMethod = method;
          publish(publishTypes.PRIORITIZATION_METHOD, {'method':method});
          propagatePrioritizationChange();
          break;
        default:
          throw new Error('setPrioritizationMethod(): ' +
              'Invalid method: ' + method);
      }
    },

    'getMonthlyPayments' : function getMonthlyPayments() {
      return monthlyPayments;
    },

    'setMonthlyPayments' : function setMonthlyPayments(newMonthlyPayments) {

      if (typeof newMonthlyPayments !== 'number' || newMonthlyPayments < 0.0) {
        throw new Error('setMonthlyPayments(): ' +
            'Invalid newMonthlyPayments: ' + newMonthlyPayments);
      }

      newMonthlyPayments = getLimitedMonthlyPayments(newMonthlyPayments);

      newMonthlyPayments = roundToTwoDecimals(newMonthlyPayments);

      // No need to do anything if it's exactly the same
      if (monthlyPayments === newMonthlyPayments) {
        return;
      }

      monthlyPayments = newMonthlyPayments;
      publish(publishTypes.MONTHLY_PAYMENTS, {'payments':newMonthlyPayments});
      propagateMonthlyPaymentChange();
    },

    'getCustomDebtOrder' : function getCustomDebtOrder() {

      var sortedDebtArray = [];

      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          sortedDebtArray.push(allDebts[debt].uid);
        }
      }

      sortedDebtArray.sort(function customOrderSort(a, b) {
        // a - b results in lowest first sorting
        return customDebtOrder[a] - customDebtOrder[b];
      });

      return sortedDebtArray;
    },

    'setCustomDebtOrder' : function setCustomDebtOrder(requestedOrder) {

      var i, uid;

      // requestedOrder must be an array
      if (Object.prototype.toString.call(requestedOrder) !== '[object Array]') {
        throw new Error('setCustomDebtOrder(): ' +
          'Invalid requestedOrder: ' + requestedOrder);
      }

      // Track what debt uids we have not covered yet
      var availableUids = {};
      for (var debt in allDebts) {
        if (allDebts.hasOwnProperty(debt)) {
          availableUids[debt] = true;
        }
      }

      // Save the previous order in case not all items are defined
      var previousOrder = customDebtOrder;

      // Create a tracker for our new order
      var newOrder = [];

      // Copy over the requested order, filtering by available uids
      for (i = 0; i < requestedOrder.length; i++) {
        uid = requestedOrder[i];

        if (availableUids[uid]) {
          newOrder.push(uid);
          availableUids[uid] = false;
        }
      }

      // For sanity's sake, find missing uids to place at the end of the list
      // We'll be maintaining the order they had previously
      // Ideally, this will never be necessary, but we're being forgiving here
      var missedUids = [];
      for (uid in availableUids) {
        if (availableUids.hasOwnProperty(uid) && availableUids[uid]) {
          missedUids[previousOrder[uid]] = uid;
          availableUids[uid] = false;
        }
      }

      // Finally, convert these arrays to the internally used format
      // i.d. {uid : order, uid : order, ...}
      var newOrderObject = {};
      var counter = 0;

      for (i = 0; i < newOrder.length; i++) {
        uid = newOrder[i];
        newOrderObject[uid] = i;
        counter++;
      }

      for (i = 0; i < missedUids.length; i++) {
        if (missedUids[i] !== undefined) {
          uid = missedUids[i];
          newOrderObject[uid] = counter;
          counter++;
        }
      }

      customDebtOrder = newOrderObject;
    },

    'getTotalAmountOwed' : function getTotalAmountOwed() {
      return totalAmountOwed;
    },

    'getTotalMinimumMonthlyPayment' : function getTotalMinimumMonthlyPayment() {
      return totalMinimumMonthlyPayment;
    },

    'getPayoffTime' : function getPayoffTime() {
      return payoffTime;
    }
  };

}()));


