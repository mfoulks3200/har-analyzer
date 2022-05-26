var har;
var reqs = [];
var selectedReq;

function setupGUI(){
    $(".tab-group").html("");
    $(".page").each(function(){
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
        $(this).html(getNested($(this).attr("data")));
    });
    $(".request-inspector").addClass("ready");
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
    var item = {
        "method": reqItem.request.method,
        "time": reqItem.time,
        "fullURL": reqItem.request.url,
        "domain": endpointComponents[1],
        "endpoint": endpointComponents[2],
        "referer": referer,
        "status": reqItem.response.status+" "+reqItem.response.statusText,
        "index": reqs.length,
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