
// JSHint directive
/* global define */

define((function view(undefined){
  'use strict';

  var config = {
    'programContainerId' : 'debtContainer'
  };

  var subscribers = [];

  var domCache = {
    'debts' : {}
  };

  var publishTypes = {
    'REQUEST_UPDATE_DEBT' : 'REQUEST_UPDATE_DEBT',
    'REQUEST_DELETE_DEBT' : 'REQUEST_DELETE_DEBT',
    'REQUEST_MONTHLY_PAYMENT' : 'REQUEST_MONTHLY_PAYMENT',
    'REQUEST_PRIORITY_METHOD' : 'REQUEST_PRIORITY_METHOD',
    'REQUEST_ALLOCATION_METHOD' : 'REQUEST_ALLOCATION_METHOD'
  };

  var init = function init() {

    var programContainer = document.getElementById(config.programContainerId);

    if (programContainer === undefined) {
      throw new Error('init(): ' +
          'getElementById could not find "' + config.programContainerId + '"!' +
          'Please ensure an element with this id exists on your page.');
    }

    var documentFragment = document.createDocumentFragment();

    var debtTable = document.createElement('table');
    documentFragment.appendChild(debtTable);
    domCache.debtTable = debtTable;

      var headerTr = document.createElement('tr');
      debtTable.appendChild(headerTr);

        var deleteHeaderTr = document.createElement('th');
        deleteHeaderTr.innerHTML = 'Delete Entry';
        headerTr.appendChild(deleteHeaderTr);

        var owedHeaderTr = document.createElement('th');
        owedHeaderTr.innerHTML = 'Amount Owed';
        headerTr.appendChild(owedHeaderTr);

        var aprHeaderTr = document.createElement('th');
        aprHeaderTr.innerHTML = 'APR';
        headerTr.appendChild(aprHeaderTr);

        var monthlyTR = document.createElement('th');
        monthlyTR.innerHTML = 'Minimum Monthly Payment';
        headerTr.appendChild(monthlyTR);

    var allocationDiv = document.createElement('div');
    documentFragment.appendChild(allocationDiv);

      var allocationP = document.createElement('p');
      allocationP.innerHTML = 'How to allocate amount over monthly minimum:';
      allocationDiv.appendChild(allocationP);

      var allocationSelect = document.createElement('select');
      allocationSelect.addEventListener('change', requestSetAllocationMethod);
      allocationDiv.appendChild(allocationSelect);
      domCache.allocationSelect = allocationSelect;

        var priorityOption = document.createElement('option');
        priorityOption.innerHTML = 'Pay to highest priority debt';
        priorityOption.value = 'priority';
        allocationSelect.appendChild(priorityOption);

        var evenOption = document.createElement('option');
        evenOption.innerHTML = 'Split evenly between all debts';
        evenOption.value = 'even';
        allocationSelect.appendChild(evenOption);

        var proportionalOption = document.createElement('option');
        proportionalOption.innerHTML = 'Split proportionally by amount owed';
        proportionalOption.value = 'proportional';
        allocationSelect.appendChild(proportionalOption);

    var prioritizationDiv = document.createElement('div');
    documentFragment.appendChild(prioritizationDiv);

      var prioritizationP = document.createElement('p');
      prioritizationP.innerHTML = 'How to prioritize debts:';
      prioritizationDiv.appendChild(prioritizationP);

      var prioritizationSelect = document.createElement('select');
      prioritizationSelect.addEventListener('change', requestSetPriorityMethod);
      prioritizationDiv.appendChild(prioritizationSelect);
      domCache.prioritizationSelect = prioritizationSelect;

        var aprOption = document.createElement('option');
        aprOption.innerHTML = 'Highest APR first';
        aprOption.value = 'apr';
        prioritizationSelect.appendChild(aprOption);

        var owedOption = document.createElement('option');
        owedOption.innerHTML = 'Lowest amount owed first';
        owedOption.value = 'owed';
        prioritizationSelect.appendChild(owedOption);

        var customOption = document.createElement('option');
        customOption.innerHTML = 'Use order entered by user above';
        customOption.value = 'custom';
        prioritizationSelect.appendChild(customOption);

    var paymentsDiv = document.createElement('div');
    documentFragment.appendChild(paymentsDiv);

      var paymentP = document.createElement('p');
      paymentP.innerHTML = 'How much to pay every month:';
      paymentsDiv.appendChild(paymentP);

      var paymentInput = document.createElement('input');
      paymentInput.type = 'number';
      paymentInput.placeholder = 'Monthly Payments';
      paymentInput.min = '0';
      paymentInput.step = 'any';
      paymentInput.addEventListener('input', requestSetMonthlyPayment);
      paymentsDiv.appendChild(paymentInput);
      domCache.paymentInput = paymentInput;

    var payoffTimeDiv = document.createElement('div');
    documentFragment.appendChild(payoffTimeDiv);

      var payoffMessageP = document.createElement('p');
      payoffMessageP.innerHTML = '';
      payoffTimeDiv.appendChild(payoffMessageP);
      domCache.payoffMessageP = payoffMessageP;

    var disclaimerDiv = document.createElement('div');
    documentFragment.appendChild(disclaimerDiv);

      var disclaimerP = document.createElement('p');
      disclaimerP.innerHTML = 'Disclaimer: Every loan is different. ' +
          'While this tool provides a reasonable estimation, it can not ' +
          'account for all fees, charges, policies, and other possibilities. ' +
          'For a full debt repayment analysis, consult a financial planner.';
      payoffTimeDiv.appendChild(disclaimerP);

    programContainer.innerHTML = '';
    programContainer.appendChild(documentFragment);
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

  var requestSetDebtInfo = function requestSetDebtInfo(event) {

    var changedElement = event.target;

    var publishData = {
      'uid' : changedElement.dataset.uid,
      'property' : changedElement.dataset.property,
      'amount' : changedElement.value
    };

    publish('REQUEST_UPDATE_DEBT', publishData);
  };

  var requestSetDeleteDebt = function requestSetDeleteDebt(event) {

    var changedElement = event.target;

    var publishData = {
      'uid' : changedElement.dataset.uid
    };

    publish('REQUEST_DELETE_DEBT', publishData);
  };

  var requestSetMonthlyPayment = function requestSetMonthlyPayment() {

    var inputElem = domCache.paymentInput;

    var publishData = {
      'amount' : inputElem.value
    };

    publish('REQUEST_MONTHLY_PAYMENT', publishData);
  };

  var requestSetPriorityMethod = function requestSetPriorityMethod() {

    var selectElem = domCache.prioritizationSelect;

    var method = selectElem.options[selectElem.selectedIndex].value;

    var publishData = {
      'method' : method
    };

    publish('REQUEST_PRIORITY_METHOD', publishData);
  };

  var requestSetAllocationMethod = function requestSetAllocationMethod() {

    var selectElem = domCache.allocationSelect;

    var method = selectElem.options[selectElem.selectedIndex].value;

    var publishData = {
      'method' : method
    };

    publish('REQUEST_ALLOCATION_METHOD', publishData);
  };

  var newDebtInput = function newDebtInput(uid) {

    var debtCache = domCache.debts[uid] = {};

    var tr = document.createElement('tr');
    tr.id = uid;
    debtCache.container = tr;

    var tdDelete = document.createElement('td');
    var buttonDelete = document.createElement('button');
    buttonDelete.innerHTML = 'Delete';
    buttonDelete.dataset.uid = uid;
    buttonDelete.addEventListener('click', requestSetDeleteDebt);
    tdDelete.appendChild(buttonDelete);

    var tdAmountOwed = document.createElement('td');
    var inputAmountOwed = document.createElement('input');
    inputAmountOwed.type = 'number';
    inputAmountOwed.placeholder = 'Amount Owed';
    inputAmountOwed.min = '0';
    inputAmountOwed.step = 'any';
    inputAmountOwed.dataset.uid = uid;
    inputAmountOwed.dataset.property = 'amountOwed';
    inputAmountOwed.addEventListener('input', requestSetDebtInfo);
    tdAmountOwed.appendChild(inputAmountOwed);
    debtCache.amountOwedInput = inputAmountOwed;

    var tdAPR = document.createElement('td');
    var inputAPR = document.createElement('input');
    inputAPR.type = 'number';
    inputAPR.placeholder = 'APR';
    inputAPR.min = '0';
    inputAPR.step = 'any';
    inputAPR.dataset.uid = uid;
    inputAPR.dataset.property = 'apr';
    inputAPR.addEventListener('input', requestSetDebtInfo);
    tdAPR.appendChild(inputAPR);
    debtCache.aprInput = inputAPR;

    var tdMinimumMonthly = document.createElement('td');
    var inputMinimumMonthly = document.createElement('input');
    inputMinimumMonthly.type = 'number';
    inputMinimumMonthly.placeholder = 'Minimum Monthly Payment';
    inputMinimumMonthly.min = '0';
    inputMinimumMonthly.step = 'any';
    inputMinimumMonthly.dataset.uid = uid;
    inputMinimumMonthly.dataset.property = 'minimumMonthly';
    inputMinimumMonthly.addEventListener('input', requestSetDebtInfo);
    tdMinimumMonthly.appendChild(inputMinimumMonthly);
    debtCache.monthlyMinimumInput = inputMinimumMonthly;

    tr.appendChild(tdDelete);
    tr.appendChild(tdAmountOwed);
    tr.appendChild(tdAPR);
    tr.appendChild(tdMinimumMonthly);

    if (domCache.debtTable) {
      domCache.debtTable.appendChild(tr);
    } else {
      throw new Error('newDebtInput(): ' +
        'debtTable DOM element mysteriously vanished!');
    }
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

    'addDebt' : function addDebt(uid) {
      newDebtInput(uid);
    },

    'updateDebt' : function updateDebt(uid, property, amount) {

      var elem;

      if (domCache.debts[uid]) {

        switch(property) {
          case 'apr':
            elem = domCache.debts[uid].aprInput;
            break;

          case 'monthly':
            elem = domCache.debts[uid].monthlyMinimumInput;
            break;

          case 'owed':
            elem = domCache.debts[uid].amountOwedInput;
            break;

          default:
            throw new Error('updateDebt(): ' +
              'Invalid property: ' + property);
        }

        elem.value = amount;
      }
    },

    'deleteDebt' : function deleteDebt(uid) {

      if (domCache.debts[uid]) {
        var elem = domCache.debts[uid].container;
        elem.parentNode.removeChild(elem);
        delete domCache.debts[uid];
      }
    },

    'getAllDebts' : function getAllDebts() {

      var allDebts = [];

      for (var debt in domCache.debts) {
        if (domCache.debts.hasOwnProperty(debt)) {
          allDebts.push(debt);
        }
      }

      return allDebts;
    },

    'setAllocationMethod' : function setAllocationMethod(method) {

      if (domCache.allocationSelect) {
        switch(method) {
          case 'priority':
            domCache.allocationSelect.selectedIndex = '0';
            break;

          case 'even':
            domCache.allocationSelect.selectedIndex = '1';
            break;

          case 'proportional':
            domCache.allocationSelect.selectedIndex = '2';
            break;

          default:
            throw new Error('setAllocationMethod(): ' +
              'Invalid method: ' + method);
        }
      }
    },

    'setPriotitizationMethod' : function setPriotitizationMethod(method) {

      if (domCache.prioritizationSelect) {
        switch(method) {
          case 'apr':
            domCache.prioritizationSelect.selectedIndex = '0';
            break;

          case 'owed':
            domCache.prioritizationSelect.selectedIndex = '1';
            break;

          case 'custom':
            domCache.prioritizationSelect.selectedIndex = '2';
            break;

          default:
            throw new Error('setPriotitizationMethod(): ' +
              'Invalid method: ' + method);
        }
      }
    },

    'setMonthlyPayments' : function setMonthlyPayments(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setMonthlyPayments(): ' +
            'Invalid amount: ' + amount);
      }

      if (domCache.paymentInput) {
        if (amount === 0) {
          domCache.paymentInput.value = undefined;
        } else {
          domCache.paymentInput.value = amount;
        }
      }
    },

    'setTotalAmountOwed' : function setTotalAmountOwed(amount) {
      // We aren't actually doing anything with this right now

      /*
      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalAmountOwed(): ' +
            'Invalid amount: ' + amount);
      }
      */
    },

    'setTotalMinimumMonthlyPayment' : function setTotalMinimumMonthlyPayment(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalMinimumMonthlyPayment(): ' +
            'Invalid amount: ' + amount);
      }

      // Set the lower limit on monthly payments
      if (domCache.paymentInput) {
        domCache.paymentInput.min = amount;
      }
    },

    'setPayoffTime' : function setPayoffTime(months) {

      if ((typeof months !== 'number' &&
          typeof months !== 'undefined') ||
          months < 0) {
        throw new Error('setPayoffTime(): ' +
            'Invalid months: ' + months);
      }

      var payments;

      if (domCache.paymentInput) {
        payments = Number(domCache.paymentInput.value);
      }

      if (domCache.payoffMessageP) {

        if (typeof months === 'undefined' || payments === 0) {
          domCache.payoffMessageP.innerHTML = '';

        } else if (months === 0) {
          domCache.payoffMessageP.innerHTML = '';

        } else if (months === 1) {
          domCache.payoffMessageP.innerHTML = 'By paying ' +
              payments.toFixed(2) + ' every month, it will take roughly ' +
            '1 month for you to pay off all of your debts.';

        } else if (months === 1200) {
          domCache.payoffMessageP.innerHTML = 'By paying ' +
              payments.toFixed(2) + ' every month, it will take over ' +
               '100 years for you to pay off all of your debts! ' +
               'You should consider making larger payments.';

        } else {
          domCache.payoffMessageP.innerHTML = 'By paying ' +
              payments.toFixed(2) + ' every month, it will take roughly ' +
              months + ' months for you to pay off all of your debts.';
        }
      }
    }
  };
}()));








