const path = require('path');
const { readdir, writeFile, readFile } = require('fs/promises');
const { scrapeLogger, logger } = require('../../../utils/logger');
const dandanplayMatch = require('./dandanplayMatch');
const computeCollection = require('./computeCollection');
const fs = require('fs');
const { appedDirTree, getFileType, TaskPool, deepMerge,searchLeaf } = require('../../../utils');
// const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')

console.log('dandanplayScraper');

// parentPort.on('message',async libraryRootPath=>{
//     let res = await dandanplayScraper(libraryRootPath)
//     parentPort.postMessage(res)
//   })



async function dandanplayScraper(libraryRootPath, existTree,full=false,depth) {
    try {
        logger.info('dandanplayScraper start',libraryRootPath,existTree.label,existTree.path,full=false,depth)
        const taskQueue = new TaskPool(3)

        //处理文件过滤器
        let fileFilter = async (filePath) => await getFileType(filePath) == 'video'
        try {
            if (!existTree) {
                existTree = { label: path.basename(libraryRootPath), path: libraryRootPath, children: [] }
            } else {
                if (!existTree.children) { existTree.children = [] }
                fileFilter = async (filePath) => {
                        // console.log('.........................', filePath);
                    let leaf = searchLeaf(existTree, filePath)
                    if (!leaf||full) {
                        return await getFileType(filePath) == 'video'
                    }
                    if (leaf.title) {
                        console.log('exist', leaf.label);
                        return false
                    }

                }
            }
        } catch (error) { }


        let dirTree = {
            label: path.basename(libraryRootPath),
            path: libraryRootPath,
            children: []
        }
        let queue = []
        let curList = await readdir(libraryRootPath)
        let tempList = []
        curList.forEach(v => {
            //清理根目录下无关文件
            if (path.extname(v)!='.parts') {
                tempList.push(v)
            }
        })
        curList = tempList

        //将媒体库根目录下的每个文件夹设为一个任务，提交到taskQueue来控制，防止异步造成的请求超时
        curList.forEach(v => {
            queue.push(new Promise(async (resolve, reject) => {
                let dirTask = async () => {
                    //刮削核心，以appedDirTree为基础，在扫描目录时对视频文件进行识别，将相关信息附加到dirTree上
                    return await appedDirTree(path.join(libraryRootPath, v), {}, {
                        appendFileInfo: dandanplayMatch,
                        appendDirInfo: computeCollection,
                        fileFilter,
                        callback: async () => {
                            deepMerge(existTree, dirTree, { keyword: 'label' })
                            // await writeFile('./test.json', JSON.stringify(existTree, '', '\t'))
                        },
                        deep: depth?depth:1,//设置深度信息，方便合集识别
                        tag: {
                            existTree//将existTree附加到appedDirTree中，方便合集识别
                        }
                    })
                }
                //单个文件夹的识别结果
                let res = await taskQueue.task(dirTask)
                //    console.log('res-----------------',res);
                if (res) {
                    dirTree.children.push(res)
                }
                resolve()
            }))
        })
        await Promise.all(queue)
        deepMerge(existTree, dirTree, { keyword: 'label' })
        // await writeFile('./test.json', JSON.stringify(existTree, '', '\t'))
        // console.log('---------------------end',libraryRootPath);
        return existTree
    } catch (error) {

    }
}



module.exports = dandanplayScraper