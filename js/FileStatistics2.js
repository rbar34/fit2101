
let fileName = localStorage.getItem('fileName')
let filePath = localStorage.getItem('filePath')
let owner = localStorage.getItem('owner')
let repo = localStorage.getItem('repo');
let barData,pieData;
let highestTotal = 0;
let listOfMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct", "Nov", "Dec"]
// Adding Repository name and owner dynamically
document.getElementById("ownerAndRepo").innerHTML = `${owner} / ${repo}`
// Adding file name dynamically
document.getElementById("pathTitle").innerHTML = fileName
// Finish DOM Update

// Extracting contributor data from file path
const fetchBlame = async () => {
  let token = "f2b9718ec12238fcbdc7bdf6345bae4f1bf61615"
  const api_call = await fetch('https://api.github.com/graphql', {
      method: 'POST',
    headers: {
        'Authorization': `bearer ${token}`
    },
    body: JSON.stringify({
      query: `query {
          repository(owner:\"${owner}\", name:\"${repo}\") {
          defaultBranchRef {
              target {
              ... on Commit {
                  blame(path: \"${filePath}\") {
                  ranges {
                      startingLine
                    endingLine
                    age
                    commit {
                      author {
                          user {
                          login
                        }
                      }
                    }
                  }
                }
            }
            }
        }
        }
    }`
})
  })
  const data = await api_call.json();
  return {data: data, name: "fetchBlame"}
}

const fetchDateAndChanges = async () => {
  let token = "f2b9718ec12238fcbdc7bdf6345bae4f1bf61615"
  let yearAgoDate = retrieveOneYearAgoDate()
  const api_call = await fetch('https://api.github.com/graphql', {
      method: 'POST',
    headers: {
        'Authorization': `bearer ${token}`
    },
    body: JSON.stringify({
      query: `query {
        repository(owner: "${owner}", name: "${repo}") {
          object(expression: "master") {
            ... on Commit {
              history(first: 50, path: "${filePath}") {
                edges {
                  node {
                    additions
                    deletions
                    committedDate
                    author {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
    }`
})
  })
  const data = await api_call.json();
  return {data: data, name: "fetchDateAndChanges"}
}

// This function returns a date object of today's date - 1 year
// September 29th June 2019 => September 29th June 2018
function retrieveOneYearAgoDate() {
  let today = new Date()
  // Subtracting 1 year from today's date
  today.setFullYear(today.getFullYear()-1)
  today.setDate(1)
  return today
}

const showData = async (callback,MODE) => {
  let res = await callback()

    if (res.name === "fetchBlame")
    {
      let blameRange = res.data.data.repository.defaultBranchRef.target.blame.ranges
      produceBlameTally(blameRange)
    }
    else if (res.name === "fetchDateAndChanges")
    {
      let statsRange = res.data.data.repository.object.history.edges
      produceStatsAndDateTally(statsRange,MODE)
    }

}


const syncedDisplay = async (MODE) => {
  document.getElementById("pie").innerHTML = ""
  document.getElementById("bar").innerHTML = ""
  //await showData(fetchDateAndChanges,MODE)
  //await showData(fetchBlame)
  await Promise.all([showData(fetchDateAndChanges,MODE),showData(fetchBlame)])
  displayData(MODE)
}

const produceStatsAndDateTally = (statsRange,MODE) => {
    let tallyOfContributors = produceTallyOfContributors(statsRange)
    let tallyOfMonths = {}
    try {
      for (let i=0;i<statsRange.length;i++)
      {
        let author = statsRange[i].node.author.user.login
        let changes = statsRange[i].node.additions + statsRange[i].node.deletions
        let commitDate = new Date(statsRange[i].node.committedDate)
        let month = listOfMonths[commitDate.getMonth()]
        let year = commitDate.getFullYear()

        if (tallyOfMonths[month+"-"+year]==undefined) {
          let newMonth = Object.assign({},tallyOfContributors)
          newMonth.month = month
          tallyOfMonths[month+"-"+year] = newMonth
        }
        tallyOfMonths[month+"-"+year][author] += changes // Points to the correct month
        tallyOfMonths[month+"-"+year].total += changes
      }
    } catch {}
    convertTallyIntoPercent(tallyOfMonths,MODE)
    barData = convertToCompatibleArray(tallyOfContributors,tallyOfMonths)

}

const convertToCompatibleArray = (contributors,monthTally) => {
  let compatibleData = [["Month"]]
  for (let author in contributors) {
    if (author=="total"||author=="month") {continue}
    compatibleData[0].push(author)
  }
  for (let key in monthTally) {
    let month = monthTally[key].month
    let monthSubTally = [key]
    for (let author in monthTally[key]) {
      if (author=="total"||author=="month") {continue}
      monthSubTally.push(monthTally[key][author])
    }
    compatibleData.push(monthSubTally)
  }
  return compatibleData
}

const convertTallyIntoPercent = (tallyOfMonths,MODE) => {
  for (let key in tallyOfMonths) {
    let total = tallyOfMonths[key].total
    if (total>highestTotal) {highestTotal=total}
    if (MODE==="PERCENT") {
      for (let author in tallyOfMonths[key]) {
        if (total==0) {break}
        if (author=="month") {continue}
        let changes = tallyOfMonths[key][author]
        tallyOfMonths[key][author] = Math.round((changes/total)*100)
      }
    }
  }
}

const produceTallyOfContributors = (statsRange) => {
  listOfContributors = {}
  try {
    for (let i=0;i<statsRange.length;i++)
    {
      let author = statsRange[i].node.author.user.login
      if (listOfContributors[author]==undefined)
      {
        listOfContributors[author] = 0
      }
    }
  } catch {}
  listOfContributors.total = 0
  return listOfContributors
}

const produceTallyOfMonths = (filler) => {
  let date = retrieveOneYearAgoDate()
  let tallyOfMonths = {}
  for (let i=0;i<13;i++)
  {
    let month = listOfMonths[date.getMonth()]
    let year = date.getFullYear()
    // Cloning the filler material to prevent cross references
    // and assigning the month to a property for quick access later
    b = Object.assign({},filler)
    b["month"] = month
    //
    tallyOfMonths[month+"-"+year] = b
    date.setMonth(date.getMonth()+1)  // Increment Month
  }
  return tallyOfMonths
}
const produceBlameTally = (blameRange) => {
    let tally = {}
    // As of now. Tally represents the number of commits made to a particular file
  for (let i=0;i<blameRange.length;i++)
  {
      let user = blameRange[i].commit.author.user
    let linesChanged = blameRange[i].endingLine-blameRange[i].startingLine+1
    if (user!==null)
    {
      if (tally[user.login]===undefined)
      {
          tally[user.login] = linesChanged
      } else
      {
          tally[user.login] += linesChanged
        }
    }
}
  let sortedTally = sortTallyIntoArray(tally)
  pieData = sortedTally
}


const sortTallyIntoArray = (unsortedTally) => {
    let unsortedArray = []
    for (let name in unsortedTally)
    {
        let nameScoreInstance = {name: name,score: unsortedTally[name]}
        unsortedArray.push(nameScoreInstance)
    }
    // Sorting unsortedArray that contains names and scores
  unsortedArray.sort((a,b)=>{
      if (a.score > b.score) {
          return -1;
        } else if (b.score > a.score) {
            return 1;
    } else {
        return 0;
    }
})
  return unsortedArray;
}

function outputOfSortedTally(tally) {
    // For the tally input check end of produceBlameTally
    console.log(tally)
}

function displayData(MODE) {
    // Pie chart of top five contributors
    const contributorData = pieData
    let vAxisMax,vAxisTitle;
    if (MODE==="PERCENT") {
      vAxisMax = 100
      vAxisTitle = "% Contribution"
    } else if (MODE==="ABSOLUTE") {
      vAxisMax = highestTotal
      vAxisTitle = "Changes"
    }
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(drawPie);
    google.charts.setOnLoadCallback(drawBar);
    function drawPie() {
        // Define the chart to be drawn.
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Contributor');
        data.addColumn('number', 'Lines');
        data.addRows(
            contributorData.map(e => [e.name, e.score])
        );
        var options = {
            legend: { position: 'top', maxLines: 3 },
        };
        // Instantiate and draw the chart.
        var chart = new google.visualization.PieChart(document.getElementById("pie"));
        chart.draw(data, options);
    }

    function drawBar() {
        // Define the chart to be drawn.
        var data = new google.visualization.arrayToDataTable(barData);
        var options = {
            legend: { position: 'top', maxLines: 3 },
            bar: {groupWidth : "95%"},
            isStacked: true,
            vAxis: {
              title: vAxisTitle,
              viewWindow: {
                min: 0,
                max: vAxisMax
              }
            },
            hAxis: {
              direction: -1
            },
            explorer: {
              axis: "horizontal",
              keepInBounds: true
            }
        };
        // Instantiate and draw the chart.
        var chart = new google.visualization.ColumnChart(document.getElementById("bar"));
        chart.draw(data, options);
    }

};

syncedDisplay("ABSOLUTE")
