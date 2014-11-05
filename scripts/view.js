
// JSHint directive
/* global define */

define('view', ['jquery', 'jquery.splendid.textchange'],
      function view($, jQuerySplendid, undefined){
  'use strict';

  var config = {
    'programContainerId' : 'debtContainer'
  };

  var subscribers = [];

  var totalMinimum = 0.0;

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

  var addListener = function addListener(elem, type, callback) {

    if (elem.addEventListener) {
      // Modern browsers
      elem.addEventListener(type, callback);
    } else if (elem.attachEvent) {
      // IE8 and other old browsers
      elem.attachEvent('on' + type, callback);
    }
  };

  var init = function init() {

    var programContainer = document.getElementById(config.programContainerId);

    if (programContainer === undefined) {
      throw new Error('init(): ' +
          'getElementById could not find "' + config.programContainerId + '"!' +
          'Please ensure an element with this id exists on your page.');
    }

    var documentFragment = document.createDocumentFragment();

    var titleHeader = document.createElement('header');
    titleHeader.innerHTML = 'Debt Repayment Calculator';
    documentFragment.appendChild(titleHeader);

    var instructionsP = document.createElement('p');
    instructionsP.innerHTML = 'Enter the amount owed, APR, and minimum ' +
        'monthly payment for each debt.';
    instructionsP.className = 'instructionsP';
    documentFragment.appendChild(instructionsP);

    var debtTable = document.createElement('table');
    debtTable.className = 'debtTable';
    documentFragment.appendChild(debtTable);
    domCache.debtTable = debtTable;

      var headerTr = document.createElement('tr');
      headerTr.className = 'headerTr';
      debtTable.appendChild(headerTr);

        var deleteHeaderTr = document.createElement('th');
        deleteHeaderTr.innerHTML = '';
        deleteHeaderTr.className = 'deleteHeader';
        headerTr.appendChild(deleteHeaderTr);

        var owedHeaderTr = document.createElement('th');
        owedHeaderTr.innerHTML = 'Owed';
        owedHeaderTr.className = 'inputHeader';
        headerTr.appendChild(owedHeaderTr);

        var aprHeaderTr = document.createElement('th');
        aprHeaderTr.innerHTML = 'APR';
        aprHeaderTr.className = 'inputHeader';
        headerTr.appendChild(aprHeaderTr);

        var monthlyTR = document.createElement('th');
        monthlyTR.innerHTML = 'Monthly';
        monthlyTR.className = 'inputHeader';
        headerTr.appendChild(monthlyTR);

    var totalsDiv = document.createElement('div');
    documentFragment.appendChild(totalsDiv);

      var totalOwedP = document.createElement('p');
      totalOwedP.innerHTML = 'Total owed:';
      totalsDiv.appendChild(totalOwedP);

        var totalOwedSpan = document.createElement('span');
        totalOwedSpan.innerHTML = '0.00';
        totalOwedP.appendChild(totalOwedSpan);
        domCache.totalOwedSpan = totalOwedSpan;

    var selectsContainerDiv = document.createElement('div');
    selectsContainerDiv.className = 'selectsContainerDiv';
    documentFragment.appendChild(selectsContainerDiv);

      var selectInstructionsP = document.createElement('p');
      selectInstructionsP.className = 'selectInstructionsP';
      selectsContainerDiv.appendChild(selectInstructionsP);

      var allocationDiv = document.createElement('div');
      allocationDiv.className = 'allocationDiv';
      selectsContainerDiv.appendChild(allocationDiv);

        var allocationP = document.createElement('p');
        allocationP.innerHTML = 'Allocation';
        allocationDiv.appendChild(allocationP);

        var allocationSelect = document.createElement('select');
        addListener(allocationSelect, 'change', requestSetAllocationMethod);
        allocationDiv.appendChild(allocationSelect);
        domCache.allocationSelect = allocationSelect;

          var priorityOption = document.createElement('option');
          priorityOption.innerHTML = 'Priority first';
          priorityOption.value = 'priority';
          allocationSelect.appendChild(priorityOption);

          var evenOption = document.createElement('option');
          evenOption.innerHTML = 'Even split';
          evenOption.value = 'even';
          allocationSelect.appendChild(evenOption);

          var proportionalOption = document.createElement('option');
          proportionalOption.innerHTML = 'Proportional split';
          proportionalOption.value = 'proportional';
          allocationSelect.appendChild(proportionalOption);

      var prioritizationDiv = document.createElement('div');
      prioritizationDiv.className = 'prioritizationDiv';
      selectsContainerDiv.appendChild(prioritizationDiv);

        var prioritizationP = document.createElement('p');
        prioritizationP.innerHTML = 'Prioritization';
        prioritizationDiv.appendChild(prioritizationP);

        var prioritizationSelect = document.createElement('select');
        addListener(prioritizationSelect, 'change', requestSetPriorityMethod);
        prioritizationDiv.appendChild(prioritizationSelect);
        domCache.prioritizationSelect = prioritizationSelect;

          var aprOption = document.createElement('option');
          aprOption.innerHTML = 'Highest APR';
          aprOption.value = 'apr';
          prioritizationSelect.appendChild(aprOption);

          var owedOption = document.createElement('option');
          owedOption.innerHTML = 'Lowest owed';
          owedOption.value = 'owed';
          prioritizationSelect.appendChild(owedOption);

          var customOption = document.createElement('option');
          customOption.innerHTML = 'As listed';
          customOption.value = 'custom';
          prioritizationSelect.appendChild(customOption);

    var paymentsDiv = document.createElement('div');
    paymentsDiv.className = 'paymentsDiv';
    documentFragment.appendChild(paymentsDiv);

      var paymentP = document.createElement('p');
      paymentP.innerHTML = 'Monthly Payments';
      paymentP.className = 'paymentP';
      paymentsDiv.appendChild(paymentP);

      var paymentInput = document.createElement('input');
      paymentInput.type = 'text';
      paymentInput.placeholder = 'Enter Here';
      $(paymentInput).keydown(restrictInput);
      $(paymentInput).on('textchange', requestSetMonthlyPayment);
      paymentInput.className = 'paymentInput';
      paymentsDiv.appendChild(paymentInput);
      domCache.paymentInput = paymentInput;

    var payoffTimeDiv = document.createElement('div');
    documentFragment.appendChild(payoffTimeDiv);

      var payoffMessageP = document.createElement('p');
      payoffMessageP.innerHTML = '';
      payoffMessageP.className = 'payoffMessageP';
      payoffTimeDiv.appendChild(payoffMessageP);
      domCache.payoffMessageP = payoffMessageP;

    var disclaimerDiv = document.createElement('div');
    documentFragment.appendChild(disclaimerDiv);

      var disclaimerP = document.createElement('p');
      disclaimerP.innerHTML = 'Disclaimer: Every loan is different. ' +
          'While this tool provides a reasonable estimation, it can not ' +
          'account for all fees, charges, policies, and other possibilities. ' +
          'For a full debt repayment analysis, consult a financial planner.';
      disclaimerP.className = 'disclaimerP';
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

  var getEventElem = function getEventElem(event) {

    // IE8 has its own way of handling things.
    // This should support modern browsers and IE8
    event = event || window.event;
    var eventElem = event.target || event.srcElement;

    return eventElem;
  };

  var requestSetDebtInfo = function requestSetDebtInfo(event) {

    var eventElem = getEventElem(event);

    var publishData = {
      'uid' : eventElem.dataset.uid,
      'property' : eventElem.dataset.property,
      'amount' : eventElem.value
    };

    publish('REQUEST_UPDATE_DEBT', publishData);
  };

  var requestSetDeleteDebt = function requestSetDeleteDebt(event) {

    var eventElem = getEventElem(event);

    var publishData = {
      'uid' : eventElem.dataset.uid
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
    buttonDelete.innerHTML = 'X';
    if (typeof buttonDelete.dataset === 'undefined') {
      buttonDelete.dataset = {};
    }
    buttonDelete.dataset.uid = uid;
    addListener(buttonDelete, 'click', requestSetDeleteDebt);
    buttonDelete.className = 'deleteColumn';
    tdDelete.appendChild(buttonDelete);

    var tdAmountOwed = document.createElement('td');
    var inputAmountOwed = document.createElement('input');
    inputAmountOwed.type = 'text';
    inputAmountOwed.placeholder = 'Owed';
    // inputAmountOwed.min = '0';
    // inputAmountOwed.step = 'any';
    if (typeof inputAmountOwed.dataset === 'undefined') {
      inputAmountOwed.dataset = {};
    }
    inputAmountOwed.dataset.uid = uid;
    inputAmountOwed.dataset.property = 'amountOwed';
    $(inputAmountOwed).keydown(restrictInput);
    $(inputAmountOwed).on('textchange', requestSetDebtInfo);
    inputAmountOwed.className = 'inputColumn';
    tdAmountOwed.appendChild(inputAmountOwed);
    debtCache.amountOwedInput = inputAmountOwed;

    var tdAPR = document.createElement('td');
    var inputAPR = document.createElement('input');
    inputAPR.type = 'text';
    inputAPR.placeholder = 'APR';
    // inputAPR.min = '0';
    // inputAPR.step = 'any';
    if (typeof inputAPR.dataset === 'undefined') {
      inputAPR.dataset = {};
    }
    inputAPR.dataset.uid = uid;
    inputAPR.dataset.property = 'apr';
    $(inputAPR).keydown(restrictInput);
    $(inputAPR).on('textchange', requestSetDebtInfo);
    inputAPR.className = 'inputColumn';
    tdAPR.appendChild(inputAPR);
    debtCache.aprInput = inputAPR;

    var tdMinimumMonthly = document.createElement('td');
    var inputMinimumMonthly = document.createElement('input');
    inputMinimumMonthly.type = 'text';
    inputMinimumMonthly.placeholder = 'Monthly';
    // inputMinimumMonthly.min = '0';
    // inputMinimumMonthly.step = 'any';
    if (typeof inputMinimumMonthly.dataset === 'undefined') {
      inputMinimumMonthly.dataset = {};
    }
    inputMinimumMonthly.dataset.uid = uid;
    inputMinimumMonthly.dataset.property = 'minimumMonthly';
    $(inputMinimumMonthly).keydown(restrictInput);
    $(inputMinimumMonthly).on('textchange', requestSetDebtInfo);
    inputMinimumMonthly.className = 'inputColumn';
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

  var restrictInput = function restrictInput(eventObject) {

    if (keyAddsNoCharacters(eventObject) || keyIsNumber(eventObject)) {
      // Allow numbers and keys that don't add characters to the input
      return;

    } else if (keyIsDecimal(eventObject)) {
      // Prevent multiple decimals
      var eventElem = getEventElem(eventObject);
      var count = (eventElem.value.match(/\./g) || []).length;

      if (count > 0) {
        eventObject.preventDefault();
      }

    } else {
      // Prevent all other input
      eventObject.preventDefault();
    }
  };

  var keyAddsNoCharacters = function keyAddsNoCharacters(eventObject) {

    var keyCode = eventObject.keyCode;
    var validKeys = [
      8, // Backspace
      9, // Tab
      13, // Enter
      27, // Escape
      46, // Delete
      35, // End
      36, // Home
      37, // Left
      38, // Up
      39, // Right
      40 // Down
    ];

    var length = validKeys.length;

    for (var i = 0; i < length; i++) {
      if (keyCode === validKeys[i]) {
        return true;
      }
    }

    return false;
  };

  var keyIsNumber = function keyIsNumber(eventObject) {

    var keyCode = eventObject.keyCode;
    var shift = eventObject.shiftKey;

    // Numbers across the top of the keyboard
    if (!shift && keyCode > 47 && keyCode < 58) {
      return true;
    }

    // Numpad numbers
    if (keyCode > 95 && keyCode < 106){
      return true;
    }

    return false;
  };

  var keyIsDecimal = function keyIsDecimal(eventObject) {

    var keyCode = eventObject.keyCode;
    var shift = eventObject.shiftKey;

    // Period (Near right shift on most US QWERTY keyboards)
    if (!shift && keyCode === 190) {
      return true;
    }

    // Numpad decimal
    if (keyCode === 110) {
      return true;
    }

    return false;
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

        // Don't bother making changes if it would be exactly the same
        if (Number(elem.value).toFixed(2) !== Number(amount).toFixed(2)){
          elem.value = amount;
        }
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
          domCache.paymentInput.value = '';
        } else if (Number(domCache.paymentInput.value).toFixed(2) !== Number(amount).toFixed(2)) {
          domCache.paymentInput.value = amount;
        }
      }
    },

    'setTotalAmountOwed' : function setTotalAmountOwed(amount) {
      // We aren't actually doing anything with this right now

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalAmountOwed(): ' +
            'Invalid amount: ' + amount);
      }

      if (domCache.totalOwedSpan) {
        domCache.totalOwedSpan.innerHTML = amount.toFixed(2);
      }
    },

    'setTotalMinimumMonthlyPayment' : function setTotalMinimumMonthlyPayment(amount) {

      if (typeof amount !== 'number' || amount < 0.0) {
        throw new Error('setTotalMinimumMonthlyPayment(): ' +
            'Invalid amount: ' + amount);
      }

      totalMinimum = amount;

      // if (domCache.totalMinimumSpan) {
      //   domCache.totalMinimumSpan.innerHTML = amount.toFixed(2);
      // }
    },

    'setPayoffTime' : function setPayoffTime(months) {

      if ((typeof months !== 'number' &&
          typeof months !== 'undefined') ||
          months < -1) {
        throw new Error('setPayoffTime(): ' +
            'Invalid months: ' + months);
      }

      var payments;

      if (domCache.paymentInput) {
        payments = Number(domCache.paymentInput.value);
      }

      // if (domCache.totalMinimumSpan) {
      //   minimumPayment = domCache.totalMinimumSpan.innerHTML;
      // }

      if (domCache.payoffMessageP) {

        if (typeof months === 'undefined' || payments === 0) {
          domCache.payoffMessageP.innerHTML = '';

        } else if (months === 0) {
          domCache.payoffMessageP.innerHTML = '';

        } else if (months === -1 && totalMinimum !== 0) {
          domCache.payoffMessageP.innerHTML = 'Be sure to enter an amount ' +
              'at least as high as the total minimum monthly payment of ' +
              totalMinimum + '.';

        } else if (months === 1200) {
          domCache.payoffMessageP.innerHTML = 'By paying ' +
              payments.toFixed(2) + ' every month, it will take over ' +
               '100 years to pay off all of your debts!';

        } else {
          var message = [];
          message.push('By paying ' + payments.toFixed(2) +
              ' every month, it will take roughly ');

          var years = Math.floor(months/12);
          months = months%12;

          if (years === 1) {
            message.push('1 year ');
          } else if (years > 0) {
            message.push(years + ' years ');
          }

          if (years > 0 && months > 0) {
            message.push('and ');
          }

          if (months === 1) {
            message.push('1 month ');
          } else if (months > 0) {
            message.push(months + ' months ');
          }

          message.push('to pay off all of your debts.');

          domCache.payoffMessageP.innerHTML = message.join('');
        }
      }
    }
  };
});








