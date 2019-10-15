"use strict";

var contributorList = [];

const fetchContributors = async (owner,repo) => {
    /*
    Fetches a array of contributors using GitHub API
    GitHub documentation: https://developer.github.com/v3/repos/statistics/#get-contributors-list-with-additions-deletions-and-commit-counts

    return: data - fetched contributor array
    */
    const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`);
    if (api_call.status == 204){
        // no content/contributors
        return 204;
    }
    const data = await api_call.json();
    return data
}


function getStartIndex(page, usersPerPage){
    /*
    Returns the index from which buildTableBody() will start iterating backwards from the build a page
    ie Returns the index containing the first contributor on page number "page".
    */
    return (contributorList.length-1) - usersPerPage*(page-1);
}


function validPageNumber(pageNumber, usersPerPage){
    /*
    Checks if a page number is valid, given the number of users on a page

    returns: true - if page number is valid for use with contributorList
             false - if page number is not valid
    */
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > Math.ceil(contributorList.length/15) || getStartIndex(pageNumber,usersPerPage) < 0){
        return false;
    }
    return true;
}


function buildTableHead(){
    /*
    Builds Contributor List header node

    return: tableHead - <thead> node containing Contributor List table header ( , Contributors, GitHub ID, Commits)
    */
    let tableHead  = document.createElement("thead");
    let newRow = document.createElement("tr");
    // create column for avatars
    let newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.id = "imageRow";
    newRow.appendChild(newHeader);

    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "Contributors";
    newRow.appendChild(newHeader);

    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "GitHub ID";
    newRow.appendChild(newHeader);

    newHeader = document.createElement("th");
    newHeader.class += "mdl-data-table__cell--non-numeric";
    newHeader.innerHTML = "Commits";
    newRow.appendChild(newHeader);

    tableHead.appendChild(newRow);
    return tableHead;
}


function buildTableBody(currentPage, usersPerPage=15){
    /*
    Builds Contributor List table page body, using contributorList

    input: currentPage - integer. Page to be built
           usersPerPage - integer, number of contributors to be displayed per page
    return: tableBody - <tbody> node containing table body (avatar, name, id, and total number of commits for all contributors)
    */
    const avatarWidth = 50;
    const avatarHeight = avatarWidth; // to remain square
    let tableBody = document.createElement("tbody");
    tableBody.id = "contributorTableBody";

    if (!validPageNumber(currentPage, usersPerPage)){
        // return an error to be displayed if the page number is not valid
        console.log(currentPage.toString()+" is not a valid page number for buildTableBody()")
        tableBody.innerHTML = "error with page number";
        return tableBody;
    }

    // function to be called when row is clicked
    var clickHandler = function(user) {
        return function() {
            localStorage.setItem('profile',user);
            window.location.href = "ContributorProfile.html";
        };
    };

    // working out user range for page (start index to start index - usersperpage,exclusive)
    // subtracting usersperpage for end index because the list is transversed backwards
    let startIndex = getStartIndex(currentPage, usersPerPage);
    let endIndex = startIndex - usersPerPage +1;
    if (endIndex < 0){
        endIndex = 0;
    }


    // going through each contributor and adding them to the table
    for (var index = startIndex; index >= endIndex; index--){
        let newRow = document.createElement("tr");

        // add avatar to row
        let avatar = document.createElement("td");

        avatar.className += "mdl-data-table__cell--non-numeric";
        avatar.id = "imageRow";
        let avatarPicture = document.createElement("img");
        avatarPicture.src = contributorList[index].author.avatar_url;
        avatarPicture.alt = contributorList[index].author.login+"'s avatar";
        // avatarPicture.style = "max-height:50px;max-width:50px;height:auto;width:40%;"; //doesn't work as intended
        avatarPicture.width = avatarWidth;
        avatarPicture.height = avatarHeight;
        avatar.appendChild(avatarPicture);
        newRow.appendChild(avatar);

        // add contributor name to row
        let name = document.createElement("td");
        name.className += "mdl-data-table__cell--non-numeric";
        name.innerHTML = contributorList[index].author.login;
        newRow.appendChild(name);

        // add contributor id to row
        let id = document.createElement("td");
        id.className += "mdl-data-table__cell--non-numeric"; // set to non-numeric so it'd be in line with the header
        id.innerHTML = contributorList[index].author.id;
        newRow.appendChild(id);

        // add total number of commits to row
        let numberOfCommits = document.createElement("td");
        numberOfCommits.className += "mdl-data-table__cell--non-numeric";
        numberOfCommits.innerHTML = contributorList[index].total;
        newRow.appendChild(numberOfCommits);

        // making row clickable
        newRow.onclick = clickHandler(contributorList[index].author.login);

        // append row to table
        tableBody.appendChild(newRow);
    }
    return tableBody;
}


function buildPaginationButton(currentPage, buttonType, usersPerPage){
    /*
    input:  currentPage
            buttonType - either a page number (1,2,3 etc )or an arrow type ("back" or "forward")
    */
    // check if currentPage and buttontype are valid
    
    
    // last possible page
    let lastPage = Math.ceil(contributorList.length/usersPerPage); 
    let button = document.createElement("button");
    
    // assign class name
    if (buttonType == currentPage){
        // makes current page button different colour
        button.className += "mdl-button mdl-js-ripple-effect mdl-js-button mdl-button--accent page-button";
    }
    else{
        button.className += "mdl-button mdl-js-ripple-effect mdl-js-button page-button";
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

function buildPaginationBar(currentPage){
    /*
    builds a tool bar to be used for switching between pages

    input: currentPage - an integer describing the current table page being displayed
    return: pageBarRow - <tr> node containing the interface for navigating table pages
    */

    let usersPerPage = 15 // change if number per list is adjustable

    let row = document.createElement("tr");
    let data = document.createElement("td");
    data.colSpan = 4;
    data.style = "text-align:center";
    row.id = "paginationRow";

    if (!validPageNumber(currentPage)){
        row.innerHTML = "error with page number";
        console.log(currentPage.toString()+" is not a valid page number for buildPaginationBar()")
        // an empty row with error message
    }
    else {
        let sidePages = 2; // number of pages to be displayed left/right of current page
        let minPage = currentPage - sidePages; // first numbered page in bar
        let maxPage = currentPage + sidePages // last numbered page in bar
        let lastPage = Math.ceil(contributorList.length/usersPerPage); // last possible page
        
        if (currentPage > 1){
            data.appendChild(buildPaginationButton(currentPage, "back", usersPerPage));
        }
        
        
        
        for (var i = minPage; i <= maxPage; i++ ){
            if (i >= 1 & i <= Math.ceil(contributorList.length/usersPerPage)){
                data.appendChild(buildPaginationButton(currentPage, i, usersPerPage));
            }
        }
        
        if (currentPage < Math.ceil(contributorList.length/usersPerPage)){
            data.appendChild(buildPaginationButton(currentPage, "forward", usersPerPage));
        }
    }
    row.appendChild(data)
    return row;
}


function buildContributorTable(){
    /*
    Using owner and repo data stored in local storage, fetches contributor info, removes loading spinner, builds
    and displays the table for the first time. Should only be called once, by Contributors.html.
    */

    // check whether the owner and the repo name is stored in localStorage
    if (localStorage.getItem("owner") === "" || localStorage.getItem("repo") === ""){
      window.location.href = "MainPage.html";
    }

    let idTableBody = document.getElementById("table_body");
    let spinner = document.getElementById("spinner");
    let tableNode = document.getElementById("contributor_table");
    tableNode.style.display = "table";
    
    // display owner and repo on the top of the page
    let ownerAndRepositoryDt = document.getElementById("ownerAndRepo");
    ownerAndRepositoryDt.innerHTML = localStorage.getItem("owner") + "  /  " + localStorage.getItem("repo");

    // fetch contributors first, using stored owner/repo from main page, then build table
    fetchContributors(localStorage.getItem("owner"), localStorage.getItem("repo")).then(function(fetchedList){
        // assign to global variable, for page building
        contributorList = fetchedList;
        // show 1st page
        let page = 1;

        // list was fetched, can build table
        // delete spinner, display first page
        spinner.parentNode.removeChild(spinner);
        // if there's no contributors, no table to build
        if (contributorList == 204){
            let noData = document.createElement("td");
            noData.innerHTML = "This repository has no contributors";
            tableNode.appendChild(noData);
        }
        else {
            tableNode.appendChild(buildTableHead());
            tableNode.appendChild(buildTableBody(page));
            tableNode.appendChild(buildPaginationBar(page));
        }

    }, function(contributorsList){
        // list was not fetched, display error
        spinner.parentNode.removeChild(spinner);
        let noData = document.createElement("td");
        noData.innerHTML = "Contributor data could not be retrieved";
        tableNode.appendChild(noData);
                                                       }); //end of .then()
}


function swapNode(newNode, oldNode){
    /*
    'Swaps' oldNode with newNode. Not a true swap; if the parent node has other children,
    newNode wont be in the same position as oldNode.
    */
    let parent = oldNode.parentNode;
    parent.removeChild(oldNode);
    parent.appendChild(newNode);
}


function changePage(newPageNumber){
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
    swapNode(buildTableBody(newPageNumber), document.getElementById("contributorTableBody"));

    // create new bar, delete old bar
    swapNode(buildPaginationBar(newPageNumber), document.getElementById("paginationRow"));
}
