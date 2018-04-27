// ==UserScript==
// @name         Southwest Check-in Companion
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically check-in to your flight
// @author       Ben Parker
// @match        https://www.southwest.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
  'use strict';

  // total attempts to check-in
  const max_attempts = 3;

  // delay (in ms) between check-in attempts
  const attempt_delay = 2000;

  var displayTimeoutId = null;
  var checkInTimeoutId = null;

  window.onload = function() {
    
    // Direct behavior based on which page is loaded
    var url = window.location.href;
    const checkIn = /^https:\/\/www\.southwest\.com\/(\?.+)?[^\/]*$/;
    const success = /southwest.com\/air\/check-in\/review/;
    const error = /southwest.com\/air\/check-in\/index\.html\?.+/;
    const pause = /southwest.com\/air\/check-in\/review.html\?.+/;

    // this redirects to error page
    // https://www.southwest.com/air/check-in/review.html?redirectToVision=true&passengerFirstName=Shawna&passengerLastName=Parker&leapfrogRequest=true&hash=e753c618-6bd5-4ae0-b140-44bff8b0c75d&confirmationNumber=333333
    
    
    // Successful check-in, send via text
    // if (success.test(url)) {
    //   SendBoardingPass();
    // }
    console.log("Initial URL: " + url);
    if (pause.test(url)) {
      setTimeout(waitForURL, 2000);
    }
    else {
      waitForURL();
    }

    function waitForURL() {
      var url = window.location.href;
      if (error.test(url)) {
        console.log("Calling RetryCheckIn() " + url);
        RetryCheckIn();
      }
      else if (checkIn.test(url)) {
        console.log("Calling CheckIn() " + url);
        CheckIn();
      }
    }
  }

  function CheckIn() {
    const now = new Date();
    const checkInPanel = document.getElementsByClassName("booking-form--section check-in--button-container")[0];
    const autoCheckInDiv = document.createElement("div");

    // reset # of retries from local storage
    GM_setValue("attempts", 0);

    // Create date Inputs and Labels
    const dateDivContainer = document.createElement("div");
    dateDivContainer.setAttribute("class", "booking-form--section");

    const dateDiv = document.createElement("div");
    dateDiv.setAttribute("class", "swa-text-input swa-text-input_large booking-form-utilities--confirmation-number-container");

    const dateLabel = document.createElement("label");
    dateLabel.setAttribute("class", "booking-form--label booking-form--top-label error-label");
    dateLabel.setAttribute("for", "month-input");
    dateLabel.innerHTML = "* Date (MM / DD / YYYY)";

    const monthInput = document.createElement("input");
    monthInput.setAttribute('id','month-input');
    monthInput.setAttribute('type','text');
    monthInput.setAttribute('maxlength','2');
    monthInput.setAttribute('size','2');
    monthInput.setAttribute('value',(now.getMonth() + 1).toString().padStart(2, "0"));

    const dayInput = document.createElement("input");
    dayInput.setAttribute('id','day-input');
    dayInput.setAttribute('type','text');
    dayInput.setAttribute('maxlength','2');
    dayInput.setAttribute('size','2');
    dayInput.setAttribute('value',now.getDate().toString().padStart(2, "0"));

    const yearInput = document.createElement("input");
    yearInput.setAttribute('id','year-input');
    yearInput.setAttribute('type','text');
    yearInput.setAttribute('maxlength','4');
    yearInput.setAttribute('size','4');
    yearInput.setAttribute('value',now.getFullYear());

    // Assemble Date section
    dateDiv.appendChild(dateLabel);
    dateDiv.appendChild(monthInput);
    dateDiv.innerHTML += " / ";
    dateDiv.appendChild(dayInput);
    dateDiv.innerHTML += " / ";
    dateDiv.appendChild(yearInput);
    dateDivContainer.appendChild(dateDiv);

    // Create time Inputs and Labels
    const timeDivContainer = document.createElement("div");
    timeDivContainer.setAttribute("class", "booking-form--section");

    const timeDiv = document.createElement("div");
    timeDiv.setAttribute("class", "swa-text-input swa-text-input_large booking-form-utilities--confirmation-number-container");

    const timeLabel = document.createElement("label");
    timeLabel.setAttribute("class", "booking-form--label booking-form--top-label error-label");
    timeLabel.setAttribute("for", "hour-input");
    timeLabel.innerHTML = "* Time (24-hour format)";

    const hourInput = document.createElement("input");
    hourInput.setAttribute("id", "hour-input");
    hourInput.setAttribute("type", "text");
    hourInput.setAttribute("maxlength", "2");
    hourInput.setAttribute("size", "2");
    hourInput.setAttribute("value", now.getHours().toString().padStart(2, "0"));

    const minuteInput = document.createElement("input");
    minuteInput.setAttribute("id", "minute-input");
    minuteInput.setAttribute("type", "text");
    minuteInput.setAttribute("maxlength", "2");
    minuteInput.setAttribute("size", "2");
    minuteInput.setAttribute("value", now.getMinutes().toString().padStart(2, "0"));

    const secondsInput = document.createElement("input");
    secondsInput.setAttribute("id", "second-input");
    secondsInput.setAttribute("type", "text");
    secondsInput.setAttribute("maxlength", "2");
    secondsInput.setAttribute("size", "2");
    secondsInput.setAttribute("value", "04");

    // Assemble Time section
    timeDiv.appendChild(timeLabel);
    timeDiv.appendChild(hourInput);
    timeDiv.innerHTML += " : ";
    timeDiv.appendChild(minuteInput);
    timeDiv.innerHTML += " : ";
    timeDiv.appendChild(secondsInput);
    timeDivContainer.appendChild(timeDiv);

    // Create Phone Number Inputs and Labels
    // Further down we will store the phone number for later use
    const phoneDivContainer = document.createElement("div");
    phoneDivContainer.setAttribute("class", "booking-form--section");

    const phoneDiv = document.createElement("div");
    phoneDiv.setAttribute("id", "phoneDiv");
    phoneDiv.setAttribute("class", "swa-text-input swa-text-input_large booking-form-utilities--confirmation-number-container");

    const phoneLabel = document.createElement("label");
    phoneLabel.setAttribute("class", "booking-form--label booking-form--top-label error-label");
    phoneLabel.innerHTML = "* Boarding pass text number";

    const phoneArea = document.createElement("input");
    phoneArea.setAttribute("id", "phoneArea");
    phoneArea.setAttribute("type", "text");
    phoneArea.setAttribute("maxlength", "3");
    phoneArea.setAttribute("size", "3");

    const phonePrefix = document.createElement("input");
    phonePrefix.setAttribute("id", "phonePrefix");
    phonePrefix.setAttribute("type", "text");
    phonePrefix.setAttribute("maxlength", "3");
    phonePrefix.setAttribute("size", "3");

    const phoneNumber = document.createElement("input");
    phoneNumber.setAttribute("id", "phoneNumber");
    phoneNumber.setAttribute("type", "text");
    phoneNumber.setAttribute("maxlength", "4");
    phoneNumber.setAttribute("size", "4");

    // Assemble Phone Number inputs
    phoneDiv.appendChild(phoneLabel);
    phoneDiv.innerHTML += "(";
    phoneDiv.appendChild(phoneArea);
    phoneDiv.innerHTML += ") ";
    phoneDiv.appendChild(phonePrefix);
    phoneDiv.innerHTML += "-";
    phoneDiv.appendChild(phoneNumber);
    phoneDivContainer.appendChild(phoneDiv);

    // Create Auto Check-in button
    const buttonDiv = document.createElement("div");
    buttonDiv.setAttribute("class", "booking-form--section check-in--button-container");
    buttonDiv.setAttribute("style", "margin-top: 7px; width: 120px;");

    const autoCheckInButton = document.createElement("button");
    autoCheckInButton.setAttribute("id", "auto-checkin-button");
    autoCheckInButton.setAttribute("class", "swa-button swa-button_primary");
    autoCheckInButton.setAttribute("style","background-color: #304cb2; color: white; width: 120px;");
    autoCheckInButton.setAttribute("type", "button");
    autoCheckInButton.addEventListener("click", startCountdown, true);
    autoCheckInButton.innerHTML = "Auto Check in";

    const countdown = document.createElement("div");
    countdown.setAttribute("id", "countdown-div");

    // Assemble button div
    buttonDiv.appendChild(autoCheckInButton);
    buttonDiv.appendChild(countdown);
    
    autoCheckInDiv.appendChild(dateDivContainer);
    autoCheckInDiv.appendChild(timeDivContainer);
    autoCheckInDiv.appendChild(phoneDivContainer);
    autoCheckInDiv.appendChild(buttonDiv);

    checkInPanel.parentNode.insertBefore(autoCheckInDiv, checkInPanel.nextSibling);

    function startCountdown(event) {
        const confirmationNumber = document.getElementById("confirmationNumber").value;
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const phoneDiv = document.getElementById("phoneDiv")
        var errors = [];

        const countdownDiv = document.getElementById("countdown-div");
        const month = parseInt(document.getElementById("month-input").value) - 1;
        const day = parseInt(document.getElementById("day-input").value);
        const year = parseInt(document.getElementById("year-input").value);
        const hour = parseInt(document.getElementById("hour-input").value);
        const minute = parseInt(document.getElementById("minute-input").value);
        const second = parseInt(document.getElementById("second-input").value);
        const today = new Date();

        const checkInTime = new Date(year, month, day, hour, minute, second);
        const countdown = checkInTime.getTime() - today.getTime();

        if (countdown <= 0 || Number.isNaN(countdown)) {
            errors.push("- Enter a date and time in the future");
        }

        if (confirmationNumber.length == 0) {
            errors.push("- Enter a valid six-character confirmation number");
        }

        if (firstName.length == 0) {
            errors.push("- Enter a first name");
        }

        if (lastName.length == 0) {
            errors.push("- Enter a last name");
        }

        const phoneInputs = Array.from(phoneDiv.getElementsByTagName("input"));
        if (!phoneInputs.every(input => input.maxLength === input.value.length)) {
            errors.push("- Enter a valid phone number with area code");
        }

        if (errors.length > 0) {
            alert("Fix the following errors:\n\n" + errors.join("\n"));
        }
        // Save phone number and start countdown
        else {
            if (checkInTimeoutId !== null) window.clearTimeout(checkInTimeoutId);
            if (displayTimeoutId !== null) window.clearTimeout(displayTimeoutId);

            checkInTimeoutId = window.setTimeout(doCheckIn, countdown);
            displayTimeoutId = window.setTimeout(displayCountdown, 1000, checkInTime);

            const phoneNumber = phoneInputs.map(i => i.value).join("");
            GM_setValue("phoneNumber", phoneNumber);
        }
    }

    function displayCountdown(endTime) {
        const countdownDiv = document.getElementById("countdown-div");
        const now = new Date();
        const seconds = (endTime - now.getTime()) / 1000;
        const hoursLeft = Math.floor(seconds / 3600);
        const minutesLeft = Math.floor(seconds / 60) - (hoursLeft * 60);
        const secondsLeft = Math.ceil(seconds % 60);

        const times = [hoursLeft, minutesLeft, secondsLeft];
        const formattedTimes = times.map(num => {
            if (num < 10) return "0" + num;
            else return num;
        });

        countdownDiv.innerHTML = formattedTimes.join(":");

        if (seconds > 0) {
            displayTimeoutId = window.setTimeout(displayCountdown, 1000, endTime);
        }
        else {
            countdownDiv.innerHTML = "00:00:00";
        }
    }

    function doCheckIn() {
        const checkInBtn = document.getElementById("jb-button-check-in");
        const attempts = GM_getValue("attempts");
        
        checkInBtn.click();
    }
  }

  function SendBoardingPass() {
    const textButton = document.getElementById("textBoardingPass");
    const sendButton = document.getElementById("form-mixin--submit-button");
    const phoneNumber = GM_getValue("phoneNumber");
    
    textButton.value = phoneNumber;
  }

  function RetryCheckIn() {
    const checkInBtn = document.getElementById("form-mixin--submit-button");
    const attempts = GM_getValue("attempts");
    
    if (attempts < max_attempts) {
      checkInBtn.focus();
      checkInBtn.click();
      GM_setValue("attempts", attempts + 1);
      window.setTimeout(RetryCheckIn, attempt_delay);
    }
  }
})();
