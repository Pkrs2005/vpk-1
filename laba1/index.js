const fs = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');

const SMALL = 1024;        
const MEDIUM = 1024 * 1024;  
const options = commandLineArgs([
    { name: 'folder', type: String, defaultOption: true }
]);
const folderPath = options.folder;

fs.readdir(folderPath, (err, files) => {
    files.forEach(fileName => {
        const fullPath = path.join(folderPath, fileName);

        fs.stat(fullPath, (err, stats) => {

            if (!stats.isFile()) return; 

            let targetDir = '';

            if (stats.size < SMALL) {
                targetDir = 'small';
            } else if (stats.size < MEDIUM) {
                targetDir = 'medium';
            } else {
                targetDir = 'large';
            }

            const newFolder = path.join(folderPath, targetDir);

            fs.mkdir(newFolder, { recursive: true }, () => {
                const newPath = path.join(newFolder, fileName);
                
                fs.rename(fullPath, newPath, () => {
                    console.log(fileName + ' -> ' + targetDir);
                });
            });
        });
    });
});