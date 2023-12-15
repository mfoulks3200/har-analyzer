var har;
var reqs = [];
var selectedReq;
var visibleIndicies = [];

var handledKeystroke = false;
var keystrokeTimeout = true;
const vscode = acquireVsCodeApi();

function runSearchCriteria(reqItem, selectorType, selector, attrName, attrVal) {
    if ($(reqItem).attr(attrName) == attrVal && (!$(selectorType + selector).hasClass("selected") && ($(selectorType).hasClass("selected")))) {
        $(reqItem).hide();
        return true;
    }
    return false;
}

function runSearch() {
    while (visibleIndicies.length > 0) {
        visibleIndicies.pop();
    }
    var i = -1;
    $(".request-item").each(function () {
        i++;
        if (runSearchCriteria(this, ".method-filter", ".get", "type", "GET")) { return; }
        if (runSearchCriteria(this, ".method-filter", ".post", "type", "POST")) { return; }
        if (runSearchCriteria(this, ".method-filter", ".put", "type", "PUT")) { return; }
        if (runSearchCriteria(this, ".method-filter", ".delete", "type", "DELETE")) { return; }
        if (runSearchCriteria(this, ".method-filter", ".patch", "type", "PATCH")) { return; }

        if (runSearchCriteria(this, ".req-type-filter", ".doc", "reqtype", "document")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".xhr", "reqtype", "xhr")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".ping", "reqtype", "ping")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".img", "reqtype", "image")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".font", "reqtype", "font")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".script", "reqtype", "script")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".stylesheet", "reqtype", "stylesheet")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".man", "reqtype", "manifest")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".pre", "reqtype", "preflight")) { return; }
        if (runSearchCriteria(this, ".req-type-filter", ".other", "reqtype", "other")) { return; }

        if ($(".search").val().length > 0 && !$(this).attr("endpoint").includes($(".search").val())) {
            $(this).hide();
            return;
        }
        $(this).show();
        visibleIndicies.push(i);
    });
}

function getNextValue(thisIndex, higher) {
    if (higher) {
        for (i = 0; i < visibleIndicies.length; i++) {
            if (visibleIndicies[i] > thisIndex) {
                return visibleIndicies[i];
            }
        }
    } else {
        for (i = visibleIndicies.length - 1; i >= 0; i--) {
            if (visibleIndicies[i] < thisIndex) {
                return visibleIndicies[i];
            }
        }
    }
    return -1;
}

let selectedIndex = -1;

function setupGUI() {
    $(".tab-group").html("");
    $(".page:not([disabled])").each(function () {
        $(".tab-group").append("<div class='tab' name='" + $(this).attr("name") + "'>" + $(this).attr("name") + "</div>"); //this
    });
    $(".tab").first().addClass("selected");
    $(".page").first().addClass("show");

    $(".tab").off().on("click", function () {
        $(".tab").removeClass("selected");
        $(this).addClass("selected");
        $(".page").removeClass("show");
        $(".page[name='" + $(this).attr("name") + "']").addClass("show");
    });

    $(".expand-filters").off().on("click", function () {
        $(this).toggleClass("expanded");
        $(".req-type-filters").toggleClass("expanded");
        $(".container.request-items").toggleClass("expanded");
        runSearch();
    });

    $(".method-filter,.req-type-filter").off().on("click", function () {
        $(this).toggleClass("selected");
        runSearch();
    });

    $(".search").off().on('input', function (e) {
        runSearch();
    });

    $(".section-title").off().on("click", function () {
        $(this).parent().toggleClass("hide");
    });

    $(".request-item").off().on("click", function () {
        selectReq($(this).attr("index"));
    });

    document.addEventListener('keydown', (e) => {
        if (keystrokeTimeout) {
            keystrokeTimeout = false;
            setTimeout(function () {
                handledKeystroke = false;
                keystrokeTimeout = true;
            }, 100);
        }
    });

    runSearch();

    document.addEventListener('keydown', (e) => {
        if ($(e.target).hasClass("search")) {
            runSearch();
        }
        if (e.code === "ArrowUp" && !handledKeystroke) {
            e.preventDefault();
            if (selectedIndex == -1) {
                selectedIndex = reqs.length - 1;
                selectReq(reqs.length - 1);
                handledKeystroke = true;
            } else {
                if (selectedIndex != 0) {
                    selectedIndex--;
                    if (visibleIndicies.includes(selectedIndex)) {
                        selectReq(selectedIndex);
                        handledKeystroke = true;
                    } else {
                        var temp = getNextValue(selectedIndex, false);
                        if (temp != -1) {
                            selectedIndex = temp;
                            selectReq(selectedIndex);
                        } else {
                            selectedIndex++;
                        }
                        handledKeystroke = true;
                    }
                }
            }
        }
        if (e.code === "ArrowDown" && !handledKeystroke) {
            e.preventDefault();
            if (selectedIndex == -1) {
                selectedIndex = 0;
                selectReq(0);
                handledKeystroke = true;
            } else {
                if (selectedIndex < reqs.length - 1) {
                    selectedIndex++;
                    if (visibleIndicies.includes(selectedIndex)) {
                        selectReq(selectedIndex);
                        handledKeystroke = true;
                    } else {
                        var temp = getNextValue(selectedIndex, true);
                        if (temp != -1) {
                            selectedIndex = temp;
                            selectReq(selectedIndex);
                        } else {
                            selectedIndex--;
                        }
                        handledKeystroke = true;
                    }
                }
            }
        }
        $(".request-item[index='" + selectedIndex + "']").get(0).scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    });
}

function getNested(path) {
    var args = path.split('.');
    var obj = selectedReq;

    for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return "";
        }
        obj = obj[args[i]];
    }
    return obj;
}

function round(num, place) {
    return +(Math.round(num + "e+" + place) + "e-" + place);
}

function selectReq(index) {
    selectedIndex = index;
    selectedReq = reqs[index];
    $(".request-item.selected").removeClass("selected");
    $(".request-item[index='" + index + "']").addClass("selected");
    $(".inspector-title").attr("type", selectedReq.method);
    $(".inspector-title").attr("endpoint", selectedReq.endpoint);
    $(".inspector-title").attr("time", selectedReq.time);
    $(".inspector-title").attr("status", selectedReq.status);
    $("*[data]:not([round])").each(function () {
        $(this).html(getNested($(this).attr("data")).toString().toHtmlEntities());
    });
    $("*[data][round]").each(function () {
        $(this).html(round(getNested($(this).attr("data")), $(this).attr("round")));
    });
    $(".inspector-timing-bars").attr("totalTime", 0);
    $(".inspector-timing-bars .data-bar").each(function () {
        if ($(this).html() > 0) {
            $(this).parent().attr("totalTime", (+$(this).parent().attr("totalTime")) + (+$(this).html()));
        }
        $(this).attr("time", $(this).html());
        $(this).html("");
    });
    var current = 0;
    $(".inspector-timing-bars .data-bar").each(function () {
        var total = +$(this).parent().attr("totalTime");
        var time = +$(this).attr("time");
        if (time > 0) {
            $(this).attr("style", "width:" + ((time / total) * 100) + "%;margin-left:" + ((current / total) * 100) + "%;");
            current += time;
        } else {
            $(this).attr("style", "");
        }
    });
    $("*[data-table]").html("");
    $("*[data-table]").each(function () {
        var table = getNested($(this).attr("data-table"));
        for (var tableIndex in table) {
            var tableItem = table[tableIndex];
            if (!(tableItem === undefined) && !(tableItem.value === undefined)) {
                $(this).append(`<div class="data-row" keyName="` + tableItem.name.toString().toHtmlEntities() + `">` + tableItem.value.toString().toHtmlEntities() + `</div>`);
            }
        }
    });
    $("*[require-data]").each(function () {
        var table = getNested($(this).attr("require-data"));
        if (table.length == 0) {
            $(this).hide();
        } else {
            $(this).show();
        }
    });

    $("*[require-value]").each(function () {
        var components = $(this).attr("require-value").split("=");
        var value = getNested(components[0]);
        if (new RegExp(components[1]).test(value)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });

    $("*[data-to]").each(function () {
        if (typeof $(this).attr("require-value") !== 'undefined' && $(this).attr("require-value") !== false) {
            var components = $(this).attr("require-value").split("=");
            var value = getNested(components[0]);
            if (!new RegExp(components[1]).test(value)) {
                return;
            }
        }
        var components = $(this).attr("data-to").split("=");
        var value = getNested(components[1]);
        $(this).attr(components[0], value);
    });

    $(".code-block.shorten").each(function () {
        $(this).scrollTop(0);
        if (selectedReq.formatted) {
            $(this).addClass("formatted");
        } else {
            $(this).removeClass("formatted");
        }
        // if(selectedReq != null && selectedReq.content.length > 10000){
        //     $(this).addClass("collapsable").addClass("collapsed");
        //     $(this).html(selectedReq.contentShort);
        // }else{
        //     $(this).removeClass("collapsable").removeClass("collapsed");
        //     $(this).html(selectedReq.content);
        // }
        $(this).html(selectedReq.contentShort.toString().toHtmlEntities());
    });

    $(".open-new-tab").off().on("dblclick", function () {
        vscode.postMessage({
            action: "openNewTab",
            text: selectedReq.content,
            lang: selectedReq.mimeType.split("\/")[1]
        });
    });

    $(".stack").html("");
    if (selectedReq.obj._initiator?.type == "script") {
        for (var i = 0; i < selectedReq.obj._initiator.stack.callFrames.length; i++) {
            var frame = selectedReq.obj._initiator.stack.callFrames[i];
            const re = new RegExp('(?:.+\/)([^\/?]+)', 'gm');
            var URLMatch = re.exec(frame.url);
            var file = URLMatch == null ? "" : URLMatch[1];
            $(".stack").append(`<tr>
                <td class="stack-frame-function">`+ (frame.functionName.length == 0 ? "(anonymous)" : frame.functionName) + `</td>
                <td class="stack-frame-sID">`+ frame.scriptId + `</td>
                <td class="stack-frame-location">(`+ frame.lineNumber + ":" + frame.columnNumber + `)</td>
                <td class="stack-frame-file"><div>`+ file + `</div></td>
            </tr>`);
        }
    }

    $(".request-inspector").addClass("ready");
}

function toggleBlockCollapse(block) {
    if (block.hasClass("collapsed")) {
        block.removeClass("collapsed");
        $(block).html(getNested($(block).attr("data")).toString().toHtmlEntities());
    } else {
        block.addClass("collapsed");
        $(block).html(getNested($(block).attr("data") + "Short").toString().toHtmlEntities());
    }
}

function formatXML(input, indent) {
    indent = indent || '\t'; //you can set/define other ident than tabs


    //PART 1: Add \n where necessary
    xmlString = input.replace(/^\s+|\s+$/g, '');  //trim it (just in case) {method trim() not working in IE8}

    xmlString = input
        .replace(/(<([a-zA-Z]+\b)[^>]*>)(?!<\/\2>|[\w\s])/g, "$1\n") //add \n after tag if not followed by the closing tag of pair or text node
        .replace(/(<\/[a-zA-Z]+[^>]*>)/g, "$1\n") //add \n after closing tag
        .replace(/>\s+(.+?)\s+<(?!\/)/g, ">\n$1\n<") //add \n between sets of angled brackets and text node between them
        .replace(/>(.+?)<([a-zA-Z])/g, ">\n$1\n<$2") //add \n between angled brackets and text node between them
        .replace(/\?></, "?>\n<") //detect a header of XML

    xmlArr = xmlString.split('\n');  //split it into an array (for analise each line separately)



    //PART 2: indent each line appropriately

    var tabs = '';  //store the current indentation
    var start = 0;  //starting line

    if (/^<[?]xml/.test(xmlArr[0])) start++;  //if the first line is a header, ignore it

    for (var i = start; i < xmlArr.length; i++) //for each line
    {
        var line = xmlArr[i].replace(/^\s+|\s+$/g, '');  //trim it (just in case)

        if (/^<[/]/.test(line))  //if the line is a closing tag
        {
            tabs = tabs.replace(indent, '');  //remove one indent from the store
            xmlArr[i] = tabs + line;  //add the tabs at the beginning of the line
        }
        else if (/<.*>.*<\/.*>|<.*[^>]\/>/.test(line))  //if the line contains an entire node
        {
            //leave the store as is
            xmlArr[i] = tabs + line; //add the tabs at the beginning of the line
        }
        else if (/<.*>/.test(line)) //if the line starts with an opening tag and does not contain an entire node
        {
            xmlArr[i] = tabs + line;  //add the tabs at the beginning of the line
            tabs += indent;  //and add one indent to the store
        }
        else  //if the line contain a text node
        {
            xmlArr[i] = tabs + line;  // add the tabs at the beginning of the line
        }
    }


    //PART 3: return formatted string (source)
    return xmlArr.join('\n');  //rejoin the array to a string and return it
}

function formatJSON(text) {
    try {
        return JSON.stringify(JSON.parse(text), null, 4);
    } catch (e) {
        console.log("Could not parse JSON:");
        console.log(text);
        return text;
    }
}

function format(text, mimeType) {
    if (mimeType == "text/html" || mimeType == "text/xml") {
        return formatXML(text);
    } else if (mimeType == "application/json") {
        return formatJSON(text);
    } else {
        return text;
    }
}

function loadHARByURL(harURL) {
    $.get(harURL, function (data) {
        loadHAR(data);
    });
}

function loadHAR(harText) {
    har = JSON.parse(harText);
    for (var i = 0; i < har.log.entries.length; i++) {
        addRequestItem(har.log.entries[i]);
    }
    setupGUI();
    $(".item-loader").addClass("hide");
}

function addRequestItem(reqItem) {
    var endpointRegEx = new RegExp("^[^:]*:\/\/([^/]*)([^?]*)");
    var endpointComponents = endpointRegEx.exec(reqItem.request.url);
    var referer = "";
    for (var i = 0; i < reqItem.request.headers.length; i++) {
        if (reqItem.request.headers[i].name == "referer") {
            referer = reqItem.request.headers[i].value;
        }
    }
    var content = "";
    var formatted = false;
    if (reqItem.response.content.text != null) {
        content = reqItem.response.content.text;
        if (reqItem.response.content.encoding == "base64") {
            content = atob(reqItem.response.content.text);
        }
        if (reqItem.response.content.mimeType != "text/plain") {
            if (reqItem.response.content.mimeType.includes("image/")) {
                content = "data:" + reqItem.response.content.mimeType.split("/")[1] + ";base64," + reqItem.response.content.text;
            } else {
                formatted = true;
            }
        }
        content = format(content, reqItem.response.content.mimeType);
    }
    var item = {
        "method": reqItem.request.method,
        "time": reqItem.time,
        "fullURL": reqItem.request.url,
        "domain": endpointComponents[1],
        "endpoint": endpointComponents[2],
        "referer": referer,
        "status": reqItem.response.status + " " + reqItem.response.statusText,
        "index": reqs.length,
        "content": content,
        "contentShort": content.substring(0, 5000),
        "mimeType": reqItem.response.content.mimeType,
        "formatted": formatted,
        "obj": reqItem
    };
    reqs.push(item);
    addRequestGUIItem(item);
}

function addRequestGUIItem(entity) {
    var newItem = $(".templates .request-item").first().clone();
    newItem.attr("type", entity.obj.request.method);
    newItem.attr("reqType", entity.obj._resourceType);
    newItem.attr("time", entity.obj.time);
    newItem.attr("endpoint", entity.endpoint);
    newItem.attr("status", entity.obj.response.status);
    newItem.attr("index", entity.index);
    if (entity.obj.response.status !== 200) {
        if (entity.obj.response.status >= 400) {
            newItem.attr("highlight", "red");
        } else {
            newItem.attr("highlight", "yellow");
        }
    }
    newItem.attr("index", entity.index);
    newItem.find(".time").text(Math.round(entity.obj.time) + "ms");
    newItem.find(".status").attr("status", entity.obj.response.status);
    if (entity.method.length > 4) {
        switch (entity.method) {
            case "DELETE":
                newItem.find(".method").text("DLTE");
                break;
            case "OPTIONS":
                newItem.find(".method").text("OPNS");
                break;
            default:
                newItem.find(".method").text(entity.method);
                break;
        }
    } else {
        newItem.find(".method").text(entity.method);
    }
    newItem.find(".endpoint").text(entity.endpoint);
    newItem.appendTo(".request-items");
}

window.addEventListener('message', event => {

    const message = event.data; // The JSON data our extension sent

    console.log("Loading HAR")
    loadHAR(message.HARText);
});

$(document).ready(function () {
    vscode.postMessage({
        action: "loadHAR"
    });
});

String.prototype.toHtmlEntities = function () {
    return this.replace(/./gm, function (s) {
        // return "&#" + s.charCodeAt(0) + ";";
        return (s.match(/[a-z0-9\s]+/i)) ? s : "&#" + s.charCodeAt(0) + ";";
    });
};

String.fromHtmlEntities = function (string) {
    return (string + "").replace(/&#\d+;/gm, function (s) {
        return String.fromCharCode(s.match(/\d+/gm)[0]);
    })
};