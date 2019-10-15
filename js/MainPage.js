"use strict"
let inputRef = document.getElementById("repoUrl")
let errorRef = document.getElementById("errorLabel")

inputRef.addEventListener("keypress",(e)=>{search(e)})

const search = (e) => {
  if (e.keyCode===13) {
    getUrl()
  }
}
// Returns True if repository exists, false if not
const fetchRepositoryStatus = async (owner,repo) => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  return api_call.ok
}

// Returns True if repository is not empty
const fetchRepositoryContents = async (owner,repo) => {
  const api_call = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
  return api_call.ok
}


const getUrl = async () => {
    try {
      var values = inputRef.value;
      // splitting the url obtained from the user by '/' and inputting it into an array
      values = values.split("/");
      // further split the last value to only take the "repo" name if there is ".git"
      values[4] = values[4].split(".git");

      let owner = values[3]
      let repo = values[4][0]
      const EXISTS = await fetchRepositoryStatus(owner,repo)
      // Throw error is repository does not exist or is private
      if (!EXISTS) {
        throw new Error("Repository Does Not Exist Or Is Private")
      }
      // Throw error if repository is empty
      const EMPTY = await fetchRepositoryContents(owner,repo)
      if (!EMPTY) {
        throw new Error("Repository Is Empty")
      }
      // taking the last and second last value and stored it on localStorage as "owner" and "repo"
      localStorage.setItem("owner", owner);
      localStorage.setItem("repo", repo)
      location.href = "Overview.html"
    }  catch (err) {
      // If error is because from the split function throwing an error then set error message to invalid error
      if (err.name==="TypeError") {
        err.message = "Invalid URL"
      }
      activeError(err.message)
    }

}

function activeError(message) {
      errorRef.innerHTML = message
      inputRef.parentNode.classList.add("is-invalid");
      inputRef.parentNode.classList.add("is-dirty");
}
function chosenImage(url_string) {
     document.body.style.backgroundImage = `url(${url_string})`
}
