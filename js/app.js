"use strict"

// graphs

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
// let data = [2, 4, 6, 8]
const pie = d3.pie()
// console.log(pie(data))

// generating the sector arcs
const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius);

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

// end graphs

const fetchDirectory = async (path) => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  const data = await api_call.json();
  return {data: data, name: "fetchDirectory"}
}

const fetchFileCommits = async (path) => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`);
  const data = await api_call.json();
  return {data: data, name: "fetchFileCommits"}
}

const fetchBlame = async (path) => {
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
                blame(path: \"${path}\") {
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

const fetchRepositoryContents = async (path) => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
  const data = await api_call.json();
  data.tree.sort((a,b)=>{
    if (a.type==="tree")
    {
      a.size=0
    } else if (b.type==="tree") {
      b.size=0
    }
    if (a.size > b.size) {
      return -1;
    } else if (b.size > a.size) {
      return 1;
    } else {
      return 0;
    }
  })
  return {data: data.tree, name: "fetchRepositoryContents"}
}




const showData = (callback,path) => {
  owner = ownerRef.value
  repo = repoNameRef.value
  // Very Janky Solution. Reset History Only If New Search Is Made
  // Fortunately this occurs when path is an empty string
  if (path==="")
  {
      root.resetHistory()
  }

  callback(path).then((res) => {
    if (res.name==="fetchDirectory")
    {
        resetTable() // Reset the table HTMl
        initialiseRoot(res.data) // Add files and folder into Repository class
        processFiles() // Display files and folders
        displayTable() // Unhide the table
    } else if (res.name === "fetchFileCommits")
    {
      // console.log(res.data)
    } else if (res.name === "fetchBlame")
    {
      let blameRange = res.data.data.repository.defaultBranchRef.target.blame.ranges
      produceBlameTally(blameRange)
    } else if (res.name === "fetchRepositoryContents")
    {
      displayLargestFiles(res.data)
    }
  })
}

// This function will display the folders in the root
const initialiseRoot = (res) => {
    for (let i=0;i<res.length;i++)
    {
        if (res[i].type==="dir")
        {
            root.root.addFolder(res[i].path,res[i].name)
        } else if (res[i].type==="file")
        {
            root.root.addFile(res[i].path,res[i].name)
        }

    }
}

const processFiles = () => {
    let folders = []
    let files = []
    let fileRef = {folderRef: folders, fileRef : files}

    for (let file in root.contents())
    {
      let fileType = root.contents()[file].constructor.name

      if (fileType==="File")
      {
          files.push(root.contents()[file])
      } else if (fileType==="Folder")
      {
          folders.push(root.contents()[file])
      }
    }

    for (let key in fileRef)
    {
      for (let i=0;i<fileRef[key].length;i++)
      {
          let row = document.createElement("tr")

          //Creating Icon Column
          let icon = document.createElement("td")
          icon.className = "mdl-data-table__cell--non-numeric"
          if (key==="folderRef")
          {
            icon.innerHTML = "<i class=\"material-icons\">folder</i>"
          } else if (key==="fileRef")
          {
            icon.innerHTML = "<i class=\"material-icons transparent-file-button\">description</i>"
          }

          //Creating File Name Column
          let fileName = document.createElement("td")
          fileName.innerText = fileRef[key][i].name // The name of the file or folder
          //Appending all columns to row

          //Creating Filler Column for Icon
          let filler = document.createElement("td")

          //Adding event listener to row for clicking. Execute function if row is clicked
          row.addEventListener("click", () => clickedFileOrFolder(row))
          row.appendChild(icon);
          row.appendChild(fileName)
          row.appendChild(filler)
          //Appending row to columns
          repositoryDispRef.appendChild(row)
      }
    }

}

// This function clears the tables
const resetTable = () => {
    repositoryDispRef.innerHTML = ""
    filePathRef.innerText = ""
    fileNameRef.innerText = ""
    root.resetRoot()
}

const clickedFileOrFolder = (el) => {
    let iconType = el.children[0].innerText // File or Folder
    let fileName = el.children[1].innerText // File/Folder Name

    if (selectedRef!==undefined) // Reset colour of previous row
    {
        selectedRef.style.backgroundColor = "rgba(255,255,255,1)"
    }
    selectedRef = el
    if (iconType==="description") // The file icon has the name of "description"
    {
        let filePath = root.contents()[fileName].path
        fileNameRef.innerText = fileName
        filePathRef.innerText = filePath
        showData(fetchFileCommits,filePath)
        showData(fetchBlame,filePath)
        el.style.backgroundColor = "rgba(255,64,129,0.11)" // Change background colour to indicate it has been picked

    } else if (iconType==="folder") // The folder icon has the name of "folder"
    {
        let nextPath = root.contents()[fileName].path // Extract path of the folder
        root.addDirectory(nextPath) // We need to store the path so the user can backtrack if requried
        showData(fetchDirectory,nextPath)
    }
}

const clickLargestFile = (el) => {
  let filePath = el.children[1].innerText
  let filePathArray = filePath.split("/")
  let fileName = filePathArray[filePathArray.length-1]

  if (selectedRef!==undefined) // Reset colour of previous row
  {
      selectedRef.style.backgroundColor = "rgba(255,255,255,1)"
  }
  // Updating current position of highhlighted cell
  selectedRef = el
  el.style.backgroundColor = "rgba(255,64,129,0.11)" // Change background colour to indicate it has been picked
  // Quering for file commit information
  showData(fetchBlame, filePath)
  // Adjusting the text in the file path and name table
  fileNameRef.innerText = fileName
  filePathRef.innerText = filePath
}


const goBack = () => {
    let length = root.history.length
    if (length>1) // No folder to go back to when already at root of repository
    {
        let oldPath = root.history[length-2] // -1 Since we need to account for indexes starting at 0. -1 since we need second last element
        root.removeDirectory() // Remove last element from root history since we are moving up the folder progression
        showData(fetchDirectory, oldPath)
    }
}

const search = (e) => {
  if (e.keyCode===13)
  {
    showData(fetchDirectory,"")
    showData(fetchRepositoryContents)
  }
}




// This function console logs an object containing the number of commits done
// to a file by a specific user. The tally object has a user's name as the
// key. Thus making searching through the object more efficient and avoiding
// the use of our own searching algorithm
// Key principle is if a name is not already defined wthin the tally object. it must be
// a new collaborator. If not than increment value already existing within the tally by the
// the number of lines changed
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
  drawArcs(sortedTally.slice(0, 5).map(e => e.score))
  displayTally(sortedTally)
}


// This functio sorts the tally objects into a sorted array and then returns it. This
// array contains objects with name and score of a collaborator
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

const displayTally = (sortedTally) => {
    commitsToFileRef.innerHTML = "";
    let indexLength = sortedTally.length
    for (let i=0;i<5&&i<indexLength;i++)
    {
      let row = document.createElement("tr")
      //Creating Ranking Column
      let ranking = document.createElement("td")
      ranking.innerText = i+1 // ranking={1,2,3,.....}
      //Creating Author Column
      let author = document.createElement("td")
      author.innerText = sortedTally[i].name
      //Creating Total Column
      let total = document.createElement("td")
      total.innerText = sortedTally[i].score
      //Appending all columns to row
      row.appendChild(ranking);row.appendChild(author);row.appendChild(total)
      //Appending row to columns
      commitsToFileRef.appendChild(row)
    }
}

const displayLargestFiles = (sortedLargestFiles) => {
    largestFileRef.innerHTML = "";
    let indexLength = sortedLargestFiles.length
    for (let i=0;i<5&&i<indexLength;i++)
    {
      let row = document.createElement("tr")
      //Creating Ranking Column
      let ranking = document.createElement("td")
      ranking.innerText = i+1 // ranking={1,2,3,.....}
      ranking.className = "icon-col"
      //Creating File Path Column
      let filePath = document.createElement("td")
      filePath.innerText = sortedLargestFiles[i].path
      filePath.className = "author-col"
      //Creating Size Column
      let size = document.createElement("td")
      size.innerText = sortedLargestFiles[i].size
      //Appending all columns to row
      row.appendChild(ranking);row.appendChild(filePath);row.appendChild(size)
      row.addEventListener("click",()=>{clickLargestFile(row)})
      //Appending row to columns
      largestFileRef.appendChild(row)
    }

}
let repositoryDispRef = document.getElementById("repositoryList")
let fileNameRef = document.getElementById("fileName")
let filePathRef = document.getElementById("filePath")
let ownerRef = document.getElementById("owner_id");
let largestFileRef = document.getElementById("listOfLargestFiles")
let repoNameRef = document.getElementById("repo_name_id")
let commitsToFileRef = document.getElementById("listOfFileCommits")
let selectedRef,owner,repo;

let root = new Repository()


// Add event listener for enter keypresss
document.addEventListener("keypress",search)

owner = ownerRef.value
repo = repoNameRef.value
