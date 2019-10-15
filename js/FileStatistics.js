// This file will take the localStorage data from the repo page and load it up for pie-chartification!!!

// Okay so for the timeline, we are just using a stacked bar graph for each day


// This is going to be really messy and silly, but I'm going to directly copy the pie-graph code from navigator.js
// Ideally, I would do something fancy to avoid re-writing the code but I can't think of anything clever right now...
let contributorTable = JSON.parse(localStorage.getItem('fileStats')),
    fileName = localStorage.getItem('fileName'),
    data = contributorTable.slice(0, 5)
document.getElementById("fileStatisticsHeader").innerHTML = fileName

// colour pallette
const colour = d3.scaleOrdinal([
    '#4daf4a',
    '#377eb8',
    '#ff7f00',
    '#984ea3']
)

// referencing svg in HTML
const
    svgii = d3.select("svg"),
    width = svgii.attr("width"),
    height = svgii.attr("height"),
    radius = Math.min(width, height) / 2,
    g = svgii.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

// generating the pie chart
const pie = d3.pie()

// generating the sector arcs
const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

const newArc = d3.arc()
    .innerRadius(3 * radius / 2)
    .outerRadius(radius)


const setArcs = data =>
    g.selectAll("arc") // select all HTML "arc" IDs
        .data(pie(data)) // mutate data to pie(data)
        .enter()
        .append("g")
        .attr("class", "arc")

// draw arc paths
const drawArcs = data =>
    setArcs(data).append("path")
        .attr("fill", function (d, i) {
            return colour(i);
        })
        .attr("d", arc);

document.getElementById("fileTitle").innerHTML = fileName.substring(1,fileName.length-1)
drawArcs(contributorTable.slice(0, 5).map(e => e.score))
