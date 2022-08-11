// ==UserScript==
// @name         Nissa Tool
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://members.centralreach.com/
// @icon         https://www.google.com/s2/favicons?domain=crmls.org
// @grant        none
// ==/UserScript==

(function () {
    'use strict';


    function addStylesToPage() {
        var css = `
  table.dreampop-helper {
    width: 100%;
  }
  table.dreampop-helper td {
    padding: 5px 0px 5px 0px;
  }
  table.dreampop-helper input,
  table.dreampop-helper textarea {
    width: 95%;
    border: 1px solid black;
    border-radius: 5px;
    padding: 5px;
    text-align: right;
  }
  table.dreampop-helper button {
    padding: 4px 7px;
    background: #00000052;
    border: 1px solid black;
    border-radius: 5px;
  }
  table.dreampop-helper .calc-results {
    text-align: right;
    padding-right: 10px;   
    width: 40% 
  }
  `,
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        head.appendChild(style);

        style.type = 'text/css';
        if (style.styleSheet) {
            // This is required for IE8 and below.
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
    }

    function addCardToPage(element) {
        document.body.prepend(element);
    }

    function copyToClipboard(inputId) {
        /* Get the text field */
        var copyText = document.getElementById(inputId);
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */
        /* Copy the text inside the text field */
        document.execCommand("copy");
        //alert("Copied the text: " + copyText.value);
    }

    function createElements(data) {
        // Container
        var div = document.createElement("div");
        div.id = "eventCalculator";
        div.style.zIndex = "100"
        div.style.position = "fixed";
        div.style.padding = "10px";
        div.style.left = "10px";
        div.style.top = "350px";
        div.style.display = "none";

        div.style.width = "280px";
        div.style.background = "rgb(0 0 0 / 15%)";
        div.style.borderRadius = "5px";
        div.style.border = "1px solid black";
        div.style.color = "black";
        div.innerHTML = `<table class="dreampop-helper">
  <tr>
  <td colspan="2" style="font-size: 12pt;font-weight: bold;text-align: center;padding: 0;">Nissa Tool</td>
  <td></td>
  </tr>
  
  <!--
  <tr>
  <td colspan="2">
      <div style="position: relative;">
          <input id="address" value=""/>
          <button style="position: absolute;left: 4px;padding: 0;top: 5px;" onclick="copyToClipboard('address');">📋</button>
      </div>
  </td>
  <td></td>
  </tr><tr>
  <td>
    <label style="top: -20px;" for="monthlyTotal">Monthly Total</label>
  </td><td style="width: 50%;">
      <div style="position: relative;">
          <input style="font-weight: bold;" id="monthlyTotal" value=""/>
          <button style="position: absolute;left: 4px;padding: 0;top: 5px;" onclick="copyToClipboard('monthlyTotal');">📋</button>
      </div>
  </td>
  </tr><tr>
    <td><span id="garage"></span></td>
    <td><span id="panels"></span></td>
  </tr><tr>
    <td><span id="beds"></span></td>
    <td><span id="baths"></span></td>
  </tr>
  -->

  </table>
  <table class="dreampop-helper">
  <tr>
    <td><label style="top: -20px;" for="directTx">Direct Tx</label></td>
    <td class="calc-results"><span id="directTx"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="directTxSub">Direct Tx-Sub</label></td>
    <td class="calc-results"><span id="directTxSub"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="hlsDirect">HLS Direct</label></td>
    <td class="calc-results"><span id="hlsDirect"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="hlsIndirect">HLS Indirect</label></td>
    <td class="calc-results"><span id="hlsIndirect"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="hlsIndirectBhpn">HLS-Indirect-BHPN Report Writing</label></td>
    <td class="calc-results"><span id="hlsIndirectBhpn"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="mlsDirect">MLS Direct</label></td>
    <td class="calc-results"><span id="mlsDirect"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="mlsIndirect">MLS Indirect</label></td>
    <td class="calc-results"><span id="mlsIndirect"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="mlsIndirectBhpn">MLS-Indirect-BHPN Report Writing</label></td>
    <td class="calc-results"><span id="mlsIndirectBhpn"></span></td>
</tr>
<tr>
    <td><label style="top: -20px;" for="other">Other</label></td>
    <td class="calc-results"><span id="other"></span></td>
</tr>

  </table>`;

        return div;
    }


    function parseCurrency(dollarAmount) {
        return Number(dollarAmount.replace(/[^0-9.-]+/g, ""));
    }

    function doubleToCurrency(num) {
        // Create our number formatter.
        var formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',

            // These options are needed to round to whole numbers if that's what you want.
            //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
            //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
        });

        return formatter.format(num); /* $2,500.00 */
    }

    const EVENT_TIME_PATTERN = /(\d+):?(\d+)?(AM|PM)?-(\d+):?(\d+)?(AM|PM)?/;

    function isSchedule() {
        return window.location.hash
            .split('#')[1]
            .startsWith('scheduling');
    }

    function getScheduleMode() {
        return window.location.hash
            .split('?')[1]
            .split('&')
            .find(p => p.startsWith('mode'))
            .split('=')[1];
    }

    function getEventData(events, mode) {
        let eventData = []

        let eventType, timeText = '';
        events.each((index, event) => {
            try {
                switch (mode) {
                    case 'week':
                        eventType = $(event).find('.ln2').first().text();
                        timeText = $(event).find('.ln1 .time').first().text();
                        break;
                    case 'month':
                        let textContainer = $(event).find('a > div > span')[2];
                        eventType = $(textContainer).children('b').last().text();
                        timeText = $(textContainer).children('span').first().text();
                        break;
                }
                let matches = EVENT_TIME_PATTERN.exec(timeText);
                let eventTimes = {
                    startHour: matches[1],
                    startMinute: matches[2] ?? 0,
                    endHour: matches[4],
                    endMinute: matches[5] ?? 0,
                };
                
                let hourDuration = eventTimes.endHour - eventTimes.startHour;
                hourDuration = hourDuration < 0 ? hourDuration + 12 : hourDuration;

                let minuteDuration = eventTimes.endMinute - eventTimes.startMinute;
                if (minuteDuration < 0) {
                    minuteDuration += 60;
                    hourDuration -= 1;
                }

                eventData.push({
                    type: eventType,
                    hours: hourDuration,
                    minutes: minuteDuration
                });
        } catch (error) {
            console.log('Error');
        }
        });

        return eventData;
    }

    function scrapeData() {
        var mode = getScheduleMode();

        var events = $('.event');
        var eventData = getEventData(events, mode);
        

        var eventTotals = {
            directTx: { hours: 0, minutes: 0, total: 0},
            directTxSub: { hours: 0, minutes: 0, total: 0},
            hlsDirect: { hours: 0, minutes: 0, total: 0},
            hlsIndirect: { hours: 0, minutes: 0, total: 0},
            hlsIndirectBhpn: { hours: 0, minutes: 0, total: 0},
            mlsDirect: { hours: 0, minutes: 0, total: 0},
            mlsIndirect: { hours: 0, minutes: 0, total: 0},
            mlsIndirectBhpn: { hours: 0, minutes: 0, total: 0},
            other: { hours: 0, minutes: 0, total: 0},
        };
        eventData.forEach(data => {
            let eventGroup;
            switch(data.type.trim()) {
                case 'Direct Tx':
                    eventGroup = eventTotals.directTx;
                    break;
                case 'Direct Tx-Sub':
                    eventGroup = eventTotals.directTxSub;
                    break;
                case 'HLS Direct':
                    eventGroup = eventTotals.hlsDirect;
                    break;
                case 'HLS Indirect':
                    eventGroup = eventTotals.hlsIndirect;
                    break;
                case 'HLS-Indirect-BHPN Report Writing':
                    eventGroup = eventTotals.hlsIndirectBhpn;
                    break;
                case 'MLS Direct':
                    eventGroup = eventTotals.mlsDirect;
                    break;
                case 'MLS Indirect':
                    eventGroup = eventTotals.mlsIndirect;
                    break;
                case 'MLS-Indirect-BHPN Report Writing':
                    eventGroup = eventTotals.mlsIndirectBhpn;
                    break;
                default:
                    eventGroup = eventTotals.other;
                    break;
            }
            eventGroup.minutes += data.minutes;
            if (eventGroup.minutes >= 60) {
                eventGroup.hours += (eventGroup.minutes - (eventGroup.minutes % 60)) / 60;
                eventGroup.minutes = eventGroup.minutes % 60;
            }
            eventGroup.hours += data.hours;
        });
        for (let key in eventTotals) {
            let eventTotal = eventTotals[key];
            eventTotal.total = eventTotal.hours + (eventTotal.minutes / 60);
        }

        document.getElementById('directTx').textContent = eventTotals.directTx.total;
        document.getElementById('directTxSub').textContent = eventTotals.directTxSub.total;
        document.getElementById('hlsDirect').textContent = eventTotals.hlsDirect.total;
        document.getElementById('hlsIndirect').textContent = eventTotals.hlsIndirect.total;
        document.getElementById('hlsIndirectBhpn').textContent = eventTotals.hlsIndirectBhpn.total;
        document.getElementById('mlsDirect').textContent = eventTotals.mlsDirect.total;
        document.getElementById('mlsIndirect').textContent = eventTotals.mlsIndirect.total;
        document.getElementById('mlsIndirectBhpn').textContent = eventTotals.mlsIndirectBhpn.total;
        document.getElementById('other').textContent = eventTotals.other.total;
        
        // var pmi = 175;
        // document.getElementById('pmi').textContent = doubleToCurrency(pmi);
        // var hInsurance = 150;
        // document.getElementById('hInsurance').textContent = doubleToCurrency(hInsurance);

        // var address = document.getElementsByClassName('formula J_formula')[0].textContent.trim()
        // document.getElementById('address').value = address;

        // var propertyTax = '';
        // try {
        //     var priceValue = document.getElementsByClassName('d-text d-fontSize--largest d-color--brandDark')[0].textContent.trim();
        //     var price = parseCurrency(priceValue);
        //     propertyTax = price * 0.01;
        //     document.getElementById('propertyTax').textContent = doubleToCurrency(propertyTax.toFixed(0));
        // } catch (ex) { }

        // var assessmentValue = '';
        // var supplementalTax = '';
        // try {
        //     var assessmentLabel = $('div > span').filter(function () { return ($(this).text() === 'Tax Other Annual Assessment Amount') });
        //     assessmentValue = assessmentLabel[0].parentElement.nextElementSibling.children[0].textContent;
        //     supplementalTax = parseCurrency(assessmentValue);
        //     document.getElementById('assessmentValue').textContent = doubleToCurrency(supplementalTax.toFixed(0));
        // } catch (ex) { }

        // var hoa = '';
        // try {
        //     var hoaLabel = $('div > span').filter(function () { return ($(this).text().indexOf('Association Fee') > -1) });
        //     var hoaValue = hoaLabel[1].parentElement.nextElementSibling.children[0].textContent;
        //     hoa = parseCurrency(hoaValue);
        //     document.getElementById('hoa').textContent = doubleToCurrency(hoa.toFixed(0));
        // } catch (ex) { }

        // var downPayment = price * 0.03;
        // var loanAmount = price - downPayment;
        // var interestRate = 0.03375 / 12;
        // var terms = 30 * 12;

        // var monthlyTax = (propertyTax + supplementalTax) / 12;
        // document.getElementById('monthlyTax').textContent = doubleToCurrency(monthlyTax.toFixed(0));

        // var monthlyMinusPni = monthlyTax + pmi + hInsurance + hoa;
        // document.getElementById('monthlyMinusPni').textContent = doubleToCurrency(monthlyMinusPni.toFixed(0));

        // var pni = loanAmount * (interestRate * Math.pow((1 + interestRate), terms) / (Math.pow((1 + interestRate), terms) - 1));
        // document.getElementById('pni').textContent = doubleToCurrency(pni);

        // var monthlyTotal = monthlyMinusPni + pni;
        // document.getElementById('monthlyTotal').value = doubleToCurrency(monthlyTotal);

        // try {
        //     var beds = $('div > span').filter(function () { return ($(this).text().indexOf('beds') > -1) });
        //     var bedsValue = parseInt(beds[1].previousElementSibling.textContent, 10);
        //     var bedsResult = bedsValue < 3 ? '❌' :
        //         bedsValue == 3 ? '⚠' :
        //             '✅';
        //     bedsResult += ` ${bedsValue} Bedrooms`;
        //     document.getElementById('beds').textContent = bedsResult;
        // } catch (ex) { }

        // try {
        //     var baths = $('div > span').filter(function () { return ($(this).text().indexOf('baths') > -1) });
        //     var bathsValue = parseInt(baths[1].previousElementSibling.textContent, 10);
        //     var bathsResult = bathsValue < 2 ? '❌' :
        //         bathsValue == 2 ? '⚠' :
        //             '✅';
        //     bathsResult += ` ${bathsValue} Bathrooms`;
        //     document.getElementById('baths').textContent = bathsResult;
        // } catch (ex) { }

        // try {
        //     var garageSpaces = $('div > span').filter(function () { return ($(this).text().indexOf('Garage Spaces') > -1) });
        //     var garageValue = parseInt(garageSpaces[1].parentElement.nextElementSibling.children[0].textContent, 10);
        //     var garageResult = garageValue < 2 ? '❌' :
        //         garageValue == 2 ? '⚠' :
        //             '✅';
        //     garageResult += ` ${garageValue} Car Garage`;
        //     document.getElementById('garage').textContent = garageResult;
        // } catch (ex) { }

        // try {
        //     var documentText = (document.documentElement.textContent || document.documentElement.innerText);
        //     var hasSolar = documentText.match(/solar/gi) && !documentText.match(/no solar/gi);
        //     var solarResult = hasSolar ? '✅ ടolar' : '⚠ No ടolar';
        //     document.getElementById('panels').textContent = solarResult;
        // } catch (ex) { }
    }

    function fillData(data) {
        //TODO
    }

    function run() {
        addStylesToPage();

        // let data = scrapeData();
        let element = createElements();
        addCardToPage(element);

        // To make these accessible after page load
        document.scrapeData = scrapeData;
        // document.copyToClipboard = copyToClipboard;
        
        let evaluated = false;
        var eventCalculator = document.getElementById('eventCalculator');
        // while (!evaluated) {
            setInterval(function () {
                if (!evaluated || true) {
                    try {
                        if (!isSchedule()) {
                            throw new Exception();
                        }
                        var overlayLoadingDisplay = $('.overlay-loading')[0].style.display;
                        if (overlayLoadingDisplay == 'none') {
                            eventCalculator.style.display = "block";
                            evaluated = true;
                            document.scrapeData();
                        } else {
                            throw new Exception();
                        }
                    } catch (ex) { 
                        eventCalculator.style.display = "none";
                    }
                }
            }, 1000);
        // }
    }

    // Run after page loads
    setTimeout(run, 1000);

})();