const { logger } = require('../../../../utils/logger');
const { rimraf } = require('../../../../utils');
const { mkdir,writeFile} = require('fs/promises');

const { settings } = require('../../../../utils/init');
const path = require('path');

//转码串流功能的次核心，预处理分段信息，同时生成m3u8清单文件
async function generateM3U8(videoInfo) {
    try {
        logger.debug('generateM3U8', 'start');
        let videoIndex = videoInfo.videoIndex = {}
        let SID = videoInfo.SID
        logger.debug('generateM3U8', 'SID', SID);
        let { duration } = videoInfo
        let segmentLength = 3
        let segmentDuration = Number((segmentLength * 1001 / 1000).toFixed(3))
        let duration_ts = segmentDuration * 90000 - 1
        let lastSegmentDuration = (duration % segmentLength * 1001 / 1000).toFixed(3)
        let segmentNum = parseInt(duration / 1.001 / segmentLength)
        let M3U8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${segmentLength}\n#EXT-X-MEDIA-SEQUENCE:${segmentNum}\n#EXT-X-PLAYLIST-TYPE:event\n`
        // if (timeList[0] == timeList[1]) {
        // let segmentDuration = Number(timeList[0])
        // let base_pts = ts0.start_pts
        // let segmentDuration = Number((duration_ts/90000).toFixed(6))
        for (let i = 0, base_pts = 1, start, start_pts, end, endLoop = false; !endLoop; i++) {
            start_pts = base_pts + (duration_ts + 1) * i
            start = Number(((start_pts - base_pts) / 90000).toFixed(6))
            if (i < segmentNum) {
                end = Number(((start_pts - base_pts + duration_ts) / 90000).toFixed(6))
                M3U8 += `#EXTINF:${segmentDuration}\nindex${i}.ts?cookie=SID=${encodeURIComponent(SID)}\n`
            } else {
                end = duration
                M3U8 += `#EXTINF:${lastSegmentDuration}\nindex${i}.ts?cookie=SID=${encodeURIComponent(SID)}\n#EXT-X-ENDLIST`
                endLoop = true
            }
            videoIndex[`index${i}`] = { start_pts, duration_ts, start, end, segmentDuration, id: i, state: "init" }
        }
        await new Promise((r, j) => {
            rimraf(path.resolve(settings.tempPath, 'output'), (err) => {
                if (err) {
                    logger.error('error rimraf', err);
                }
                r()
            })
        })
        await mkdir(path.resolve(settings.tempPath, 'output'))
        logger.info('debug', 'clear');
        await writeFile(path.resolve(settings.tempPath, 'output', 'index.m3u8'), M3U8)
    } catch (error) {
        logger.error('generateM3U8', error)
    }

}

module.exports = {
    generateM3U8,
    // videoIndex
}