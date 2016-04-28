define(function(require) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/logo/logo.css";
    document.getElementsByTagName("head")[0].appendChild(link);
    
    $("#geppettologo").append('<div class="gpt-gpt_logo"></div>');
})