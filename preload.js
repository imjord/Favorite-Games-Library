const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");
const { execFile, spawn } = require("child_process");
const createDesktopShortcut = require("create-desktop-shortcuts");

window.addEventListener("DOMContentLoaded", () => {
  const addGameBtnEl = document.getElementById("add-game");
  let gameListUl = document.querySelector(".game-list");
  var getGamesEl = document.querySelector("#get-games");

  // check if folder exists if it doesnt then create a new one

  if (fs.existsSync("./resources/app/MyFavoriteGames")) {
    console.log("favorite games folder found...");

    getAllGames();
  } else {
    console.log("favorite games folder not found... creating folder");
    fs.mkdir(path.join(__dirname, "./resources/app/MyFavoriteGames"), (err) => {
      if (err) {
        return console.error(err);
      }
      console.log("Favorite Games Folder created successfully!");
      getAllGames();
    });
  }

  // function to update the list of games
  getGamesEl.addEventListener("click", () => {
    gameListUl.innerHTML = "";
    getAllGames();
  });

  // function to remove the game from the myfavorite games folder
  function removeGame(gameName) {
    fs.unlink(`./resources/app/MyFavoriteGames/${gameName}.lnk`, (err) => {
      if (err) {
        console.log(err);
      }
      console.log("File deleted successfully!");
    });
  }

  // function to get the shortcut games from myfavorite games and list them in the app
  function getAllGames() {
    fs.readdir("./resources/app/MyFavoriteGames", (err, files) => {
      console.log("going over games in folder...");
      files.forEach((file) => {
        var playBtn = document.createElement("button");
        var listGame = document.createElement("li");
        var playIcon = document.createElement("img");
        var spanEl = document.createElement("span");
        var removeBtn = document.createElement("button");
        var removeIcon = document.createElement("img");
        removeIcon.setAttribute("src", `./css/remove.ico`);
        removeIcon.classList.add("remove-icon");
        removeBtn.classList.add("remove-btn");
        removeBtn.append(removeIcon);
        playIcon.setAttribute("src", `./css/play.ico`);
        playIcon.classList.add("play-icon");
        playBtn.classList.add("play-btn");
        gameListUl.append(listGame);
        gameListUl.append(spanEl);
        listGame.innerText = file.toString().replace(".lnk", "");
        listGame.append(spanEl);
        spanEl.append(playBtn);
        playBtn.append(playIcon);
        removeBtn.addEventListener("click", () => {
          removeGame(file.toString().replace(".lnk", ""));
          getAllGames();
        });
        playBtn.addEventListener("click", () => {
          // console.log(`click ${file}`);
          const parsed = shell.readShortcutLink(
            `./resources/app/MyFavoriteGames/${file}`
          );

          // console.log(parsed);
          execFile(parsed.target, (error, stdout, stderr) => {
            if (error) {
              // console.log(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              // console.log(`stderr: ${stderr}`);
              return;
            }
            // console.log("stdout: ", stdout);
          });
        });
      });
    });
  }

  //upon clicking  add game file, request the file from the main process
  addGameBtnEl.addEventListener("click", () => {
    ipcRenderer.send("file-request");
  });
  //upon receiving a file, process accordingly
  ipcRenderer.on("file", (event, file) => {
    const shortcutsCreated = createDesktopShortcut({
      windows: {
        filePath: file,
        outputPath: path.join(__dirname, "./MyFavoriteGames"),
      },
    });
    if (shortcutsCreated) {
      console.log(
        `Game executable placed inside ${path.join(
          __dirname,
          "./MyFavoriteGames/"
        )}`
      );
    } else {
      console.log(
        'Could not create the icon or set its permissions (in Linux if "chmod" is set to true, or not set)'
      );
    }
  });
});
