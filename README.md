# FileServer-for-qBittorrent v0.4.2

[说明](#说明)

[声明](#声明)

[安装方法](#安装方法)

[配置项](#配置项)

[媒体库功能](#媒体库功能)

[安全性](#安全性)（！！！无 ssl 和域名的一定不要开启 qb 中的跳过身份验证，会尽快修复）

[转码说明](#转码说明)

[已知问题](#已知问题)

[常规问题解决方案](#常规问题解决方案)

[使用注意及建议](#使用注意及建议)

## 说明

本应用为 qbittorrent 的周边项目，为 qbittorrent 下载好的视频提供转码串流服务，可在 web 端直接播放（详见配置项及转码说明），实现下载刮削播放一条龙服务，免去做种与管理之间的矛盾，v0.4 起已实现单独的媒体库功能，但登录验证依然依赖于 qbittorrent。

已完成的配套 webui：[qBittorrent Web UI](https://github.com/blytzxdl/qbwebui)（v0.3 开始已集成，预计 v0.6 起将改用新版 UI）

使用 jellyfin 版的 ffmpeg，因其提供了将文本字幕转为图形的方法，可以充分利用显卡硬件加速，并且可以使用 libfdk_aac 库，提高音频转码速度（主要是自己不会 C 语言，尝试了三天自己编译 ffmpeg 仍然报错无穷尽，果断放弃，如不符合协议，烦请提醒）

如有大佬愿意参与开发，那我非常欢迎！！！

目前唯一官方 QQ 群:678611783

v0.5 分支正在迁移至 vite+vue3+ts+electron

## 声明

本应用当前的定位是为 qbittorrent 提供轻量级的转码串流服务，内置提取视频缩略图和弹弹 play 的刮削功能，目的是简化下载、管理和播放的流程，既不是类似 Jellyfin 那样的全能媒体服务器，也不是种子播放器。

由于是新人独立开发，能力精力有限，因此，过分的要求不会受理，出现下文未列出且解决方案无效的未知 Bug 请积极反馈，项目层面的问题烦请大佬提醒。

功能更新的优先级如下：

严重 Bug >= 关键功能 > 符合本应用定位的功能 > 实验性功能 >= 常规 Bug >= UI 改进

本应用使用 GPL3 协议，完全开源免费，不是通过官方渠道下载本应用而产生的问题，恕不处理

## 安装方法

[Windows 版](https://github.com/blytzxdl/FileServer-for-qBittorrent/tree/main/documents/Windows版安装说明.md)（配置最简单，欢迎尝鲜） [Linux 版(需要图形界面)](https://github.com/blytzxdl/FileServer-for-qBittorrent/tree/main/documents/Linux版安装说明.md) [通用 CORE 版(需要 nodejs)](https://github.com/blytzxdl/FileServer-for-qBittorrent/tree/main/documents/通用CORE版安装说明.md)

## 体验新功能/特性

一般情况下，在已安装过旧的完整版后，仅需要下载 CORE 版，将其中的文件解压到 `应用根目录/resources/app` 下覆盖，即可完成更新，后续会想办法实现应用内更新

## 配置项

应用会自动在根目录生成默认配置文件 settings.json，配置项如下（如果不是自动生成的路径，请将反斜杠'\\'换成'/',避免产生错误）

```
{

	"qbHost": "http://localhost:8080",	//必填，qBittorrent Web UI的地址，如需使用ssl/https，请设置对应的地址和端口号，如填写为本地子网地址如localhost、192.168.1.1等，必须关闭qBittorrent中的跳过身份验证，否则有安全漏洞，会尽快修复

	"serverPort": 9009,             	//必填，本应用端口，与其它程序的端口冲突时可能无法启动或闪退

	"tempPath": "./",			//必填，视频缓存路径，默认为系统临时文件目录，可另外指定，指定路径末尾要带/号，会在指定路径生成output文件夹

	"ffmpegPath":""				//必填，ffmpeg路径，win下默认为集成的ffmpeg路径，linux下会在jellyfin-ffmpeg默认安装位置下搜索，不建议手动指定为其它版本的ffmpeg

	"cert": "./ssl/domain.pem",     	//ssl证书路径，可手动修改

	"key": "./ssl/domain.key",      	//ssl密钥路径，可手动修改

	"secure": false,                 	//ssl安全设置，ssl配置成功后会自动使用true

	"share":false,				//为true时，可将生成的hls地址中"m3u8"后的文本去除，形成固定的串流地址，但这会跳过cookie校验，自己权衡开关与否

	"platform": "nvidia",			//服务端显卡型号（详见转码说明）

	"encode": "h264",			//目标编码格式（详见转码说明）

	"bitrate": "5",				//目标视频码率（单位“M”，详见转码说明）

	"autoBitrate":false			//自动码率，为true时会将bitrate设置作为参考，在原视频码率的1.5倍低于目标码率时，会使用目标码率，尽量保持原画质；在原视频码率高于目标码率的1.5倍时，会使用目标码率的1.5倍，尽量节省流量和磁盘空间；其它情况下为原视频码率的1.2倍

	"advAccel":true				//高级硬件加速，在Windows上基本没问题，Linux上的兼容性待验证；为false时只会使用基础的硬件加速，可能解决大多数兼容问题

	"tmdbKey":""				//未实装

	"customInputCommand": ""		//自定义ffmpeg输入指令，接收string类型（纯文本）,按空格分隔（详见指令说明）

	"customOutputCommand": ""		//自定义ffmpeg输出指令

	"debug":false				//debug开关，初次使用时会自动开启，重启后需手动开启
}
```

## 媒体库功能

自 v0.4 起，已实现独立的媒体库，并内置了视频缩略图提取功能与基于弹弹 play 开放 API 的刮削，

海报图及番剧信息由弹弹 play 提供，并在本地进行计算推断，缩略图提取是基于 ffmpeg 独立实现。

也就是说，对于弹弹 play 数据库尚未精确匹配的视频，无法获取对应的番名、季度、海报图等信息，

但媒体库中会包含进来并生成缩略图，可以正常播放观看，

等到弹弹 play 数据库更新后，可以再次更新媒体库或文件夹，获取最新匹配信息。

并且刮削后，会在视频文件同目录生成 nfo 文件，可供 TMM、Jellyfin 等识别，

已有 nfo 的，会按配置项中的数据源设置进行合并。

视频播放功能在媒体库和种子内容界面皆可使用

刮削过程需要较多 cpu、硬盘资源，消耗时间与视频数量正相关，与 cpu、硬盘速度负相关

感谢弹弹 play 开放数据库，弹弹 play 官网：[弹弹 play - 全功能“本地视频+弹幕”播放器 (dandanplay.com)](https://www.dandanplay.com/)

## 安全性

支持 https，通过 qBittorrent 的 cookie 进行校验，仅在 share 配置为 true 时对外暴露缓存文件夹 tempPath，暂时无法提供更完善的安全保护

v0.4.2 会加入独立的权限验证，当前版本下，如果没有域名及 ssl 证书，不能开启 qBittorrent 的跳过身份校验，否则有安全问题

## ssl/https 配置

qbittorrent 未使用 https 时，本应用有无 https 皆可，qbittorrent 开启 https 时，本应用必须配置 https

请使用和 qbittorrent 相同的证书，在本应用根目录下新建文件夹，命名 ssl，放入证书，默认识别"domain.pem"和"domain.key"文件

## 转码说明

-   **！！！请确认已安装好正确的驱动，尤其是 Linux 版，详见 Linux 驱动安装说明**

-   **！！！Linux 版请确认已安装好 jellyfin 版 ffmpeg，并分配了相关权限，详见 Linux 安装说明**

-   一般的视频转码通常在 5 秒内能启动，部分视频开始转码前可能需要较长加载时间（与视频本身、硬盘速度等相关），超过 10 秒，如超过半分钟未弹出视频界面，且 cpu、gpu、硬盘并无较高负载，可能是其它问题

-   字幕识别与字体挂载

    -   字幕采用宽松的识别方式，如片名为 abc[01].mkv，则既可以识别 abc[01].chs.ass，又可以识别[01].ass，这样需要手动给字幕批量重命名时，除非需要保留多语言版本，否则不需要考虑片名后缀参差不齐的问题，挑片名中的特征值就行。

    -   字体处理：可识别视频同目录下带有 fonts 关键字的字体压缩包、文件夹，完美还原字幕特效，再也不用手动解压安装字体了，

        压缩包会解压到临时目录，文件夹会复制到临时目录，不会修改源文件

    -   初次解压字体压缩包会延长转码启动时间，影响一般在 1-3 秒左右（由 cpu、硬盘速度、字体包大小决定），连续播放同文件夹下视频时，不会重复解压，字体文件夹同理

-   编码支持问题

    -   platform：可选"nvidia","intel","amd","vaapi",选择对应的显卡品牌以使用显卡加速，vaapi 仅适用于 Linux 系统下的 intel 和 amd 显卡

    -   encode：可选"h264","h265"

        ！！！h264 兼容良好，h265 兼容问题复杂，经有限测试，h265 视频受平台（如 ios 对 h265 支持更好，安卓、pc 在网页上大概率不支持 h265）、浏览器（如 alook 可接管视频播放来支持 h265，via，chrome 等无此功能）等因素限制，如播放器经常出现格式不支持之类的错误，建议选择 h264，或者将 share 设置为 true，将生成的 hls 链接复制到第三方播放器播放

-   转码相关问题

    -   转码判断条件：只有无字幕且码率未超限的 h264 8bit（avc yuv420p）视频会跳过转码，其它视频统一进行转码

    -   转码视频

        -   速度：主要受编码器和解码器两方面的硬件能力限制，部分情况下受硬盘速度影响

            有对应显卡及片源、系统环境满足条件时，解码器默认启用高级硬件加速，速度主要受 gpu 限制

        -   画质：主要由源视频质量和视频码率决定，分辨率遵循源视频，不处理，色深默认为 8bit

            画质上限不超过源视频（除非自定义指令来改善），在指定码率低于源视频码率时，画质会出现损失

        -   体积：主要由编码格式和码率决定，相较源视频难以比较（因素复杂）

            大致上相同编码格式，码率越高，体积越大；相同码率，h265 视频体积小于 h264 视频体积

        -   HDR：暂不支持色调映射，在我的测试中，nvidia 显卡会自动处理色彩，amd 显卡不会处理

    -   硬件加速（当前支持 h265、h264 编码的源视频。h264 10bit 的视频(比如标注有 Hi10p)仅支持编码加速，这是硬件限制）

        -   解码加速：

            当前版本的高级硬件加速基于 jellyfin 版 ffmpeg，能尽量发挥显卡性能，但由于使用环境复杂，可能不兼容部分类型的视频，可尝试关闭高级硬件加速 advAccel

        -   编码加速：均支持 h265、h264

-   多显卡问题

    -   通常情况下会根据 platform 选项自动选择对应品牌的第一张显卡
    -   Linux 系统下使用 vaapi 时会自动使用系统中的第一张显卡，即/dev/dri/renderD128
    -   也就是说，除非你有多张同品牌的显卡或使用 vaapi，基本不需要考虑多显卡切换问题
    -   之后会更新加入选择功能

-   网速需求/流量消耗问题

    -   单位说明：

        视频码率的 xx M，大致相当于需要网络带宽 xx M，例如 5M 码率的视频，需要至少 5M 的带宽才能流畅观看，网络带宽小于码率时，需要等待来加载视频，无其它影响；

        带宽换算成常见的网速统计时，按 8：1 来计算，即 1M 带宽=125KB/s 的网速

        综上，一个 5M 码率，24 分钟的视频，流畅播放需要 5M 的带宽，平均 625KB/s 的网速，消耗的流量约为 5M×60×24÷8 = 900MB

    -   对于未转码视频，视频总体积和消耗的流量大致等于源文件体积

    -   对于转码的视频，可通过限制码率来控制需要的网速与消耗的流量（但过低时会严重影响画质）

## 已知问题

-   ~~amd 显卡转码的视频在 safari 上播放时，可正常连续完整播放，但转码完成后无法跳转进度条（黑屏）（zen2APU 核显与 a12+ios15 测试结果，其它情况自行测试，可尝试用第三方播放器软解播放）~~ 启用高级硬件加速后似乎解决了
-   ~~多季合集的种子无法准确匹配番名，但其中的单集匹配无误（由弹弹 play 刮削结果决定）~~已大幅改进，部分细节待优化，过于特殊的情况没办法
-   mkv 内封多轨非文本字幕时，~~无法直接转码，请在同目录下放入同名外挂字幕（后续可能改进）~~ 会自动使用第一条字幕轨，后续加入字幕选择
-   ~~过于快速地连续跳转进度条会产生多个 ffmpeg 进程，后续想办法改善，但可能由于编程语言限制无法彻底解决，如要连续跳转，请尽量在继续播放后再进行下次跳转~~ 已超大幅改进，现在基本无忧了
-   v0.4 版本，由于更换了媒体库实现方式，种子管理界面中，对于未建立子文件夹的合集种子无法正常显示刮削信息，之后会修复
-   应用闪退的可能原因：与其它程序的端口冲突————建议修改 settings.json 中的 serverPort 为其它端口

## 常规问题解决方案

-   10%概率的问题：再点一下进度条
-   20%概率的问题：关闭播放器后重新打开
-   30%概率的问题：停止转码并清除缓存后重新播放
-   40%概率的问题：复制串流链接到第三方播放器播放
-   50%概率的问题：重启应用（可能需要在任务管理器结束 ffmpeg 进程，即占用 gpu 最多的）
-   60%概率的问题：关闭高级硬件加速 advAccel
-   70%概率的问题：按照安装说明重新安装
-   80%概率的问题：检查配置项、qbittorrent 等是否正常，硬件配置是否跟得上你的需求
-   90%概率的问题：不要在进度条上跳舞，否则你的电脑会哭
-   100%概率的问题：本应用还不配，你值得更好的

## 使用注意及建议

-   每次设置成功配置项后，会在系统临时文件夹下新建 settings_backup.json 文件来备份，下次更新配置项出现问题时，会读取备份配置，直到正确更新配置项
-   自 0.3 版本起，已集成了 qBittorrent Web UI，如果本应用下的 web UI 文件不存在或访问 qBittorrent 本身的 Web 端口，会使用 qBittorrent 中设置的 web UI（通常是原版的 web UI），

    需要管理种子但本 web UI 中尚未提供相应功能时，可访问 qBittorrent 的 Web 端口，在其原版的 web UI 中控制

-   建议不要过于快速地连续跳转进度条（虽然已经超大幅改进了，但还是这么建议）
-   请确认你的电脑配置能满足转码需要，比如我用非虚拟机的 ubuntu+i5-1135g7 核显测试没问题，但 pve 虚拟直通的 ubuntu+j3455 只能播放极少数视频，其它视频可能会在转码一半后报错，或直接导致整个宿主机卡死，jellyfin 也差不多（可能是我虚拟机设置问题，比如显存等，还需排查）
-   添加媒体库时，建议不要一次性添加多个媒体库，可能出现未知异常

## 更新计划（不分先后）

-   [ ] 安全性改进，独立权限验证
-   [ ] 封装 qb 原 api，通过 websocket 向 web 传数据
-   [x] ~~跨平台支持（linux、openwrt 等）~~已部分实现
-   [ ] 字幕匹配、上传
-   [x] ~~虚拟种子（将 qB 中没有，但弹弹 play 识别了的文件模拟成种子）~~ ~~暂时通过媒体库页面实现，后续考虑更完善的方案~~ v0.4 已实现单独的媒体库
-   [ ] 安装向导
-   [ ] 其它优化
-   [ ] 网页端预解析种子，
-   [ ] 网页端上传字幕包并批量重命名，
-   [ ] 网页端根据刮削结果自动重命名种子文件
-   [ ] tmdb 刮削
-   [ ] WebSocket 监控并互通日志
-   [ ] 合并种子管理与媒体库界面
-   [ ] 换用 Dplayer 播放弹幕
-   [ ] 提取章节信息以在播放器一键跳过
-   [ ] 自动连续播放
-   [ ] 应用内更新
-   [ ] 。。。

## API

（todo）

## 投喂

本项目完全开源免费，如果觉得好用，不妨 star 一下，如果能投喂一把，解我当务之急，更是感激不尽

**投喂不会提供任何额外服务，仅能支持开发者持续更新，请量力而为**

![image-20221105202215936](preview/README/image-20221105202215936.png)

## ~~ffmpeg 指令说明~~ 当前版本指令生成系统过于复杂，不建议自定义

默认指令

```
-copyts
-ss ...
(-c:v ...)
-i "..."
-c:v ...
(-tag:v hvc1)
(-pix_fmt yuv420p)
(-sn)
(-vf subtitles=in.ass )
-c:a aac
-ac 2
-ab 384000
-avoid_negative_ts disabled
-g ...
-keyint_min:v:0 ...
-b:v ...
-bufsize ...
-maxrate ...
-f hls
-hls_time 3
-hls_segment_type mpegts
-hls_flags temp_file
-start_number ...
-hls_segment_filename "..."
-hls_playlist_type event
-hls_list_size 0
-hide_banner
-y
...
```

(...和()表示按条件动态生成)

自定义指令

```js
-copyts
-ss ...
-customInputCommand(输入指令生效位置)
-i "..."
-customOutputCommand（输出指令生效位置）
-avoid_negative_ts disabled
-g ...
-keyint_min:v:0 ...
-f hls
-hls_time 3
-hls_segment_type mpegts
-hls_flags temp_file
-start_number ...
-hls_segment_filename "..."
-hls_playlist_type event
-hls_list_size 0
-hide_banner
-y
...
```

~~服务器转码前会在控制台输出转码时用的指令，可将其复制后在终端运行，排查错误~~ 当前 windows 版本暂时不显示控制台
