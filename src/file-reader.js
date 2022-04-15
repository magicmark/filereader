const path = require("path");
const pMemoize = require("p-memoize");
const chokidar = require("chokidar");
const { promises: fsPromises } = require("fs");

function getFileReader(filePath) {
  return pMemoize(() => {
    console.log(
      `Reaching out the file system to read ${filePath}. I should only show up once!`
    );
    return fsPromises.readFile(filePath, "utf8");
  });
}

function getFileReadMiddleware(
  /**
   * List of file paths that we _know_ we're going to want to read
   * If any files in this list don't exist during app startup, we'll fail fast.
   */
  knownFiles
) {
  // TODO: Add the following psuedo-logic:
  // if not every file in knownFiles exists, throw error

  // Set up a bunch of initial file readers
  const fileReaders = {};
  knownFiles.forEach(filePath => {
    fileReaders[path.resolve(filePath)] = getFileReader(path.resolve(filePath));
  });

  chokidar.watch(knownFiles).on("change", filePath => {
    fileReaders[path.resolve(filePath)] = getFileReader(path.resolve(filePath));
  });

  // TODO: Set up some cache pre-warm logic

  return function fileReaderMiddleware(req, res, next) {
    /**
     * Copy the pointers to the functions in fileReaders into requestScopedFileReaders
     * This will "freeze" a set of file readers per request
     * (These functions won't be overwritten by chokidar)
     */
    const requestScopedFileReaders = { ...fileReaders };

    res.locals.readFile = fileName => {
      return requestScopedFileReaders[path.resolve(fileName)]();
    };

    next();
  };
}

module.exports = getFileReadMiddleware;
