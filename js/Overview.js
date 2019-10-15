let largestFileRef = document.getElementById("listOfLargestFiles")
let commitsRef = document.getElementById("listOfCommits");
  let commitsTitleRef = document.getElementById("contributorTitle")
  let commitsTypeRef = document.getElementById("contributorType")
let owner = localStorage.getItem("owner")
let repo = localStorage.getItem("repo")
let numOfContributors = 8
let MENU_STATE = "WEEKLY" // This defines the initial state of the contributor table. When the user opens this page
                          // they will be shown the weekly contributor statistics. This can be changed with the menu

// Adding Repository name and owner dynamically
document.getElementById("ownerAndRepo").innerHTML = `${owner} / ${repo}`
// Finish DOM Update

const fetchRepositoryContents = async () => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
  const data = await api_call.json();
  // Sort files from largest to smallest
  data.tree.sort((a,b)=>{
    // a.size and b.size will be undefined if the particular entry in data.tree is of "commit" or "tree" type
    if (a.size===undefined)
    {
      a.size=0
    } else if (b.size===undefined) {
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

const fetchContributors = async () => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`);
  if (api_call.status===202) {
    // Fetching statistics takes time. Sometimes github API will need some time to prepare them. If so
    // it will send a 202 Response. When this occurs we will recursively call this function until the
    // statistics are prepared
    let res = await fetchContributors()
    return res
  } else if (api_call.status===200) {
    const data = await api_call.json();
    return {data: data, name: "fetchContributors"}
  }
}

const menuContributors = (STATE) => {
  MENU_STATE = STATE
  commitsRef.innerHTML = "" // Reset the contributor table contents

  if (STATE==="TOTAL") {
    commitsTypeRef.innerText = "Commits"
    commitsTitleRef.innerText = "Top Total Contributors"
  } else if (STATE==="WEEKLY") {
    commitsTypeRef.innerText = "Changes"
    commitsTitleRef.innerText = "Top Weekly Contributors"
  }

  spinner = document.createElement("div")
  spinner.className = "mdl-spinner mdl-js-spinner is-active"
  commitsRef.appendChild(spinner)
  componentHandler.upgradeDom()
  syncedDisplay()
}

const processContributors = (res) => {
  let top5 = [];
  let length = res.length-1
  // Contributors are already sorted according to their total number contributions
  if (numOfContributors>0)
  {
    for (let i=length;i>(length-numOfContributors)&&i>=0;i--)
    {
      let row = document.createElement("tr")
      //Creating Ranking Column
      let ranking = document.createElement("td")

      // Adding avatar
      let avatar = document.createElement("img")
      avatar.src = res[i].author.avatar_url
      avatar.width = 50
      avatar.height = 50
      ranking.appendChild(avatar)

      //Creating Author Column
      let author = document.createElement("td")
      author.innerText = res[i].author.login
      author.className = "author"
      //Creating Total Column
      let total = document.createElement("td")
      total.innerText = res[i].total
      //Appending all columns to row
      row.appendChild(ranking);row.appendChild(author);row.appendChild(total)
      row.addEventListener("click",()=>{viewUser(row)})
      //Appending row to columns
      commitsRef.appendChild(row)
    }
  }

}


const showData = async (callback,path) => {
    let res = await callback(owner,repo)
    if (res.name === "fetchRepositoryContents")
    {
      displayLargestFiles(res.data)
    } else if (res.name === "fetchContributors")
    {
      // resetTable() // Clear tables before appending data
      let weekIndex = res.data[0].weeks.length-1
      // Determine whether to display weekly contributor statistics or
      // total contributor statistics
      if (MENU_STATE==="WEEKLY") {
        processCommits(res.data,weekIndex)
      } else if (MENU_STATE==="TOTAL") {
        processContributors(res.data)
      }
    }
  }


const syncedDisplay = async () => {
  await Promise.all([showData(fetchRepositoryContents),showData(fetchContributors)])
  displayTable()
}


const displayLargestFiles = (sortedLargestFiles) => {
    largestFileRef.innerHTML = "";
    let indexLength = sortedLargestFiles.length-1
    // Initialising counters
    let i=-1 // Tracking the files inside sortedLargestFiles
    let j=0 // Tracking number of valid fileExtensions
    while (i<indexLength&&j<numOfContributors)
    {
      // Ignore file extensions that are not source code
      // This is because they will not yield useful contributor information
      i++
      // Repository is so small that folders start being included in the largest file table. Break out of loop if this occurs
      if (sortedLargestFiles[i].type==="tree"||sortedLargestFiles[i].type==="commit") {
        break;
      }
      if (!is_file_valid(sortedLargestFiles[i].path)) {
        continue
      } else {
        j++
      }

      let row = document.createElement("tr")
      //Creating Ranking Column
      let ranking = document.createElement("td")
      ranking.innerText = extractFileName(sortedLargestFiles[i].path) // src/fileExtension/README.md => README.md
      ranking.className = "file-name"
      //Creating File Path Column
      let filePath = document.createElement("td")
      filePath.innerText = sortedLargestFiles[i].path
      filePath.className = "file-path"
      //Creating Size Column
      let size = document.createElement("td")
      size.innerText = (sortedLargestFiles[i].size/(10**6)).toFixed(2)
      size.className = "file-size"
      //Appending all columns to row
      row.appendChild(ranking);row.appendChild(filePath);row.appendChild(size)
      //Adding event listener for clicking on row
      row.addEventListener("click",()=>{viewFileStatistics(row)})
      //row.addEventListener("click",()=>{clickLargestFile(row)})
      //Appending row to columns
      largestFileRef.appendChild(row)
    }

}

const extractFileName = (filePath) => {
  let filePathArray = filePath.split("/")
  let fileName = filePathArray[filePathArray.length-1]
  return fileName
}

const is_file_valid = (filePath) => {
  let filePathSplit = filePath.split("/")
  let fileExtensionList = filePathSplit[filePathSplit.length-1].split(".")
  let fileExtension = fileExtensionList[fileExtensionList.length-1]
  if (validFileExtensions[fileExtension]!==undefined) {
    return true
  } else {
    return false
  }
}
const viewFileStatistics = (row) => {
  let filePath = row.getElementsByClassName("file-path")[0].innerText
  let filePathSplit = filePath.split("/")
  let fileName = filePathSplit[filePathSplit.length-1]
  localStorage.setItem("filePath",filePath)
  localStorage.setItem("fileName",fileName)
  location.href = "FileStatistics.html"
}

const viewUser = (row) => {
  let user = row.getElementsByClassName("author")[0].innerText
  localStorage.setItem("profile",user)
  location.href = "ContributorProfile.html"
}

const processCommits = (res,weekIndex) => {
  let top5 = [];
  let length = res.length-1
  // Sort array of contributors according to the number of commits
  // Sorting algorithm
  res.sort(function(a,b){
    let aChanges = a.weeks[weekIndex].a + a.weeks[weekIndex].d
    let bChanges = b.weeks[weekIndex].a + b.weeks[weekIndex].d
    if (aChanges > bChanges) {
    return 1;
  } else if (bChanges > aChanges) {
    return -1;
    } else {
    return 0;
  }
  })
  // Displaying contributors by who has the highest number of commits
  if (numOfContributors>0)
  {
    for (let i=length;i>(length-numOfContributors)&&i>=0;i--)
    {
      let row = document.createElement("tr")
      //Creating Ranking Column
      let ranking = document.createElement("td")

      let avatar = document.createElement("img")
      avatar.src = res[i].author.avatar_url
      avatar.width = 50
      avatar.height = 50
      ranking.appendChild(avatar)

      //Creating Author Column
      let author = document.createElement("td")
      author.innerText = res[i].author.login
      author.className = "author"
      //Creating Total Column
      let total = document.createElement("td")
      let changes = res[i].weeks[weekIndex].a + res[i].weeks[weekIndex].d
      total.innerText = changes
      //Appending all columns to row
      row.appendChild(ranking);row.appendChild(author);row.appendChild(total)
      row.addEventListener("click",()=>{viewUser(row)})
      //Appending row to columns
      commitsRef.appendChild(row)
    }
  }

}


const displayTable = () => {
  let tableList = document.getElementsByClassName("data")
  let spinnerList = document.getElementsByClassName("mdl-spinner")
  let spinnerListLength = spinnerList.length
  for (let i=0;i<tableList.length;i++)
  {
    tableList[i].style.visibility = "visible";
  }
  for (let i=0;i<spinnerListLength;i++)
  {
    spinnerList[0].remove()
  }

}

// This function clears the tables
const resetTable = () => {
  //contributorsRef.innerHTML = ""
  //additionsRef.innerHTML = ""
  commitsRef.innerHTML = ""
  //deletionsRef.innerHTML = ""
}

// showData(fetchRepositoryContents)
// showData(fetchContributors)
syncedDisplay()
