
var koratDragonDen = koratDragonDen || {};
koratDragonDen.debtCalculatorSample = koratDragonDen.debtCalculatorSample || {};

// TODO - Rename functions/variables?
// TODO - Add a drag functionality?
// TODO - Add disclaimer?
// TODO - Add some sort of loading screen?
koratDragonDen.debtCalculatorSample.view = (function view(undefined){
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

      var paymentInput = document.createElement('input');
      paymentInput.type = 'range';
      paymentInput.min = '0';
      paymentInput.max = '100';
      paymentInput.addEventListener('change', requestSetMonthlyPayment);
      paymentsDiv.appendChild(paymentInput);
      domCache.paymentInput = paymentInput;

    var payoffTimeDiv = document.createElement('div');
    documentFragment.appendChild(payoffTimeDiv);

      var payoffMessageP = document.createElement('p');
      payoffMessageP.innerHTML = 'Please enter debts above.';
      payoffTimeDiv.appendChild(payoffMessageP);
      domCache.payoffMessageP = payoffMessageP;

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

    domCache[uid] = {};

    var tr = document.createElement('tr');
    tr.id = uid;
    domCache[uid].container = tr;

    var tdDelete = document.createElement('td');
    var buttonDelete = document.createElement('button');
    buttonDelete.innerHTML = 'Delete';
    buttonDelete.dataset.uid = uid;
    buttonDelete.addEventListener('click', requestSetDeleteDebt);
    tdDelete.appendChild(buttonDelete);

    var tdAPR = document.createElement('td');
    var inputAPR = document.createElement('input');
    inputAPR.type = 'number';
    inputAPR.placeholder = 'APR';
    inputAPR.min = '0';
    inputAPR.dataset.uid = uid;
    inputAPR.dataset.property = 'apr';
    inputAPR.addEventListener('input', requestSetDebtInfo);
    tdAPR.appendChild(inputAPR);
    domCache[uid].aprInput = inputAPR;

    var tdAmountOwed = document.createElement('td');
    var inputAmountOwed = document.createElement('input');
    inputAmountOwed.type = 'number';
    inputAmountOwed.placeholder = 'Amount Owed';
    inputAmountOwed.min = '0';
    inputAmountOwed.dataset.uid = uid;
    inputAmountOwed.dataset.property = 'amountOwed';
    inputAmountOwed.addEventListener('input', requestSetDebtInfo);
    tdAmountOwed.appendChild(inputAmountOwed);
    domCache[uid].amountOwedInput = inputAmountOwed;

    var tdMinimumMonthly = document.createElement('td');
    var inputMinimumMonthly = document.createElement('input');
    inputMinimumMonthly.type = 'number';
    inputMinimumMonthly.placeholder = 'Minimum Monthly Payment';
    inputMinimumMonthly.min = '0';
    inputMinimumMonthly.dataset.uid = uid;
    inputMinimumMonthly.dataset.property = 'minimumMonthly';
    inputMinimumMonthly.addEventListener('input', requestSetDebtInfo);
    tdMinimumMonthly.appendChild(inputMinimumMonthly);
    domCache[uid].monthlyMinimumInput = inputMinimumMonthly;

    tr.appendChild(tdDelete);
    tr.appendChild(tdAPR);
    tr.appendChild(tdAmountOwed);
    tr.appendChild(tdMinimumMonthly);

    document.getElementById('debtTable').appendChild(tr);
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

      if (domCache[uid]) {

        switch(property) {
          case 'apr':
            elem = domCache[uid].aprInput;
            break;

          case 'monthly':
            elem = domCache[uid].monthlyMinimumInput;
            break;

          case 'owed':
            elem = domCache[uid].amountOwedInput;
            break;

          default:
            throw new Error('updateDebt(): ' +
              'Invalid property: ' + property);
        }

        elem.value = amount;
      }
    },

    'deleteDebt' : function deleteDebt(uid) {

      if (domCache[uid]) {
        var elem = domCache[uid].container;
        elem.parentNode.removeChild(elem);
        delete domCache[uid];
      }
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
            domCache.allocationSelect.selectedIndex = '0';
            break;

          case 'owed':
            domCache.allocationSelect.selectedIndex = '1';
            break;

          case 'custom':
            domCache.allocationSelect.selectedIndex = '2';
            break;

          default:
            throw new Error('setAllocationMethod(): ' +
              'Invalid method: ' + method);
        }
      }
    },

    'setMonthlyPayments' : function setMonthlyPayments(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setMonthlyPayments(): ' +
            'Invalid amount: ' + amount);
      }

      // TODO - Do we need to protect against illogical settings?
      if (domCache.paymentInput) {
        domCache.paymentInput.value = amount;
      }
    },

    'setTotalAmountOwed' : function setTotalAmountOwed(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalAmountOwed(): ' +
            'Invalid amount: ' + amount);
      }

      // Set the upper limit on the slider
      if (domCache.paymentInput) {
        domCache.paymentInput.max = amount;
      }
    },

    'setTotalMinimumMonthlyPayment' : function setTotalMinimumMonthlyPayment(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalMinimumMonthlyPayment(): ' +
            'Invalid amount: ' + amount);
      }

      // Set the lower limit on the slider
      if (domCache.paymentInput) {
        domCache.paymentInput.min = amount;
      }
    },

    'setPayoffTime' : function setPayoffTime(months) {

      if (typeof months !== 'number' || months < 0.0) {
        throw new Error('setPayoffTime(): ' +
            'Invalid months: ' + months);
      }

      // TODO - Make better good grammars
      if (domCache.payoffMessageP) {
        domCache.payoffMessageP.innerHTML = 'It will take roughly ' +
            months + ' months for you to pay off all your debts.';
      }
    }
  };
}());








