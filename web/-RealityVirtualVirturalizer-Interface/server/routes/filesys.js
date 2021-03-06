const express = require('express');
const router = express.Router();

const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);

const path = require('path');
const BSON = require('bson');


router.get('/root_list', async (req, res) => {
    // root directory of data files
    const rootDirectory = path.join(__dirname, '../data/');
    try {
        // ensure the root directory exists
        if (fs.existsSync(rootDirectory)) {
            // read from the rootdirectory
            let files = await readdir(rootDirectory)
            let data = [];

            files.forEach(function (file) {
                // check if each item in directory list is a directory
                var isDir = fs.statSync(path.join(rootDirectory, file)).isDirectory();

                if (isDir) {
                    // push directories
                    data.push({ name: file, isDir: true, path: path.join(rootDirectory, file), exists: true });
                }
                else {
                    // get file extension type
                    var ext = path.extname(file);
                    // push files
                    data.push({ name: file, ext: ext, isDir: false, path: path.join(rootDirectory, file), exists: true });
                }
            });
            // send the data back to the client
            res.send(data);
        }
        else {
            res.send({ exists: false })
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.post('/navigate_dir', async (req, res) => {
    // get current item which is either a directory or file
    let currentItem = req.body
    // check if item is a directory
    if (currentItem.isDir) {
        try {
            // check if still exists in the filesystem
            if (fs.existsSync(currentItem.path)) {
                // read from the directory
                let files = await readdir(currentItem.path);
                let data = [];

                files.forEach(function (file) {
                    var isDir = fs.statSync(path.join(currentItem.path, file)).isDirectory();

                    if (isDir) {
                        // push directories
                        data.push({ name: file, isDir: true, path: path.join(currentItem.path, file), exists: true });
                    }
                    else {
                        // get file extension type
                        var ext = path.extname(file);
                        // push files
                        data.push({ name: file, ext: ext, isDir: false, path: path.join(currentItem.path, file), exists: true });
                    }
                });
                res.send(data);
            }
            else {
                // directory no longer exists
                res.send({ exists: false });
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    else {

    }
});

router.post('/readfile', async (req, res) => {
    // get file from body
    let file = req.body;

    if (fs.existsSync(file.path)) {
        // if the file extension is a bson format
        if (file.ext == '.bson') {
            fs.readFile(file.path, (error, bsonData) => {
                if (error) throw error;
                // convert the bson file to a json format on the fly
                var jsonData = BSON.deserialize(bsonData);
                file.data = jsonData
                res.send(file);
            });
        }
        else {
            // if the file is any other format encode in utf-8
            fs.readFile(file.path, 'utf-8', (error, data) => {
                if (error) throw error;
                // if json format, make the output readable
                if (file.ext == '.json') {
                    file.data = JSON.stringify(JSON.parse(data), null, '\t');
                }
                else {
                    file.data = data
                }
                res.send(file);
            });
        }
    }
    else {
        res.send({ exists: false });
    }
});

router.post('/removeItem', async (req, res) => {
    let item = req.body;
    if (fs.existsSync(item.path)) {
        if (item.isDir) {
            fs.rmdir(item.path, { recursive: true }, (error) => {
                if (error) throw error;
                res.send({ "valid": true });
            });
        } else {
            fs.unlink(item.path, (error) => {
                if (error) throw error;
                res.send({ "valid": true });
            });
        }
    }
    else {
        res.send({ "valid": false });
    }
});

module.exports = router;