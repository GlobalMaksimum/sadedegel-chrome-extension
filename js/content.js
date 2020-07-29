// Constants
const api = "https://sadedegel.herokuapp.com/api/summarizer/rouge1";
const apiStats = "https://sadedegel.herokuapp.com/api/doc/statistics";

// Listen message from background script
chrome.runtime.onMessage.addListener(messageReceiver)

// Take action for message sent
function messageReceiver(message, sender, sendResponse) {
    console.log(message.url);

    // Check summary modal existence
    let isModalExist = document.getElementById("summaryModal");
    if (isModalExist) {
        // Show existing modal
        $('#summaryModal').modal({
            keyboard: false
        })
    } else {
        // Create modal from scratch
        const selectedArticleText = identifyArticleText(message.url);
        getArticleDurations(selectedArticleText).then(durations => {
            console.log(durations.radio2);
            summarize(selectedArticleText, durations.radio2)
                .then(summaryText => {
                    loadSummaryModal(summaryText, durations);
                });
        }
        );
    }
}

async function getArticleDurations(article) {
    let jsonBody = {};
    jsonBody["doc"] = article;

    const response = await fetch(apiStats, {
        method: 'POST',
        body: JSON.stringify(jsonBody),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'application/json'
        }
    }).then(res => res.json())
        .then(data => {
            console.log("total duration" + data.duration);
            let durations = {
                radio1: calculateDuration(data.duration, 0.1),
                radio2: calculateDuration(data.duration, 0.5),
                radio3: calculateDuration(data.duration, 0.8),
            }
            console.log("api call return object");
            console.log(durations)
            return durations
        });
    return response;
}

function calculateDuration(seconds, factor) {
    let s = seconds * factor;
    let r = (Math.ceil(s / 10) * 10)

    if (r < 60) {
        return { duration: r, unit: "second" };
    } else {
        return { duration: Math.ceil(r / 60), unit: "minute" };
    }
}


// Summarization api call
async function summarize(article, durationObj) {
    let jsonBody = {};
    jsonBody["doc"] = article;
    jsonBody["duration"] = durationObj.duration;
    jsonBody["unit"] = durationObj.unit;
    console.log("jsonbody");
    console.log(jsonBody);

    const response = await fetch(api, {
        method: 'POST',
        body: JSON.stringify(jsonBody),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'application/json'
        }
    }).then(res => res.json())
        .then(data => {
            let summaryText = '';
            data.sentences.map(sentence => summaryText += sentence);
            return summaryText;
        });
    return response;
}

function identifyArticleText(url) {
    if (url.includes("hurriyet.com.tr")) {
        return document.getElementsByClassName('article-content news-text')[0].outerText;
    }
    else if (url.includes("milliyet.com.tr")) {
        return document.getElementsByClassName('article__content')[0].outerText;
    }
    else if (url.includes("sozcu.com.tr")) {
        return document.getElementsByClassName('author-the-content content-element')[0].outerText;
    }
    else if (url.includes("haberturk.com")) {
        return document.getElementsByClassName('content type1 newsArticle')[0].outerText;
    }
    else if (url.includes("sabah.com.tr")) {
        return document.getElementsByClassName('newsBox')[0].outerText;
    }
    else {
        console.log("Bu websitesi henüz desteklenmiyor!");
    }
}


// Insert modal object to DOM
function loadSummaryModal(summaryText, durations) {

    // Bootstrap modal
    let summaryModal = document.createElement("div");
    summaryModal.id = "summaryModal";
    summaryModal.className = "modal fade";
    summaryModal.setAttribute("role", "dialog");
    summaryModal.setAttribute("aria-hidden", "true");
    summaryModal.setAttribute("aria-labelledby", "summaryModalTitle");

    let modalContainer = document.createElement('div');
    modalContainer.className = 'modal-dialog modal-dialog-centered';
    modalContainer.setAttribute("role", "document");
    summaryModal.appendChild(modalContainer);

    let modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContainer.appendChild(modalContent);

    let modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalContent.appendChild(modalHeader);

    let headerTitle = document.createElement("h5");
    headerTitle.id = "summaryModalTitle";
    headerTitle.className = "modal-title";
    headerTitle.innerHTML = "Haber Özeti";
    modalHeader.appendChild(headerTitle);

    let modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalContent.appendChild(modalBody);

    let modalSummaryText = document.createElement("span");
    modalSummaryText.id = "summaryTextResponse"
    // Set summary content
    modalSummaryText.innerHTML = summaryText;
    modalBody.appendChild(modalSummaryText);


    let modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalContent.appendChild(modalFooter);

    // Close button
    let closeButton = document.createElement("button");
    closeButton.className = "btn btn-secondary";
    closeButton.setAttribute("data-dismiss", "modal");
    closeButton.textContent = "Kapat";
    //modalFooter.appendChild(closeButton);

    // Add bootstrap collapse for options
    let optionsCollapse = document.createElement("div");
    optionsCollapse.style.marginTop = "20px";
    optionsCollapse.id = "optionsCollapse";


    // Add new summary length options
    let radioIMG = document.createElement('span');
    radioIMG.className = 'radioIMG';
    let radioIMG2 = document.createElement('span');
    radioIMG2.className = 'radioIMG';
    let radioIMG3 = document.createElement('span');
    radioIMG3.className = 'radioIMG';
    let lengthRangeContainer = document.createElement("div");
    lengthRangeContainer.id = "optionsWrapper";
    lengthRangeContainer.className = "form-group";
    let optWrapper1 = document.createElement('div');
    optWrapper1.className = 'form-check';
    let optWrapper2 = document.createElement('div');
    optWrapper2.className = 'form-check';
    let optWrapper3 = document.createElement('div');
    optWrapper3.className = 'form-check';
    let option1label = document.createElement('label');
    option1label.id = "duration1label"
    option1label.className = 'form-check-label';
    option1label.textContent = durations.radio1.duration + ' ' + (durations.radio1.unit == 'second' ? 'saniye' : 'dakika');
    let option2label = document.createElement('label');
    option2label.id = "duration2label"
    option2label.className = 'form-check-label active';
    option2label.textContent = durations.radio2.duration + ' ' + (durations.radio2.unit == 'second' ? 'saniye' : 'dakika');
    let option3label = document.createElement('label');
    option3label.id = "duration3label"
    option3label.className = 'form-check-label';
    option3label.textContent = durations.radio3.duration + ' ' + (durations.radio3.unit == 'second' ? 'saniye' : 'dakika');
    let opt1 = document.createElement('input');
    opt1.id = "duration1";
    opt1.setAttribute('type', 'radio');
    opt1.setAttribute('value', durations.radio1.duration);
    opt1.setAttribute('name', 'length');
    opt1.setAttribute('data-unit', durations.radio1.unit);
    let opt2 = document.createElement('input');
    opt2.id = "duration2";
    opt2.setAttribute('type', 'radio');
    opt2.setAttribute('value', durations.radio2.duration);
    opt2.setAttribute('name', 'length');
    opt2.setAttribute('checked', true);
    opt2.setAttribute('data-unit', durations.radio2.unit);
    let opt3 = document.createElement('input');
    opt3.id = "duration3";
    opt3.setAttribute('type', 'radio');
    opt3.setAttribute('value', durations.radio3.duration);
    opt3.setAttribute('name', 'length');
    opt3.setAttribute('data-unit', durations.radio3.unit);

    //placing the options
    option1label.appendChild(opt1);
    option1label.appendChild(radioIMG);
    option2label.appendChild(opt2);
    option2label.appendChild(radioIMG2);
    option3label.appendChild(opt3);
    option3label.appendChild(radioIMG3);

    optWrapper1.appendChild(option1label);
    optWrapper2.appendChild(option2label);
    optWrapper3.appendChild(option3label);

    lengthRangeContainer.appendChild(optWrapper1);
    lengthRangeContainer.appendChild(optWrapper2);
    lengthRangeContainer.appendChild(optWrapper3);

    optionsCollapse.appendChild(lengthRangeContainer);
    modalFooter.appendChild(optionsCollapse);
    modalFooter.appendChild(closeButton);

    // Append modal to body
    document.body.appendChild(summaryModal);

    // Add event listeners for radio buttons
    const radios = document.querySelectorAll('input[type=radio][name=length]');
    radios.forEach(radio => radio.addEventListener('change', changeSummaryLength));

    $('#optionsWrapper .form-check-label').click((e) => {
        $('#optionsWrapper').find('.active').removeClass('active');
        e.target.parentNode.classList.add('active');
    });

    // Show modal
    $('#summaryModal').modal({
        keyboard: false
    })
}

function changeSummaryLength(event) {
    const duration = event.target.value;
    const unit = document.getElementById(event.target.id).getAttribute("data-unit")
    const apiCallPromise = summarize(identifyArticleText(event.target.baseURI), { duration: duration, unit: unit });
    apiCallPromise.then(summaryText => {
        document.getElementById("summaryTextResponse").innerHTML = summaryText;
    });
}
