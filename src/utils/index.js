const { settings } = require('./init');
const {logger} = require('./logger');
const {createReadStream} = require('fs');
const rimraf = require('rimraf');
const { EventEmitter } = require('events');
const path = require('path');
const event = new EventEmitter();
const sevenBin = require('7zip-bin');
const pathTo7zip = sevenBin.path7za
const Seven = require('node-7z');
const { readdir,mkdir,rename } = require('fs/promises');
var crypto = require('crypto');
const hash = crypto.createHash('md5');
function cleanNull(arr) {
    let temp = []
    arr.forEach(v => {
        if (v.length > 0 || typeof v == 'function') {
            temp.push(v)
        }
    })
    return temp
}

function generatePictureUrl(path) {
    return `/api/localFile/getFile/img.jpg?type=picture&path=${encodeURIComponent(path)}`
}

function mediaContentType(name) {
    const type = {
        '.mp4': 'video/mp4',
        '.mkv': 'video/mp4',
        // '.mkv':'video/x-matroska'
    }
    return type[path.extname(name)]
}

async function extractFonts(packPath, fontsDir) {
    if (!fontsDir) {
        fontsDir = path.resolve(settings.tempPath, 'fonts')
        logger.debug('utils extractFonts',fontsDir)
    }
    try {
        await new Promise((resolve, reject) => {
            rimraf(fontsDir,err=>resolve())
        })
        await  mkdir(fontsDir)
    } catch (error) {
    }
    await new Promise((resolve, reject) => {
        let stream = Seven.extractFull(packPath, fontsDir, {
            recursive: true,
            $bin: pathTo7zip
        })
        stream.on('end', function () {
            resolve()
        })
        stream.on('error', (err) => resolve(err))
    })
    let dirContent = await readdir(fontsDir)
    if (dirContent.length==1) {
        let fontsList = []
        let tempDir =path.join(fontsDir,dirContent[0])
        dirContent = await readdir(tempDir)
        dirContent.forEach(v=>{
            fontsList.push(rename(path.join(tempDir,v),path.join(fontsDir,v)).catch(e=>Promise.resolve()))
        })
        await Promise.all(fontsList)
    }
}
function listFonts(packPath) {
    return Seven.list(packPath, {
        $bin: pathTo7zip
    })
}

async function vidoeHash(filePath) {
    return await new Promise((resolve, reject) => {
        const stream =createReadStream(filePath,{end:1024*1024*16-1})
        stream.on('data', chunk => {
          hash.update(chunk, 'utf8');
        });
        stream.on('end', () => {
          const md5 = hash.digest('hex');
          resolve(md5)
        });
    })
}

module.exports = {
    cleanNull,
    generatePictureUrl,
    mediaContentType,
    extractFonts,
    listFonts,
    vidoeHash,
    Seven,
    event,
    rimraf,
}