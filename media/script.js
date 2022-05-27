var har;
var reqs = [];
var selectedReq;

function setupGUI(){
    $(".tab-group").html("");
    $(".page:not([disabled])").each(function(){
        $(".tab-group").append("<div class='tab' name='"+$(this).attr("name")+"'>" + $(this).attr("name") + "</div>"); //this
    });
    $(".tab").first().addClass("selected");
    $(".page").first().addClass("show");
    
    $(".tab").off().on("click", function(){
        $(".tab").removeClass("selected");
        $(this).addClass("selected");
        $(".page").removeClass("show");
        $(".page[name='"+$(this).attr("name")+"']").addClass("show");
    });
    
    $(".section-title").off().on("click", function(){
        $(this).parent().toggleClass("hide");
    });

    $(".request-item").off().on("click", function(){
        $(".request-item.selected").removeClass("selected");
        $(this).addClass("selected");
        selectReq(reqs[$(this).attr("index")]);
        console.log(reqs[$(this).attr("index")]);
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

function selectReq(index){
    selectedReq = index;
    $("*[data]").each(function(){
        console.log($(this).attr("data"));
        $(this).html(getNested($(this).attr("data")).toString().toHtmlEntities());
    });
    $("*[data-table]").html("");
    $("*[data-table]").each(function(){
        var table = getNested($(this).attr("data-table"));
        for(var tableIndex in table){
            var tableItem = table[tableIndex];
            if(!(tableItem === undefined) && !(tableItem.value === undefined)){
                $(this).append(`<div class="data-row" keyName="`+tableItem.name.toString().toHtmlEntities()+`">`+tableItem.value.toString().toHtmlEntities()+`</div>`);
            }
        }
    });
    $("*[require-data]").each(function(){
        var table = getNested($(this).attr("require-data"));
        if(table.length == 0){
            $(this).hide();
        }else{
            $(this).show();
        }
    });

    $("*[require-value]").each(function(){
        var components = $(this).attr("require-value").split("=");
        var value = getNested(components[0]);
        console.log(components[1]+" "+value);
        if(new RegExp(components[1]).test(value)){
            $(this).show();
        }else{
            $(this).hide();
        }
    });

    $("*[data-to]").each(function(){
        var components = $(this).attr("data-to").split("=");
        var value = getNested(components[1]);
        $(this).attr(components[0], value);
    });

    $(".code-block").each(function(){
        $(this).scrollTop(0);
        if(selectedReq.formatted){
            $(this).addClass("formatted");
        }else{
            $(this).removeClass("formatted");
        }
        if($(this).attr("data") != null && getNested($(this).attr("data")).length > 10000){
            console.log(getNested($(this).attr("data")).length);
            $(this).addClass("collapsable").addClass("collapsed");
            $(this).html($(this).html().substring(0,5000));
        }else{
            $(this).removeClass("collapsable").removeClass("collapsed");
        }
    });
    
    $(".code-block").off().on("dblclick", function(){
        if($(this).hasClass("collapsable")){
            toggleBlockCollapse($(this));
            $(this).get().scrollTop = 0;
        }
    });

    $(".request-inspector").addClass("ready");
}

function toggleBlockCollapse(block){
    if(block.hasClass("collapsed")){
        block.removeClass("collapsed");
        $(block).html(getNested($(block).attr("data")).toString().toHtmlEntities());
    }else{
        block.addClass("collapsed");
        $(block).html(getNested($(block).attr("data")).toString().toHtmlEntities().substring(0,5000));
    }
}

function formatXML(input,indent)
{
  indent = indent || '\t'; //you can set/define other ident than tabs


  //PART 1: Add \n where necessary
  xmlString = input.replace(/^\s+|\s+$/g, '');  //trim it (just in case) {method trim() not working in IE8}

  xmlString = input
                   .replace( /(<([a-zA-Z]+\b)[^>]*>)(?!<\/\2>|[\w\s])/g, "$1\n" ) //add \n after tag if not followed by the closing tag of pair or text node
                   .replace( /(<\/[a-zA-Z]+[^>]*>)/g, "$1\n") //add \n after closing tag
                   .replace( />\s+(.+?)\s+<(?!\/)/g, ">\n$1\n<") //add \n between sets of angled brackets and text node between them
                   .replace( />(.+?)<([a-zA-Z])/g, ">\n$1\n<$2") //add \n between angled brackets and text node between them
                   .replace(/\?></, "?>\n<") //detect a header of XML

  xmlArr = xmlString.split('\n');  //split it into an array (for analise each line separately)



  //PART 2: indent each line appropriately

  var tabs = '';  //store the current indentation
  var start = 0;  //starting line

  if (/^<[?]xml/.test(xmlArr[0]))  start++;  //if the first line is a header, ignore it

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
  return  xmlArr.join('\n');  //rejoin the array to a string and return it
}

function formatJSON(text){
    try{
        return JSON.stringify(JSON.parse(text), null, 4);
    }catch(e){
        console.log("Could not parse JSON:");
        console.log(text);
        return text;
    }
}

function format(text, mimeType){
    if(mimeType == "text/html" || mimeType == "text/xml"){
        return formatXML(text);
    }else if(mimeType == "application/json"){
        return formatJSON(text);
    }else{
        return text;
    }
}

function loadHARByURL(harURL){
    $.get(harURL, function(data){
        loadHAR(data);
    });
}

function loadHAR(harText){
    har = JSON.parse(harText);
    console.log(har);
    for(var i=0; i<har.log.entries.length; i++){
        addRequestItem(har.log.entries[i]);
    }
    setupGUI();
    $(".item-loader").addClass("hide");
}

function addRequestItem(reqItem){
    var endpointRegEx = new RegExp("^[^:]*:\/\/([^/]*)([^?]*)");
    var endpointComponents = endpointRegEx.exec(reqItem.request.url);
    var referer = "";
    for(var i=0; i<reqItem.request.headers.length; i++){
        if(reqItem.request.headers[i].name == "referer"){
            referer = reqItem.request.headers[i].value;
        }
    }
    var content = "";
    var formatted = false;
    if(reqItem.response.content.text != null){
        content = reqItem.response.content.text;
        if(reqItem.response.content.encoding == "base64"){
            content = atob(reqItem.response.content.text);
        }
        if(reqItem.response.content.mimeType != "text/plain"){
            if(reqItem.response.content.mimeType.includes("image/")){
                content = "data:"+reqItem.response.content.mimeType.split("/")[1]+";base64,"+reqItem.response.content.text;
            }else{
                formatted = true;
                console.log(format(content, reqItem.response.content.mimeType));
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
        "status": reqItem.response.status+" "+reqItem.response.statusText,
        "index": reqs.length,
        "content":content,
        "mimeType": reqItem.response.content.mimeType,
        "formatted":formatted,
        "obj": reqItem
    };
    reqs.push(item);
    addRequestGUIItem(item);
}

function addRequestGUIItem(entity){
    var newItem = $(".templates .request-item").first().clone();
    newItem.attr("type", entity.obj.request.method);
    newItem.attr("time", entity.obj.time);
    newItem.attr("endpoint", entity.endpoint);
    newItem.attr("status", entity.obj.response.status);
    newItem.attr("index", entity.index);
    newItem.find(".time").text(Math.round(entity.obj.time)+"ms");
    newItem.find(".status").attr("status", entity.obj.response.status);
    if(entity.method.length > 4){
        switch(entity.method){
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
    }else{
        newItem.find(".method").text(entity.method);
    }
    newItem.find(".endpoint").text(entity.endpoint);
    newItem.appendTo(".request-items");
}

String.prototype.toHtmlEntities = function() {
    return this.replace(/./gm, function(s) {
        // return "&#" + s.charCodeAt(0) + ";";
        return (s.match(/[a-z0-9\s]+/i)) ? s : "&#" + s.charCodeAt(0) + ";";
    });
};

String.fromHtmlEntities = function(string) {
    return (string+"").replace(/&#\d+;/gm,function(s) {
        return String.fromCharCode(s.match(/\d+/gm)[0]);
    })
};