// Constants
const api = "https://sadedegel.herokuapp.com"
const summarizerEndpoint = "/api/summarizer/rouge1";
const statsEndpoint = "/api/doc/statistics";

// Listen message from background script
chrome.runtime.onMessage.addListener(messageReceiver)

// Take action for message sent
function messageReceiver(message, sender, sendResponse) {

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
        if (selectedArticleText) {
            createSummaryModal();
            getArticleDurations(selectedArticleText).then(durations => {
                summarize(selectedArticleText, durations.radio2)
                    .then(resp => {
                        loadSummaryData(resp, durations);
                        $("#loader").fadeOut();
                    });
            }
            );
        }
    }
}

async function getArticleDurations(article) {
    let jsonBody = {};
    jsonBody["doc"] = article;

    const response = await fetch(api + statsEndpoint, {
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
            let durations = {
                radio1: calculateDuration(data.duration, 0.1),
                radio2: calculateDuration(data.duration, 0.5),
                radio3: calculateDuration(data.duration, 0.8),
            }
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

    const response = await fetch(api + summarizerEndpoint, {
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
            data.sentences.map(sentence => summaryText += ' ' + sentence);
            return { summaryText: summaryText, osc: data.original.sentence_count, owc: data.original.word_count, ssc: data.summary.sentence_count, swc: data.summary.word_count };
        });
    return response;
}

function identifyArticleText(url) {
    try {
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
            throw "Bu websitesi henüz desteklenmiyor!"
        }
    } catch (exception) {
        console.error("Eklentiyi desteklenmeyen sayfada çalıştırdınız!");
    }
}

function createSummaryModal() {
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

    let loader = document.createElement("span")
    loader.className = "loader"
    loader.id = "loader"
    modalBody.appendChild(loader)

    let modalSummaryText = document.createElement("span");
    modalSummaryText.id = "summaryTextResponse"
    // Set summary content
    modalSummaryText.innerHTML = "";
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

    // Stat Info

    let statInfo = document.createElement("div");
    statInfo.id = "statInfo";
    statInfo.className = "card";
    statInfo.innerHTML = "";


    modalFooter.appendChild(statInfo);
    modalFooter.appendChild(optionsCollapse);
    modalFooter.appendChild(closeButton);

    // Append modal to body
    document.body.appendChild(summaryModal);

    // Show modal
    $('#summaryModal').modal({
        keyboard: false
    });
}

// Insert modal object to DOM
function loadSummaryData(resp, durations) {
    // Bootstrap modal
    document.getElementById("summaryTextResponse").innerHTML = resp.summaryText;
    document.getElementById("statInfo").innerHTML = formStatsBody(resp);

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


    document.getElementById("optionsCollapse").appendChild(lengthRangeContainer);


    // Add event listeners for radio buttons
    const radios = document.querySelectorAll('input[type=radio][name=length]');
    radios.forEach(radio => radio.addEventListener('change', changeSummaryLength));


    $('#optionsWrapper .form-check-label').click((e) => {
        $('#optionsWrapper').find('.active').removeClass('active');
        e.target.parentNode.classList.add('active');
    });


}


function changeSummaryLength(event) {
    const duration = event.target.value;
    const unit = document.getElementById(event.target.id).getAttribute("data-unit");
    $("#summaryTextResponse").fadeOut(10);
    document.getElementById("summaryTextResponse").innerHTML = "";

    $("#loader").fadeIn(10);

    const apiCallPromise = summarize(identifyArticleText(event.target.baseURI), { duration: duration, unit: unit });
    apiCallPromise.then(resp => {
        $(".card-body").html(formStatsBody(resp));
        $("#loader").delay(100).fadeOut();
        $("#summaryTextResponse").html(resp.summaryText).animate({ opacity: 1 }, 250);
        $("#summaryTextResponse").fadeIn(10);
    });
}


function formStatsBody(resp) {
    if (resp.osc && resp.ssc && resp.owc && resp.swc) {
        return `<div class="card-body row text-center" style="margin-bottom:0px;">
                <span class="col">
                    Toplam Cümle Sayısı: ${resp.osc}
                </span>
                <span class="col">
                    Özet Cümle Sayısı: ${resp.ssc}
                </span>
                <span class="col">
                    Toplam Kelime Sayısı: ${resp.owc}
                </span>
                <span class="col">
                    Özet Kelime Sayısı: ${resp.swc}
                </span>
            </div>
        </div>`;
    }
    else {
        return `<div class="card-body row text-center" style="margin-bottom:0px;">
                <span class="col">
                    Hata! İstatistik alınamadı.
                </span>
            </div>
        </div>`;
    }
}