"use strict";
const apiURL = "https://api.github.com/"

let contentGridNode = document.getElementById("mainGrid");
let firstCol = document.createElement("div");
firstCol.className = "mdl-cell mdl-cell--3-col";

let repoFiles = [];
let repoFileChanges = [];
let pushes = []
let userName = localStorage.getItem('profile');
let owner = localStorage.getItem('owner');
let repo = localStorage.getItem('repo')
let totalChanges = 0;
let totalCommits = 0;
let changesPerCommit = 0;

const fetchContributor = async (userName) => {
  const api_call = await fetch(apiURL + `search/users?q=user:${userName}`);
  const data = await api_call.json();
  return data;
}

const fetchEvents = async (userName) => {
  const api_call = await fetch(apiURL + `repos/${owner}/${repo}/commits?author=${userName}`);
  const data = await api_call.json();
  return analyseFetches(data);
}

const analyseFetches = async (pushes) => {
  console.log(pushes);
  let changesPerFile = {}
  for (let i = 0 ; i < pushes.length && i < 10 ; i++) {
    let api_call = await fetch(apiURL + `repos/${owner}/${repo}/commits/${pushes[i].sha}`);
    let data = await api_call.json();
    totalCommits += 1
    for (let i=0;i<data.files.length;i++)
    {
      let fileName = data.files[i].filename
      let changes = data.files[i].additions + data.files[i].deletions
      if (changesPerFile[fileName]===undefined) // If filePath does not exist. Then set it to 0
      {
        changesPerFile[fileName] = 0
      }
      changesPerFile[fileName] += changes // Increment the integer stored under the filePath by changes
      totalChanges += changes
    }
  }
  let unsortedChangesPerFile = Object.entries(changesPerFile)
  let sortedChangesPerFile = sortChangesPerFile(unsortedChangesPerFile)
  return sortedChangesPerFile
  /* {
        pathFile: Count
        pathFile2: Count
        ....
     }
  */
}

function sortChangesPerFile(input) {
  input.sort((a,b)=>{
    if (a[1] > b[1]) {
    return -1;
  } else if (b[1] > a[1]) {
    return 1;
    } else {
    return 0;
  }
  })
  return input
}

function createFilesTable(){
  fetchEvents(userName).then(function(fileInformation){
    let aveChangesDd = document.createElement("dd");
    console.log(totalChanges,totalCommits);
    aveChangesDd.innerHTML = "ave. changes p/commit: " + (totalChanges/totalCommits).toPrecision(4);
    firstCol.appendChild(aveChangesDd);

    let secondCol = document.createElement("div");
    secondCol.className = "mdl-cell mdl-cell--9-col table-col-mdl";

    let tableNode = document.createElement("table");
    tableNode.id = "fileTable";
    tableNode.className = "mdl-data-table files-table mdl-js-data-table mdl-shadow--6dp mdl-cell";

    let filterForm = document.createElement("form");
    //filterForm.className = "mdl-cell";
    filterForm.action = "#";

    let textFieldDiv = document.createElement("div");
    textFieldDiv.className = "mdl-textfield mdl-js-textfield";

    let input = document.createElement("input");
    input.className = "mdl-textfield__input";

    input.type = "text";
    input.id = "filter";

    let label = document.createElement("label");
    label.className = "mdl-textfield__label"
    label.htmlFor  = "filter";
    label.innerHTML = "Filter";

    textFieldDiv.appendChild(input);
    textFieldDiv.appendChild(label);
    filterForm.appendChild(textFieldDiv);
    secondCol.appendChild(filterForm);

    tableNode.append(createTableHead());
    tableNode.append(createTableBody(fileInformation));
    secondCol.appendChild(tableNode);
    contentGridNode.appendChild(secondCol);

    let rows = tableNode.getElementsByTagName("tr");

    for (let i = 0 ; i < rows.length ; i++) {
      let currentRow = tableNode.rows[i];
      var createClickHandler = function(row) {
        return function() {
          let cells = currentRow.getElementsByTagName("td");
          localStorage.setItem('filePath',cells[0].innerHTML);
          localStorage.setItem('fileName',extractFileName(cells[0].innerHTML));
          window.location.href = "FileStatistics.html";
        };
      };
      currentRow.onclick = createClickHandler(currentRow);
    }

    input.addEventListener("keyup", (inputArg) => {
      let input, filter, table, tr, td, i;
      input = document.getElementById("filter");
      filter = input.value.toUpperCase();
      table = document.getElementById("fileTable");
      tr = table.getElementsByTagName("tr");
      // Loop through all table rows, and hide those who don't match the search query
      for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
          let txtValue = td.innerHTML;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            tr[i].style.display = "";
          } else {
            tr[i].style.display = "none";
          }
        }
      }
      componentHandler.upgradeDom();
    });

    let newSpacerR = document.getElementById("newSpacerR");
    newSpacerR.parentNode.removeChild(newSpacerR);
    let newSpinner = document.getElementById("newSpinner");
    newSpinner.parentNode.removeChild(newSpinner);
    let newSpacerL = document.getElementById("newSpacerL");
    newSpacerL.parentNode.removeChild(newSpacerL);

    componentHandler.upgradeDom();

  });
}

function createTableHead(tableNode){

  let tableHead  = document.createElement("thead");
  let newRow = document.createElement("tr");

  let newHeader = document.createElement("th");
  newHeader.className = "mdl-data-table__cell--non-numeric"
  newHeader.innerHTML = "File Name";
  newHeader.id = "tableHeader";
  newRow.appendChild(newHeader);

  newHeader = document.createElement("th");
  newHeader.innerHTML = "Changes";
  newRow.appendChild(newHeader);
  tableHead.appendChild(newRow);

  return tableHead;
}

function createTableBody(files){
 /**
 Creates the body of the table listing files
 **/
  let tableBody = document.createElement("tbody");
  for (let i = 0 ; i < files.length ; i++) {
    let newRow = document.createElement("tr");

    let fileNameElement = document.createElement("td");
    fileNameElement.className += "mdl-data-table__cell--non-numeric";
    fileNameElement.innerHTML = files[i][0];
    newRow.appendChild(fileNameElement);

    let changesNumElement = document.createElement("td");
    changesNumElement.className += "mdl-data-table__cell";
    changesNumElement.innerHTML = files[i][1];
    newRow.appendChild(changesNumElement);

    tableBody.appendChild(newRow);
  }
  return tableBody;
}

function createCard(){
  /**
  Uses the data stored in 'profile' in local storage to create a card
  **/
  fetchContributor(userName).then(function(contributorList){
    let contributor = contributorList.items[0];

    let cardNode = document.createElement("div");
    cardNode.className += "profile-card-image mdl-card mdl-cell mdl-shadow--6dp";
    cardNode.style.backgroundImage = "url('" + contributor.avatar_url + "')";

    let contributorTitle = document.createElement("dt");
    contributorTitle.className = "mdl-components-dt contributor-title";
    contributorTitle.innerHTML = contributor.login;
    let contributorDescription = document.createElement("dd");
    contributorDescription.id = "contributorDescription";
    contributorDescription.className = "mdl_components-dd contributor-description";
    contributorDescription.innerHTML = "contributor";

    firstCol.appendChild(cardNode);
    firstCol.appendChild(contributorTitle);
    firstCol.appendChild(contributorDescription);

    let spinnerSpacerLeft = document.getElementById("spinnerSpacerL");
    spinnerSpacerLeft.parentNode.removeChild(spinnerSpacerLeft);
    let spinnerSpacerRight = document.getElementById("spinnerSpacerR");
    spinnerSpacerRight.parentNode.removeChild(spinnerSpacerRight);
    let spinner = document.getElementById("spinner");
    spinner.parentNode.removeChild(spinner); // Delete loading spinner

    contentGridNode.appendChild(firstCol);

    let spinnerSpacerL = document.createElement("div");
    spinnerSpacerL.className = "mdl-layout-spacer";
    spinnerSpacerL.id = "newSpacerL";
    contentGridNode.appendChild(spinnerSpacerL);

    let newSpinner = document.createElement("div");
    newSpinner.className = "mdl-spinner mdl-js-spinner is-active";
    newSpinner.id = "newSpinner";
    contentGridNode.appendChild(newSpinner);

    let spinnerSpacerR = document.createElement("div");
    spinnerSpacerR.className = "mdl-layout-spacer";
    spinnerSpacerR.id = "newSpacerR";
    contentGridNode.appendChild(spinnerSpacerR);

    componentHandler.upgradeDom();

    createFilesTable();

  });
}

function extractFileName(path) {
  /**
  Given a string of the path to a file, returns the file Name
  **/
  let indexOfSlash = 0
  for (let i = path.length - 1 ; i >= 0 ; i--) {
    if (path[i] == "/") {
      return path.substring(i+1,path.length);
    }
  }
  return path;
}

createCard();
