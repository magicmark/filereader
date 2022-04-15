import assert from 'assert';
import path from 'path';
import pMemoize from 'p-memoize';
import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

function getFileReader(filePath) {
    return pMemoize(readFile(filePath, 'utf8'));
}

export default function getFileReadMiddleware(
    /**
     * List of file paths that we _know_ we're going to want to read
     * If any files in this list don't exist during app startup, we'll fail fast.
     */
    files,
) {
    // Set up a bunch of initial file readers
    const fileReaders = {};

    files.forEach(filePath => {
        // Do an initial check that the file exists on disk at startup time
        assert(existsSync(path.resolve(filePath)), `Expected ${path.resolve(filePath)} to exist on disk`);

        // Set up a memoized callback to read the file
        fileReaders[path.resolve(filePath)] = getFileReader(path.resolve(filePath));
    });

    chokidar.watch(files).on('change', filePath => {
        // When the file changes on disk, replace the callback
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
