"use strict"
class Folder
{
  constructor(path,name)
  {
    this.path = path
    this.contents = {}
    this.name = name
  }


  addFolder(path,name)
  {
    let newFolder = new Folder(path,name)
    this.contents[name] = newFolder
  }


  addFile(path,name)
  {
    let newFile = new File(path,name)
    this.contents[name] = newFile
  }

}

class File
{
  constructor(path,name)
  {
    this.path = path
    this.name = name
  }

}

class Repository
{
  constructor()
  {
    this.root = new Folder("")
    this.history = [""] // This is the path of the root
  }

  root()
  {
    return this.root
  }

  contents()
  {
    return this.root.contents
  }

  history()
  {
    return this.history
  }

  resetRoot()
  {
    this.root = new Folder("")
  }

  resetHistory()
  {
    this.history = [""]
  }

  addDirectory(newPath)
  {
    this.history.push(newPath)
  }

  removeDirectory()
  {
    this.history.pop()
  }

}