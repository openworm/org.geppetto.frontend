define(function(require) {

    // global functions: required for menu actions (ie. eval'd strings...)
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g, b];
    }

    // to be passed to SceneController.lightUpEntity
    window.voltage_color = function(min, max) {
        if(max == undefined || min == undefined) { min = 0; max = 1; }
        return function(x) {
            x = (x-min)/(max-min);
            var y=(1-x)/0.25;
            var i=Math.floor(y);
            var j=y-i;
            var r, g, b;
            switch(i)
            {
                case 0: r=1;g=j;b=0;break;
                case 1: r=1-j;g=1;b=0;break;
                case 2: r=0;g=1;b=j;break;
                case 3: r=0;g=1-j;b=1;break;
                case 4: r=0;g=0;b=1;break;
            }
            return [r, g, b];
        }
    };

    window.ca_color = function(min, max) {
        if(max == undefined || min == undefined) { min = 0; max = 1; }
        return function(x) {
            x = (x-min)/(max-min); // normalization
            return hslToRgb((120-(90*x))/255.0, 0.5+(0.5*x), 0.2+(0.4*x));
        };
    };

    return {
        defaultLayout: function() {
            return {
                autosize : true,
                width : '100%',
                height : '100%',
                margin: {
                    l: 10,
                    r: 10,
                    b: 40,
                    t: 10,
                    pad: 4
                },
                xaxis: {
                    title: '',
                    range: [],
                    autotick: true,
                    ticks: 'outside',
                    showticklabels: true,
                    nticks: 8,
                    ticklen: 4,
                    tickcolor : 'rgb(255, 255, 255)',
		    tickfont: {
			family: 'Helvetica Neue, sans-serif',
			size : 11,
			color: 'rgb(255, 255, 255)'
		    },
		    titlefont : {
			family: 'Helvetica Neue, sans-serif',
			size : 12,
			color: 'rgb(255, 255, 255)'
		    },
                },
                yaxis: {
                    ticks: '',
                    showticklabels: false
                },
                paper_bgcolor: 'rgba(66, 59, 59, 0.90)',
		plot_bgcolor: 'transparent'
            };
        },

        nbars: 100,
        data: {type: 'heatmap', showscale: false, colorbar: {autotick: false, tick0: 0, dtick: 1}},

        genColorscale: function(min, max, n, f, normalize) {
            // Three.js uses float 0-1 RGB values, here we convert to 0-255
            var scalefn_255 = function(scalefn) {
                return function(x){
                    if (normalize) {
                        x = x/max;
                        if (x < 0) { x = 0; }
                        if (x > 1) { x = 1; }
                    }
                    var r,g,b;
                    [r,g,b] = scalefn(x).map(function(y){ return Math.round(y*255); });
                    return "rgb(" + r + "," + g + "," + b + ")";
                }
            };

            f = scalefn_255(f);
            
            var colorscale = [];
            var step = (max-min)/n;
            var x = min;
            var rgb = [];
            
            for (var i=0; i<n; ++i) {
                colorscale.push([i/n, f(x)]);
                colorscale.push([(i+1)/n, f(x)]);
                x += step;
            }

            return colorscale;
        },

        setScale: function(min, max, scalefn, normalize){
            var colorscale = this.genColorscale(min, max, this.nbars, scalefn, normalize);

            var xdata = [];
            for (var i=0; i<this.nbars; ++i){
                xdata.push(min+(i*(max-min)/this.nbars));
            }

            this.data.x = xdata;
            this.data.z = [[...Array(this.nbars).keys()]];
            if (colorscale != undefined) {
                this.data.colorscale = colorscale;
            }

            return this.data;
        }
    };
});
