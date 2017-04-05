
function LoadTabContent(ind, callback) {
    if (ind == 2) {
        $("#tabs-1").load('./lib/tab_1_content.html', callback);
    }
    if (ind > 0) {
        for (i = 3; i <= ind; i++) {
            if ($("#tabs-" + i).html() == '') {
                $("#tabs-" + i).load('./lib/tab_' + i + '_content.html', callback);
            }
        }
    } else {
        for (i = 3; i <= 4; i++) {
            if ($(window).height() + $(this).scrollTop() > $("#tabs-" + i).offset().top && $("#tabs-" + i).html() == '') {
                $("#tabs-" + i).load('./lib/tab_' + i + '_content.html', callback);
            }
        }
    }
    if (ind == 2) { // after moving to the correct location update the map
        resizeMapDiv();
        updateMap();
    }
}

$(function () {
    /*$("#tabs").tabs();*/
    $("#tabs-3").tabs();
    $("#tabs-3").tabs("select", "3");
    $("#tabs-3").tabs("select", "3");
});


$(function () {
    var sub_nav = $('#sub-nav');
    pos = sub_nav.offset();

    //main_nav_height = parseFloat($("#selector").css("margin-top"));
    sloc = findPosC(document.getElementById('left-container'));
    //contloc = findPosC(document.getElementById('selector'));
    //selector_height = /*parseFloat($("#selector").css("height"));*/ sloc[1] - contloc [1]

    topNav_height = (parseFloat($("top-banner").css("height")) + parseFloat($("#primary").css("height")));

    $(window).scroll(function () {
        /* dynamic load tab content to save initial loading time */
        LoadTabContent(0);

        var cont = $('#cont').offset().left;
        var left = $('#left-box').css({ 'left': (cont - $(window).scrollLeft() + 20) + 'px' });
        $('#banner').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
        $('#primary').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
        $('#left-container').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
        $('#left-box').css({ 'left': (cont - $(window).scrollLeft() + 20) + 'px' });
        //				$('.sub-nav-fixed').css({'left': (cont - $(window).scrollLeft() + 384) + 'px' });
        //				$('.sub-nav-default').css({'left': 0 + 'px' });

        /* leave the sub-nav as fixed on the top for Design for a width of 768px */
        if (parseInt($(".container").css("width")) > 420) {
            if ($(this).scrollTop() + topNav_height > sloc[1] && sub_nav.hasClass('sub-nav-default')) {
                sub_nav.fadeOut('fast', function () {
                    $(this).removeClass('sub-nav-default').addClass('sub-nav-fixed').fadeIn('fast');
                });
                $("#left-box").fadeOut('fast', function () {
                    $(this).removeClass('left-box-default').addClass('left-box-fixed').fadeIn('fast');
                });
                $("#selector").fadeOut('fast', function () {
                    $(this).addClass('selector-scroll').fadeIn('fast');
                });
            } else if ($(this).scrollTop() + topNav_height <= sloc[1] && sub_nav.hasClass('sub-nav-fixed')) {
                sub_nav.fadeOut('fast', function () {
                    $(this).removeClass('sub-nav-fixed').addClass('sub-nav-default').fadeIn('fast');
                    $("#sub-nav").css("left:0px !important");
                });
                $("#left-box").fadeOut('fast', function () {
                    $(this).removeClass('left-box-fixed').addClass('left-box-default').fadeIn('fast');
                });
                $("#selector").fadeOut('fast', function () {
                    $(this).removeClass('selector-scroll').fadeIn('fast');
                });
            }
        }

        for (i = 4; i > 0; i--) {
            if ($(this).scrollTop() >= $("#tabs-" + i).offset().top - 130) {
                $('#sub-nav .ui-state-active').removeClass('ui-state-active');
                $('#sub-nav .ui-tabs-selected').removeClass('ui-tabs-selected');
                $("#tabs-" + i + "-link").addClass('ui-state-active ui-tabs-selected');
                break;
            }
        }

    });
});

$(window).resize(function () {
    var cont = $('#cont').offset().left;
    var left = $('#left-box').css({ 'left': (cont - $(window).scrollLeft() + 20) + 'px' });
    $('#banner').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
    $('#primary').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
    $('#left-container').css({ 'left': (cont - $(window).scrollLeft()) + 'px' });
    $('#left-box').css({ 'left': (cont - $(window).scrollLeft() + 20) + 'px' });
    //			$('.sub-nav-fixed').css({'left': (cont - $(window).scrollLeft() + 384) + 'px' });			
    //			$('.sub-nav-default').css({'left': 0 + 'px' });

    resizeMRIDiv();
    resizeMapDiv();
    resizeSegDiv();
    resizeMapDiv2();
    resizeBlockfaceDiv();
    resizeComparisonViewerDiv();
    resizeInfoViewerGoogleBrain();
    resizeInfoViewerSegmentation();
    resizeInfoViewerMRI();
    resizeInfoViewerModels();
    resizeInfoViewerBlockface();
    resizeInfoViewerWalkthrough();
    if (parseInt($(".container").css("width")) < 768) {
        if ($("#sub-nav").hasClass('sub-nav-fixed')) {
            $("#sub-nav").removeClass('sub-nav-fixed').addClass('sub-nav-default');
        }
        if ($("#left-box").hasClass('left-box-fixed')) {
            $("#left-box").removeClass('left-box-fixed').addClass('left-box-default');
        }
    }

    if ($(".six.columns").width() == 268 || $(".six.columns").width() == 300) {
        document.getElementById("label").size = 25;
    } else if ($(".six.columns").width() == 420) {
        document.getElementById("label").size = 42;
    } else {
        document.getElementById("label").size = 36;
    }
    $(".ui-autocomplete").css("left", ($("html").width() - $("#cont").width()) / 2);
    $(".ui-autocomplete").css("width", parseInt($("#left-container").css("width")) + (parseInt($("#left-container").css("margin-left")) - 5) * 2);

});

$('.sub-nav-tab').live('click', function (event) {

    /*...prevent the default behaviour...*/
    event.preventDefault();

    var tabInd = $(this).parent().attr('id').match(/[0-9]/);
    // (Hauke) uncommented the loading as it did not load the google map portion correctly
    // This change destroys the load by usage feature!
    //LoadTabContent(tabInd);

    // var divId = $(this).parent().attr("id").replace("-link",'');
    var divId = "tabs-" + tabInd;
    var offsetTop = $("#" + divId).offset().top - 104;
    window.scroll(0, offsetTop);

    /* ...remove the tab_link_selected class from current active link... */
    $('#sub-nav .ui-state-active').removeClass('ui-state-active');
    $('#sub-nav .ui-tabs-selected').removeClass('ui-tabs-selected');

    /* ...and add it to the new active link */
    $(this).parent().addClass('ui-state-active ui-tabs-selected');
});


function centerToTab(number) {
    var divId = "tabs-" + number;
    var offsetTop = $("#" + divId).offset().top - 104;
    jQuery('html, body').animate({ scrollTop: offsetTop }, 1000);
    // window.scroll(0,offsetTop);
}

$(function () {
    $("#label").autocomplete({
        source: availableLabel,
        delay: 0,
        open: function (event, ui) {
            $(this).autocomplete("widget").css({
                "left": ($("html").width() - $("#cont").width()) / 2,
                "width": parseInt($("#left-container").css("width")) + (parseInt($("#left-container").css("margin-left")) - 5) * 2
            });
        }
    });
});



var search_result_mycarousel_itemList = [];

var searchFunc = function (e) {
    if (typeof user_1279 !== "undefined" && user_1279 == "1") {
        return; // do nothing if user is not logged in
    }

    search_result_mycarousel_itemList = [];
    jQuery('#mycarousel').jcarousel('scroll', 0);
    $(".brain_jcarousel").html('<ul id="mycarousel" class="jcarousel-skin-ie7"></ul>');

    var search_str = $("#label").val().toLowerCase().trim().replace(/ /g, '_');
    //	alert('search now for ' + search_str);
    $("#mycarousel img").removeClass("found");
    $(window).scrollTop(0);
    $("#left-box").removeClass('left-box-fixed').addClass('left-box-default').fadeIn('fast');
    $("#sub-nav").removeClass('sub-nav-fixed').addClass('sub-nav-default').fadeIn('fast');
    if ($("#label").val() == '') {
        //return false;
        current_itemList = mycarousel_itemList;

        load_carousel(mycarousel_itemList);

    } else {
        slice_label.filter(function (sl) {
            if (sl.label.toLowerCase() == search_str) {
                //$("img[alt=\"Section "+sl.slice_num+"\"]").addClass('found');
                if (mycarousel_itemList_pic_num.indexOf(parseInt(sl.slice_num)) >= 0) {
                    var len = sl.slice_num.toString().length;
                    var img_num = '';
                    for (i = 0; i < 4 - len; i++) {
                        img_num += '0';
                    }
                    img_num += sl.slice_num;
                    search_result_mycarousel_itemList.push({ url: "./data/Blockface/TINY/2500_FINAL_HM_Blockface_" + img_num + "_MEDIUM_TINY.jpg", title: "Section " + sl.slice_num });

                }

            }
        });

        load_carousel(search_result_mycarousel_itemList);

    }
    if (e.which == 13) {
        $(".ui-autocomplete").css("display", "none");
    }
};
$("#label").live("blur", function () {
    var default_value = "Search by structure or slice number"; //$(this).attr("rel");
    if ($(this).val() == "") {
        $(this).val(default_value);
    }
}).live("focus", function () {
    var default_value = "Search by structure or slice number"; //$(this).attr("rel");
    if ($(this).val() == default_value) {
        $(this).val("");
    }
});
var addFoundBorder = function (e) {
    if (current_itemList.length != mycarousel_itemList.length) {
        $("#mycarousel img").addClass("found");
    }
}

$('#search').live('click', searchFunc);
$('#search-icon-small').live('click', searchFunc);
//$(".jcarousel-next").live('click',searchFunc);
//$(".jcarousel-prev").live('click',searchFunc);
$(".ui-menu-item").live('click', searchFunc);
$("#search-box #label").live('keyup', function (e) {
    if (e.which == 13) {
        $(".ui-autocomplete").css("display", "none");
        $("#search-icon-small").trigger('click');
    }

    if ($("#search-box #label").val() == '') {
        current_itemList = mycarousel_itemList;
        jQuery('#mycarousel').jcarousel('scroll', 0);
        $(".brain_jcarousel").html('<ul id="mycarousel" class="jcarousel-skin-ie7"></ul>');
        load_carousel(mycarousel_itemList);
    }
    else if ($(".ui-autocomplete-input").val() == 'Search by structure or slice number') {
        $(".ui-autocomplete-input").val('');
    }
    else {
        //       $("#search-icon-small").trigger('click');
    }
});
$(".jcarousel-next").live('click', addFoundBorder);
$(".jcarousel-prev").live('click', addFoundBorder);


$("#reset-buttons").live('click', function () {
    //	$("#label").val('');
    $(".ui-autocomplete-input").val("Search by structure or slice number");
    $("#mycarousel img").removeClass("found");
    jQuery('#mycarousel').jcarousel('scroll', 0);
    $(".brain_jcarousel").html('<ul id="mycarousel" class="jcarousel-skin-ie7"></ul>');
    load_carousel(mycarousel_itemList);
});

$('#g-right li img').live('click', function (event) {
    if (typeof user_1279 !== "undefined" && user_1279 == "1") {
        alert('This functionality is only available for users with a valid account. Go to thedigitalbrainlibrary.org/hm_web to sign-up.');
        return; // do nothing
    }

    var n = $(this).attr("imageNumber");
    $('#g-right li img').removeClass('active');
    $(this).addClass('active');

    // get real image number
    var sr = jQuery(this).attr('src');
    // extract the number from the string
    var idS = sr.split('_');
    var idSS = idS[4];
    var id = parseFloat(idSS).toFixed(0);

    SliceNumber = addZeros(id, 4);
    update(id);
});

function findPosC(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return [curleft, curtop];
    }
}

function putSliceNrAsThal(id) {
    // update the mm location in the side view
    var thal = -(id - 955) * 70 / 1000.0;
    var pos = -1.27 * thal - 17;
    var talpos = (thal / 0.97).toFixed(2);
    jQuery('#slice-location-thal').html('<span id="slice-location-thal-text">' + thal + ' mm</span>');
    jQuery('#slice-location-thal').css('left', pos + 'px');
    jQuery('.Talar').html('<span id="slice-location-thal-text">' + thal + ' mm (' + talpos + ' mm)</span>');
}

function ACPCpos(id) {
    var y = (49 / 2304 * (id - 55) - 316).toFixed(4);
    jQuery('#AC-PC').css('top', y + 'px');
}

// update everything
function update(id, _maplocation, _mapZoom) {
    SliceNumber = addZeros(id, 4);
    putSliceNrAsThal(id);
    ACPCpos(id);
    updateBlockface();
    current_slice_path = 'https://s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/HM/Slice_' + addZeros(id, 4) + '/Result';
    if (typeof _maplocation != "undefined" && typeof _mapZoom != "undefined")
        updateMap(SliceNumber, _maplocation, _mapZoom);
    else
        updateMap();
    mpr1.infoOverlayEnabled = true;
    mpr1.setLockPosition(false, false, false);
    pos = mpr1.getPosition();
    mrId = parseInt(id / 2400 * 511);
    mpr1.setPosition(pos[0], pos[1], mrId);
    mpr1.infoOverlayEnabled = false;
    mpr1.setLockPosition(false, false, true);
    mpr1.scoutLineColor = "rgb(127,29,49)";
    resizeMRIDiv();
    resizeMapDiv();
    resizeSegDiv();
    var medium_src = './data/Blockface/MEDIUM/2500_FINAL_HM_Blockface_' + SliceNumber + '_MEDIUM.jpg';
    medium_src = 'getBlockface.php?h=' + SliceNumber;
    //medium_src = medium_src.replace("TINY","MEDIUM");
    $("#left-box img").attr("src", medium_src);

    $("#left-box #img-title").html("SECTION NUMBER " + SliceNumber);

    //This loads the label file.
    var lab = new Image();
    lab.onload = function () {
        can = document.getElementById('labeldisplay').getContext('2d');
        can.drawImage(lab, 0, 0, 521, 457);
        //$('#type').text('ready');
    }

    lab.src = "/hm_web/data/Segmented/" + seglabel;

    //Shows labels on hover over blockface
    $('#blockface_label').mousemove(function (e) {
        bfloc = findPosC(this);
        cX = e.clientX;
        cY = e.pageY;
        bX = bfloc[0];
        bY = bfloc[1];
        sY = parseFloat(jQuery('#segmented').css('top'));
        sX = parseFloat(jQuery('#segmented').css('left'));
        var mouseX = -sX + cX - bfloc[0] + 0.5;
        var mouseY = -sY + cY - bfloc[1] + 10;
        var can = document.getElementById('labeldisplay').getContext('2d');
        var imageData = can.getImageData(mouseX, mouseY, 1, 1);
        var labelValue = imageData.data;
        $('#type').text(nameForKey(labelValue[0])[0].replace(/_/g, ' ')// + ' ' + labelValue[0] + ' ' + mouseX + ' ' + mouseY + ' ' + sX + ' ' + sY
        );
    });
}

function resizeMapDiv() {
    //Resize the height of the div containing the map.
    //Do not call any map methods here as the resize is called before the map is created.
    var d = document.getElementById("map");
    var offsetTop = 0;
    var w = jQuery('#tabs-1').width();
    var w1 = w * .974;
    var h = w * .917; h = h.toFixed(0);
    jQuery('#map').css({ 'width': w1 + "px" });
    jQuery('#map').css({ 'height': h + "px" });
    jQuery('#tabs-1').css({ 'height': h + "px" });
    if (h >= 0) {
        jQuery('#map').css({ 'height': h + "px" });
    }
    for (var elem = d; elem != null; elem = elem.offsetParent) {
        offsetTop += elem.offsetTop;
    }
    jQuery('#open-info-viewer-googlebrain').css('top', -jQuery('#map').height() - 37);
    jQuery('#open-info-viewer-googlebrain').css('left', jQuery('#map').width() - 17);
    jQuery('#open-info-viewer-googlebrain').fadeIn('slow');

    jQuery('#open-map-overlay').css('top', -jQuery('#map').height() - 33);
    jQuery('#open-map-overlay').css('left', jQuery('#map').width() - 18);
    jQuery('#open-map-overlay').fadeIn('slow');

    jQuery('#open-add-hotspot-location').css('top', -jQuery('#map').height() - 29);
    jQuery('#open-add-hotspot-location').css('left', jQuery('#map').width() - 18);
    jQuery('#open-add-hotspot-location').fadeIn('slow');

    jQuery('#open-add-hotspot-notice-location').css('top', -jQuery('#map').height() - 25);
    jQuery('#open-add-hotspot-notice-location').css('left', jQuery('#map').width() - 18);
    jQuery('#open-add-hotspot-notice-location').fadeIn('slow');

    jQuery('#open-comparison-viewer').css('top', -jQuery('#map').height() - 22);
    jQuery('#open-comparison-viewer').css('left', jQuery('#map').width() - 17);
    //jQuery('#open-comparison-viewer').fadeIn('slow');

}

function resizeMapDiv2() {
    //Resize the height of the div containing the map.
    //Do not call any map methods here as the resize is called before the map is created.
    var d = document.getElementById("map2");
    var offsetTop = 0;
    var w = jQuery('#map-overlay').width();
    var h = jQuery('#map-overlay').height();
    jQuery('#map2').width(w - 12);
    if (h >= 0) {
        //jQuery('#map2').css({'height': (h-20)+"px"});
        jQuery('#map2').height(h - 12);
    }
    var w2 = jQuery(window).width();
    jQuery('#map-overlay').css('left', (w2 - w) / 2.0);
    for (var elem = d; elem != null; elem = elem.offsetParent) {
        offsetTop += elem.offsetTop;
    }
}

function resizeComparisonViewerDiv() {
    var api = jQuery('#comparison-viewer').data("overlay");
    if (typeof api === "undefined")
        return;

    var w = jQuery('#comparison-viewer').width();
    var h = jQuery('#comparison-viewer').height();
    jQuery('#comparison-viewer-div').width(w);
    if (h >= 0) {
        jQuery('#comparison-viewer-div').height(h);
    }
    jQuery('#comparison-viewer-right').css('width', w / 2 - 2);
    jQuery('#comparison-viewer-left').css('width', w / 2 - 2);
    jQuery('#map3').width(w / 2 - 2);
    jQuery('#map4').width(w / 2 - 2);
    jQuery('#map3').height(h - 2);
    jQuery('#map4').height(h - 2);
    var w2 = jQuery(window).width();
    jQuery('#comparison-viewer').css('left', (w2 - w) / 2.0);
}

function resizeBlockfaceDiv() {
    var api = jQuery('#blockface-overlay').data("overlay");
    if (typeof api === "undefined")
        return;

    var w = jQuery('#blockface-overlay').width();
    var h = jQuery('#blockface-overlay').height();
    jQuery('#blockface-overlay-div').width(w - 12);
    if (h >= 0) {
        jQuery('#blockface-overlay-div').height(h - 12);
    }
    jQuery('#blockface-overlay-div').children().remove();

    //jQuery('#blockface-overlay-div').css('background', 'url(./data/Blockface/LARGE/HM_Blockface_' + SliceNumber + '.jpg) center center no-repeat');
    //var url = 'url(getBlockface.php?h='+SliceNumber + '&type=large) center center no-repeat';
    var url = 'url(getBlockface.php?h=' + SliceNumber + '&type=large) center center no-repeat';
    jQuery('#blockface-overlay-div').css('background', url);
    if (w < h) {
        jQuery('#blockface-overlay-div').css('background-size', (w - 12) + 'px auto');
        //    jQuery('#blockface-overlay-div').append("<center style='background-color: rgb(220,220,220);'><img width='" + (w-20) + "px' height='auto' src='./data/Blockface/LARGE/HM_Blockface_" + SliceNumber + ".jpg' style='vertical-align: middle;'/></center>");
    } else {
        jQuery('#blockface-overlay-div').css('background-size', 'auto ' + (h - 12) + 'px');
        var w2 = jQuery(window).width();
        jQuery('#blockface-overlay').css('left', (w2 - w) / 2.0);
    }

}

function resizeMRIDiv() {
    var d = document.getElementById("tabs-3-1");
    var e = document.getElementById("tabs-3-2");
    var f = document.getElementById("tabs-3-3");
    var g = document.getElementById("win0");
    var h = document.getElementById("win1");
    var i = document.getElementById("win2");
    var w = jQuery('#tabs-1').width();
    var x = w * .978; x = x.toFixed(0);
    var y = x * .83; y = y.toFixed(0);
    var z = y * .1; z = z.toFixed(0);
    d.style.width = e.style.width = f.style.width = d.style.height = e.style.height = f.style.height = x + "px";
    g.style.width = h.style.width = i.style.width = g.style.height = h.style.height = i.style.height = x + "px";


    //	g.style.width=h.style.width=i.style.width=y+"px";
    //	g.style.height=h.style.height=i.style.height=x*.8+"px";
    jQuery('#window0').attr('width', y);
    jQuery('#window1').attr('width', y);
    jQuery('#window2').attr('width', y);
    jQuery('#window0').attr('height', y);
    jQuery('#window1').attr('height', y);
    jQuery('#window2').attr('height', y);
    jQuery('#window0').css({ 'margin-left': z + 'px' });
    jQuery('#window1').css({ 'margin-left': z + 'px' });
    jQuery('#window2').css({ 'margin-left': z + 'px' });
    jQuery('#window0').css({ 'margin-bottom': z + 'px' });
    jQuery('#window1').css({ 'margin-bottom': z + 'px' });
    jQuery('#window2').css({ 'margin-bottom': z + 'px' });
    mpr1.update();
    mpr2.update();
    mpr3.update();

    jQuery('#open-info-viewer-MRI').css('top', -jQuery('#win2').height() - 35);
    jQuery('#open-info-viewer-MRI').css('left', jQuery('#win2').width() + 4);
    jQuery('#open-info-viewer-MRI').fadeIn('slow');
}
function resizeSegDiv() {
    //Resize the height of the div containing the map.
    //Do not call any map methods here as the resize is called before the map is created.
    var w = jQuery('#tabs-1').width();
    var x = w * .977; x = x.toFixed(0);
    var y = x * .88 - 18; y = y.toFixed(0);
    jQuery('#blockface_label').css({ 'width': x + "px" });
    jQuery('#blockface_label').css({ 'height': y + "px" });

    jQuery('#open-info-viewer-segmentation').css('top', -jQuery('#blockface_label').height() - 74);
    jQuery('#open-info-viewer-segmentation').css('left', jQuery('#blockface_label').width() + 1);
    jQuery('#open-info-viewer-segmentation').fadeIn('slow');

}

function resizeInfoViewerGoogleBrain() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-googlebrain').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-googlebrain-content').height(); y= y.toFixed(0);
    jQuery('#info-viewer-googlebrain').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    jQuery('#info-viewer-googlebrain').css('left', parseInt((parseFloat(w) - x) / 2.0) + 'px');
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}

function resizeInfoViewerSegmentation() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-segmentation').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-segmentation-content').height(); y= y.toFixed(0);
    jQuery('#info-viewer-segmentation').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    jQuery('#info-viewer-segmentation').css('left', parseInt((parseFloat(w) - x) / 2.0) + 'px');
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}
function resizeInfoViewerMRI() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-MRI').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-MRI-content').height(); y= y.toFixed(0);  
    jQuery('#info-viewer-MRI').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    jQuery('#info-viewer-MRI').css('left', parseInt((parseFloat(w) - x) / 2.0) + 'px');
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}
function resizeInfoViewerModels() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-models').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-models-content').height(); y= y.toFixed(0);
    jQuery('#info-viewer-models').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    jQuery('#info-viewer-models').css('left', parseInt((parseFloat(w) - x) / 2.0) + 'px');
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}
function resizeInfoViewerBlockface() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-blockface').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-blockface-content').height(); y= y.toFixed(0); 
    jQuery('#info-viewer-blockface').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    //    console.log('margin is:' + (parseFloat(w)-x)/2.0);
    //    console.log('w is: ' + w + ' x is: ' + x);
    jQuery('#info-viewer-blockface').css('left', (parseFloat(w) - x) / 2.0);
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}
function resizeInfoViewerWalkthrough() {
    var w = jQuery(window).width();
    var x = w * .5; x = x.toFixed(0);
    var y = x * .5; y = y.toFixed(0);
    jQuery('#info-viewer-walkthrough').css({ 'width': x + "px" });
    //  var y=jQuery('#info-viewer-walkthrough-content').height(); y= y.toFixed(0);
    jQuery('#info-viewer-walkthrough').css({ 'height': y + "px" });

    //  jQuery('#info-viewer-googlebrain').css('top', -jQuery('#blockface_label').height()-74);
    jQuery('#info-viewer-walkthrough').css('left', parseInt((parseFloat(w) - x) / 2.0) + 'px');
    //  jQuery('#info-viewer-googlebrain').fadeIn('slow');

}

function updateBlockface() {
    bfname = "2500_FINAL_HM_Blockface_" + SliceNumber + "_MEDIUM.jpg";
    segname = "colorwash_snapshot_" + SliceNumber + ".jpg";
    seglabel = "grayscale_snapshot_" + SliceNumber + ".png";
    talairach = "grid.png";
    $('#Blockface').attr('src', './data/Blockface/MEDIUM/"+bfname+"');
    //		    $('.Blockface').css('background-repeat', "no-repeat");
    $('.BlockfaceLabel').css('background', "url('/hm_web/data/Segmented/" + segname + "')");
    $('.BlockfaceLabel').css('background-repeat', "no-repeat");
    $('#section').text('Section ' + SliceNumber);
}

function showMe(it, box) {
    //	var vis = (box.checked) ? "block" : "none";
    document.getElementById(it).style.display = vis;
}

//load label names
function nameForKey(num) {
    switch (num) {
        case 0: { return [""]; }
        case 1: { return ["Hippocampus"]; }
        case 2: { return ["Putamen"]; }
        case 3: { return ["Superior_Frontal_Gyrus"]; }
        case 4: { return ["Caudate"]; }
        case 5: { return [""]; }
        case 6: { return [""]; }
        case 7: { return ["Cingulate_Gyrus"]; }
        case 8: { return ["Paracentral_Lobule"]; }
        case 9: { return ["Precentral_Gyrus"]; }
        case 10: { return ["Postcentral_Gyrus"]; }
        case 11: { return ["Parietal_Operculum"]; }
        case 12: { return ["Frontal_Operculum"]; }
        case 13: { return ["Insular_Gyrus"]; }
        case 14: { return ["Claustrum"]; }
        case 15: { return ["Planum_Polare"]; }
        case 16: { return ["Transverse_Temporal_Gyrus"]; }
        case 17: { return ["Planum_Temporale"]; }
        case 18: { return ["Superior_Temporal_Gyrus"]; }
        case 19: { return ["Middle_Temporal_Gyrus"]; }
        case 20: { return ["Inferior_Temporal_Gyrus"]; }
        case 21: { return ["Fusiform_Gyrus"]; }
        case 22: { return ["Parahippocampal_Gyrus"]; }
        case 23: { return ["Entorhinal_Cortex"]; }
        case 24: { return ["Amygdala"]; }
        case 25: { return ["Optic_Tract"]; }
        case 26: { return ["Internal_Globus_Pallidus"]; }
        case 27: { return ["Stria_Terminalis"]; }
        case 28: { return ["Thalamus"]; }
        case 29: { return ["Zona_Incerta"]; }
        case 30: { return ["Substantia_Nigra"]; }
        case 31: { return ["Subthalamic_Nucleus"]; }
        case 32: { return ["Supramarginal_Gyrus"]; }
        case 33: { return ["Lateral_Geniculate_Nucleus"]; }
        case 34: { return ["Medial_Geniculate_Nucleus"]; }
        case 35: { return [""]; }
        case 36: { return ["Red_Nucleus"]; }
        case 37: { return [""]; }
        case 38: { return ["Inferior_Colliculus"]; }
        case 39: { return [""]; }
        case 40: { return [""]; }
        case 41: { return [""]; }
        case 42: { return ["Periaqueductal_Gray"]; }
        case 43: { return [""]; }
        case 44: { return ["Pineal_Gland"]; }
        case 45: { return ["Hippocampal_Commissure"]; }
        case 46: { return ["Precuneus_Gyrus"]; }
        case 47: { return ["Lingual_Gyrus"]; }
        case 48: { return [""]; }
        case 49: { return ["Superior_Parietal_Lobule"]; }
        case 50: { return ["Occipital_Gyrus"]; }
        case 51: { return ["Angular_Gyrus"]; }
        case 52: { return ["Striate_Area"]; }
        case 53: { return ["Parietooccipital_Cortex"]; }
        case 54: { return ["Temporooccipital_Cortex"]; }
        case 55: { return ["Hypothalamus"]; }
        case 56: { return ["Mammillary_Bodies"]; }
        case 57: { return ["Oculomotor_Nerve"]; }
        case 58: { return [""]; }
        case 59: { return ["Middle_Frontal_Gyrus"]; }
        case 60: { return ["Ambiens_Gyrus"]; }
        case 61: { return ["Basal_Nucleus"]; }
        case 62: { return ["Piriform_Cortex"]; }
        case 63: { return ["Accumbens_Nucleus"]; }
        case 64: { return ["Paraterminal_Gyrus"]; }
        case 65: { return ["Inferior_Frontal_Gyrus_Opercular"]; }
        case 66: { return ["Fundus_Region"]; }
        case 67: { return ["Straight_Gyrus"]; }
        case 68: { return ["Posteromedial_Orbital_Lobule"]; }
        case 69: { return ["Area_Piriformis_Insulae"]; }
        case 70: { return ["Posterior_Orbital_Gyrus"]; }
        case 71: { return ["Inferior_Frontal_Gyrus_Triangular"]; }
        case 72: { return ["Basal_Operculum"]; }
        case 73: { return ["Medial_Orbital_Gyrus"]; }
        case 74: { return ["Inferior_Rostal_Gyrus"]; }
        case 75: { return ["Subcallosal_Gyrus"]; }
        case 76: { return ["Inferior_Frontal_Gyrus_Orbital"]; }
        case 77: { return ["Lateral_Orbital_Gyrus"]; }
        case 78: { return ["Middle_Frontopolar_Gyrus"]; }
        case 79: { return ["Inferior_Frontopolar_Gyrus"]; }
        case 80: { return ["Frontomarginal_Gyrus"]; }
        case 81: { return ["Superior_Rostral_Gyrus"]; }
        case 82: { return ["Intermediate_Orbital_Gyrus"]; }
        case 83: { return ["Declive"]; }
        case 84: { return ["Central_Lobule"]; }
        case 85: { return ["Folium"]; }
        case 86: { return ["Lingula"]; }
        case 87: { return ["Tuber"]; }
        case 88: { return ["Culmen"]; }
        case 89: { return ["Uvula"]; }
        case 90: { return ["Nodulus"]; }
        case 91: { return ["Pyramis"]; }
        case 92: { return ["Ala_of_the_Central_Lobule"]; }
        case 93: { return ["Anterior_Quadrangular_Lobule"]; }
        case 94: { return ["Posterior_Quadrangular_Lobule"]; }
        case 95: { return ["Superior_Semilunar_Lobule"]; }
        case 96: { return ["Inferior_Semilunar_Lobule"]; }
        case 97: { return ["Gracile_Lobule"]; }
        case 98: { return ["Biventral_Lobule"]; }
        case 99: { return ["Tonsilla"]; }
        case 100: { return [""]; }
        case 101: { return ["Flocculus"]; }
        case 102: { return ["White_Matter"]; }
        case 103: { return [""]; }
        case 104: { return [""]; }
        case 105: { return ["Optic_Chiasm"]; }
        case 106: { return ["Subcallosal_Area"]; }
        case 107: { return ["Olfactory_Area"]; }
        case 108: { return ["Perirhinal_Cortex"]; }
        case 109: { return [""]; }
        case 110: { return ["Bed_Nucleus_of_the_Stria"]; }
        case 111: { return ["External_Globus_Pallidus"]; }
        case 112: { return ["Anterior_Commissure"]; }
        case 113: { return [""]; }
        case 114: { return [""]; }
        case 115: { return [""]; }
        case 116: { return [""]; }
        case 117: { return [""]; }
        case 118: { return [""]; }
        case 119: { return [""]; }
        case 120: { return [""]; }
        case 121: { return [""]; }
        case 122: { return ["Cerebral_Peduncle"]; }
        case 123: { return [""]; }
        case 124: { return [""]; }
        case 125: { return ["Third_Ventricle"]; }
        case 126: { return [""]; }
        case 127: { return ["Fornix"]; }
        case 128: { return [""]; }
        case 129: { return ["Internal_Capsule"]; }
        case 130: { return ["Lateral_Ventricle"]; }
        case 131: { return ["Striatal_Cell_Bridges"]; }
        case 132: { return ["Pons"]; }
        case 133: { return ["Superior_Cerebellar_Peduncle"]; }
        case 134: { return [""]; }
        case 135: { return [""]; }
        case 136: { return [""]; }
        case 137: { return [""]; }
        case 138: { return [""]; }
        case 139: { return [""]; }
        case 140: { return ["Fimbria"]; }
        case 141: { return [""]; }
        case 142: { return ["Posterior_Commissure"]; }
        case 143: { return ["Cerebral_Aqueduct"]; }
        case 144: { return [""]; }
        case 145: { return ["Optic_Radiation"]; }
        case 146: { return ["Superior_Colliculus"]; }
        case 147: { return ["Indusium_Griseum"]; }
        case 148: { return ["Area_Orbitoinsularis"]; }
        case 149: { return ["Fourth_Ventricle"]; }
        case 150: { return ["Inferior_Olivary_Nucleus"]; }
        case 151: { return ["Cortex"]; }
        case 152: { return ["Lesion"]; }
        case 153: { return ["Olfactory_Tract"]; }
        case 154: { return ["Anterior_Olfactory_Nucleus"]; }
        case 155: { return ["Septal_Nuclei"]; }
        case 156: { return ["Simple_Lobule"]; }
        case 157: { return ["Dentate_Nucleus"]; }
        case 158: { return ["Middle_Cerebellar_Peduncle"]; }
        case 159: { return [""]; }
        case 160: { return ["Removed_MTL_Guess"]; }
        case 161: { return ["Surgical_Clip"]; }
        default: { return [" "]; }
    }
}

var cX = 0; var cY = 0; var rX = 0; var rY = 0;

function UpdateCursorPosition(e) { cX = e.pageX; cY = e.pageY; }
function UpdateCursorPositionDocAll(e) { cX = event.clientX; cY = event.clientY; }

if (document.all) { document.onmousemove = UpdateCursorPositionDocAll; }
else { document.onmousemove = UpdateCursorPosition; }

function AssignPosition(d) {
    if (self.pageYOffset) {
        rX = self.pageXOffset;
        rY = self.pageYOffset;
    }
    else if (document.documentElement && document.documentElement.scrollTop) {
        rX = document.documentElement.scrollLeft;
        rY = document.documentElement.scrollTop;
    }
    else if (document.body) {
        rX = document.body.scrollLeft;
        rY = document.body.scrollTop;
    }
    if (document.all) {
        cX += rX;
        cY += rY;
    }
    //	d.style.left = (cX+10) + "px";
    //	d.style.top = (cY+10) + "px";
}

function HideContent(d) {
    if (d.length < 1) { return; }
    document.getElementById(d).style.display = "none";
}
function ShowContent(d) {
    if (d.length < 1) { return; }
    var dd = document.getElementById(d);
    dd.style.display = "block";
    //	bfloc = findPosC(document.getElementById('blockface_nolabel'))
    //    var mouseX = e.pageX - bfloc[0];
    //    var mouseY = e.pageY - bfloc[1];
}
function ReverseContentDisplay(d) {
    if (d.length < 1) { return; }
    var dd = document.getElementById(d);
    AssignPosition(dd);
    if (dd.style.display == "none") { dd.style.display = "block"; }
    else { dd.style.display = "none"; }
}

var locationBySlice = {};
locationBySlice['0199'] = { centerLat: 44.43137917475613, centerLng: -35.5078125 };
locationBySlice['0235'] = { centerLat: 42.38852556705306, centerLng: -34.1015625 };
locationBySlice['0271'] = { centerLat: 28.726182356515025, centerLng: -17.2265625 };
locationBySlice['0307'] = { centerLat: 39.195599922646224, centerLng: -21.4453125 };
locationBySlice['0343'] = { centerLat: 40.27696080353267, centerLng: -5.9765625 };
locationBySlice['0379'] = { centerLat: 71.2291387369125, centerLng: -90.3515625 };
locationBySlice['0415'] = { centerLat: 71.67642594903772, centerLng: -93.8671875 };
locationBySlice['0433'] = { centerLat: 65.85538134683627, centerLng: -93.1640625 };
locationBySlice['0487'] = { centerLat: 65.85538134683627, centerLng: -93.1640625 };
locationBySlice['0523'] = { centerLat: 65.85538134683627, centerLng: -90.3515625 };
locationBySlice['0559'] = { centerLat: 65.85538134683627, centerLng: -87.5390625 };
locationBySlice['0595'] = { centerLat: 65.85538134683627, centerLng: -84.0234375 };
locationBySlice['0631'] = { centerLat: 65.85538134683627, centerLng: -87.5390625 };
locationBySlice['0649'] = { centerLat: 65.85538134683627, centerLng: -88.2421875 };
locationBySlice['0667'] = { centerLat: 65.85538134683627, centerLng: -82.6171875 };
locationBySlice['0703'] = { centerLat: 65.85538134683627, centerLng: -86.1328125 };
locationBySlice['0721'] = { centerLat: 65.85538134683627, centerLng: -88.2421875 };
locationBySlice['0739'] = { centerLat: 65.85538134683627, centerLng: -85.4296875 };
locationBySlice['0775'] = { centerLat: 65.85538134683627, centerLng: -79.8046875 };
locationBySlice['0793'] = { centerLat: 65.85538134683627, centerLng: -80.5078125 };
locationBySlice['0811'] = { centerLat: 65.85538134683627, centerLng: -85.4296875 };
locationBySlice['0847'] = { centerLat: 65.85538134683627, centerLng: -75.5859375 };
locationBySlice['0883'] = { centerLat: 65.85538134683627, centerLng: -76.9921875 };
locationBySlice['0901'] = { centerLat: 65.85538134683627, centerLng: -72.7734375 };
locationBySlice['0919'] = { centerLat: 65.85538134683627, centerLng: -74.8828125 };
locationBySlice['0955'] = { centerLat: 65.85538134683627, centerLng: -72.7734375 };
locationBySlice['0973'] = { centerLat: 65.85538134683627, centerLng: -77.6953125 };
locationBySlice['0991'] = { centerLat: 65.85538134683627, centerLng: -74.8828125 };
locationBySlice['1027'] = { centerLat: 65.85538134683627, centerLng: -69.2578125 };
locationBySlice['1063'] = { centerLat: 65.85538134683627, centerLng: -63.6328125 };
locationBySlice['1099'] = { centerLat: 65.85538134683627, centerLng: -64.3359375 };
locationBySlice['1135'] = { centerLat: 65.85538134683627, centerLng: -63.6328125 };
locationBySlice['1171'] = { centerLat: 65.85538134683627, centerLng: -60.8203125 };
locationBySlice['1207'] = { centerLat: 65.85538134683627, centerLng: -58.0078125 };
locationBySlice['1855'] = { centerLat: 65.85538134683627, centerLng: -72.7734375 };
locationBySlice['1891'] = { centerLat: 65.85538134683627, centerLng: -72.7734375 };
locationBySlice['1927'] = { centerLat: 65.85538134683627, centerLng: -76.9921875 };
locationBySlice['1963'] = { centerLat: 65.85538134683627, centerLng: -78.3984375 };
locationBySlice['1999'] = { centerLat: 65.85538134683627, centerLng: -86.1328125 };
locationBySlice['2035'] = { centerLat: 24.963092337069753, centerLng: -5.9765625 };
locationBySlice['2071'] = { centerLat: 22.38760541276085, centerLng: -3.1640625 };
locationBySlice['2107'] = { centerLat: 27.48579875372881, centerLng: -5.9765625 };
locationBySlice['2143'] = { centerLat: 36.982317556959366, centerLng: -21.4453125 };
locationBySlice['2179'] = { centerLat: 45.426939316192815, centerLng: -22.8515625 };
locationBySlice['2215'] = { centerLat: 56.045621879849854, centerLng: -34.1015625 };
locationBySlice['2251'] = { centerLat: 59.77682973372056, centerLng: -39.7265625 };
locationBySlice['2287'] = { centerLat: 60.47722221435968, centerLng: -52.3828125 };
locationBySlice['2359'] = { centerLat: 36.982317556959366, centerLng: 1.0546875 };

function tileURL(a, b) {
    // pervent wrap around
    if (a.y < 0 || a.y >= (1 << b)) {
        return null;
    }
    if (a.x < 0 || a.x >= (1 << b)) {
        return null;
    }
    var c = Math.pow(2, b);
    var d = a.x;
    var e = a.y;
    var f = "t";
    for (var g = 0; g < b; g++) {
        c = c / 2;
        if (e < c) {
            if (d < c) { f += "q" }
            else { f += "r"; d -= c }
        } else {
            if (d < c) { f += "t"; e -= c }
            else { f += "s"; d -= c; e -= c }
        }
    }
    subdirs = 3;
    tmp = "";
    if (f.length >= subdirs) { // subdivide into sub-directories
        for (i = 0; i < subdirs; i++) {
            tmp += f.charAt(i) + "/";
        }
    }
    tmp += f;
    return current_slice_path + "/" + tmp + ".jpg";
}
function tileURL2(a, b) {
    // pervent wrap around
    if (a.y < 0 || a.y >= (1 << b)) {
        return null;
    }
    if (a.x < 0 || a.x >= (1 << b)) {
        return null;
    }
    var c = Math.pow(2, b);
    var d = a.x;
    var e = a.y;
    var f = "t";
    for (var g = 0; g < b; g++) {
        c = c / 2;
        if (e < c) {
            if (d < c) { f += "q" }
            else { f += "r"; d -= c }
        } else {
            if (d < c) { f += "t"; e -= c }
            else { f += "s"; d -= c; e -= c }
        }
    }
    subdirs = 3;
    tmp = "";
    if (f.length >= subdirs) { // subdivide into sub-directories
        for (i = 0; i < subdirs; i++) {
            tmp += f.charAt(i) + "/";
        }
    }
    tmp += f;
    return alternate_slice_path + "/" + tmp + ".jpg";
}

function updateMap(_SliceNumber, _maplocation, _zoom) {
    var maxZoom = 11;
    var initialZoom = 1;

    // change zoom level based on size of region

    if (typeof _zoom != "undefined")
        initialZoom = _zoom;

    var customMapOptions = {
        getTileUrl: tileURL,
        isPng: false,
        maxZoom: maxZoom,
        minZoom: 1,
        tileSize: new google.maps.Size(256, 256),
        radius: 1738000,
        name: "HM",
        streetViewControl: false
    };
    if (typeof SliceNumber !== "undefined"
        && (SliceNumber < 379 || SliceNumber > 1999)) {
        initialZoom = 0;
        maxZoom = 10;
        var customMapOptions = {
            getTileUrl: tileURL,
            isPng: false,
            maxZoom: maxZoom,
            minZoom: 0,
            tileSize: new google.maps.Size(256, 256),
            radius: 1738000,
            name: "HM",
            streetViewControl: false
        };
    }
    if (typeof SliceNumber !== "undefined"
        && (SliceNumber < 91 || SliceNumber > 2359)) {
        initialZoom = -1;
        maxZoom = 9;
        var customMapOptions = {
            getTileUrl: tileURL,
            isPng: false,
            maxZoom: maxZoom,
            minZoom: -1,
            tileSize: new google.maps.Size(256, 256),
            radius: 1738000,
            name: "HM",
            streetViewControl: false
        };
    }
    var customMapType = new google.maps.ImageMapType(customMapOptions);

    var centreLat = 66.70383915858723;
    var centreLon = -48.1640625;
    if (typeof SliceNumber !== "undefined" &&
        typeof locationBySlice[SliceNumber] !== "undefined") {
        centreLat = locationBySlice[SliceNumber].centerLat;
        centreLon = locationBySlice[SliceNumber].centerLng;
    }
    if (typeof _maplocation != "undefined") {
        centreLat = _maplocation[0];
        centreLon = _maplocation[1];
    }

    var mycenter = new google.maps.LatLng(centreLat, centreLon);
    var myOptions = {
        center: mycenter,
        zoom: initialZoom,
        mapTypeControlOptions: {
            mapTypeIds: ['map']
        },
        mapTypeId: 'map',
        backgroundColor: "#FFFFFF",
        zoomControl: true,
        scrollwheel: true,
        streetViewControl: false,
        draggableCursor: 'crosshair',
        overviewMapControl: true,
        overviewMapControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT
        }
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    map.mapTypes.set('HM', customMapType);
    map.setMapTypeId('HM');
    //map.enableScrollWheelZoom();
    //map.enableContinuousZoom();

    google.maps.event.addListener(map, "bounds_changed", function (event) {
        // sO.draw();
        // line drawn on screen is 100px == 200micron
        var mz = customMapOptions.maxZoom;
        var st = document.getElementById('scaleText');
        //        if (typeof str === "undefined")
        //	  return;
        var zoomDif = (mz + 1) - map.getZoom();
        var dif = 20 / zoomDif; // 20x is our max zoom, added factor of 2.0
        var siz1 = (50 * 0.37 * Math.pow(2, zoomDif - 1));
        var unit1 = '&micro;m ';
        if (siz1 > 1000) {
            siz1 = (siz1 / 1000.0).toFixed(1);
            unit1 = 'mm ';
        }
        var siz2 = (20 / Math.pow(2, zoomDif - 1)).toFixed(2);
        st.innerHTML = siz1 + unit1 //+ "<span title=\"magnification of objective\">[" + siz2 + "x" + "]</span>";
        jQuery('.gmnoprint a').html('Google Terms of Use');
    });


    google.maps.event.addListener(map, 'mousewheel DOMMouseScroll', function (e) {
        if (!e) {
            e = window.event
        }
        if (e.preventDefault) {
            e.preventDefault()
        }
        e.returnValue = false;
    });

    // switch on comparison viewer if slice has a comparison slice available
    if (typeof SliceNumber !== "undefined") {
        var found = false;
        for (var i = 0; i < alternate_pairings.length; i++) {
            if (alternate_pairings[i][0] == SliceNumber) {
                jQuery('#open-comparison-viewer').fadeIn('slow');
                found = true;
                break;
            }
        }
        if (found == false)
            jQuery('#open-comparison-viewer').fadeOut();
    }
}

/*Pairing for comparison viewer*/
var alternate_slice_path = "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/GoogleBrain/HM/Slice_1207/Result";
var alternate_pairings = [["1243", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0009/Slice_1234/Result"],
["1171", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0015/Slice_1162/Result"],
["0811", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0001/Slice_0718/Result"],
["1315", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0009/Slice_1306/Result"],
["0739", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0009/Slice_0730/Result"],
["0955", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0009/Slice_0947/Result"],
["1027", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-AG-0015/Slice_0910/Result"]
];

if (user_name == "jannese") {
    alternate_pairings.push(["1207", "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/Subjects/TBO-ME-0028/Slice_0671/Result"]);
}

var shift_3_to_4 = [0, 0];

// Comparison viewer update
function updateMap34() {

    alternate_slice_path = "//s3-us-west-1.amazonaws.com/test-patient-hm/GoogleBrain/RM/Slice_1234/Result";
    for (var i = 0; i < alternate_pairings.length; i++) {
        if (SliceNumber == alternate_pairings[i][0]) {
            alternate_slice_path = alternate_pairings[i][1];
            break;
        }
    }
    var customMapOptions = {
        getTileUrl: tileURL,
        isPng: false,
        maxZoom: 11,
        minZoom: 0,
        tileSize: new google.maps.Size(256, 256),
        radius: 1738000,
        name: "HM",
        streetViewControl: false
    };
    var customMapType = new google.maps.ImageMapType(customMapOptions);
    var customMapOptions2 = {
        getTileUrl: tileURL2,
        isPng: false,
        maxZoom: 11,
        minZoom: 0,
        tileSize: new google.maps.Size(256, 256),
        radius: 1738000,
        name: "HM",
        streetViewControl: false
    };
    var customMapType2 = new google.maps.ImageMapType(customMapOptions2);

    initialZoom = 1;
    var centreLat = 66.70383915858723;
    var centreLon = -48.1640625;
    if (typeof SliceNumber !== "undefined" &&
        typeof locationBySlice[SliceNumber] !== "undefined") {
        centreLat = locationBySlice[SliceNumber].centerLat;
        centreLon = locationBySlice[SliceNumber].centerLng;
    }

    var mycenter = new google.maps.LatLng(centreLat, centreLon);
    var myOptions = {
        center: mycenter,
        zoom: initialZoom,
        mapTypeControlOptions: {
            mapTypeIds: ['map3']
        },
        mapTypeId: 'map3',
        backgroundColor: "#FFFFFF",
        draggableCursor: 'crosshair',
        zoomControl: true,
        scrollwheel: true,
        streetViewControl: false,
        overviewMapControl: true,
        overviewMapControlOptions: {
            opened: true,
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT
        }
    };
    map3 = new google.maps.Map(document.getElementById("map3"), myOptions);
    map3.mapTypes.set('HM', customMapType2);
    map3.setMapTypeId('HM');
    map4 = new google.maps.Map(document.getElementById("map4"), myOptions);
    map4.mapTypes.set('HM', customMapType);
    map4.setMapTypeId('HM');
    //map.enableScrollWheelZoom();
    //map.enableContinuousZoom();

    google.maps.event.addListener(map4, "zoom_changed", function (event) {
        var zoom = map4.getZoom();
        map3.setZoom(zoom);
    });
    google.maps.event.addListener(map4, "center_changed", function (event) {
        var center = map4.getCenter();
        var newPos = new google.maps.LatLng(center.lat() - shift_3_to_4[0], center.lng() - shift_3_to_4[1]);

        map3.setCenter(newPos); // keep the old shift
    });

    google.maps.event.addListener(map3, "drag", function () {
        var cent3 = map3.getCenter();
        var cent4 = map4.getCenter();
        shift_3_to_4 = [cent4.lat() - cent3.lat(), cent4.lng() - cent3.lng()];
    });

    google.maps.event.addListener(map3, "bounds_changed", function (event) {

        // sO.draw();
        // line drawn on screen is 100px == 200micron
        var mz = customMapOptions.maxZoom;
        var st = document.getElementById('scaleText2');
        var zoomDif = (mz + 1) - map3.getZoom();
        var dif = 20 / zoomDif; // 20x is our max zoom, added factor of 2.0
        var siz1 = (50 * 0.37 * Math.pow(2, zoomDif - 1));
        var unit1 = '&micro;m ';
        if (siz1 > 1000) {
            siz1 = (siz1 / 1000.0).toFixed(1);
            unit1 = 'mm ';
        }
        var siz2 = (20 / Math.pow(2, zoomDif - 1)).toFixed(2);
        st.innerHTML = siz1 + unit1 //+ "<span title=\"magnification of objective\">[" + siz2 + "x" + "]</span>"
            ;
        //st.innerHTML = siz1 + unit1 + siz2 + "x ";

        // st.innerHTML = (100 * 0.37*2.0 * Math.pow(2, zoomDif - 1)) + '&micro;m ' + (20 / Math.pow(2, zoomDif-1)).toFixed(1) + "x ";
        jQuery('.gmnoprint a').html('Google Terms of Use');
    });


    google.maps.event.addListener(map3, 'mousewheel DOMMouseScroll', function (e) {
        if (!e) {
            e = window.event
        }
        if (e.preventDefault) {
            e.preventDefault()
        }
        e.returnValue = false;
    });
    google.maps.event.addListener(map4, "bounds_changed", function (event) {
        // sO.draw();
        // line drawn on screen is 100px == 200micron
        var mz = customMapOptions.maxZoom;
        var st = document.getElementById('scaleText2');
        var zoomDif = (mz + 1) - map3.getZoom();
        var dif = 20 / zoomDif; // 20x is our max zoom, added factor of 2.0
        var siz1 = (50 * 0.37 * Math.pow(2, zoomDif - 1));
        var unit1 = '&micro;m ';
        if (siz1 > 1000) {
            siz1 = (siz1 / 1000.0).toFixed(1);
            unit1 = 'mm ';
        }
        var siz2 = (20 / Math.pow(2, zoomDif - 1)).toFixed(2);
        st.innerHTML = siz1 + unit1 //+ "<span title=\"magnification of objective\">[" + siz2 + "x" + "]</span>"
            ;
        //st.innerHTML = siz1 + unit1 + siz2 + "x ";

        // st.innerHTML = (100 * 0.37*2.0 * Math.pow(2, zoomDif - 1)) + '&micro;m ' + (20 / Math.pow(2, zoomDif-1)).toFixed(1) + "x ";
        jQuery('.gmnoprint a').html('Google Terms of Use');
    });


    google.maps.event.addListener(map4, 'mousewheel DOMMouseScroll', function (e) {
        if (!e) {
            e = window.event
        }
        if (e.preventDefault) {
            e.preventDefault()
        }
        e.returnValue = false;
    });
}

function updateMap2() {
    var customMapOptions = {
        getTileUrl: tileURL,
        isPng: false,
        maxZoom: 11,
        minZoom: 0,
        tileSize: new google.maps.Size(256, 256),
        radius: 1738000,
        name: "HM",
        streetViewControl: false
    };
    var customMapType = new google.maps.ImageMapType(customMapOptions);

    initialZoom = 1;
    var centreLat = 66.70383915858723;
    var centreLon = -48.1640625;
    if (typeof SliceNumber !== "undefined" &&
        typeof locationBySlice[SliceNumber] !== "undefined") {
        centreLat = locationBySlice[SliceNumber].centerLat;
        centreLon = locationBySlice[SliceNumber].centerLng;
    }

    var mycenter = new google.maps.LatLng(centreLat, centreLon);
    var myOptions = {
        center: mycenter,
        zoom: initialZoom,
        mapTypeControlOptions: {
            mapTypeIds: ['map2']
        },
        mapTypeId: 'map2',
        backgroundColor: "#FFFFFF",
        draggableCursor: 'crosshair',
        zoomControl: true,
        scrollwheel: true,
        streetViewControl: false,
        overviewMapControl: true,
        overviewMapControlOptions: {
            opened: true,
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT
        }
    };
    map2 = new google.maps.Map(document.getElementById("map2"), myOptions);
    map2.mapTypes.set('HM', customMapType);
    map2.setMapTypeId('HM');
    //map.enableScrollWheelZoom();
    //map.enableContinuousZoom();

    google.maps.event.addListener(map2, "bounds_changed", function (event) {
        // sO.draw();
        // line drawn on screen is 100px == 200micron
        var mz = customMapOptions.maxZoom;
        var st = document.getElementById('scaleText2');
        var zoomDif = (mz + 1) - map2.getZoom();
        var dif = 20 / zoomDif; // 20x is our max zoom, added factor of 2.0
        var siz1 = (50 * 0.37 * Math.pow(2, zoomDif - 1));
        var unit1 = '&micro;m ';
        if (siz1 > 1000) {
            siz1 = (siz1 / 1000.0).toFixed(1);
            unit1 = 'mm ';
        }
        var siz2 = (20 / Math.pow(2, zoomDif - 1)).toFixed(2);
        st.innerHTML = siz1 + unit1 //+ "<span title=\"magnification of objective\">[" + siz2 + "x" + "]</span>"
            ;
        //st.innerHTML = siz1 + unit1 + siz2 + "x ";

        // st.innerHTML = (100 * 0.37*2.0 * Math.pow(2, zoomDif - 1)) + '&micro;m ' + (20 / Math.pow(2, zoomDif-1)).toFixed(1) + "x ";
        jQuery('.gmnoprint a').html('Google Terms of Use');
    });


    google.maps.event.addListener(map2, 'mousewheel DOMMouseScroll', function (e) {
        if (!e) {
            e = window.event
        }
        if (e.preventDefault) {
            e.preventDefault()
        }
        e.returnValue = false;
    });
}

var current_slice_path = "/hm_web/GoogleBrain/Subjects/HM/Slice_1207/Result";
if (typeof user_1279 !== "undefined" && user_1279 == "1") {
    current_slice_path = "/hm_web/GoogleBrain/Subjects/HM/Slice_1279/Result";
}

$(document).ready(function () {


    $.extend($.fn.disableTextSelect = function () {
        return this.each(function () {
            if ($.browser.mozilla) {//Firefox
                $(this).css('MozUserSelect', 'none');
            } else if ($.browser.msie) {//IE
                $(this).bind('selectstart', function () { return false; });
            } else {//Opera, etc.
                $(this).mousedown(function () { return false; });
            }
        });
    });
    $('.noSelect').disableTextSelect();//No text selection on elements with a class of 'noSelect'


    // if the user presses the next slide button we should go to the next slide
    jQuery('#walkthrough-scroll-next').click(function () {
        // what is the currently displayed div?
        var thisDiv = 0;
        var thisLocation = jQuery('.walkthrough').scrollTop();
        var slides = jQuery('.walkthrough .slide');
        var minDist, location, winnerPos;
        var first = true;
        var locations = new Array();
        jQuery.each(slides, function (index, value) {
            //var pos = jQuery(value).offset().top;
            var pos = thisLocation + jQuery(value).position().top;
            var pos2 = jQuery(value).position().top;
            var pos3 = jQuery('.walkthrough')[0].scrollHeight;
            locations[index] = pos;
            if (first) {
                first = false;
                winnerPos = pos;
                minDist = Math.abs(pos - thisLocation);
                thisDiv = index;
            }
            if (Math.abs(pos - thisLocation) < minDist) {
                minDist = Math.abs(pos - thisLocation);
                thisDiv = index;
                winnerPos = pos;
            }
        });

        // scroll to the next
        var nextDiv = thisDiv + 1;
        if (nextDiv > locations.length - 1) {
            nextDiv = 0;
        }
        jQuery('.walkthrough').animate({ scrollTop: locations[nextDiv] }, 'slow');

    });
    jQuery('#walkthrough-scroll-prev').click(function () {
        // what is the currently displayed div?
        var thisDiv = 0;
        var thisLocation = jQuery('.walkthrough').scrollTop();
        var slides = jQuery('.walkthrough .slide');
        var minDist, location, winnerPos;
        var first = true;
        var locations = new Array();
        jQuery.each(slides, function (index, value) {
            //var pos = jQuery(value).offset().top;
            var pos = thisLocation + jQuery(value).position().top;
            var pos2 = jQuery(value).position().top;
            var pos3 = jQuery('.walkthrough')[0].scrollHeight;
            locations[index] = pos;
            if (first) {
                first = false;
                winnerPos = pos;
                minDist = Math.abs(pos - thisLocation);
                thisDiv = index;
            }
            if (Math.abs(pos - thisLocation) < minDist) {
                minDist = Math.abs(pos - thisLocation);
                thisDiv = index;
                winnerPos = pos;
            }
        });

        // scroll to the next
        var nextDiv = thisDiv - 1;
        if (nextDiv < 0) {
            nextDiv = locations.length - 1;
        }
        jQuery('.walkthrough').animate({ scrollTop: locations[nextDiv] }, 'slow');

    });

    //$('#rad-sub-nav li a').last().css('background-image', 'none');
    //$('#sub-nav li a').last().css('background-image', 'none');
    jQuery('#model-interface').buttonset();

    for (var i = 0; i < jQuery('#model-interface').children().length / 2.0; i++) { // set all buttons to off
        jQuery('#model-' + i).attr('checked', false).button("refresh");
    }
    AEROTWIST.A3.Sample.finishedLoading = function () {
        //jQuery('#model-5').trigger('change');
    };

    jQuery('#model-interface :checkbox').change(function () {
        var buttonChanged = jQuery(this).attr('id');
        // If we pressed something other than "BRAIN SURFACE" make sure that 
        // "BRAIN SURFACE" is off.
        //if (buttonChanged != "model-5") {
        //  jQuery('#model-5').attr('checked', false);
        //  jQuery('#model-interface').buttonset('refresh');
        //}

        for (var i = 0; i < AEROTWIST.A3.Sample.geometries.length; i++) {
            // jQuery('#model-'+i).attr('checked',false).button("refresh");
            if (jQuery('#model-' + i).attr('checked')
                && AEROTWIST.A3.Sample.geometries[i] == null) {
                var b = i; // make a local copy, don't reference the parents i
                AEROTWIST.A3.Sample.loadThis(b, function () {
                    AEROTWIST.A3.Sample.geometries[b].visible = jQuery('#model-' + b).attr('checked');
                });

            } else {
                if (AEROTWIST.A3.Sample.geometries[i] !== null)
                    AEROTWIST.A3.Sample.geometries[i].visible = jQuery('#model-' + i).attr('checked');
            }
        }
    });
    //jQuery('#model-5').attr('checked',true).button("refresh");
    //jQuery('#model-6').attr('checked',true).button("refresh");

    jQuery('#open-info-viewer-models').css('top', -jQuery('#model_container').height() + 1);
    jQuery('#open-info-viewer-models').css('left', jQuery('#model_container').width() - 18);
    jQuery('#open-info-viewer-models').fadeIn('slow');

    jQuery('#open-info-viewer-blockface').fadeIn('slow');

    jQuery('#open-info-viewer-walkthrough').css('top', -jQuery('#guided').height() + 194);
    jQuery('#open-info-viewer-walkthrough').css('left', jQuery('#guided').width() - 18);
    jQuery('#open-info-viewer-walkthrough').fadeIn('slow');

    jQuery('#open-blockface-overlay').fadeIn('slow');

    jQuery('#open-add-hotspot-location').live('click', function () {
        jQuery('#add-hotspot-location').live('onLoad', function () {
            jQuery('#add-hotspot-location').css('width', 300);
            jQuery('#add-hotspot-location').css('height', 100);
        });
        jQuery('#add-hotspot-location').dialog({
            modal: true,
            title: "Add location to the <a href='/hm_web/data/hotspots/process.php?query=display' target='hotspot viewer' style=\"text-decoration:none;color:#7f1d31;\">Histological Slide Box</a>",
            closeOnClick: false,
            effect: 'apple',
            buttons: {
                "Cancel": function () {
                    jQuery('#add-hotspot-location').dialog('close');
                    return false;
                },
                "Submit": function () {
                    var location = map.getCenter();
                    var zoom = map.getZoom();
                    var numTiles = 1 << map.getZoom();
                    var projection = map.getProjection();
                    var worldCoordinate = projection.fromLatLngToPoint(location);
                    var pixelCoordinate = new google.maps.Point(
                        worldCoordinate.x * numTiles,
                        worldCoordinate.y * numTiles);
                    var tileCoordinate = new google.maps.Point(
                        Math.floor(pixelCoordinate.x / 256),
                        Math.floor(pixelCoordinate.y / 256));
                    var tile = tileURL(tileCoordinate, zoom);
                    // submit the data to hotspot
                    jQuery.ajax({
                        type: "POST",
                        url: '/hm_web/data/hotspots/process.php?callback=success',
                        data: {
                            user: user_name == "" ? "anonymous" : user_name,
                            add: jQuery('#hotspot-location-title').val(),
                            body: jQuery('#hotspot-location-body').val().replace(/\n/g, '<br />'),
                            location: "[" + SliceNumber + "," + location.lat() + "," + location.lng() + "," + zoom + "," + tile + "]"
                        },
                        dataType: 'jsonp',
                        context: document.body,
                        success: function (data) { // this is very strange, we should use success here, but it does not work...
                            jQuery('#add-hotspot-location').dialog('close');

                            // show a dialog that adding the hotspot was successful
                            jQuery('#add-hotspot-location-success').dialog({
                                modal: true,
                                title: "Added hotspot location",
                                closeOnClick: false,
                                effect: 'apply',
                                load: true,
                                buttons: {
                                    "OK": function () { jQuery('#add-hotspot-location-success').dialog('close'); }
                                }
                            });
                        }
                    });
                    return false;
                }
            },
            load: true
        });
    });

    jQuery('#open-add-hotspot-notice-location').live('click', function () {
        jQuery('#add-hotspot-notice-location').live('onLoad', function () {
            jQuery('#add-hotspot-notice-location').css('width', 300);
            jQuery('#add-hotspot-notice-location').css('height', 100);
        });
        jQuery('#add-hotspot-notice-location').dialog({
            modal: true,
            title: "REPORT LOCATION",
            closeOnClick: false,
            effect: 'apple',
            buttons: {
                "Cancel": function () {
                    jQuery('#add-hotspot-notice-location').dialog('close');
                    return false;
                },
                "Submit": function () {
                    var location = map.getCenter();
                    var zoom = map.getZoom();
                    var numTiles = 1 << map.getZoom();
                    var projection = map.getProjection();
                    var worldCoordinate = projection.fromLatLngToPoint(location);
                    var pixelCoordinate = new google.maps.Point(
                        worldCoordinate.x * numTiles,
                        worldCoordinate.y * numTiles);
                    var tileCoordinate = new google.maps.Point(
                        Math.floor(pixelCoordinate.x / 256),
                        Math.floor(pixelCoordinate.y / 256));
                    var tile = tileURL(tileCoordinate, zoom);
                    // submit the data to hotspot
                    jQuery.ajax({
                        type: "POST",
                        url: '/hm_web/data/hotspots-notice/process.php?callback=success',
                        data: {
                            user: user_name == "" ? "anonymous" : user_name,
                            add: jQuery('#hotspot-notice-location-title').val(),
                            body: jQuery('#hotspot-notice-location-body').val().replace(/\n/g, '<br />'),
                            location: "[" + SliceNumber + "," + location.lat() + "," + location.lng() + "," + zoom + "," + tile + "]"
                        },
                        dataType: 'jsonp',
                        context: document.body,
                        success: function (data) { // this is very strange, we should use success here, but it does not work...
                            jQuery('#add-hotspot-notice-location').dialog('close');
                            // show a dialog that adding the hotspot was successful
                            jQuery('#add-hotspot-notice-location-success').dialog({
                                modal: true,
                                title: "Problem reported successfully",
                                closeOnClick: false,
                                effect: 'apply',
                                load: true,
                                buttons: {
                                    "OK": function () { jQuery('#add-hotspot-notice-location-success').dialog('close'); }
                                }
                            });
                        }
                    });
                    return false;
                }
            },
            load: true
        });
    });

    jQuery('#open-comparison-viewer').live('click', function () {
        setTimeout("resizeComparisonViewerDiv();", 200);
        jQuery('#comparison-viewer').live('onLoad', function () {
            updateMap34();
            resizeComparisonViewerDiv();
        });
        jQuery('#comparison-viewer').overlay({
            closeOnClick: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#comparison-viewer').data("overlay");
        api.onBeforeLoad = function () {
            updateMap34();
            resizeComparisonViewerDiv();
        };
        api.load();
    });

    jQuery('#open-blockface-overlay').click(function () {
        jQuery('#blockface-overlay').overlay({
            closeOnClick: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#blockface-overlay').data("overlay");
        api.onBeforeLoad = function () {
            resizeBlockfaceDiv();
        };
        api.load();
    });


    /* based on the screen size, load minimal tab content to save initial loading time */
    LoadTabContent(2, function () {
        jQuery('#open-map-overlay').click(function () {
            setTimeout("resizeMapDiv2();", 200);
            jQuery('#map-overlay').overlay({
                closeOnClick: false,
                effect: 'apple',
                mask: {
                    color: '#fff',
                    loadSpeed: 200,
                    opacity: 0.5
                }
            });
            var api = jQuery('#map-overlay').data("overlay");
            jQuery('#map-overlay').on('onLoad', function () {
                updateMap2();
                resizeMapDiv2();
                map2.setCenter(map.getCenter());
                map2.setZoom(map.getZoom() + 1);
            });
            api.load();
        });
        jQuery('#open-info-viewer-googlebrain').on('click', function () {
            jQuery('#info-viewer-googlebrain').overlay({
                oneInstance: false,
                closeOnClick: false,
                effect: 'apple',
                mask: {
                    color: '#fff',
                    loadSpeed: 200,
                    opacity: 0.5
                }
            });
            var api = jQuery('#info-viewer-googlebrain').data("overlay");
            api.onBeforeLoad = function () {
                resizeInfoViewerGoogleBrain();
            };
            api.load();
            jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
        });

    });


    jQuery('#open-info-viewer-segmentation').on('click', function () {
        jQuery('#info-viewer-segmentation').overlay({
            oneInstance: false,
            closeOnClick: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#info-viewer-segmentation').data("overlay");
        api.onBeforeLoad = function () {
            resizeInfoViewerSegmentation();
        };
        api.load();
        jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
    });

    jQuery('#open-info-viewer-MRI').on('click', function () {
        jQuery('#info-viewer-MRI').overlay({
            oneInstance: false,
            closeOnClick: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#info-viewer-MRI').data("overlay");
        api.onBeforeLoad = function () {
            resizeInfoViewerMRI();
        };
        api.load();
        jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
    });

    jQuery('#open-info-viewer-models').on('click', function () {
        jQuery('#info-viewer-models').overlay({
            closeOnClick: false,
            oneInstance: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.9
            }
        });
        var api = jQuery('#info-viewer-models').data("overlay");
        api.onBeforeLoad = function () {
            resizeInfoViewerModels();
            return false;
        };
        api.load();
        jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
    });

    jQuery('#open-info-viewer-blockface').on('click', function () {
        jQuery('#info-viewer-blockface').overlay({
            closeOnClick: false,
            oneInstance: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#info-viewer-blockface').data("overlay");
        api.onBeforeLoad = function () {
            resizeInfoViewerBlockface();
        };
        api.load();
        jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
    });

    jQuery('#open-info-viewer-walkthrough').on('click', function () {
        jQuery('#info-viewer-walkthrough').overlay({
            closeOnClick: false,
            oneInstance: false,
            effect: 'apple',
            mask: {
                color: '#fff',
                loadSpeed: 200,
                opacity: 0.5
            }
        });
        var api = jQuery('#info-viewer-walkthrough').data("overlay");
        api.onBeforeLoad = function () {
            resizeInfoViewerWalkthrough();
        };
        api.load();
        jQuery('img[src=non]').remove(); //ugly hack to remove broken image showing up
    });

    mpr1 = new mpr(0);
    mpr1.scoutLineColor = "rgb(127,29,49)";
    mpr1.setVoxelSize([1, 1, 1]);
    mpr1.setFlipSliceDirections([false, false, false]);
    mpr1.bindWindow("#window0", [0, 1, 0]);
    mpr1.bindWindow("#window1", [0, 0, 1]); // make sure that cross-hair is syncronized
    mpr1.bindWindow("#window2", [1, 0, 0]); // make sure that cross-hair is syncronized
    mpr1.setCacheSize(3); // speed up display by caching 1 image only
    mpr1.setPatientInformation("H.M.", "March 2009", "T1", "none");
    mpr1.setDataPath('data/JPEGS/T1');
    mpr1.infoOverlayEnabled = false;
    mpr1.setLockPosition(false, false, true);
    mpr2 = new mpr(1);
    mpr2.scoutLineColor = "rgb(127,29,49)";
    mpr2.setVoxelSize([1, 1, 1]);
    mpr2.setFlipSliceDirections([false, false, false]);
    //mpr2.bindWindow("#window1", [0,0,1]);
    mpr2.setCacheSize(3); // speed up display by caching 1 image only
    mpr2.setPatientInformation("H. M.", "2012/02/02", "T1", "none");
    mpr2.setDataPath('data/JPEGS/T1');
    mpr3 = new mpr(2);
    mpr3.scoutLineColor = "rgb(127,29,49)";
    mpr3.setVoxelSize([1, 1, 1]);
    mpr3.setFlipSliceDirections([false, false, false]);
    //mpr3.bindWindow("#window2", [1,0,0]);
    mpr3.setCacheSize(3); // speed up display by caching 1 image only
    mpr3.setPatientInformation("H. M.", "2012/02/02", "T1", "none");
    mpr3.setDataPath('data/JPEGS/T1');

    SliceNumber = "1207";
    if (typeof user_1279 !== "undefined" && user_1279 == "1") {
        SliceNumber = "1279";
    }

    if (typeof slice != "undefined" && slice != "") {
        SliceNumber = slice;
    }
    if (typeof maplocation != "undefined" && maplocation != "") {
        initialMapLocation = maplocation;
    }
    if (typeof mapZoom != "undefined" && mapZoom != "") {
        initialMapZoom = mapZoom;
    }
    resizeMRIDiv();
    if (typeof maplocation != "undefined" &&
        typeof mapZoom != "undefined" &&
        typeof slice != "undefined")
        updateMap(SliceNumber, initialMapLocation, initialMapZoom);
    else
        updateMap();
    resizeMapDiv();
    $('#Blockface').attr("src", "/hm_web/data/Blockface/MEDIUM/2500_FINAL_HM_Blockface_" + SliceNumber + "_MEDIUM.jpg");
    //		    $('.Blockface').css('background-repeat', "no-repeat");
    $('#section').text('Section ' + SliceNumber);
    $("#tabs-1 #id").css("height", $('#tabs-1').width() * .917);
    $(".ui-autocomplete-input").val("Search by structure or slice number");
    /*			
                      $('#search').live('click', searchFunc);
                $('#search-icon-small').live('click', searchFunc);
                $(".jcarousel-next").live('click',searchFunc);
                $(".jcarousel-prev").live('click',searchFunc);
                $(".ui-menu-item").live('click',searchFunc);
                $("#search-box #label").live('keyup',function(){
                if($("#ui-complete-input").val()=='Search by Brain Region')
                    $("#ui-complete-input").val('');
                searchFunc;
            });
    */
    if ($(".six.columns").width() == 268 || $(".six.columns").width() == 300) {
        document.getElementById("label").size = 25;
    } else if ($(".six.columns").width() == 420) {
        document.getElementById("label").size = 42;
    } else {
        document.getElementById("label").size = 36;
    }


    //This loads the label file.
    var lab = new Image();
    lab.onload = function () {
        can = document.getElementById('labeldisplay').getContext('2d');
        can.drawImage(lab, 0, 0, 521, 457);
        //$('#type').text('ready');
    }

    //This loads the colored labels.
    var img = new Image();
    lab.src = "/hm_web/data/Segmented/grayscale_snapshot_" + SliceNumber + ".png";
    //Shows labels on hover over blockface
    //			$('#blockface_label').mousemove(function(e) {
    //	        bfloc = findPosC(this);
    //			cX = e.clientX;
    //			cY = e.pageY;
    //			bX = bfloc[0];
    //			bY = bfloc[1];
    //			var mouseX = cX - bfloc[0];
    //			var mouseY = cY - bfloc[1];
    //			var can = document.getElementById('labeldisplay').getContext('2d');
    //			var imageData = can.getImageData(mouseX, mouseY, 1, 1);	
    // 	                var labelValue = imageData.data;
    //			$('#type').text(nameForKey(labelValue[0])[0].replace(/_/g,' ')+ ' ' + mouseX + ' ' + mouseY
    //										);
    //			});
    jQuery('.slide').click(function () {
        if (typeof user_1279 !== "undefined" && user_1279 == "1") {
            alert('This functionality is only available for users with a valid account. Go to thedigitalbrainlibrary.org/hm_web to sign-up.');
            return; // do nothing if not logged in
        }

        var slice = jQuery(this).attr('mapLocationSlice');
        var lat = jQuery(this).attr('mapLocationLat');
        var lng = jQuery(this).attr('mapLocationLng');
        var tab = jQuery(this).attr('tab');
        var mprlocation1 = jQuery(this).attr('mprLocation1');
        var mprlocation2 = jQuery(this).attr('mprLocation2');
        var mprlocation3 = jQuery(this).attr('mprLocation3');
        if (typeof slice === "undefined")
            return;
        var zoom = parseFloat(jQuery(this).attr('mapLocationZoom'));
        if (SliceNumber != slice)
            update(slice);
        map.setCenter(new google.maps.LatLng(lat, lng));
        map.setZoom(zoom);
        centerToTab(parseFloat(tab).toFixed(0));
        if (typeof mprlocation1 !== "undefined" &&
            typeof mprlocation2 !== "undefined" &&
            typeof mprlocation3 !== "undefined") {
            mpr1.setPosition(parseInt(mprlocation1),
                parseInt(mprlocation2),
                parseInt(mprlocation3));
        }

        //jQuery(this).parent().animate({ scrollTop: jQuery(this).offset().top }, 1000);
    });
    if (typeof maplocation != "undefined") // in case we have an initial map location 
        setTimeout("update( \"" + SliceNumber + "\", [" + initialMapLocation[0] + "," + initialMapLocation[1] + "], " + initialMapZoom + " );", 1000);
    else
        setTimeout("update( \"" + SliceNumber + "\" );", 1000); // display the first image

});






var lastID = 0;
function mycarousel_itemLoadCallback(carousel, state) {
    for (var i = carousel.first; i <= carousel.last; i++) {
        if (carousel.has(i * 2 - 1)) {
            // continue;
        }

        if (i > Math.ceil(current_itemList.length / 2)) {
            break;
        }

        //carousel.add(i, mycarousel_getItemHTML(mycarousel_itemList[i-1]));
        carousel.add(i, mycarousel_getItemHTML(i * 2 - 2))
    }
    jQuery('.jcarousel-item img').hover(function () {
        var sr = jQuery(this).attr('src');
        // extract the number from the string
        var idS = sr.split('_');
        var idSS = idS[4];
        var id = parseFloat(idSS).toFixed(0);
        if (id != lastID) {
            jQuery('#g-left-img').attr('src', './data/KeyFrames/line' + addZeros(id, 4) + '.png').fadeIn('fast');
            lastID = id;
        }
        // update the mm location in the side view
        putSliceNrAsThal(id);
    });
};

/**
 * Item html creation helper.
 */
function mycarousel_getItemHTML(I) {
    //return '<img src="' + item.url + '" width="75" height="75" alt="' + item.url + '" />';
    item_0 = current_itemList[I];
    itemHTML = '<a href="javascript:void(0);"><img src="' + item_0.url + '" width="98" alt="' + item_0.title + '" imageNumber="' + (I + 1) + '"/></a>';
    if (current_itemList.length - 1 > I) {
        item_1 = current_itemList[I + 1];
        itemHTML += '<a href="javascript:void(0);"><img src="' + item_1.url + '" width="98" alt="' + item_1.title + '" imageNumber="' + (I + 2) + '"/></a>';
    }
    return itemHTML;
};

function addZeros(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

jQuery(document).ready(function () {
    load_carousel(mycarousel_itemList);
});

var current_itemList;
var j_scroll;

function load_carousel(itemList) {
    if (itemList.length == 0) {
        itemList = mycarousel_itemList;
    }
    current_itemList = itemList;
    j_scroll = Math.floor((parseInt($("#g-right").css("width")) - 28) / 102);
    jQuery('#mycarousel').jcarousel({
        size: Math.ceil(itemList.length / 2),
        scroll: j_scroll,
        vertical: false,
        rows: 2,
        itemLoadCallback: { onBeforeAnimation: mycarousel_itemLoadCallback },
    });
    if (current_itemList.length != mycarousel_itemList.length) {
        $("#mycarousel img").addClass("found");
    }
    else {
        //	jQuery('#mycarousel').jcarousel('scroll',1);
    }
};
function newPopup(url) {
    popupWindow = window.open(
        url, 'popUpWindow', 'height=740,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes')
};

