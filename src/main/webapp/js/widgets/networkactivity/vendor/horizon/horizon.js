/* 
 * 
 * THIS PLUGIN HAS BEEN MODIFIED  it is no longer associated with the plugin on GitHub
 * 
 * */
(function() {
  d3.horizon = function() {
    var mode = "offset", // or mirror
        area = d3.svg.area(),
        defined,
        x = d3_horizonX,
        y = d3_horizonY,
        width = 1024,
        height = 40;
    var dataValues = function(d){return d;};
    var color = ["rgba(0,0,0,0)","#FFF"];

    // For each small multiple…
    function horizon(g) {
      g.each(function(d) {
        var g = d3.select(this),
            xMin = Infinity,
            xMax = -Infinity,
            x0, // old x-scale
            y0, // old y-scale
            t0,
            id; // unique id for paths
        var yMin = (d.yMin == null || undefined)?Infinity:d.yMin;
        var yMax = (d.yMax == null || undefined)?-Infinity:d.yMax;
        // Compute x- and y-values along with extents.
        var data = dataValues(d).map(function(d, i) {
	            var xv = x.call(this, d, i),
	            yv = y.call(this, d, i);
	        if (xv < xMin) xMin = xv;
	        if (xv > xMax) xMax = xv;
	        if (yv > yMax) yMax = yv;
	        if (yv < yMin) yMin = yv;
	        return [xv, yv];
	    });
        d.yMin = yMin;
        d.yMax = yMax;
        var bands = color.length;
        
        var heightUsed = (height instanceof Function)? height(d):+height;

        // Compute the new x- and y-scales, and transform.
        var x1 = d3.scale.linear().domain([xMin, xMax]).range([0, width]),
            y1 = d3.scale.linear().domain([yMin, yMax]).range([0, heightUsed*bands]),
            t1 = d3_horizonTransform(bands, heightUsed, mode);

        // Retrieve the old scales, if this is an update.
        if (this.__chart__) {
          x0 = this.__chart__.x;
          y0 = this.__chart__.y;
          t0 = this.__chart__.t;
          id = this.__chart__.id;
        } else {
          x0 = x1.copy();
          y0 = y1.copy();
          t0 = t1;
          id = ++d3_horizonId;
        }

        // We'll use a defs to store the area path and the clip path.
        var defs = g.selectAll("defs")
            .data([null]);

        // The clip path is a simple rect.
        defs.enter().append("defs").append("clipPath")
            .attr("id", "d3_horizon_clip" + id)
            .append("rect")
            .attr("width", width)
            .attr("height", heightUsed);

        d3.transition(defs.select("rect"))
            .attr("width", width)
            .attr("height", heightUsed);

        // We'll use a container to clip all horizon layers at once.
        g.selectAll("g")
            .data([null])
          .enter().append("g")
            .attr("clip-path", "url(#d3_horizon_clip" + id + ")");

        // Instantiate each copy of the path with different transforms.
        var path = g.select("g").selectAll("path")
            .data(d3.range(0,bands,1));

        if (defined) area.defined(function(_, i) { return defined.call(this, d[i], i); });

        var d0 = area
            .x(function(d) { return x0(d[0]); })
            .y0(heightUsed * bands)
            .y1(function(d) { return heightUsed * bands - y0(d[1]); })
            (data);

        var d1 = area
            .x(function(d) { return x1(d[0]); })
            .y1(function(d) { return heightUsed * bands - y1(d[1]); })
            (data);

        path.enter().append("path")
            .style("fill", function(d){return color[d];})
            .attr("transform", t0)
            .attr("d", d0);

        d3.transition(path)
            .style("fill", function(d){return color[d];})
            .attr("transform", t1)
            .attr("d", d1);

        d3.transition(path.exit())
            .attr("transform", t1)
            .attr("d", d1)
            .remove();

        // Stash the new scales.
        this.__chart__ = {x: x1, y: y1, t: t1, id: id};
      });
    }



    horizon.mode = function(_) {
      if (!arguments.length) return mode;
      mode = _ + "";
      return horizon;
    };

    horizon.colors = function(_) {
      if (!arguments.length) return color;
      color = _;
      return horizon;
    };

    horizon.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return horizon;
    };

    horizon.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return horizon;
    };

    horizon.width = function(_) {
      if (!arguments.length) return width;
      width = +_;
      return horizon;
    };

    horizon.height = function(_) {
      if (!arguments.length && !(_ instanceof Function )) return height;
      height = _;
      return horizon;
    };

    horizon.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return horizon;
    };
    
    horizon.dataValues = function(_) {
        if (!arguments.length) return dataValues;
        dataValues = _;
        return horizon;
    };

    return d3.rebind(horizon, area, "interpolate", "tension");
  };

  var d3_horizonId = 0;

  function d3_horizonX(d) { return d[0]; }
  function d3_horizonY(d) { return d[1]; }

  function d3_horizonTransform(bands, h, mode) {
    return mode == "offset"
        ? function(d) { return "translate(0," + (d-bands) * h + ")"; }
        : function(d) { return (d < 0 ? "scale(1,-1)" : "") + "translate(0," + (d - bands) * h + ")"; };
  }
})();
