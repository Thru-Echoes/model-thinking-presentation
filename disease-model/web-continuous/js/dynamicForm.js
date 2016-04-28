$(document).ready(function(){
    var sexColM = [];
    var sexColF = [];

    var bId, sId;

    for (var i=0; i<NUM_CLASS; i++) {

        if (IS_SEX == "one") {
          var id = ($('.aClasses .subClasses').length + 1).toString();
          sexColM.push('<div class="form-group subClasses" id=subClass' + (i+1) + '"><input type="text" class="form-control" placeholder="Age Class' + (i+1) +'" id="aClass' + (i+1) + '"></div></div>');

        } else {
          var mId = ($('.aClasses .maleClasses').length + 1).toString();
          var fId = ($('.aClasses .femClasses').length + 1).toString();
          sexColM.push('<div class="form-group maleClasses" id=mClass' + (i+1) + '"><input type="text" class="form-control" placeholder="Male Age' + (i+1) +'" id="mClass' + (i+1) + '"></div></div>');
          sexColF.push('<div class="form-group femClasses" id=fClass' + (i+1) + '"><input type="text" class="form-control" placeholder="Female Age' + (i+1) +'" id="fClass' + (i+1) + '"></div></div>');
        }

        bId = ($('.bRates .subB').length + 1).toString();
        $('.bRates').append('<div class="form-group subB" id=subB' + bId + '"><input type="text" class="form-control" placeholder="Birth Rate' + bId +'" id="bRate' + bId + '"></div></div>');
        sId = ($('.sRates .subS').length + 1).toString();
        $('.sRates').append('<div class="form-group subS" id=subS' + i + '"><input type="text" class="form-control" placeholder="Survival Rate' + i +'" id="sRate' + i + '"></div></div>');
    }
    $('.sRates').append('<div class="form-group subS" id=subS' + (Number(sId)) + '"><input type="text" class="form-control" placeholder="Survival Rate' + (Number(sId)) +'" id="sRate' + (Number(sId)) + '"></div></div>');
    $('.sRates').append('<br><p>The final survival rate accounts for aging individuals</p>');

    if (IS_SEX != "one") {
        $('.aClasses').append('<h4>Males</h4><form class="navbar-form navbar-left" role="search">' + sexColM.join("") + '</form>');
        $('.aClasses').append('<br><br><br><h4>Females</h4><form class="navbar-form navbar-left" role="search">' + sexColF.join("") + '</form>');
    } else {
        $('.aClasses').append('<form class="navbar-form navbar-left" role="search">' + sexColM.join("") + '</form>');
    }

    if (NUM_NODES != 1) {
        for (var j=0; j<NUM_NODES; j++) {
            var cId = ($('.cnnect .col'+ (j+1) +'Row').length + 1).toString();
            var fullCol = [];
            for (var k=0; k<NUM_NODES; k++) {
                fullCol.push('<div class="form-group col'+ (j+1) +'Row" id=col'+ (j+1) +'Row' + (k+1) + '"><input type="text" class="form-control" placeholder="Location ' + (k+1) +' to '+ (j+1) +'" id="cnct' + (k+1) + '' + (j+1) + '"></div>');
            }
            $('.cnnect').append('<div class="col-md-2">' + fullCol.join("") + '</div>');
        }
    } else {
          $('.cnnect').append('<div class="col-md-6"><p>Connectance applies as a region-to-region attractivity (or propensity). Since there is only 1 region connectivity is ignored.</p></div>');
    }
});
