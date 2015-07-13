define(function(require) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "assets/js/components/dev/logo/logo.css";
    document.getElementsByTagName("head")[0].appendChild(link);
    
    $("#geppettologo").append('<i class="gpt-gpt_logo"></i>');
})