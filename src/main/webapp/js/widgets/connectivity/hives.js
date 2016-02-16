/**
 * Connectivity widget
 */


hives = {
   createHiveLayout: function (context) {

       innerRadius = 20,
       outerRadius = 180;

       var angle = d3.scale.ordinal().domain(d3.range(context.dataset.nodeTypes.length + 1)).rangePoints([0, 2 * Math.PI]),
           quali_angle = d3.scale.ordinal().domain(context.dataset.nodeTypes).rangeBands([0, 2 * Math.PI]);
       radius = d3.scale.linear().range([innerRadius, outerRadius]),
           linkTypeScale = d3.scale.category10().domain(context.dataset.linkTypes);
       nodeTypeScale = d3.scale.category20().domain(context.dataset.nodeTypes);

       var nodes = context.dataset.nodes,
           links = [];
       context.dataset.links.forEach(function (li) {
           if (typeof li.target !== "undefined") {
               links.push({source: nodes[li.source], target: nodes[li.target], type: li.type});
           }
       });

       var svg = context.svg.append("g")
           .attr("transform", "translate(" + context.options.innerWidth / 2 + "," + context.options.innerHeight / 2 + ")");

       svg.selectAll(".axis")
           .data(d3.range(context.dataset.nodeTypes.length))
           .enter().append("line")
           .attr("class", "axis")
           .attr("transform", function (d) {
               return "rotate(" + degrees(angle(d)) + ")";
           })
           .attr("x1", radius.range()[0])
           .attr("x2", radius.range()[1]);

       svg.selectAll(".link")
           .data(links)
           .enter().append("path")
           .attr("class", "link")
           .attr("d", d3.hive.link()
               .angle(function (d) {
                   return quali_angle(d.type);
               })
               .radius(function (d) {
                   return radius(d.degree);
               }))
           .style("stroke", function (d) {
               return linkTypeScale(d.type);
           });

       var node = svg.selectAll(".node")
           .data(nodes)
           .enter().append("circle")
           .attr("class", "node")
           .attr("transform", function (d) {
               return "rotate(" + degrees(quali_angle(d.type)) + ")";
           })
           .attr("cx", function (d) {
               return radius(d.degree);
           })
           .attr("r", 5)
           .style("fill", function (d) {
               return nodeTypeScale(d.type);
           });

       node.append("title")
           .text(function (d) {
               return d.id;
           });

       function degrees(radians) {
           return radians / Math.PI * 180 - 90;
       }
   }
}