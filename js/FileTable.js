"use strict"
let owner, repo
owner = localStorage.getItem("owner")
repo = localStorage.getItem("repo")
// check whether the owner and the repo name is stored in localStorage
if (owner === "" || repo === ""){
  window.location.href = "Index.html";
}

let fileList = []
let filesPerPage;

const fetchFileContents = async (owner, repo) => {
    /*
    This constant fetches all the data from the repository and append all the files into fileList in the form of {name, path, and size} and return fileList
    */
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
  const data = await api_call.json();

  // looping through all the data
  for (let i = 0; i < data.tree.length; i++){
      // check whether the data object is a file
      if (data.tree[i].mode === "100644"){
          // take the path of the data
          let path = data.tree[i].path
          // get the name from the path
          let path_split = path.split('/')
          let length = path_split.length
          var name = path_split[length - 1]
          // appending the file data to fileList
          fileList.push({name: name, path: path, size: data.tree[i].size})
      }
  }

  return fileList;
}

function buildTableHead(){
    /*
    This function, similar to the Contributors Table, is used to build the Header for the table with columns {icon, filename, filepath, and size}
    */
    let tableHead  = document.createElement("thead");
    let newRow = document.createElement("tr");
    // create Header for file icon
    let newHeader = document.createElement("th");
    newHeader.class += "mdl-layout--large-screen-only";
    newRow.appendChild(newHeader);

    // create Header for File Name
    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "File Name";
    newRow.appendChild(newHeader);

    // create Header for File Path
    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "File Path";
    newRow.appendChild(newHeader);

    // create Header for File Size
    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "Size (MB)";
    newRow.appendChild(newHeader);

    tableHead.appendChild(newRow);
    return tableHead;
}

async function buildTableBody(fileList, currentPage, filesPerPage=15){
    /*
    This function is used to build the table body
    */

    // promise to get all the file data before progressing
    const files = await fileList;

    // creating the body of the table
    let tableBody = document.createElement("tbody");
    tableBody.id = "fileTableBody";

    // check whether it is the current Page number is valid
    if (!validPageNumber(currentPage, filesPerPage)){
        // return an error to be displayed if the page number is not valid
        console.log(currentPage.toString()+" is not a valid page number for buildTableBody()")
        tableBody.innerHTML = "error with page number";
        return tableBody;
    }

    // function to be called when row is clicked

    // change here
    /*
    var clickHandler = function(user) {
        return function() {
            localStorage.setItem('profile',user);
            window.location.href = "ContributorProfile.html";
        };
    };
    */

    let startIndex = getStartIndex(currentPage, filesPerPage);
    let endIndex = startIndex - filesPerPage +1;
    if (endIndex < 0){
        endIndex = 0;
    }


    // looping through the fileList
    for (let index = startIndex; index >= endIndex; index--){
        let newRow = document.createElement("tr");
        let fileIcon = document.createElement("td");
        fileIcon.innerHTML = "<i class=\"material-icons transparent-file-button\">description</i>"
        newRow.appendChild(fileIcon);

        // add filename to row
        let fileName = document.createElement("td");
        fileName.className += "mdl-data-table__cell--non-numeric";
        fileName.innerHTML = files[index].name;
        newRow.appendChild(fileName);

        // add file path to row
        let filePath = document.createElement("td");
        filePath.className += "mdl-data-table__cell--non-numeric"; // set to non-numeric so it'd be in line with the header
        filePath.innerHTML = files[index].path;
        newRow.appendChild(filePath);

        // add size of the file to row
        let size = document.createElement("td");
        size.className += "mdl-data-table__cell--non-numeric";
        size.innerHTML = files[index].size/(10**6);
        newRow.appendChild(size);

        // making row clickable
        //newRow.onclick = clickHandler(contributorList[index].author.login);

        // append row to table
        tableBody.appendChild(newRow);

    }

    return tableBody;
}

async function buildFileTable(){
    /*
    Function removes spinner as well as build header and body for the table
    */

    let spinner = document.getElementById("spinner");
    let ownerAndRepositoryDt = document.getElementById("ownerAndRepo");
    ownerAndRepositoryDt.innerHTML = owner + " / " + repo;

    // fetch files first, using stored owner/repo from main page, then build table
    fetchFileContents(owner, repo).then(async function(fileContents){
        let page = 1;
        let table = document.getElementById("file_table");

        let fileTableBody = await buildTableBody(fileContents, page);
        spinner.parentNode.removeChild(spinner);
        table.style.display = "table";
        table.appendChild(buildTableHead());
        table.appendChild(fileTableBody);
        table.appendChild(buildPaginationBar(page));

    }, function(fileList){
        spinner.parentNode.removeChild(spinner);
        table.innerHTML = "Data could not be retrieved";
    });
}

function getStartIndex(page, filesPerPage){
    /*
    Returns the index from which buildTableBody() will start iterating backwards from the build a page
    ie Returns the index containing the first contributor on page number "page".
    */
    return (fileList.length-1) - filesPerPage*(page-1);
}

function validPageNumber(pageNumber, filesPerPage){
    /*
    Checks if a page number is valid, given the number of users on a page

    returns: true - if page number is valid for use with contributorList
             false - if page number is not valid
    */
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > Math.ceil(fileList.length/15) || getStartIndex(pageNumber,filesPerPage) < 0){
        return false;
    }
    return true;
}

function swapNode(newPage, oldPage){
    /*
    'Swaps' oldNode with newNode. Not a true swap; if the parent node has other children,
    newNode wont be in the same position as oldNode.
    */
    let parent = oldPage.parentNode;
    parent.removeChild(oldPage);
    parent.appendChild(newPage);
}

async function changePage(newPageNumber){
    /*
    Changes displayed table page to newPage and updates pagination bar. Should be called when a pagination bar button is clicked.

    input - newPageNumber: integer of the new page number to be displayed
    */
    // check if new page is valid
    if (!validPageNumber(newPageNumber)){
        console.log(newPageNumber.toString()+" is not a valid page number for changePage()")
        return // do not change anything
    }

    // create new page, delete old  page
    var newTableBody = await buildTableBody(fileList, newPageNumber);
    swapNode(newTableBody, document.getElementById("fileTableBody"));

    // create new bar, delete old bar
    var newPaginationBar = await buildPaginationBar(newPageNumber);
    swapNode(newPaginationBar, document.getElementById("paginationRow"));
}

function buildPaginationBar(currentPage){
    /*
    builds a tool bar to be used for switching between pages

    input: currentPage - an integer describing the current table page being displayed
    return: pageBarRow - <tr> node containing the interface for navigating table pages
    */

    let filesPerPage = 15 // change if number per list is adjustable

    let row = document.createElement("tr");
    let data = document.createElement("td");
    data.colSpan = 5;
    data.style = "text-align:center";
    row.id = "paginationRow";

    if (!validPageNumber(currentPage)){
        row.innerHTML = "error with page number";
        console.log(currentPage.toString()+" is not a valid page number for buildPaginationBar()")
        // an empty row with error message
    }
    else {
        let sidePages = 2; // number of pages to be displayed left/right of current page
        let minPage = currentPage - sidePages;
        let maxPage = currentPage + sidePages;
        let lastPage = Math.ceil(fileList.length/filesPerPage)
        if (currentPage > 1){
          data.appendChild(buildPaginationButton(currentPage, "back", filesPerPage));
        }

        // build a button for a page and it's adjacent buttons
        for (var i = minPage; i <= maxPage; i++){
          if (i >= 1 & i <= lastPage){
            data.appendChild(buildPaginationButton(currentPage, i, filesPerPage));
          }
        }

        // check to see whether the current page the user is on is the last page
        if (currentPage < lastPage){
          data.appendChild(buildPaginationButton(currentPage, "forward", filesPerPage))
        }

    }

    row.appendChild(data)
    return row;
}

function buildPaginationButton(currentPage, buttonType, filesPerPage){
    /*
    input:  currentPage
            buttonType - either a page number (1,2,3 etc )or an arrow type ("back" or "forward")
    */
    // check if currentPage and buttontype are valid


    // last possible page
    let lastPage = Math.ceil(fileList.length/filesPerPage);
    let button = document.createElement("button");

    // assign class name
    if (buttonType == currentPage){
        // makes current page button different colour
        button.className += "mdl-button mdl-js-button mdl-button--accent";
    }
    else{
        button.className += "mdl-button mdl-js-button";
    }


    if (buttonType=="back" || buttonType=="forward"){
        // arrow button
        let buttonImage = document.createElement("i");
        buttonImage.className += "material-icons";
        buttonImage.innerHTML = "arrow_"+buttonType;
        button.appendChild(buttonImage);
        if (buttonType=="back"){
            button.onclick = function() {return changePage(currentPage-1)}
        }
        else{
            button.onclick = function() {return changePage(currentPage+1)}
        }
    }
    else{
        // number button
        button.innerHTML = buttonType.toString();
        if (buttonType != currentPage){
            button.onclick = function() {return changePage(buttonType)}
        }
    }

    return button;
}

buildFileTable();
